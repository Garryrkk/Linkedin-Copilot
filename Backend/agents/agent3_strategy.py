"""
Agent 3 — Engagement Strategy Agent

The most important agent. Decides HOW to engage, not just what to write.

GenJecX Strategies:
1. Reality Compression   — compress complex reality into a sharper truth
2. Hidden Layer          — reveal what's actually happening beneath the surface
3. Pattern Recognition   — connect this to a broader observable pattern
4. Second Order Thinking — reveal downstream consequences
5. Bottleneck Reversal   — flip the problem to find the real constraint
6. Constructive Contrarian — respectful, evidence-based pushback
7. Agreement + Extension — agree, then add a layer they missed
"""

import json
import re
import structlog
from core.llm import llm_call
from agents.state import AgentState

logger = structlog.get_logger()

STRATEGIES = {
    "reality_compression": {
        "name": "Reality Compression",
        "description": "Compress a complex reality into a single, sharper, more accurate truth. Strip the fluff and surface the essential.",
        "best_for": ["inspirational posts", "big claims", "oversimplifications"],
        "signal": "Post makes a sweeping statement that's technically true but misses the mechanism",
    },
    "hidden_layer": {
        "name": "Hidden Layer",
        "description": "Reveal what's actually happening beneath the surface claim. The interesting thing isn't what they said — it's what's underneath.",
        "best_for": ["business advice", "leadership posts", "strategy posts"],
        "signal": "Post has a surface claim that conceals a more interesting underlying dynamic",
    },
    "pattern_recognition": {
        "name": "Pattern Recognition",
        "description": "Connect this specific post to a broader pattern you've observed. 'Every time X, I notice Y.'",
        "best_for": ["trend posts", "observation posts", "comparison posts"],
        "signal": "Post describes something that maps to a recognizable pattern across contexts",
    },
    "second_order": {
        "name": "Second Order Thinking",
        "description": "Reveal downstream consequences the post didn't consider. What happens after the obvious first effect?",
        "best_for": ["advice posts", "how-to posts", "prediction posts"],
        "signal": "Post focuses on immediate benefits or effects, missing longer-term dynamics",
    },
    "bottleneck_reversal": {
        "name": "Bottleneck Reversal",
        "description": "Flip the problem to find the real constraint. The stated problem is rarely the actual bottleneck.",
        "best_for": ["problem-solution posts", "productivity posts", "startup advice"],
        "signal": "Post proposes a solution to a problem, but misidentifies where the real friction is",
    },
    "constructive_contrarian": {
        "name": "Constructive Contrarian",
        "description": "Respectful pushback with evidence or a different frame. Not just disagreement — a better model.",
        "best_for": ["strong consensus posts", "hot take posts", "viral opinion posts"],
        "signal": "Post has high confidence, low nuance, and would benefit from a thoughtful challenge",
    },
    "agreement_extension": {
        "name": "Agreement + Extension",
        "description": "Agree with the core claim, then add a layer, a nuance, or a related insight they missed.",
        "best_for": ["good insight posts", "posts with a solid but incomplete point"],
        "signal": "Post is largely correct but leaves an interesting adjacent insight unexplored",
    },
}

STRATEGY_PROMPT = """You are an expert engagement strategist selecting the best comment strategy for a LinkedIn post.

POST ANALYSIS:
{analysis}

Available strategies and when to use them:
{strategies_list}

Your job: Select the SINGLE BEST strategy for this post. Consider:
1. What is the post's main claim and what does it ACTUALLY need in a comment?
2. Which strategy will produce the most insight and engagement?
3. What would a thoughtful, senior founder say in response?

Return ONLY valid JSON:
{{
  "selected_strategy": "one of: reality_compression | hidden_layer | pattern_recognition | second_order | bottleneck_reversal | constructive_contrarian | agreement_extension",
  "confidence": 0-100,
  "reasoning": "why this strategy fits this specific post",
  "secondary_strategy": "second best option",
  "all_scores": {{
    "reality_compression": 0-10,
    "hidden_layer": 0-10,
    "pattern_recognition": 0-10,
    "second_order": 0-10,
    "bottleneck_reversal": 0-10,
    "constructive_contrarian": 0-10,
    "agreement_extension": 0-10
  }}
}}

Decision rules:
- If post makes a sweeping inspirational claim → reality_compression or hidden_layer
- If post gives advice/solution → bottleneck_reversal or second_order
- If post states a strong opinion → constructive_contrarian (if controversial_score > 0.4)
- If post observes a trend → pattern_recognition
- If post makes a good point with gaps → agreement_extension

Return ONLY the JSON."""


def build_strategies_list() -> str:
    lines = []
    for key, strat in STRATEGIES.items():
        lines.append(f"- {key}: {strat['description']}")
    return "\n".join(lines)


async def engagement_strategy_agent(state: AgentState) -> AgentState:
    """
    Agent 3: Engagement Strategy

    Reads: state.analysis
    Writes: state.selected_strategy, state.strategy_confidence, state.strategy_reasoning
    """
    logger.info("agent3_engagement_strategy_start")

    if state.get("analysis_error") or not state.get("analysis"):
        logger.warning("agent3_no_analysis_available")
        # Default to hidden_layer as safe fallback
        state["selected_strategy"] = "hidden_layer"
        state["strategy_confidence"] = 60.0
        state["strategy_reasoning"] = "Default strategy (analysis unavailable)"
        return state

    try:
        analysis = state["analysis"]
        analysis_text = json.dumps(analysis, indent=2)

        prompt = STRATEGY_PROMPT.format(
            analysis=analysis_text,
            strategies_list=build_strategies_list(),
        )

        response = await llm_call(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a strategic engagement expert. "
                        "Return only valid JSON. Be decisive — pick the best strategy."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=800,
        )

        clean = response.strip()
        if clean.startswith("```"):
            clean = re.sub(r"```json|```", "", clean).strip()

        strategy_data = json.loads(clean)

        selected = strategy_data.get("selected_strategy", "hidden_layer")
        # Validate strategy name
        if selected not in STRATEGIES:
            selected = "hidden_layer"

        state["selected_strategy"] = selected
        state["strategy_confidence"] = float(strategy_data.get("confidence", 75))
        state["strategy_reasoning"] = strategy_data.get("reasoning", "")
        state["strategy_error"] = None

        logger.info(
            "agent3_strategy_selected",
            strategy=selected,
            confidence=state["strategy_confidence"],
        )

    except Exception as e:
        logger.error("agent3_error", error=str(e))
        state["selected_strategy"] = "hidden_layer"
        state["strategy_confidence"] = 60.0
        state["strategy_reasoning"] = f"Fallback due to error: {str(e)}"
        state["strategy_error"] = str(e)

    return state