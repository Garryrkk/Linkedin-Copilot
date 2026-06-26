"""
Agent 6 — Quality Filter Agent

Scores each comment across 5 dimensions.
Rejects anything below 40/50.

Comments that survive the quick pre-filter are scored in a single batched
LLM call rather than one call per comment, for the same reason as Agent 5 —
fixed per-call overhead dominates on a local model, so fewer/bigger calls
beat more/smaller ones.
"""

import json
import re
import structlog
from core.llm import llm_call
from core.config import settings
from agents.state import AgentState

logger = structlog.get_logger()

QUALITY_FILTER_BATCH_PROMPT = """You are a quality assessor for LinkedIn comments written by founders.

POST CONTEXT:
Topic: {topic}
Main Claim: {main_claim}
Audience: {audience}

COMMENTS TO EVALUATE:
{numbered_comments}

Score EACH comment on each dimension from 0-10. Be strict.

SCORING CRITERIA (apply to every comment):

adds_information (0-10):
- 0-2: Pure agreement ("Great post!", "So true!")
- 3-5: Restates the post with mild elaboration
- 6-8: Adds a related fact or perspective
- 9-10: Adds something genuinely new that the post didn't cover

originality (0-10):
- 0-2: Could have been written by anyone ("This really resonates")
- 3-5: Somewhat generic but contextualized
- 6-8: Has a unique angle or personal framing
- 9-10: Reader thinks "I've never seen it framed that way"

depth (0-10):
- 0-2: Surface level, no mechanism explained
- 3-5: One layer of insight
- 6-8: Reveals mechanism or second-order effect
- 9-10: Multi-layered, reveals root cause or systemic pattern

founder_voice (0-10):
- 0-2: Sounds like AI or a content creator
- 3-5: Acceptable but bland
- 6-8: Sounds like a smart professional
- 9-10: Sounds like a senior operator who's seen this up close

screenshot_worthy (0-10):
- 0-2: No one would save or share this
- 3-5: Mildly useful, wouldn't go viral
- 6-8: Worth bookmarking
- 9-10: Someone would screenshot and share this

AUTOMATIC ZERO triggers for any dimension:
- Starts with "Great post" / "Amazing insight" / "Well said" / "Totally agree"
- Generic encouragement with no substance
- Sounds like AI filler
- Longer than 150 words

fatal_flaws: list any of these if present:
- "starts_with_praise"
- "generic_agreement"
- "ai_sounding"
- "too_long"
- "restates_post"
- "no_new_information"

Return ONLY valid JSON with exactly {count} entries, one per comment in the same order:
{{"scores": [
  {{"score_adds_information": 0, "score_originality": 0, "score_depth": 0, "score_founder_voice": 0, "score_screenshot_worthy": 0, "fatal_flaws": []}}
]}}"""


def calculate_total_score(scores: dict) -> float:
    return (
        scores.get("score_adds_information", 0)
        + scores.get("score_originality", 0)
        + scores.get("score_depth", 0)
        + scores.get("score_founder_voice", 0)
        + scores.get("score_screenshot_worthy", 0)
    )


def quick_reject(comment: str) -> tuple[bool, str]:
    """Fast pre-filter for obviously bad comments before LLM scoring."""
    comment_lower = comment.lower().strip()

    bad_starts = [
        "great post", "amazing post", "awesome post", "incredible post",
        "well said", "so true", "totally agree", "completely agree",
        "this is so", "love this", "thank you for sharing",
        "what a great", "brilliant post",
    ]
    for bad in bad_starts:
        if comment_lower.startswith(bad):
            return True, "starts_with_praise"

    if len(comment.split()) > 150:
        return True, "too_long"

    if len(comment.split()) < 15:
        return True, "too_short"

    return False, ""


def _rejected_score(reason: str) -> dict:
    return {
        "score_adds_information": 0,
        "score_originality": 0,
        "score_depth": 0,
        "score_founder_voice": 0,
        "score_screenshot_worthy": 0,
        "total_score": 0,
        "passed": False,
        "fatal_flaws": [reason],
    }


def _error_fallback_score() -> dict:
    # Mid-range score on error rather than rejecting outright.
    return {
        "score_adds_information": 7,
        "score_originality": 7,
        "score_depth": 7,
        "score_founder_voice": 7,
        "score_screenshot_worthy": 7,
        "total_score": 35,
        "passed": False,
        "fatal_flaws": ["scoring_error"],
    }


