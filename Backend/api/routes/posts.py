"""
Posts API — handles post submission and comment generation pipeline.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, HttpUrl
from typing import Optional, Literal
from db.session import get_db
from db.models import User, Post, GeneratedComment, InputSource, EngagementStrategy
from api.middleware.auth import get_current_user
from agents.pipeline import run_pipeline
from agents.agent7_ranking import RANK_LABELS, STRATEGY_DISPLAY_NAMES
import base64
import structlog

logger = structlog.get_logger()
router = APIRouter()


# ── Request / Response schemas ──────────────────────────────

class GenerateFromURLRequest(BaseModel):
    url: str


class GenerateFromTextRequest(BaseModel):
    text: str
    author_name: Optional[str] = ""


class GenerateResponse(BaseModel):
    post_id: str
    post_text: str
    author_name: str
    analysis: dict
    selected_strategy: str
    strategy_confidence: float
    strategy_reasoning: str
    comments: list
    errors: list


# ── Helpers ─────────────────────────────────────────────────

async def save_pipeline_results(
    db: AsyncSession,
    state: dict,
    user: User,
    source: InputSource,
    source_url: str = "",
) -> tuple[Post, list[GeneratedComment]]:
    """Persist pipeline results to DB. Returns (post, saved_comments_in_rank_order)."""
    analysis = state.get("analysis") or {}

    post = Post(
        user_id=user.id,
        source=source,
        source_url=source_url,
        raw_content=state.get("post_text", ""),
        author_name=state.get("author_name", ""),
        author_profile=state.get("author_profile", ""),
        likes=state.get("likes", 0),
        comments_count=state.get("comments_count", 0),
        post_timestamp=state.get("post_timestamp", ""),
        topic=analysis.get("topic", ""),
        industry=analysis.get("industry", ""),
        main_claim=analysis.get("main_claim", ""),
        hidden_claim=analysis.get("hidden_claim", ""),
        intent=analysis.get("intent", ""),
        audience=analysis.get("audience", ""),
        sentiment=analysis.get("sentiment", ""),
        emotional_driver=analysis.get("emotional_driver", ""),
        contrarian_angle=analysis.get("contrarian_angle", ""),
        controversial_score=analysis.get("controversial_score", 0.0),
        full_analysis=analysis,
    )
    db.add(post)
    await db.flush()  # Get post.id

    # Save comments
    strategy_map = {
        "reality_compression": EngagementStrategy.REALITY_COMPRESSION,
        "hidden_layer": EngagementStrategy.HIDDEN_LAYER,
        "pattern_recognition": EngagementStrategy.PATTERN_RECOGNITION,
        "second_order": EngagementStrategy.SECOND_ORDER,
        "bottleneck_reversal": EngagementStrategy.BOTTLENECK_REVERSAL,
        "constructive_contrarian": EngagementStrategy.CONSTRUCTIVE_CONTRARIAN,
        "agreement_extension": EngagementStrategy.AGREEMENT_EXTENSION,
    }

    saved_comments: list[GeneratedComment] = []
    for ranked_comment in state.get("ranked_comments", []):
        strategy_str = ranked_comment.get("strategy", "hidden_layer")
        strategy_enum = strategy_map.get(strategy_str, EngagementStrategy.HIDDEN_LAYER)

        comment = GeneratedComment(
            post_id=post.id,
            user_id=user.id,
            strategy=strategy_enum,
            raw_comment=ranked_comment.get("raw_comment", ranked_comment.get("comment", "")),
            final_comment=ranked_comment.get("comment", ""),
            is_voice_rewritten=True,
            score_adds_information=ranked_comment.get("score_adds_information", 0),
            score_originality=ranked_comment.get("score_originality", 0),
            score_depth=ranked_comment.get("score_depth", 0),
            score_founder_voice=ranked_comment.get("score_founder_voice", 0),
            score_screenshot_worthy=ranked_comment.get("score_screenshot_worthy", 0),
            total_quality_score=ranked_comment.get("total_score", 0),
            passed_quality_filter=ranked_comment.get("passed_quality", False),
            ranking_position=ranked_comment.get("rank", 99),
        )
        db.add(comment)
        saved_comments.append(comment)

    await db.commit()
    await db.refresh(post)
    for c in saved_comments:
        await db.refresh(c)
    return post, saved_comments


def format_response(
    post: Post, state: dict, saved_comments: list[GeneratedComment]
) -> GenerateResponse:
    """Format pipeline state into API response."""
    comments = []
    for c, saved in zip(state.get("ranked_comments", []), saved_comments):
        comments.append({
            "id": saved.id,
            "rank": c.get("rank"),
            "rank_label": c.get("rank_label", ""),
            "strategy": c.get("strategy"),
            "strategy_display": c.get("strategy_display", ""),
            "comment": c.get("comment", ""),
            "raw_comment": c.get("raw_comment", ""),
            "scores": {
                "adds_information": c.get("score_adds_information", 0),
                "originality": c.get("score_originality", 0),
                "depth": c.get("score_depth", 0),
                "founder_voice": c.get("score_founder_voice", 0),
                "screenshot_worthy": c.get("score_screenshot_worthy", 0),
                "total": c.get("total_score", 0),
            },
            "passed_quality": c.get("passed_quality", False),
        })

    return GenerateResponse(
        post_id=post.id,
        post_text=state.get("post_text", ""),
        author_name=state.get("author_name", ""),
        analysis=state.get("analysis") or {},
        selected_strategy=state.get("selected_strategy", ""),
        strategy_confidence=state.get("strategy_confidence", 0),
        strategy_reasoning=state.get("strategy_reasoning", ""),
        comments=comments,
        errors=state.get("errors", []),
    )


# ── Routes ───────────────────────────────────────────────────

@router.post("/generate/url", response_model=GenerateResponse)
async def generate_from_url(
    request: GenerateFromURLRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate comments from a LinkedIn post URL."""
    logger.info("generate_from_url", user_id=user.id, url=request.url[:50])

    voice_profile = None
    if user.voice_profile:
        voice_profile = user.voice_profile.raw_profile_json

    state = await run_pipeline(
        input_source="url",
        input_data=request.url,
        user_id=user.id,
        voice_profile=voice_profile,
    )

    if not state.get("post_text"):
        raise HTTPException(
            status_code=422,
            detail=f"Could not extract post content from URL. Error: {state.get('intake_error', 'Unknown error')}"
        )

    post, saved_comments = await save_pipeline_results(db, state, user, InputSource.URL, request.url)
    return format_response(post, state, saved_comments)


