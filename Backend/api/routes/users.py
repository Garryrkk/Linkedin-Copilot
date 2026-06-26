"""
Users API — onboarding and profile management.

This is the missing piece referenced by main.py: get_current_user() in
api/middleware/auth.py looks up a User row by clerk_id and 404s
("complete onboarding") if none exists. /onboard is what creates that row.
"""

from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, EmailStr
from typing import Optional
from db.session import get_db
from db.models import User
from api.middleware.auth import get_current_user, get_clerk_user_id, security
import structlog

logger = structlog.get_logger()
router = APIRouter()


# ── Schemas ──────────────────────────────────────────────────

class OnboardRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = ""
    linkedin_profile_url: Optional[str] = ""


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    linkedin_profile_url: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = ""
    linkedin_profile_url: Optional[str] = ""
    has_voice_profile: bool


def to_response(user: User, has_voice_profile: bool) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name or "",
        linkedin_profile_url=user.linkedin_profile_url or "",
        has_voice_profile=has_voice_profile,
    )


# ── Routes ───────────────────────────────────────────────────

@router.post("/onboard", response_model=UserResponse)
async def onboard(
    request: OnboardRequest,
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: AsyncSession = Depends(get_db),
):
    """
    Create (or fetch, idempotently) the User row for the authenticated
    token. Does NOT depend on get_current_user, since that requires the
    row to already exist.
    """
    clerk_id = await get_clerk_user_id(credentials.credentials)

    result = await db.execute(
        select(User)
        .options(selectinload(User.voice_profile))
        .where(User.clerk_id == clerk_id)
    )
    user = result.scalar_one_or_none()

    if user:
        logger.info("user_onboard_existing", user_id=user.id)
        return to_response(user, user.voice_profile is not None)

    user = User(
        clerk_id=clerk_id,
        email=request.email,
        name=request.name,
        linkedin_profile_url=request.linkedin_profile_url,
    )
    db.add(user)
    await db.commit()

    logger.info("user_onboard_created", user_id=user.id)
    # A brand-new user can't have a voice profile yet — no need to query.
    return to_response(user, has_voice_profile=False)


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return to_response(user, user.voice_profile is not None)


@router.put("/me", response_model=UserResponse)
async def update_me(
    request: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Capture before commit — committing can expire the eager-loaded
    # voice_profile relationship, which would re-trigger the same lazy-load
    # crash this eager-load was meant to avoid.
    has_voice_profile = user.voice_profile is not None

    if request.name is not None:
        user.name = request.name
    if request.linkedin_profile_url is not None:
        user.linkedin_profile_url = request.linkedin_profile_url

    await db.commit()
    return to_response(user, has_voice_profile)
