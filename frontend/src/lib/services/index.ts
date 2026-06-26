import { api } from "@/lib/api/client";
import type {
  CommentRecord,
  GenerateResponse,
  PostDetail,
  PostHistoryItem,
  UserProfile,
  VoiceProfile,
} from "@/lib/types";

// The full pipeline is 7 sequential agents (up to ~14 LLM calls for 5
// comments). On a hosted API that's 20-60s; on a local model it can run
// several minutes. Give it real headroom instead of the default timeout.
const PIPELINE_TIMEOUT_MS = 10 * 60_000;

export function generateFromUrl(url: string) {
  return api.post<GenerateResponse>(
    "/api/posts/generate/url",
    { url },
    { timeoutMs: PIPELINE_TIMEOUT_MS }
  );
}

export function generateFromText(text: string, authorName?: string) {
  return api.post<GenerateResponse>(
    "/api/posts/generate/text",
    { text, author_name: authorName ?? "" },
    { timeoutMs: PIPELINE_TIMEOUT_MS }
  );
}

export function generateFromScreenshot(file: File) {
  const form = new FormData();
  form.append("file", file);
  return api.post<GenerateResponse>("/api/posts/generate/screenshot", form, {
    timeoutMs: PIPELINE_TIMEOUT_MS,
  });
}

export function generateFromPdf(file: File) {
  const form = new FormData();
  form.append("file", file);
  return api.post<GenerateResponse>("/api/posts/generate/pdf", form, {
    timeoutMs: PIPELINE_TIMEOUT_MS,
  });
}

export function getHistory(skip = 0, limit = 20) {
  return api.get<{ posts: PostHistoryItem[]; total: number }>(
    `/api/posts/history?skip=${skip}&limit=${limit}`
  );
}

export function getPost(postId: string) {
  return api.get<PostDetail>(`/api/posts/${postId}`);
}

export interface CommentUpdatePatch {
  was_posted?: boolean;
  likes_received?: number;
  replies_received?: number;
  author_responded?: boolean;
  profile_visits_generated?: number;
}

export function updateComment(commentId: string, patch: CommentUpdatePatch) {
  return api.patch<CommentRecord>(`/api/comments/${commentId}`, patch);
}

export function onboardUser(email: string, name?: string, linkedinUrl?: string) {
  return api.post<UserProfile>("/api/users/onboard", {
    email,
    name: name ?? "",
    linkedin_profile_url: linkedinUrl ?? "",
  });
}

export function getMe() {
  return api.get<UserProfile>("/api/users/me");
}

export function updateMe(patch: { name?: string; linkedin_profile_url?: string }) {
  return api.put<UserProfile>("/api/users/me", patch);
}

export function getVoiceProfile() {
  return api.get<VoiceProfile | null>("/api/voice/profile");
}

export function saveVoiceProfile(writingSamples: string) {
  return api.post<VoiceProfile>(
    "/api/voice/profile",
    { writing_samples: writingSamples },
    { timeoutMs: 120_000 }
  );
}
