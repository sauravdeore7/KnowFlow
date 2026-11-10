
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from supabase import create_client

from config import SUPABASE_URL, SUPABASE_KEY

router = APIRouter(prefix="/projects", tags=["Projects"])
security = HTTPBearer(auto_error=False)


class ProjectMemberInput(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str
    role: str


class ProjectCreateInput(BaseModel):
    name: str = Field(min_length=3, max_length=60)
    description: str = Field(min_length=20, max_length=500)
    members: list[ProjectMemberInput] = Field(default_factory=list)


class ProjectUpdateInput(BaseModel):
    name: str = Field(min_length=3, max_length=60)
    description: str = Field(min_length=20, max_length=500)
    status: str = Field(min_length=1, max_length=30)


def get_authenticated_client(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")

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

        return client, auth_response.user

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session"
        )


def to_text(value):
    if value is None:
        return ""

    if isinstance(value, list):
        return "\n".join(
            str(item) for item in value if item is not None
        )

    return str(value)


def get_source_label(source):
    if isinstance(source, dict):
        return (
            source.get("journal_id")
            or source.get("document_id")
            or source.get("source_type")
        )

    return source


def get_handover_status(handover):
    status = handover.get("status", "")

    status_map = {
        "pending_employee_review": "not_started",
        "pending_manager_review": "awaiting_approval",
        "changes_requested": "changes_requested",
        "approved": "approved",
        "shared": "approved",
    }

    return status_map.get(status, status or "not_started")


def get_handover_review(handover, incoming_profile):
    if not handover:
        return {}

    employee_confirmation = handover.get("employee_confirmation") or {}
    manager_approval = handover.get("manager_approval") or {}
    access_permissions = handover.get("access_permissions") or {}
    shared_at = handover.get("shared_at")

    is_shared = bool(
        shared_at
        and access_permissions.get("incoming_employee_access", False)
        and not access_permissions.get("revoked_at")
    )

    permissions = access_permissions.get(
        "permissions",
        access_permissions
    )

    if not isinstance(permissions, dict):
        permissions = {}

    access = {
        "status": (
            "active"
            if is_shared
            else access_permissions.get("status", "inactive")
        ),
        "grantedAt": access_permissions.get("granted_at"),
        "revokedAt": access_permissions.get("revoked_at"),
        "revokedBy": access_permissions.get("revoked_by"),
    }

    return {
        "id": handover.get("id"),
        "handoverId": handover.get("id"),
        "employeeConfirmation": {
            "confirmedAt": (
                employee_confirmation.get("confirmed_at")
                or employee_confirmation.get("confirmedAt")
            ),
            "confirmedBy": (
                employee_confirmation.get("confirmed_by")
                or employee_confirmation.get("confirmedBy")
            ),
            "employeeResponse": (
                employee_confirmation.get("comments")
                or employee_confirmation.get("employee_response")
                or employee_confirmation.get("employeeResponse")
                or ""
            ),
        },
        "employeeResponse": (
            employee_confirmation.get("comments")
            or employee_confirmation.get("employee_response")
            or employee_confirmation.get("employeeResponse")
            or ""
        ),
        "approvedAt": (
            manager_approval.get("approved_at")
            or manager_approval.get("approvedAt")
        ),
        "approvedBy": (
            manager_approval.get("approved_by")
            or manager_approval.get("approvedBy")
        ),
        "goodWishes": (
            manager_approval.get("good_wishes")
            or manager_approval.get("goodWishes")
            or ""
        ),
        "managerFeedback": (
            manager_approval.get("comments")
            or manager_approval.get("manager_feedback")
            or manager_approval.get("managerFeedback")
            or ""
        ),
        "incomingEmployeeId": handover.get("incoming_employee_id"),
        "incomingEmployeeName": incoming_profile.get("name", ""),
        "incomingEmployeeEmail": incoming_profile.get("email", ""),
        "permissions": {
            "viewReport": permissions.get("viewReport", True),
            "viewDocuments": permissions.get("viewDocuments", True),
            "viewSources": permissions.get("viewSources", True),
            "downloadDocuments": permissions.get(
                "downloadDocuments", False
            ),
        },
        "sharedAt": shared_at,
        "sharedBy": access_permissions.get("shared_by", ""),
        "access": access,
        "report": handover.get("report") or {},
        "updatedAt": handover.get("updated_at"),
    }


@router.post("/")
def create_project(
    payload: ProjectCreateInput,
    authenticated=Depends(get_authenticated_client)
):
    client, current_user = authenticated
    project_id = None

    try:
        # Verify that the current user is a manager.
        profile_response = (
            client.table("profiles")
            .select("id, name, email, role")
            .eq("id", current_user.id)
            .maybe_single()
            .execute()
        )

        manager_profile = profile_response.data

        if not manager_profile or manager_profile.get("role") != "manager":
            raise HTTPException(
                status_code=403,
                detail="Only managers can create projects."
            )

        project_name = payload.name.strip()
        description = payload.description.strip()

        if not project_name or not description:
            raise HTTPException(
                status_code=400,
                detail="Project name and description are required."
            )

        # Check for duplicate project names owned by this manager.
        duplicate_response = (
            client.table("projects")
            .select("id")
            .eq("created_by", current_user.id)
            .ilike("name", project_name)
            .execute()
        )

        if duplicate_response.data:
            raise HTTPException(
                status_code=409,
                detail="A project with this name already exists."
            )

        # Resolve employee accounts.
        member_profiles = []
        seen_emails = {
            (manager_profile.get("email") or "").lower()
        }

        allowed_designations = {
            "Developer",
            "Incoming Developer",
            "QA Engineer",
            "DevOps Engineer",
            "Designer",
            "Team Member",
        }

        for member in payload.members:
            email = member.email.strip().lower()
            designation = member.role.strip()

            if not email or email in seen_emails:
                raise HTTPException(
                    status_code=400,
                    detail=f"Duplicate or invalid member email: {email}"
                )

            if designation not in allowed_designations:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid member designation: {designation}"
                )

            seen_emails.add(email)

            member_response = (
                client.table("profiles")
                .select("id, name, email, role")
                .ilike("email", email)
                .execute()
            )

            matches = member_response.data or []

            if not matches:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"No KnowFlow account exists for {email}. "
                        "Ask this person to register first."
                    )
                )

            if len(matches) > 1:
                raise HTTPException(
                    status_code=400,
                    detail=f"Multiple accounts found for {email}."
                )

            member_profile = matches[0]

            if member_profile.get("role") != "employee":
                raise HTTPException(
                    status_code=400,
                    detail=f"{email} is not an employee account."
                )

            member_profiles.append({
                "user_id": member_profile["id"],
                "name": member_profile.get("name") or member.name,
                "email": member_profile.get("email") or email,
                "role": "employee",
                "designation": designation,
                "departing": False,
            })

        # Create the project.
        project_response = (
            client.table("projects")
            .insert({
                "name": project_name,
                "description": description,
                "status": "active",
                "handover_status": "not_started",
                "created_by": current_user.id,
            })
            .execute()
        )

        if not project_response.data:
            raise HTTPException(
                status_code=500,
                detail="Project creation failed."
            )

        project = project_response.data[0]
        project_id = project["id"]

        # Add manager and employees to the project.
        memberships = [
            {
                "project_id": project_id,
                "user_id": current_user.id,
                "role": "manager",
                "designation": "Project Manager",
                "departing": False,
            }
        ] + [
            {
                "project_id": project_id,
                "user_id": member["user_id"],
                "role": member["role"],
                "designation": member["designation"],
                "departing": member["departing"],
            }
            for member in member_profiles
        ]

        client.table("project_members").insert(memberships).execute()

        return {
            "message": "Project created successfully.",
            "project": {
                "id": project["id"],
                "name": project["name"],
                "description": project.get("description") or "",
                "status": project["status"],
                "handoverStatus": project["handover_status"],
                "createdAt": project.get("created_at"),
                "updatedAt": project.get("updated_at"),
                "members": [
                    {
                        "id": current_user.id,
                        "name": manager_profile.get("name", ""),
                        "email": manager_profile.get("email", ""),
                        "role": "Project Manager",
                        "designation": "Project Manager",
                        "departing": False,
                    }
                ] + [
                    {
                        "id": member["user_id"],
                        "name": member["name"],
                        "email": member["email"],
                        "role": "Employee",
                        "designation": member["designation"],
                        "departing": False,
                    }
                    for member in member_profiles
                ],
                "journalEntries": [],
                "documents": [],
                "knowledge": {
                    "summary": "No knowledge items recorded yet.",
                    "items": [],
                },
                "handovers": [],
                "handoverRecord": None,
                "handoverReview": {},
            }
        }

    except HTTPException:
        raise

    except Exception as error:
        print("Project creation error:", error)

        if project_id:
            try:
                client.table("projects").delete().eq(
                    "id", project_id
                ).execute()
            except Exception as cleanup_error:
                print("Project cleanup error:", cleanup_error)

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to create project. "
                "Please check database permissions and try again."
            )
        )


