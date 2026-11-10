
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client

from config import SUPABASE_URL, SUPABASE_KEY

router = APIRouter(prefix="/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(request: LoginRequest):
    try:
        client = create_client(SUPABASE_URL, SUPABASE_KEY)

        auth_response = client.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not auth_response.user or not auth_response.session:
        raise HTTPException(
            status_code=401,
            detail="Login failed"
        )

    try:
        user_client = create_client(SUPABASE_URL, SUPABASE_KEY)

        user_client.auth.set_session(
            auth_response.session.access_token,
            auth_response.session.refresh_token
        )

        profile_response = (
            user_client
            .table("profiles")
            .select("id, name, email, role")
            .eq("id", str(auth_response.user.id))
            .single()
            .execute()
        )

        profile = profile_response.data

        if not profile:
            raise HTTPException(
                status_code=403,
                detail="User profile not found"
            )

    except HTTPException:
        raise

    except Exception as error:
        print("Profile lookup error:", error)
        raise HTTPException(
            status_code=403,
            detail="Unable to retrieve user profile"
        )

    if profile["role"] not in ["manager", "employee"]:
        raise HTTPException(
            status_code=403,
            detail="Invalid user role"
        )

    return {
        "message": "Login successful",
        "access_token": auth_response.session.access_token,
        "refresh_token": auth_response.session.refresh_token,
        "token_type": "bearer",
        "user": profile
    }
