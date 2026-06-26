from typing import TypedDict, Optional, List, Any
from db.models import EngagementStrategy, InputSource


class PostAnalysis(TypedDict):
    topic: str
    industry: str
    main_claim: str
    hidden_claim: str
    intent: str
    audience: str
    sentiment: str
    emotional_driver: str
    contrarian_angle: str
    controversial_score: float


class RawComment(TypedDict):
    strategy: str
    comment: str


class ScoredComment(TypedDict):
    strategy: str
    comment: str           # final (voice-rewritten) comment
    raw_comment: str       # before voice rewrite
    score_adds_information: float
    score_originality: float
    score_depth: float
    score_founder_voice: float
    score_screenshot_worthy: float
    total_score: float
    passed_quality: bool


class RankedComment(ScoredComment):
    rank: int


# ── Main pipeline state ─────────────────────────────────────
class AgentState(TypedDict):
    # Input
    input_source: str           # url | screenshot | text | pdf
    input_data: str             # the raw input (URL, base64 image, text, etc.)
    user_id: str
    post_id: Optional[str]

    # Phase 1: Content Intake
    post_text: str
    author_name: str
    author_profile: str
    likes: int
    comments_count: int
    post_timestamp: str
    intake_error: Optional[str]

    # Phase 2: Context Analysis
    analysis: Optional[PostAnalysis]
    analysis_error: Optional[str]

    # Phase 3: Strategy
    selected_strategy: Optional[str]
    strategy_confidence: float
    strategy_reasoning: str
    strategy_error: Optional[str]

    # Phase 4: Comment Generation
    raw_comments: List[RawComment]
    generation_error: Optional[str]

    # Phase 5: Voice Consistency
    voice_profile: Optional[dict]
    voice_rewritten_comments: List[RawComment]

    # Phase 6: Quality Filter
    scored_comments: List[ScoredComment]

    # Phase 7: Ranking
    ranked_comments: List[RankedComment]

    # Meta
    pipeline_version: str
    errors: List[str]