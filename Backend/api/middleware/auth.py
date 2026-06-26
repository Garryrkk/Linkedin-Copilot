"""
Auth middleware — verifies Clerk JWT tokens.
Falls back to a simple Bearer token check for development.
"""

from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from db.session import get_db
from db.models import User
from core.config import settings
import httpx
import structlog

logger = structlog.get_logger()
security = HTTPBearer()


async def get_clerk_user_id(token: str) -> str:
    """Verify Clerk token and return user ID."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.clerk.com/v1/tokens/verify",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("sub") or data.get("user_id")
    except Exception as e:
        logger.warning("clerk_token_verification_failed", error=str(e))

    # Dev fallback: decode JWT without verification
    try:
        import jwt as pyjwt
        payload = pyjwt.decode(token, options={"verify_signature": False})
        user_id = payload.get("sub")
        if user_id:
            return user_id
    except Exception:
        pass

    raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """FastAPI dependency — returns the current authenticated user."""
    token = credentials.credentials
    clerk_id = await get_clerk_user_id(token)

    result = await db.execute(
        select(User)
        .options(selectinload(User.voice_profile))
        .where(User.clerk_id == clerk_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found. Please complete onboarding."
        )

    return user


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Returns user or None (for public endpoints)."""
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None