@router.get("/")
def get_projects(
    authenticated=Depends(get_authenticated_client)
):
    client, current_user = authenticated

    try:
        project_response = (
            client.table("projects")
            .select(
                "id, name, description, status, handover_status, "
                "created_by, created_at, updated_at, "
                "project_members("
                "id, user_id, role, designation, departing, joined_at"
                ")"
            )
            .order("created_at", desc=True)
            .execute()
        )

        database_projects = project_response.data or []

        if not database_projects:
            return {"projects": []}

        project_ids = [
            project["id"] for project in database_projects
        ]

        journals_response = (
            client.table("journals")
            .select("*")
            .in_("project_id", project_ids)
            .order("entry_date", desc=True)
            .execute()
        )

        documents_response = (
            client.table("documents")
            .select("*")
            .in_("project_id", project_ids)
            .order("created_at", desc=True)
            .execute()
        )

        knowledge_response = (
            client.table("knowledge_items")
            .select("*")
            .in_("project_id", project_ids)
            .order("created_at", desc=True)
            .execute()
        )

        handovers_response = (
            client.table("handovers")
            .select("*")
            .in_("project_id", project_ids)
            .order("created_at", desc=True)
            .execute()
        )

        journals = journals_response.data or []
        documents = documents_response.data or []
        knowledge_items = knowledge_response.data or []
        handovers = handovers_response.data or []

        profile_ids = set()

        for project in database_projects:
            for member in project.get("project_members", []):
                profile_ids.add(member["user_id"])

        for journal in journals:
            profile_ids.add(journal["employee_id"])

        for document in documents:
            profile_ids.add(document["uploaded_by"])

        for handover in handovers:
            if handover.get("outgoing_employee_id"):
                profile_ids.add(handover["outgoing_employee_id"])

            if handover.get("incoming_employee_id"):
                profile_ids.add(handover["incoming_employee_id"])

        profiles = {}

        if profile_ids:
            profile_response = (
                client.table("profiles")
                .select("id, name, email, role")
                .in_("id", list(profile_ids))
                .execute()
            )

            profiles = {
                profile["id"]: profile
                for profile in (profile_response.data or [])
            }

        journals_by_project = {}
        documents_by_project = {}
        knowledge_by_project = {}
        handovers_by_project = {}

        for journal in journals:
            journals_by_project.setdefault(
                journal["project_id"], []
            ).append(journal)

        for document in documents:
            documents_by_project.setdefault(
                document["project_id"], []
            ).append(document)

        for item in knowledge_items:
            knowledge_by_project.setdefault(
                item["project_id"], []
            ).append(item)

        for handover in handovers:
            handovers_by_project.setdefault(
                handover["project_id"], []
            ).append(handover)

        result = []

        for project in database_projects:
            project_id = project["id"]

            project_handovers = handovers_by_project.get(
                project_id, []
            )

            latest_handover = (
                project_handovers[0]
                if project_handovers
                else None
            )

            outgoing_id = (
                latest_handover.get("outgoing_employee_id")
                if latest_handover
                else None
            )

            incoming_id = (
                latest_handover.get("incoming_employee_id")
                if latest_handover
                else None
            )

            outgoing_profile = (
                profiles.get(outgoing_id, {})
                if outgoing_id else {}
            )

            incoming_profile = (
                profiles.get(incoming_id, {})
                if incoming_id else {}
            )

            members = []

            for member in project.get("project_members", []):
                profile = profiles.get(member["user_id"], {})
                role = member.get("role", "employee")

                members.append({
                    "id": member["user_id"],
                    "name": profile.get("name", "Team member"),
                    "email": profile.get("email", ""),
                    "role": (
                        "Project Manager"
                        if role == "manager"
                        else "Employee"
                    ),
                    "designation": member.get("designation") or (
                        "Project Manager"
                        if role == "manager"
                        else "Team Member"
                    ),
                    "departing": (
                        member.get("departing", False)
                        or member["user_id"] == outgoing_id
                    )
                })

            project_journals = []

            for journal in journals_by_project.get(project_id, []):
                author = profiles.get(journal["employee_id"], {})

                project_journals.append({
                    "id": journal["id"],
                    "date": journal.get("entry_date"),
                    "workSummary": journal.get("work_summary", ""),
                    "completedTasks": to_text(
                        journal.get("completed_tasks")
                    ),
                    "decisions": to_text(journal.get("decisions")),
                    "blockers": to_text(journal.get("blockers")),
                    "dependencies": to_text(journal.get("dependencies")),
                    "pendingTasks": to_text(journal.get("pending_tasks")),
                    "nextSteps": to_text(journal.get("next_steps")),
                    "evidence": to_text(journal.get("evidence")),
                    "createdBy": author.get("name", "Team member"),
                    "createdAt": journal.get("created_at")
                })

            project_documents = []

            for document in documents_by_project.get(project_id, []):
                uploader = profiles.get(document["uploaded_by"], {})
                size_bytes = document.get("size_bytes") or 0

                project_documents.append({
                    "id": document["id"],
                    "sourceId": document["id"],
                    "name": document["name"],
                    "type": (
                        document.get("file_type") or ""
                    ).upper(),
                    "sizeKb": round(size_bytes / 1024, 2),
                    "uploadedBy": uploader.get("name", "Team member"),
                    "uploadedAt": document.get("created_at")
                })

            project_knowledge = []

            for item in knowledge_by_project.get(project_id, []):
                project_knowledge.append({
                    "id": item["id"],
                    "type": item["item_type"],
                    "text": item["content"],
                    "source": get_source_label(item.get("source"))
                })

            knowledge_summary = (
                " ".join(
                    item["content"]
                    for item in knowledge_by_project.get(
                        project_id, []
                    )[:3]
                )
                if project_knowledge
                else "No knowledge items recorded yet."
            )

            formatted_handovers = []

            for handover in project_handovers:
                outgoing = profiles.get(
                    handover.get("outgoing_employee_id"), {}
                )

                handover_incoming_id = handover.get(
                    "incoming_employee_id"
                )

                incoming = (
                    profiles.get(handover_incoming_id, {})
                    if handover_incoming_id else {}
                )

                formatted_handovers.append({
                    "id": handover["id"],
                    "outgoingEmployeeId": handover.get(
                        "outgoing_employee_id"
                    ),
                    "outgoingEmployeeName": outgoing.get(
                        "name", "Team member"
                    ),
                    "incomingEmployeeId": handover_incoming_id,
                    "incomingEmployeeName": incoming.get("name", ""),
                    "report": handover.get("report") or {},
                    "employeeConfirmation": (
                        handover.get("employee_confirmation") or {}
                    ),
                    "managerApproval": (
                        handover.get("manager_approval") or {}
                    ),
                    "accessPermissions": (
                        handover.get("access_permissions") or {}
                    ),
                    "status": handover.get("status"),
                    "sharedAt": handover.get("shared_at"),
                    "createdAt": handover.get("created_at"),
                    "updatedAt": handover.get("updated_at")
                })

            handover_review = get_handover_review(
                latest_handover,
                incoming_profile
            )

            result.append({
                "id": project_id,
                "name": project["name"],
                "description": project.get("description") or "",
                "status": project["status"],
                "handoverStatus": (
                    get_handover_status(latest_handover)
                    if latest_handover
                    else project.get(
                        "handover_status", "not_started"
                    )
                ),
                "handoverReview": handover_review,
                "handoverRecord": (
                    formatted_handovers[0]
                    if formatted_handovers else None
                ),
                "createdAt": project.get("created_at"),
                "updatedAt": project.get("updated_at"),
                "members": members,
                "journalEntries": project_journals,
                "documents": project_documents,
                "knowledge": {
                    "summary": knowledge_summary,
                    "items": project_knowledge
                },
                "handovers": formatted_handovers
            })

        return {"projects": result}

    except HTTPException:
        raise

    except Exception as error:
        print("Project retrieval error:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve projects"
        )


