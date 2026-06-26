"""
LangGraph Pipeline — wires all 7 agents into a stateful graph.

Flow:
  intake → context → strategy → generation → voice → quality → ranking → END
"""

from langgraph.graph import StateGraph, END
from agents.state import AgentState
from agents.agent1_intake import content_intake_agent
from agents.agent2_context import context_understanding_agent
from agents.agent3_strategy import engagement_strategy_agent
from agents.agent4_generation import comment_generation_agent
from agents.agent5_voice import voice_consistency_agent
from agents.agent6_quality import quality_filter_agent
from agents.agent7_ranking import comment_ranking_agent
import structlog

logger = structlog.get_logger()


def should_continue_after_intake(state: AgentState) -> str:
    """Route: if intake failed critically, go to END."""
    if state.get("intake_error") and not state.get("post_text"):
        logger.warning("pipeline_early_exit_after_intake")
        return "end"
    return "continue"


def build_pipeline() -> StateGraph:
    """Build and compile the LangGraph pipeline."""
    graph = StateGraph(AgentState)

    # Add all agent nodes
    graph.add_node("intake", content_intake_agent)
    graph.add_node("context", context_understanding_agent)
    graph.add_node("strategy", engagement_strategy_agent)
    graph.add_node("generation", comment_generation_agent)
    graph.add_node("voice", voice_consistency_agent)
    graph.add_node("quality", quality_filter_agent)
    graph.add_node("ranking", comment_ranking_agent)

    # Entry point
    graph.set_entry_point("intake")

    # Conditional edge after intake
    graph.add_conditional_edges(
        "intake",
        should_continue_after_intake,
        {
            "continue": "context",
            "end": END,
        },
    )

    # Linear edges for the rest
    graph.add_edge("context", "strategy")
    graph.add_edge("strategy", "generation")
    graph.add_edge("generation", "voice")
    graph.add_edge("voice", "quality")
    graph.add_edge("quality", "ranking")
    graph.add_edge("ranking", END)

    return graph.compile()


# Compiled pipeline (singleton)
pipeline = build_pipeline()


async def run_pipeline(
    input_source: str,
    input_data: str,
    user_id: str,
    voice_profile: dict = None,
) -> AgentState:
    """
    Run the full 7-agent pipeline.

    Args:
        input_source: "url" | "screenshot" | "text" | "pdf"
        input_data: the actual content (URL string, base64 image, text, base64 pdf)
        user_id: the user's ID
        voice_profile: optional voice profile dict (from DB)

    Returns:
        Final AgentState with ranked_comments populated
    """
    initial_state: AgentState = {
        # Input
        "input_source": input_source,
        "input_data": input_data,
        "user_id": user_id,
        "post_id": None,

        # Phase 1
        "post_text": "",
        "author_name": "",
        "author_profile": "",
        "likes": 0,
        "comments_count": 0,
        "post_timestamp": "",
        "intake_error": None,

        # Phase 2
        "analysis": None,
        "analysis_error": None,

        # Phase 3
        "selected_strategy": None,
        "strategy_confidence": 0.0,
        "strategy_reasoning": "",
        "strategy_error": None,

        # Phase 4
        "raw_comments": [],
        "generation_error": None,

        # Phase 5
        "voice_profile": voice_profile,
        "voice_rewritten_comments": [],

        # Phase 6
        "scored_comments": [],

        # Phase 7
        "ranked_comments": [],

        # Meta
        "pipeline_version": "1.0.0",
        "errors": [],
    }

    logger.info(
        "pipeline_start",
        source=input_source,
        user_id=user_id,
        has_voice_profile=voice_profile is not None,
    )

    final_state = await pipeline.ainvoke(initial_state)

    logger.info(
        "pipeline_complete",
        comments_generated=len(final_state.get("ranked_comments", [])),
        errors=final_state.get("errors", []),
    )

    return final_state