
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from supabase import create_client

from config import SUPABASE_URL, SUPABASE_KEY


router = APIRouter(
    prefix="/support-requests",
    tags=["Requests & Support"]
)

security = HTTPBearer()

REQUEST_TYPES = {"document", "blocker", "clarification"}
PRIORITIES = {"Low", "Medium", "High"}
STATUSES = {"Pending", "In Review", "Resolved"}


class CreateRequest(BaseModel):
    project_id: str
    request_type: str
    title: str = Field(min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=1500)
    document_name: Optional[str] = None
    priority: str = "Medium"


class UpdateRequest(BaseModel):
    response: Optional[str] = Field(default=None, max_length=1500)
    status: str


def get_authenticated_client(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials
    client = create_client(SUPABASE_URL, SUPABASE_KEY)

    try:
        auth_response = client.auth.get_user(token)

        if not auth_response.user:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired authentication token."
            )

        client.postgrest.auth(token)

        return client, auth_response.user

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token."
        )


def get_profile(client, user_id):
    response = (
        client.table("profiles")
        .select("id, name, email, role")
        .eq("id", user_id)
        .execute()
    )

    profiles = response.data or []

    if not profiles:
        raise HTTPException(
            status_code=404,
            detail="User profile not found."
        )

    return profiles[0]


def format_request(record):
    return {
        "id": record.get("id"),
        "projectId": record.get("project_id"),
        "submittedById": record.get("submitted_by"),
        "type": record.get("request_type"),
        "title": record.get("title"),
        "description": record.get("description") or "",
        "documentName": record.get("document_name") or "",
        "priority": record.get("priority"),
        "status": record.get("status"),
        "response": record.get("response") or "",
        "respondedBy": record.get("responded_by"),
        "createdAt": record.get("created_at"),
        "updatedAt": record.get("updated_at"),
    }


@router.get("/")
def get_support_requests(
    authenticated=Depends(get_authenticated_client),
):
    client, current_user = authenticated

    try:
        profile = get_profile(client, current_user.id)

        query = (
            client.table("support_requests")
            .select("*")
            .order("created_at", desc=True)
        )

        if profile["role"] == "employee":
            query = query.eq("submitted_by", current_user.id)

        elif profile["role"] != "manager":
            raise HTTPException(
                status_code=403,
                detail="You are not authorised to view support requests."
            )

        response = query.execute()

        return {
            "requests": [
                format_request(record)
                for record in (response.data or [])
            ]
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.post("/")
def create_support_request(
    request: CreateRequest,
    authenticated=Depends(get_authenticated_client),
):
    client, current_user = authenticated

    try:
        profile = get_profile(client, current_user.id)

        if profile["role"] != "employee":
            raise HTTPException(
                status_code=403,
                detail="Only employees can submit support requests."
            )

        if request.request_type not in REQUEST_TYPES:
            raise HTTPException(
                status_code=400,
                detail="Invalid request type."
            )

        if request.priority not in PRIORITIES:
            raise HTTPException(
                status_code=400,
                detail="Invalid priority."
            )

        if not request.title.strip():
            raise HTTPException(
                status_code=400,
                detail="Request title cannot be empty."
            )

        if request.request_type == "document" and not request.document_name:
            raise HTTPException(
                status_code=400,
                detail="Please specify the requested document."
            )

        member_response = (
            client.table("project_members")
            .select("user_id")
            .eq("project_id", request.project_id)
            .eq("user_id", current_user.id)
            .execute()
        )

        if not member_response.data:
            raise HTTPException(
                status_code=403,
                detail="You are not a member of this project."
            )

        project_response = (
            client.table("projects")
            .select("id, name")
            .eq("id", request.project_id)
            .execute()
        )

        projects = project_response.data or []

        if not projects:
            raise HTTPException(
                status_code=404,
                detail="Project not found."
            )

        now = datetime.now(timezone.utc).isoformat()

        record = {
            "project_id": request.project_id,
            "submitted_by": current_user.id,
            "request_type": request.request_type,
            "title": request.title.strip(),
            "description": request.description,
            "document_name": request.document_name,
            "priority": request.priority,
            "status": "Pending",
            "created_at": now,
            "updated_at": now,
        }

        response = (
            client.table("support_requests")
            .insert(record)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=400,
                detail="Could not submit the support request."
            )

        return {
            "message": "Request submitted successfully.",
            "request": format_request(response.data[0]),
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.patch("/{request_id}")
def update_support_request(
    request_id: str,
    request: UpdateRequest,
    authenticated=Depends(get_authenticated_client),
):
    client, current_user = authenticated

    try:
        profile = get_profile(client, current_user.id)

        if profile["role"] != "manager":
            raise HTTPException(
                status_code=403,
                detail="Only project managers can update requests."
            )

        if request.status not in STATUSES:
            raise HTTPException(
                status_code=400,
                detail="Invalid request status."
            )

        existing_response = (
            client.table("support_requests")
            .select("*")
            .eq("id", request_id)
            .execute()
        )

        records = existing_response.data or []

        if not records:
            raise HTTPException(
                status_code=404,
                detail="Support request not found."
            )

        existing = records[0]

        project_response = (
            client.table("projects")
            .select("id, created_by")
            .eq("id", existing["project_id"])
            .execute()
        )

        projects = project_response.data or []

        if not projects or projects[0]["created_by"] != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You are not authorised to manage this request."
            )

        now = datetime.now(timezone.utc).isoformat()

        changes = {
            "response": (request.response or "").strip(),
            "status": request.status,
            "responded_by": current_user.id,
            "updated_at": now,
        }

        updated_response = (
            client.table("support_requests")
            .update(changes)
            .eq("id", request_id)
            .execute()
        )

        if not updated_response.data:
            raise HTTPException(
                status_code=400,
                detail="Could not update the support request."
            )

        return {
            "message": "Request updated successfully.",
            "request": format_request(updated_response.data[0]),
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))
