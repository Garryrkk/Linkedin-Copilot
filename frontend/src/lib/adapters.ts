import type {
  GenerateResponse,
  NormalizedComment,
  NormalizedResult,
  PostDetail,
} from "@/lib/types";

export function fromGenerateResponse(response: GenerateResponse): NormalizedResult {
  return {
    postId: response.post_id,
    postText: response.post_text,
    authorName: response.author_name,
    analysis: response.analysis,
    selectedStrategy: response.selected_strategy,
    strategyConfidence: response.strategy_confidence,
    strategyReasoning: response.strategy_reasoning,
    errors: response.errors,
    comments: response.comments.map<NormalizedComment>((c) => ({
      id: c.id,
      strategy: c.strategy,
      strategyDisplay: c.strategy_display,
      text: c.comment,
      rawText: c.raw_comment,
      scores: c.scores,
      rank: c.rank,
      rankLabel: c.rank_label,
      passedQuality: c.passed_quality,
      wasPosted: false,
      likesReceived: null,
      repliesReceived: null,
      authorResponded: false,
      profileVisitsGenerated: null,
    })),
  };
}

export function fromPostDetail(post: PostDetail): NormalizedResult {
  const topComment = post.comments.find((c) => c.ranking_position === 1);

  return {
    postId: post.id,
    postText: post.raw_content,
    authorName: post.author_name,
    analysis: {
      topic: post.topic,
      industry: post.industry,
      main_claim: post.main_claim,
      hidden_claim: post.hidden_claim,
      intent: post.intent,
      audience: post.audience,
      sentiment: post.sentiment,
      emotional_driver: post.emotional_driver,
      contrarian_angle: post.contrarian_angle,
      controversial_score: post.controversial_score,
    },
    selectedStrategy: topComment?.strategy ?? "",
    strategyConfidence: 0,
    strategyReasoning: "",
    errors: [],
    comments: post.comments.map<NormalizedComment>((c) => ({
      id: c.id,
      strategy: c.strategy,
      strategyDisplay: c.strategy_display,
      text: c.final_comment,
      rawText: c.raw_comment,
      scores: c.scores,
      rank: c.ranking_position,
      rankLabel: c.rank_label,
      passedQuality: c.passed_quality_filter,
      wasPosted: c.was_posted,
      likesReceived: c.likes_received,
      repliesReceived: c.replies_received,
      authorResponded: c.author_responded,
      profileVisitsGenerated: c.profile_visits_generated,
    })),
  };
}
