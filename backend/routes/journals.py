
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from supabase import create_client

from config import SUPABASE_URL, SUPABASE_KEY

router = APIRouter(prefix="/journals", tags=["Journals"])
security = HTTPBearer(auto_error=False)


class JournalRequest(BaseModel):
    project_id: str
    entry_date: date
    work_summary: Optional[str] = None
    completed_tasks: Optional[str] = None
    decisions: Optional[str] = None
    blockers: Optional[str] = None
    dependencies: Optional[str] = None
    pending_tasks: Optional[str] = None
    next_steps: Optional[str] = None
    evidence: Optional[str] = None


def get_authenticated_client(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    try:
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        token = credentials.credentials

        auth_response = client.auth.get_user(token)

        if not auth_response.user:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired session"
            )

        client.postgrest.auth(token)

        return client, auth_response.user

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session"
        )


@router.post("/")
def create_journal(
    request: JournalRequest,
    authenticated=Depends(get_authenticated_client)
):
    client, current_user = authenticated

    try:
        profile_response = (
            client.table("profiles")
            .select("id, role")
            .eq("id", str(current_user.id))
            .single()
            .execute()
        )

        profile = profile_response.data

        if not profile or profile["role"] != "employee":
            raise HTTPException(
                status_code=403,
                detail="Only employees can submit daily journals"
            )

        journal_data = {
            "project_id": request.project_id,
            "employee_id": str(current_user.id),
            "entry_date": request.entry_date.isoformat(),
            "work_summary": request.work_summary,
            "completed_tasks": request.completed_tasks,
            "decisions": request.decisions,
            "blockers": request.blockers,
            "dependencies": request.dependencies,
            "pending_tasks": request.pending_tasks,
            "next_steps": request.next_steps,
            "evidence": request.evidence,
        }

        response = (
            client.table("journals")
            .insert(journal_data)
            .select("*")
            .single()
            .execute()
        )

        return {
            "message": "Journal saved successfully",
            "journal": response.data
        }

    except HTTPException:
        raise

    except Exception as error:
        print("Journal creation error:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to save journal. Check project access and database permissions."
        )
