
import mimetypes
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pypdf import PdfReader
from docx import Document
from storage3 import SyncStorageClient
from supabase import create_client

from config import SUPABASE_URL, SUPABASE_KEY


router = APIRouter(prefix="/knowledge", tags=["Knowledge Extraction"])

security = HTTPBearer(auto_error=False)

BUCKET_NAME = "project-documents"


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


def split_values(value):
    if not value:
        return []

    if isinstance(value, list):
        values = value
    else:
        values = str(value).replace("\r", "\n").split("\n")

    result = []

    for item in values:
        cleaned = str(item).strip().lstrip("-•* ").strip()

        if cleaned:
            result.append(cleaned)

    return result


def extract_document_text(file_content, file_type):
    file_type = (file_type or "").lower()

    if file_type == "pdf":
        reader = PdfReader(BytesIO(file_content))

        return "\n".join(
            page.extract_text() or ""
            for page in reader.pages
        ).strip()

    if file_type == "docx":
        document = Document(BytesIO(file_content))

        return "\n".join(
            paragraph.text
            for paragraph in document.paragraphs
            if paragraph.text.strip()
        ).strip()

    if file_type in ["txt", "md"]:
        return file_content.decode(
            "utf-8",
            errors="replace"
        ).strip()

    return ""


@router.post("/extract/{project_id}")
def extract_project_knowledge(
    project_id: str,
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
            detail="Only project managers can extract project knowledge"
        )

    try:
        journals_response = (
            client.table("journals")
            .select("*")
            .eq("project_id", project_id)
            .order("entry_date", desc=False)
            .execute()
        )

        documents_response = (
            client.table("documents")
            .select("*")
            .eq("project_id", project_id)
            .execute()
        )

        existing_response = (
            client.table("knowledge_items")
            .select("item_type, content, source")
            .eq("project_id", project_id)
            .execute()
        )

        journals = journals_response.data or []
        documents = documents_response.data or []
        existing_items = existing_response.data or []

        existing_sources = {
            (
                item.get("source", {}).get("source_type"),
                item.get("source", {}).get("journal_id"),
                item.get("source", {}).get("document_id"),
                item.get("item_type"),
                item.get("content")
            )
            for item in existing_items
            if isinstance(item.get("source"), dict)
        }

        new_items = []

        journal_categories = {
            "work_summary": "completed",
            "completed_tasks": "completed",
            "decisions": "decision",
            "blockers": "blocker",
            "dependencies": "dependency",
            "pending_tasks": "pending",
            "next_steps": "next_step",
        }

        for journal in journals:
            for field, item_type in journal_categories.items():
                values = split_values(journal.get(field))

                for content in values:
                    source = {
                        "source_type": "journal",
                        "journal_id": journal["id"],
                        "entry_date": journal.get("entry_date"),
                        "employee_id": journal.get("employee_id"),
                        "field": field,
                    }

                    source_key = (
                        "journal",
                        journal["id"],
                        None,
                        item_type,
                        content
                    )

                    if source_key in existing_sources:
                        continue

                    new_items.append({
                        "project_id": project_id,
                        "item_type": item_type,
                        "content": content,
                        "source": source
                    })

                    existing_sources.add(source_key)

        storage = get_storage_client(token)
        document_errors = []

        for document in documents:
            try:
                file_content = storage.from_(BUCKET_NAME).download(
                    document["storage_path"]
                )

                text_content = extract_document_text(
                    file_content,
                    document.get("file_type")
                )

                if not text_content:
                    continue

                # Store a readable excerpt, not the entire document.
                excerpt = text_content[:3000].strip()

                source = {
                    "source_type": "document",
                    "document_id": document["id"],
                    "document_name": document["name"],
                }

                source_key = (
                    "document",
                    None,
                    document["id"],
                    "document",
                    excerpt
                )

                if source_key in existing_sources:
                    continue

                new_items.append({
                    "project_id": project_id,
                    "item_type": "document",
                    "content": excerpt,
                    "source": source
                })

                existing_sources.add(source_key)

            except Exception as error:
                print(
                    f"Document extraction failed for {document.get('name')}:",
                    error
                )

                document_errors.append(document.get("name", "Unknown document"))

        saved_items = []

        if new_items:
            insert_response = (
                client.table("knowledge_items")
                .insert(new_items)
                .execute()
            )

            saved_items = insert_response.data or []

        return {
            "message": "Knowledge extraction completed",
            "project_id": project_id,
            "journals_processed": len(journals),
            "documents_processed": len(documents) - len(document_errors),
            "findings_created": len(saved_items),
            "findings": saved_items,
            "document_errors": document_errors,
            "extraction_method": "rule_based"
        }

    except HTTPException:
        raise

    except Exception as error:
        print("Knowledge extraction error:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to extract project knowledge"
        )
