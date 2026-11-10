
import mimetypes
import os
import uuid

from io import BytesIO
from pathlib import PurePosixPath

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
)
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from storage3 import SyncStorageClient
from supabase import create_client

from config import SUPABASE_URL, SUPABASE_KEY


router = APIRouter(prefix="/documents", tags=["Documents"])

security = HTTPBearer(auto_error=False)

BUCKET_NAME = "project-documents"
MAX_FILE_SIZE = 10 * 1024 * 1024

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".txt",
    ".md",
}


def get_authenticated_client(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    token = credentials.credentials

    try:
        client = create_client(SUPABASE_URL, SUPABASE_KEY)

        auth_response = client.auth.get_user(token)

        if not auth_response.user:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired session"
            )

        client.postgrest.auth(token)

        return client, auth_response.user, token

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session"
        )


def get_storage_client(token):
    return SyncStorageClient(
        f"{SUPABASE_URL.rstrip('/')}/storage/v1",
        {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {token}",
        }
    )


def get_project_role(client, project_id, user_id):
    response = (
        client.table("project_members")
        .select("role")
        .eq("project_id", project_id)
        .eq("user_id", str(user_id))
        .maybe_single()
        .execute()
    )

    return response.data.get("role") if response.data else None


def get_document(client, document_id):
    response = (
        client.table("documents")
        .select("*")
        .eq("id", document_id)
        .maybe_single()
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    return response.data


@router.post("/")
def upload_document(
    project_id: str,
    file: UploadFile = File(...),
    authenticated=Depends(get_authenticated_client)
):
    client, current_user, token = authenticated

    role = get_project_role(
        client,
        project_id,
        current_user.id
    )

    if role != "manager":
        raise HTTPException(
            status_code=403,
            detail="Only project managers can upload documents"
        )

    original_name = (
        file.filename or "document"
    ).replace("\\", "/").split("/")[-1]

    extension = PurePosixPath(original_name).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, DOCX, TXT and MD files are allowed"
        )

    try:
        file_content = file.file.read()

        if not file_content:
            raise HTTPException(
                status_code=400,
                detail="The selected file is empty"
            )

        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail="Maximum file size is 10 MB"
            )

        content_type = (
            mimetypes.guess_type(original_name)[0]
            or file.content_type
            or "application/octet-stream"
        )

        storage_path = (
            f"{project_id}/{uuid.uuid4().hex}{extension}"
        )

        storage = get_storage_client(token)

        # Upload the actual file to private Supabase Storage.
        storage.from_(BUCKET_NAME).upload(
            path=storage_path,
            file=file_content,
            file_options={
                "content-type": content_type,
                "upsert": "false"
            }
        )

        try:
            # Save the document metadata in PostgreSQL.
            response = (
                client.table("documents")
                .insert({
                    "project_id": project_id,
                    "uploaded_by": str(current_user.id),
                    "name": original_name,
                    "file_type": extension.lstrip("."),
                    "size_bytes": len(file_content),
                    "storage_path": storage_path
                })
                .select("*")
                .single()
                .execute()
            )

            document = response.data

        except Exception:
            # Remove the uploaded file if metadata insertion fails.
            try:
                storage.from_(BUCKET_NAME).remove([
                    storage_path
                ])
            except Exception:
                pass

            raise

        return {
            "message": "Document uploaded successfully",
            "document": {
                "id": document["id"],
                "name": document["name"],
                "file_type": document["file_type"],
                "size_bytes": document["size_bytes"],
                "created_at": document["created_at"]
            }
        }

    except HTTPException:
        raise

    except Exception as error:
        print("Document upload error:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to upload document"
        )

    finally:
        file.file.close()


@router.get("/{document_id}/download")
def download_document(
    document_id: str,
    authenticated=Depends(get_authenticated_client)
):
    client, current_user, token = authenticated

    try:
        # RLS ensures the user can only retrieve an authorised record.
        document = get_document(client, document_id)

        storage = get_storage_client(token)

        file_content = storage.from_(BUCKET_NAME).download(
            document["storage_path"]
        )

        filename = document["name"]

        return StreamingResponse(
            BytesIO(file_content),
            media_type=(
                mimetypes.guess_type(filename)[0]
                or "application/octet-stream"
            ),
            headers={
                "Content-Disposition": (
                    f'attachment; filename="{filename}"'
                )
            }
        )

    except HTTPException:
        raise

    except Exception as error:
        print("Document download error:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to download document"
        )


@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    authenticated=Depends(get_authenticated_client)
):
    client, current_user, token = authenticated

    try:
        document = get_document(client, document_id)

        # Only the project owner can permanently remove a document.
        project_response = (
            client.table("projects")
            .select("created_by")
            .eq("id", document["project_id"])
            .maybe_single()
            .execute()
        )

        project = project_response.data

        if (
            not project
            or project["created_by"] != str(current_user.id)
        ):
            raise HTTPException(
                status_code=403,
                detail="Only the project owner can delete documents"
            )

        storage = get_storage_client(token)

        # Remove the actual file first.
        storage.from_(BUCKET_NAME).remove([
            document["storage_path"]
        ])

        # Then remove its database record.
        (
            client.table("documents")
            .delete()
            .eq("id", document_id)
            .execute()
        )

        return {
            "message": "Document deleted successfully",
            "document_id": document_id
        }

    except HTTPException:
        raise

    except Exception as error:
        print("Document deletion error:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to delete document"
        )
