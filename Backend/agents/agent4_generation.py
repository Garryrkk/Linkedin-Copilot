"""
Agent 4 — Comment Generation Agent

Generates 5 distinct comments, one per strategy variation.
Primary strategy gets the most refined version.
"""

import json
import re
import structlog
from core.llm import llm_call
from agents.state import AgentState

logger = structlog.get_logger()

COMMENT_GENERATION_PROMPT = """You are a ghostwriter for a thoughtful, senior founder/operator on LinkedIn.

POST:
---
{post_text}
---

POST ANALYSIS:
- Topic: {topic}
- Main Claim: {main_claim}
- Hidden Claim: {hidden_claim}
- Audience: {audience}
- Emotional Driver: {emotional_driver}

PRIMARY STRATEGY: {strategy_name}
Strategy Description: {strategy_description}

Generate exactly 5 comments, each using a different angle. Format as JSON:

{{
  "comments": [
    {{
      "strategy": "hidden_layer",
      "comment": "..."
    }},
    {{
      "strategy": "pattern_recognition",
      "comment": "..."
    }},
    {{
      "strategy": "reality_compression",
      "comment": "..."
    }},
    {{
      "strategy": "second_order",
      "comment": "..."
    }},
    {{
      "strategy": "constructive_contrarian",
      "comment": "..."
    }}
  ]
}}

COMMENT RULES (follow these strictly):
1. Each comment 40–120 words. No shorter, no longer.
2. Never start with: "Great post", "Insightful", "I agree", "This is amazing", "Well said"
3. Start with the SUBSTANCE. Drop straight into the insight.
4. No filler phrases. Every sentence must add information.
5. Write in short, punchy sentences. 8–15 words each.
6. Use line breaks between distinct thoughts.
7. No emojis unless extremely strategic.
8. Sound like a founder who thinks clearly, not a content creator.
9. Never be generic. Tie the comment directly to the specific post.
10. The primary strategy ({strategy_name}) comment should be the strongest.

Example of GOOD comment structure:
"The interesting thing about shipping faster isn't really the speed.

It usually means the company's internal decision loops are shorter.

Teams can move fast when they know who owns the decision.

Most slow companies don't have a speed problem. They have an ownership problem."

Return ONLY the JSON."""

STRATEGIES_META = {
    "reality_compression": "Compress a complex reality into a single, sharper, more accurate truth",
    "hidden_layer": "Reveal what's actually happening beneath the surface claim",
    "pattern_recognition": "Connect this to a broader observable pattern across contexts",
    "second_order": "Reveal downstream consequences the post didn't consider",
    "bottleneck_reversal": "Flip the problem to find the real underlying constraint",
    "constructive_contrarian": "Respectful, evidence-based pushback with a better model",
    "agreement_extension": "Agree with the core, then add an insight layer they missed",
}


async def comment_generation_agent(state: AgentState) -> AgentState:
    """
    Agent 4: Comment Generation

    Reads: state.post_text, state.analysis, state.selected_strategy
    Writes: state.raw_comments
    """
    logger.info("agent4_comment_generation_start")

    post_text = state.get("post_text", "")
    analysis = state.get("analysis") or {}
    strategy = state.get("selected_strategy", "hidden_layer")

    if not post_text:
        state["generation_error"] = "No post text"
        state["raw_comments"] = []
        return state

    try:
        prompt = COMMENT_GENERATION_PROMPT.format(
            post_text=post_text[:3000],
            topic=analysis.get("topic", ""),
            main_claim=analysis.get("main_claim", ""),
            hidden_claim=analysis.get("hidden_claim", ""),
            audience=analysis.get("audience", ""),
            emotional_driver=analysis.get("emotional_driver", ""),
            strategy_name=strategy,
            strategy_description=STRATEGIES_META.get(strategy, ""),
        )

        response = await llm_call(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert LinkedIn ghostwriter for founders. "
                        "Write comments that add genuine insight. "
                        "Return only valid JSON."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.75,
            max_tokens=2500,
        )

        clean = response.strip()
        if clean.startswith("```"):
            clean = re.sub(r"```json|```", "", clean).strip()

        data = json.loads(clean)
        comments = data.get("comments", [])

        # Validate structure
        validated = []
        for c in comments:
            if isinstance(c, dict) and c.get("comment"):
                validated.append({
                    "strategy": c.get("strategy", "unknown"),
                    "comment": c["comment"].strip(),
                })

        if not validated:
            raise ValueError("No valid comments generated")

        state["raw_comments"] = validated
        state["generation_error"] = None

        logger.info(
            "agent4_comment_generation_complete",
            count=len(validated),
        )

    except Exception as e:
        logger.error("agent4_error", error=str(e))
        state["generation_error"] = str(e)
        state["raw_comments"] = []
        errors = state.get("errors", [])
        errors.append(f"Comment Generation: {str(e)}")
        state["errors"] = errors

    return state