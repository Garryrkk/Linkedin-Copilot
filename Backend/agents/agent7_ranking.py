"""
Agent 7 — Comment Ranking Engine

Ranks all passing comments by total quality score.
Labels them: #1 Recommended, #2 Alternative, #3 Contrarian
"""

import structlog
from agents.state import AgentState

logger = structlog.get_logger()

RANK_LABELS = {
    1: "Recommended",
    2: "Alternative",
    3: "Contrarian Option",
    4: "Extra",
    5: "Extra",
}

STRATEGY_DISPLAY_NAMES = {
    "reality_compression": "Reality Compression",
    "hidden_layer": "Hidden Layer",
    "pattern_recognition": "Pattern Recognition",
    "second_order": "Second Order",
    "bottleneck_reversal": "Bottleneck Reversal",
    "constructive_contrarian": "Constructive Contrarian",
    "agreement_extension": "Agreement + Extension",
    "unknown": "General",
}


async def comment_ranking_agent(state: AgentState) -> AgentState:
    """
    Agent 7: Comment Ranking

    Reads: state.scored_comments
    Writes: state.ranked_comments
    """
    logger.info("agent7_ranking_start")

    scored = state.get("scored_comments", [])
    if not scored:
        state["ranked_comments"] = []
        return state

    try:
        # Separate passing and failing
        passing = [c for c in scored if c.get("passed_quality", False)]
        failing = [c for c in scored if not c.get("passed_quality", False)]

        # Sort passing by total score descending
        passing_sorted = sorted(passing, key=lambda x: x.get("total_score", 0), reverse=True)

        # Add rank and label
        ranked = []
        for i, comment in enumerate(passing_sorted, start=1):
            ranked_comment = {
                **comment,
                "rank": i,
                "rank_label": RANK_LABELS.get(i, "Extra"),
                "strategy_display": STRATEGY_DISPLAY_NAMES.get(
                    comment.get("strategy", ""), comment.get("strategy", "")
                ),
            }
            ranked.append(ranked_comment)

        # Also include failing comments ranked below passing (for display purposes)
        failing_sorted = sorted(failing, key=lambda x: x.get("total_score", 0), reverse=True)
        for i, comment in enumerate(failing_sorted, start=len(ranked) + 1):
            ranked_comment = {
                **comment,
                "rank": i,
                "rank_label": "Below Quality Threshold",
                "strategy_display": STRATEGY_DISPLAY_NAMES.get(
                    comment.get("strategy", ""), comment.get("strategy", "")
                ),
            }
            ranked.append(ranked_comment)

        state["ranked_comments"] = ranked

        logger.info(
            "agent7_ranking_complete",
            total=len(ranked),
            passing=len(passing_sorted),
        )

    except Exception as e:
        logger.error("agent7_error", error=str(e))
        # Return scored_comments as-is with ranks
        state["ranked_comments"] = [
            {**c, "rank": i + 1, "rank_label": RANK_LABELS.get(i + 1, "Extra"),
             "strategy_display": STRATEGY_DISPLAY_NAMES.get(c.get("strategy", ""), "")}
            for i, c in enumerate(scored)
        ]
        errors = state.get("errors", [])
        errors.append(f"Ranking: {str(e)}")
        state["errors"] = errors

    return state