@router.patch("/{project_id}")
def update_project(
    project_id: str,
    payload: ProjectUpdateInput,
    authenticated=Depends(get_authenticated_client)
):
    client, current_user = authenticated

    try:
        # Verify manager role.
        profile_response = (
            client.table("profiles")
            .select("id, role")
            .eq("id", current_user.id)
            .maybe_single()
            .execute()
        )

        profile = profile_response.data

        if not profile or profile.get("role") != "manager":
            raise HTTPException(
                status_code=403,
                detail="Only managers can update projects."
            )

        # Find the project.
        project_response = (
            client.table("projects")
            .select("id, created_by")
            .eq("id", project_id)
            .maybe_single()
            .execute()
        )

        project = project_response.data

        if not project:
            raise HTTPException(
                status_code=404,
                detail="Project not found."
            )

        if project["created_by"] != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only update projects you own."
            )

        project_name = payload.name.strip()
        description = payload.description.strip()
        status = payload.status.strip()

        if not project_name or not description or not status:
            raise HTTPException(
                status_code=400,
                detail="Project name, description and status are required."
            )

        # Check duplicate names, excluding this project.
        duplicate_response = (
            client.table("projects")
            .select("id")
            .eq("created_by", current_user.id)
            .ilike("name", project_name)
            .neq("id", project_id)
            .execute()
        )

        if duplicate_response.data:
            raise HTTPException(
                status_code=409,
                detail="Another project with this name already exists."
            )

        # Update only the project's editable fields.
        update_response = (
            client.table("projects")
            .update({
                "name": project_name,
                "description": description,
                "status": status,
            })
            .eq("id", project_id)
            .execute()
        )

        if not update_response.data:
            raise HTTPException(
                status_code=500,
                detail="Project update failed."
            )

        updated = update_response.data[0]

        return {
            "message": "Project updated successfully.",
            "project": {
                "id": updated["id"],
                "name": updated["name"],
                "description": updated.get("description") or "",
                "status": updated["status"],
                "updatedAt": updated.get("updated_at"),
            }
        }

    except HTTPException:
        raise

    except Exception as error:
        print("Project update error:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to update project."
        )
