"""
Agent 2 — Context Understanding Agent

Analyzes post text to extract:
  - Topic, industry, audience, intent
  - Main claim and hidden claim
  - Emotional driver and contrarian angle
  - Sentiment and controversial score
"""

import json
import re
import structlog
from core.llm import llm_call
from agents.state import AgentState, PostAnalysis

logger = structlog.get_logger()

ANALYSIS_PROMPT = """You are an expert LinkedIn content strategist analyzing a post for strategic engagement.

POST:
---
{post_text}
---
Author: {author_name}

Analyze this post deeply and return ONLY valid JSON with these exact fields:

{{
  "topic": "specific topic (e.g., 'AI agent frameworks', 'startup hiring', 'product-market fit')",
  "industry": "industry context (e.g., 'SaaS', 'AI/ML', 'Venture Capital', 'Marketing')",
  "main_claim": "the explicit central argument the author is making",
  "hidden_claim": "the unstated belief or assumption underneath the main claim",
  "intent": "one of: Teach | Inspire | Provoke | Announce | Share | Argue | Entertain",
  "audience": "specific target audience (e.g., 'Early-stage founders', 'B2B SaaS CEOs', 'ML engineers')",
  "sentiment": "one of: Positive | Negative | Neutral | Provocative | Cautious",
  "emotional_driver": "what emotion drives this post (e.g., 'fear of missing out', 'pride', 'frustration', 'hope')",
  "contrarian_angle": "the best possible respectful pushback or alternative perspective on this post",
  "controversial_score": 0.0
}}

For controversial_score: 0.0 = completely safe/universal, 1.0 = highly divisive/controversial.

Rules:
- Be specific, not generic
- hidden_claim should reveal what the author believes but doesn't say explicitly
- contrarian_angle should be genuinely interesting, not just "but what about X?"
- Return ONLY the JSON, no markdown, no explanation"""


async def context_understanding_agent(state: AgentState) -> AgentState:
    """
    Agent 2: Context Understanding

    Reads: state.post_text, state.author_name
    Writes: state.analysis
    """
    logger.info("agent2_context_understanding_start")

    if state.get("intake_error"):
        logger.warning("agent2_skipping_due_to_intake_error")
        state["analysis_error"] = "Skipped due to intake error"
        return state

    post_text = state.get("post_text", "")
    if not post_text:
        state["analysis_error"] = "No post text available"
        return state

    try:
        prompt = ANALYSIS_PROMPT.format(
            post_text=post_text[:4000],
            author_name=state.get("author_name", "Unknown"),
        )

        response = await llm_call(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a precise content analyst. "
                        "Return only valid JSON. Never add markdown or explanation."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=1200,
        )

        # Parse response
        clean = response.strip()
        if clean.startswith("```"):
            clean = re.sub(r"```json|```", "", clean).strip()

        analysis_data = json.loads(clean)

        # Validate required fields
        required_fields = [
            "topic", "industry", "main_claim", "hidden_claim",
            "intent", "audience", "sentiment", "emotional_driver",
            "contrarian_angle", "controversial_score"
        ]
        for field in required_fields:
            if field not in analysis_data:
                analysis_data[field] = ""

        # Ensure controversial_score is a float
        try:
            analysis_data["controversial_score"] = float(
                analysis_data.get("controversial_score", 0.0)
            )
        except (ValueError, TypeError):
            analysis_data["controversial_score"] = 0.3

        state["analysis"] = analysis_data
        state["analysis_error"] = None

        logger.info(
            "agent2_context_understanding_complete",
            topic=analysis_data.get("topic"),
            intent=analysis_data.get("intent"),
            controversial_score=analysis_data.get("controversial_score"),
        )

    except json.JSONDecodeError as e:
        logger.error("agent2_json_parse_error", error=str(e), response=response[:200])
        state["analysis_error"] = f"Failed to parse analysis: {str(e)}"
        errors = state.get("errors", [])
        errors.append(f"Context Analysis: {str(e)}")
        state["errors"] = errors

    except Exception as e:
        logger.error("agent2_error", error=str(e))
        state["analysis_error"] = str(e)
        errors = state.get("errors", [])
        errors.append(f"Context Analysis: {str(e)}")
        state["errors"] = errors

    return state