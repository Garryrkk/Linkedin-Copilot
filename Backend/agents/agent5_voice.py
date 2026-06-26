"""
Agent 5 — Voice Consistency Engine

Rewrites all generated comments to match the user's personal writing voice.
Builds voice profile from past writing samples stored in DB.

Rewrites all comments in a single batched LLM call rather than one call per
comment — on a local model, each round-trip pays a fixed prompt-processing
cost regardless of length, so 1 call for 5 comments is significantly faster
than 5 separate calls for the same total output.
"""

import json
import re
import structlog
from core.llm import llm_call
from agents.state import AgentState

logger = structlog.get_logger()

VOICE_ANALYSIS_PROMPT = """You are analyzing a founder's writing style to build their voice profile.

WRITING SAMPLES:
---
{samples}
---

Analyze the writing style and return ONLY valid JSON:
{{
  "tone": "one word: Founder | Analytical | Casual | Professional | Direct | Conversational",
  "style": "one word: Observational | Storytelling | Data-Driven | Philosophical | Tactical",
  "avg_sentence_length": 10,
  "common_words": ["word1", "word2", "word3", "word4", "word5"],
  "common_phrases": ["phrase1", "phrase2"],
  "sentence_starters": ["Most", "The interesting", "Every time"],
  "structure_pattern": "describe how they structure ideas in 1 sentence",
  "things_they_avoid": ["emojis", "exclamation marks", "hedging language"],
  "voice_summary": "2-sentence description of their writing voice"
}}

Return ONLY the JSON."""

VOICE_REWRITE_BATCH_PROMPT = """You are rewriting LinkedIn comments to match a specific founder's voice.

FOUNDER VOICE PROFILE:
- Tone: {tone}
- Style: {style}
- Avg sentence length: {avg_sentence_length} words
- Common words they use: {common_words}
- Common phrases: {common_phrases}
- Typical sentence starters: {sentence_starters}
- Structure pattern: {structure_pattern}
- Things they avoid: {things_they_avoid}
- Voice summary: {voice_summary}

ORIGINAL COMMENTS (rewrite each one independently, keep the same order):
{numbered_comments}

REWRITE RULES (apply to every comment):
1. Keep the SAME insight and substance for each — do not water it down
2. Change the language, sentence structure, and rhythm to match their voice
3. Use their common words naturally (don't force all of them)
4. Match their typical sentence length
5. Avoid the things they avoid
6. The meaning of each comment must stay 100% intact
7. Do NOT make any comment longer or shorter than its original by more than 20%

Return ONLY valid JSON with exactly {count} entries, in the same order as the originals:
{{"rewritten": ["first rewritten comment", "second rewritten comment", ...]}}"""

DEFAULT_VOICE_PROFILE = {
    "tone": "Founder",
    "style": "Observational",
    "avg_sentence_length": 12,
    "common_words": ["interesting", "pattern", "usually", "actually", "most"],
    "common_phrases": ["The interesting thing", "Most people", "It usually means"],
    "sentence_starters": ["The", "Most", "It", "What", "Every"],
    "structure_pattern": "Makes an observation, then unpacks the mechanism behind it",
    "things_they_avoid": ["exclamation marks", "emojis", "vague inspirational phrases"],
    "voice_summary": "Clear, direct founder voice. Short punchy sentences. Always ties observation to mechanism.",
}


async def build_voice_profile(writing_samples: str) -> dict:
    """Build a voice profile from writing samples."""
    try:
        prompt = VOICE_ANALYSIS_PROMPT.format(samples=writing_samples[:5000])
        response = await llm_call(
            messages=[
                {
                    "role": "system",
                    "content": "You are a writing style analyst. Return only valid JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=800,
        )
        clean = response.strip()
        if clean.startswith("```"):
            clean = re.sub(r"```json|```", "", clean).strip()
        return json.loads(clean)
    except Exception as e:
        logger.warning("voice_profile_build_failed", error=str(e))
        return DEFAULT_VOICE_PROFILE


async def rewrite_all_with_voice(comments: list[str], voice_profile: dict) -> list[str]:
    """Rewrite every comment in one batched call. Falls back to the
    original text for any entry that's missing or fails to parse."""
    numbered_comments = "\n".join(f"{i + 1}. {c}" for i, c in enumerate(comments))

    try:
        prompt = VOICE_REWRITE_BATCH_PROMPT.format(
            tone=voice_profile.get("tone", "Founder"),
            style=voice_profile.get("style", "Observational"),
            avg_sentence_length=voice_profile.get("avg_sentence_length", 12),
            common_words=", ".join(voice_profile.get("common_words", [])),
            common_phrases=", ".join(voice_profile.get("common_phrases", [])),
            sentence_starters=", ".join(voice_profile.get("sentence_starters", [])),
            structure_pattern=voice_profile.get("structure_pattern", ""),
            things_they_avoid=", ".join(voice_profile.get("things_they_avoid", [])),
            voice_summary=voice_profile.get("voice_summary", ""),
            numbered_comments=numbered_comments,
            count=len(comments),
        )
        response = await llm_call(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a ghostwriter expert at voice matching. "
                        "Preserve substance, change the voice. Return only valid JSON."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.6,
            max_tokens=1800,
        )
        clean = response.strip()
        if clean.startswith("```"):
            clean = re.sub(r"```json|```", "", clean).strip()
        rewritten = json.loads(clean).get("rewritten", [])

        return [
            rewritten[i] if i < len(rewritten) and isinstance(rewritten[i], str) and rewritten[i].strip()
            else comments[i]
            for i in range(len(comments))
        ]
    except Exception as e:
        logger.warning("voice_rewrite_batch_failed", error=str(e))
        return comments  # Return originals unchanged if the batch rewrite fails


async def voice_consistency_agent(state: AgentState) -> AgentState:
    """
    Agent 5: Voice Consistency

    Reads: state.raw_comments, state.voice_profile (from DB, injected by pipeline)
    Writes: state.voice_rewritten_comments
    """
    logger.info("agent5_voice_consistency_start")

    raw_comments = state.get("raw_comments", [])
    if not raw_comments:
        state["voice_rewritten_comments"] = []
        return state

    voice_profile = state.get("voice_profile")

    # If no voice profile, use default (user hasn't set one up yet)
    if not voice_profile:
        logger.info("agent5_using_default_voice_profile")
        voice_profile = DEFAULT_VOICE_PROFILE

    try:
        originals = [item["comment"] for item in raw_comments]
        rewritten_texts = await rewrite_all_with_voice(originals, voice_profile)

        rewritten = [
            {
                "strategy": item["strategy"],
                "comment": rewritten_texts[i],
                "raw_comment": item["comment"],
            }
            for i, item in enumerate(raw_comments)
        ]

        state["voice_rewritten_comments"] = rewritten
        logger.info("agent5_voice_rewrite_complete", count=len(rewritten))

    except Exception as e:
        logger.error("agent5_error", error=str(e))
        # Fallback: use raw comments unchanged
        state["voice_rewritten_comments"] = [
            {**c, "raw_comment": c["comment"]} for c in raw_comments
        ]
        errors = state.get("errors", [])
        errors.append(f"Voice Consistency: {str(e)}")
        state["errors"] = errors

    return state
