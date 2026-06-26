/**
 * These types mirror the FastAPI backend (Backend/) exactly:
 * - db/models.py (Post, GeneratedComment, User, VoiceProfile)
 * - agents/state.py (PostAnalysis, ScoredComment, RankedComment)
 * - api/routes/posts.py, users.py, voice.py, comments.py (response shapes)
 * Do not add fields here that the backend doesn't actually return.
 */

export type InputSource = "url" | "screenshot" | "text" | "pdf";

// The 7 strategies agent3_strategy.py knows about. Only one is ever
// `selected_strategy` for a given post; agent4_generation.py currently
// only ever writes comments for 5 of these 7 (see STRATEGIES_META in
// agent4_generation.py) — bottleneck_reversal and agreement_extension can
// be *selected* but no comment is ever generated using them today.
export type EngagementStrategy =
  | "reality_compression"
  | "hidden_layer"
  | "pattern_recognition"
  | "second_order"
  | "bottleneck_reversal"
  | "constructive_contrarian"
  | "agreement_extension";

export interface PostAnalysis {
  topic: string;
  industry: string;
  main_claim: string;
  hidden_claim: string;
  intent: string;
  audience: string;
  sentiment: string;
  emotional_driver: string;
  contrarian_angle: string;
  controversial_score: number; // 0-1
}

export interface CommentScores {
  adds_information: number; // 0-10
  originality: number; // 0-10
  depth: number; // 0-10
  founder_voice: number; // 0-10
  screenshot_worthy: number; // 0-10
  total: number; // 0-50
}

// Returned by POST /api/posts/generate/{url,text,screenshot,pdf}
export interface GeneratedCommentResult {
  id: string;
  rank: number;
  rank_label: string;
  strategy: string;
  strategy_display: string;
  comment: string;
  raw_comment: string;
  scores: CommentScores;
  passed_quality: boolean;
}

export interface GenerateResponse {
  post_id: string;
  post_text: string;
  author_name: string;
  analysis: PostAnalysis;
  selected_strategy: string;
  strategy_confidence: number; // 0-100
  strategy_reasoning: string;
  comments: GeneratedCommentResult[];
  errors: string[];
}

// Returned by GET /api/posts/history
export interface PostHistoryItem {
  id: string;
  source: InputSource;
  author_name: string;
  topic: string;
  industry: string;
  post_preview: string;
  created_at: string;
  top_strategy: string | null;
  top_score: number | null;
  comments_generated: number;
  comments_posted: number;
}

// Returned by GET /api/posts/{id}
export interface PostDetailComment {
  id: string;
  strategy: string;
  strategy_display: string;
  final_comment: string;
  raw_comment: string;
  scores: CommentScores;
  ranking_position: number | null;
  rank_label: string;
  passed_quality_filter: boolean;
  was_posted: boolean;
  likes_received: number | null;
  replies_received: number | null;
  author_responded: boolean;
  profile_visits_generated: number | null;
}

export interface PostDetail {
  id: string;
  source: InputSource;
  raw_content: string;
  author_name: string;
  likes: number;
  topic: string;
  industry: string;
  main_claim: string;
  hidden_claim: string;
  intent: string;
  audience: string;
  sentiment: string;
  emotional_driver: string;
  contrarian_angle: string;
  controversial_score: number;
  created_at: string;
  comments: PostDetailComment[];
}

// Returned by PATCH /api/comments/{id}
export interface CommentRecord {
  id: string;
  post_id: string;
  strategy: string;
  final_comment: string;
  total_quality_score: number;
  ranking_position: number | null;
  passed_quality_filter: boolean;
  was_posted: boolean;
  likes_received: number | null;
  replies_received: number | null;
  author_responded: boolean;
  profile_visits_generated: number | null;
}

// Returned by /api/users/*
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  linkedin_profile_url: string;
  has_voice_profile: boolean;
}

// Returned by /api/voice/profile
export interface VoiceProfile {
  tone: string;
  style: string;
  avg_sentence_length: number;
  common_words: string[];
  voice_summary: string;
}

/**
 * A normalized view of "the thing currently in the workspace", built by
 * adapting either GenerateResponse (right after submitting) or PostDetail
 * (when loaded from history) into one shape the screens render from.
 */
export interface NormalizedComment {
  id: string;
  strategy: string;
  strategyDisplay: string;
  text: string;
  rawText: string;
  scores: CommentScores;
  rank: number | null;
  rankLabel: string;
  passedQuality: boolean;
  wasPosted: boolean;
  likesReceived: number | null;
  repliesReceived: number | null;
  authorResponded: boolean;
  profileVisitsGenerated: number | null;
}

export interface NormalizedResult {
  postId: string;
  postText: string;
  authorName: string;
  analysis: PostAnalysis;
  selectedStrategy: string;
  strategyConfidence: number; // 0-100
  strategyReasoning: string;
  comments: NormalizedComment[];
  errors: string[];
}