async def score_all_comments(comments: list[str], analysis: dict) -> list[dict]:
    """Score every comment. Quick-rejects skip the LLM entirely; the rest
    are scored together in one batched call."""
    results: list[dict | None] = [None] * len(comments)
    to_score: list[tuple[int, str]] = []

    for i, comment in enumerate(comments):
        rejected, reason = quick_reject(comment)
        if rejected:
            results[i] = _rejected_score(reason)
        else:
            to_score.append((i, comment))

    if not to_score:
        return results  # type: ignore[return-value]

    numbered_comments = "\n".join(
        f"{n + 1}. {comment}\n---" for n, (_, comment) in enumerate(to_score)
    )

    try:
        prompt = QUALITY_FILTER_BATCH_PROMPT.format(
            topic=analysis.get("topic", ""),
            main_claim=analysis.get("main_claim", ""),
            audience=analysis.get("audience", ""),
            numbered_comments=numbered_comments,
            count=len(to_score),
        )
        response = await llm_call(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a strict quality assessor. "
                        "Be harsh — most AI-generated comments deserve 3-5 scores. "
                        "Only give 8-10 for genuinely exceptional work. "
                        "Return only valid JSON."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
            max_tokens=1500,
        )
        clean = response.strip()
        if clean.startswith("```"):
            clean = re.sub(r"```json|```", "", clean).strip()
        batch_scores = json.loads(clean).get("scores", [])

        min_score = settings.QUALITY_MIN_SCORE
        for n, (i, _) in enumerate(to_score):
            raw = batch_scores[n] if n < len(batch_scores) and isinstance(batch_scores[n], dict) else None
            if raw is None:
                results[i] = _error_fallback_score()
                continue
            total = calculate_total_score(raw)
            results[i] = {
                "score_adds_information": float(raw.get("score_adds_information", 0)),
                "score_originality": float(raw.get("score_originality", 0)),
                "score_depth": float(raw.get("score_depth", 0)),
                "score_founder_voice": float(raw.get("score_founder_voice", 0)),
                "score_screenshot_worthy": float(raw.get("score_screenshot_worthy", 0)),
                "total_score": total,
                "passed": total >= min_score,
                "fatal_flaws": raw.get("fatal_flaws", []),
            }

    except Exception as e:
        logger.error("batch_comment_scoring_failed", error=str(e))
        for i, _ in to_score:
            results[i] = _error_fallback_score()

    return results  # type: ignore[return-value]


async def quality_filter_agent(state: AgentState) -> AgentState:
    """
    Agent 6: Quality Filter

    Reads: state.voice_rewritten_comments, state.analysis
    Writes: state.scored_comments
    """
    logger.info("agent6_quality_filter_start")

    comments = state.get("voice_rewritten_comments", [])
    if not comments:
        # Try raw_comments as fallback
        comments = [
            {**c, "raw_comment": c["comment"]}
            for c in state.get("raw_comments", [])
        ]

    analysis = state.get("analysis") or {}

    if not comments:
        state["scored_comments"] = []
        return state

    try:
        comment_texts = [item["comment"] for item in comments]
        all_scores = await score_all_comments(comment_texts, analysis)

        scored = []
        for item, scores in zip(comments, all_scores):
            scored.append({
                "strategy": item["strategy"],
                "comment": item["comment"],
                "raw_comment": item.get("raw_comment", item["comment"]),
                "score_adds_information": scores["score_adds_information"],
                "score_originality": scores["score_originality"],
                "score_depth": scores["score_depth"],
                "score_founder_voice": scores["score_founder_voice"],
                "score_screenshot_worthy": scores["score_screenshot_worthy"],
                "total_score": scores["total_score"],
                "passed_quality": scores["passed"],
                "fatal_flaws": scores.get("fatal_flaws", []),
            })

        passed = [c for c in scored if c["passed_quality"]]
        failed = [c for c in scored if not c["passed_quality"]]

        logger.info(
            "agent6_quality_filter_complete",
            total=len(scored),
            passed=len(passed),
            failed=len(failed),
        )

        # If everything failed quality, include the best ones anyway
        # (better to show something than nothing)
        if not passed:
            logger.warning("agent6_all_comments_failed_quality_lowering_threshold")
            sorted_all = sorted(scored, key=lambda x: x["total_score"], reverse=True)
            for c in sorted_all[:3]:
                c["passed_quality"] = True
            state["scored_comments"] = sorted_all
        else:
            state["scored_comments"] = scored

    except Exception as e:
        logger.error("agent6_error", error=str(e))
        # Fallback: pass all comments through
        state["scored_comments"] = [
            {
                **c,
                "raw_comment": c.get("raw_comment", c["comment"]),
                "score_adds_information": 7,
                "score_originality": 7,
                "score_depth": 7,
                "score_founder_voice": 7,
                "score_screenshot_worthy": 7,
                "total_score": 35,
                "passed_quality": True,
                "fatal_flaws": [],
            }
            for c in comments
        ]
        errors = state.get("errors", [])
        errors.append(f"Quality Filter: {str(e)}")
        state["errors"] = errors

    return state
