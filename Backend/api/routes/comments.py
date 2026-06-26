"""
Comments API — performance tracking for generated comments.

Exposes the "Performance tracking (V2)" columns already on
GeneratedComment (likes_received, replies_received, author_responded,
profile_visits_generated, was_posted, posted_at) which had no endpoint
to set them.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import Optional
from db.session import get_db
from db.models import User, GeneratedComment
from api.middleware.auth import get_current_user
import structlog

logger = structlog.get_logger()
router = APIRouter()


class UpdateCommentRequest(BaseModel):
    was_posted: Optional[bool] = None
    likes_received: Optional[int] = None
    replies_received: Optional[int] = None
    author_responded: Optional[bool] = None
    profile_visits_generated: Optional[int] = None


class CommentResponse(BaseModel):
    id: str
    post_id: str
    strategy: str
    final_comment: str
    total_quality_score: float
    ranking_position: Optional[int]
    passed_quality_filter: bool
    was_posted: bool
    likes_received: Optional[int]
    replies_received: Optional[int]
    author_responded: bool
    profile_visits_generated: Optional[int]


def to_response(comment: GeneratedComment) -> CommentResponse:
    return CommentResponse(
        id=comment.id,
        post_id=comment.post_id,
        strategy=comment.strategy,
        final_comment=comment.final_comment,
        total_quality_score=comment.total_quality_score,
        ranking_position=comment.ranking_position,
        passed_quality_filter=comment.passed_quality_filter,
        was_posted=comment.was_posted,
        likes_received=comment.likes_received,
        replies_received=comment.replies_received,
        author_responded=comment.author_responded,
        profile_visits_generated=comment.profile_visits_generated,
    )


async def _get_owned_comment(comment_id: str, user: User, db: AsyncSession) -> GeneratedComment:
    result = await db.execute(
        select(GeneratedComment).where(
            GeneratedComment.id == comment_id,
            GeneratedComment.user_id == user.id,
        )
    )
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    return comment


@router.get("/{comment_id}", response_model=CommentResponse)
async def get_comment(
    comment_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    comment = await _get_owned_comment(comment_id, user, db)
    return to_response(comment)


@router.patch("/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: str,
    request: UpdateCommentRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    comment = await _get_owned_comment(comment_id, user, db)

    if request.was_posted is not None:
        comment.was_posted = request.was_posted
        if request.was_posted and not comment.posted_at:
            comment.posted_at = func.now()
    if request.likes_received is not None:
        comment.likes_received = request.likes_received
    if request.replies_received is not None:
        comment.replies_received = request.replies_received
    if request.author_responded is not None:
        comment.author_responded = request.author_responded
    if request.profile_visits_generated is not None:
        comment.profile_visits_generated = request.profile_visits_generated

    await db.commit()
    await db.refresh(comment)

    logger.info("comment_updated", comment_id=comment.id, was_posted=comment.was_posted)
    return to_response(comment)
