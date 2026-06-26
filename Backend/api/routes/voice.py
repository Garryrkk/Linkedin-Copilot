"""
Voice API — builds and stores the user's writing-voice profile.

Reuses agent5_voice.build_voice_profile (the exact function the pipeline
itself calls during the Voice Consistency phase) rather than duplicating
prompt logic.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List
from db.session import get_db
from db.models import User, VoiceProfile
from api.middleware.auth import get_current_user
from agents.agent5_voice import build_voice_profile
import structlog

logger = structlog.get_logger()
router = APIRouter()


class BuildVoiceProfileRequest(BaseModel):
    writing_samples: str


class VoiceProfileResponse(BaseModel):
    tone: Optional[str] = ""
    style: Optional[str] = ""
    avg_sentence_length: Optional[int] = 0
    common_words: List[str] = []
    voice_summary: Optional[str] = ""


def to_response(profile: VoiceProfile) -> VoiceProfileResponse:
    return VoiceProfileResponse(
        tone=profile.tone or "",
        style=profile.style or "",
        avg_sentence_length=profile.avg_sentence_length or 0,
        common_words=profile.common_words or [],
        voice_summary=(profile.raw_profile_json or {}).get("voice_summary", ""),
    )


@router.get("/profile", response_model=Optional[VoiceProfileResponse])
async def get_voice_profile(user: User = Depends(get_current_user)):
    if not user.voice_profile:
        return None
    return to_response(user.voice_profile)


@router.post("/profile", response_model=VoiceProfileResponse)
async def create_or_update_voice_profile(
    request: BuildVoiceProfileRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if len(request.writing_samples.strip()) < 50:
        raise HTTPException(
            status_code=400,
            detail="Writing samples too short (minimum 50 characters) to build a reliable voice profile",
        )

    logger.info("voice_profile_build_start", user_id=user.id)
    profile_data = await build_voice_profile(request.writing_samples)

    result = await db.execute(
        select(VoiceProfile).where(VoiceProfile.user_id == user.id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        profile = VoiceProfile(user_id=user.id)
        db.add(profile)

    profile.tone = profile_data.get("tone", "")
    profile.style = profile_data.get("style", "")
    try:
        profile.avg_sentence_length = int(profile_data.get("avg_sentence_length", 0))
    except (ValueError, TypeError):
        profile.avg_sentence_length = 0
    profile.common_words = profile_data.get("common_words", [])
    profile.sample_writing = request.writing_samples
    profile.raw_profile_json = profile_data

    await db.commit()
    await db.refresh(profile)

    logger.info("voice_profile_build_complete", user_id=user.id)
    return to_response(profile)