@router.post("/generate/text", response_model=GenerateResponse)
async def generate_from_text(
    request: GenerateFromTextRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate comments from pasted post text."""
    logger.info("generate_from_text", user_id=user.id, text_length=len(request.text))

    if len(request.text.strip()) < 20:
        raise HTTPException(status_code=400, detail="Post text too short (minimum 20 characters)")

    voice_profile = None
    if user.voice_profile:
        voice_profile = user.voice_profile.raw_profile_json

    state = await run_pipeline(
        input_source="text",
        input_data=request.text,
        user_id=user.id,
        voice_profile=voice_profile,
    )

    if state.get("author_name") == "" and request.author_name:
        state["author_name"] = request.author_name

    post, saved_comments = await save_pipeline_results(db, state, user, InputSource.TEXT)
    return format_response(post, state, saved_comments)


@router.post("/generate/screenshot", response_model=GenerateResponse)
async def generate_from_screenshot(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate comments from a screenshot (PNG/JPEG)."""
    if file.content_type not in ["image/png", "image/jpeg", "image/jpg", "image/webp"]:
        raise HTTPException(status_code=400, detail="File must be PNG, JPEG, or WebP")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    image_b64 = base64.b64encode(contents).decode("utf-8")
    media_type = file.content_type
    image_data = f"data:{media_type};base64,{image_b64}"

    voice_profile = None
    if user.voice_profile:
        voice_profile = user.voice_profile.raw_profile_json

    state = await run_pipeline(
        input_source="screenshot",
        input_data=image_data,
        user_id=user.id,
        voice_profile=voice_profile,
    )

    if not state.get("post_text"):
        raise HTTPException(
            status_code=422,
            detail="Could not extract text from screenshot. Try a higher quality image."
        )

    post, saved_comments = await save_pipeline_results(db, state, user, InputSource.SCREENSHOT)
    return format_response(post, state, saved_comments)


@router.post("/generate/pdf", response_model=GenerateResponse)
async def generate_from_pdf(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate comments from a PDF (article, newsletter, research paper)."""
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")

    contents = await file.read()
    if len(contents) > 20 * 1024 * 1024:  # 20MB limit
        raise HTTPException(status_code=400, detail="File too large (max 20MB)")

    pdf_b64 = base64.b64encode(contents).decode("utf-8")

    voice_profile = None
    if user.voice_profile:
        voice_profile = user.voice_profile.raw_profile_json

    state = await run_pipeline(
        input_source="pdf",
        input_data=pdf_b64,
        user_id=user.id,
        voice_profile=voice_profile,
    )

    if not state.get("post_text"):
        raise HTTPException(status_code=422, detail="Could not extract text from PDF")

    post, saved_comments = await save_pipeline_results(db, state, user, InputSource.PDF)
    return format_response(post, state, saved_comments)


@router.get("/history")
async def get_post_history(
    skip: int = 0,
    limit: int = 20,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get user's post generation history."""
    count_result = await db.execute(
        select(func.count()).select_from(Post).where(Post.user_id == user.id)
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(Post)
        .options(selectinload(Post.generated_comments))
        .where(Post.user_id == user.id)
        .order_by(Post.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    posts = result.scalars().all()

    def top_comment(p: Post) -> GeneratedComment | None:
        ranked = [c for c in p.generated_comments if c.ranking_position]
        if not ranked:
            return None
        return min(ranked, key=lambda c: c.ranking_position)

    return {
        "posts": [
            {
                "id": p.id,
                "source": p.source,
                "author_name": p.author_name,
                "topic": p.topic,
                "industry": p.industry,
                "post_preview": p.raw_content[:150] + "..." if len(p.raw_content or "") > 150 else p.raw_content,
                "created_at": p.created_at,
                "top_strategy": (top_comment(p).strategy if top_comment(p) else None),
                "top_score": (top_comment(p).total_quality_score if top_comment(p) else None),
                "comments_generated": len(p.generated_comments),
                "comments_posted": sum(1 for c in p.generated_comments if c.was_posted),
            }
            for p in posts
        ],
        "total": total,
    }


@router.get("/{post_id}")
async def get_post(
    post_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific post with all its generated comments."""
    result = await db.execute(
        select(Post).where(Post.id == post_id, Post.user_id == user.id)
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comments_result = await db.execute(
        select(GeneratedComment)
        .where(GeneratedComment.post_id == post_id)
        .order_by(GeneratedComment.ranking_position)
    )
    comments = comments_result.scalars().all()

    return {
        "id": post.id,
        "source": post.source,
        "raw_content": post.raw_content,
        "author_name": post.author_name,
        "likes": post.likes,
        "topic": post.topic,
        "industry": post.industry,
        "main_claim": post.main_claim,
        "hidden_claim": post.hidden_claim,
        "intent": post.intent,
        "audience": post.audience,
        "sentiment": post.sentiment,
        "emotional_driver": post.emotional_driver,
        "contrarian_angle": post.contrarian_angle,
        "controversial_score": post.controversial_score,
        "created_at": post.created_at,
        "comments": [
            {
                "id": c.id,
                "strategy": c.strategy,
                "strategy_display": STRATEGY_DISPLAY_NAMES.get(c.strategy, c.strategy),
                "final_comment": c.final_comment,
                "raw_comment": c.raw_comment,
                "scores": {
                    "adds_information": c.score_adds_information,
                    "originality": c.score_originality,
                    "depth": c.score_depth,
                    "founder_voice": c.score_founder_voice,
                    "screenshot_worthy": c.score_screenshot_worthy,
                    "total": c.total_quality_score,
                },
                "ranking_position": c.ranking_position,
                "rank_label": RANK_LABELS.get(c.ranking_position, "Extra") if c.ranking_position else "",
                "passed_quality_filter": c.passed_quality_filter,
                "was_posted": c.was_posted,
                "likes_received": c.likes_received,
                "replies_received": c.replies_received,
                "author_responded": c.author_responded,
                "profile_visits_generated": c.profile_visits_generated,
            }
            for c in comments
        ],
    }