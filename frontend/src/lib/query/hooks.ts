import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as services from "@/lib/services";
import { fromGenerateResponse, fromPostDetail } from "@/lib/adapters";
import type { NormalizedResult } from "@/lib/types";

export type AnalyzeInput =
  | { mode: "url"; url: string }
  | { mode: "text"; text: string; authorName?: string }
  | { mode: "screenshot"; file: File }
  | { mode: "pdf"; file: File };

/**
 * Runs the full 7-agent pipeline (POST /api/posts/generate/*), then
 * immediately re-fetches the persisted post (GET /api/posts/{id}) so the
 * comments we hold carry their real DB ids — the generate response never
 * includes them otherwise, since they're assigned at insert time.
 */
async function analyze(input: AnalyzeInput): Promise<NormalizedResult> {
  const response = await (() => {
    switch (input.mode) {
      case "url":
        return services.generateFromUrl(input.url);
      case "text":
        return services.generateFromText(input.text, input.authorName);
      case "screenshot":
        return services.generateFromScreenshot(input.file);
      case "pdf":
        return services.generateFromPdf(input.file);
    }
  })();

  if (response.errors.length > 0) {
    // Non-fatal pipeline errors (e.g. voice rewrite failed and fell back
    // to the raw comment) — surface them but don't block the result.
    console.warn("pipeline_errors", response.errors);
  }

  try {
    const detail = await services.getPost(response.post_id);
    return fromPostDetail(detail);
  } catch {
    // Fallback: still show the freshly generated result even if the
    // immediate re-fetch fails (comments just won't be markable-as-posted
    // until the page is reloaded).
    return fromGenerateResponse(response);
  }
}

export function useAnalyzeMutation() {
  return useMutation({ mutationFn: analyze });
}

export function useHistoryQuery(skip = 0, limit = 20) {
  return useQuery({
    queryKey: ["history", skip, limit],
    queryFn: () => services.getHistory(skip, limit),
  });
}

export function usePostQuery(postId: string | null) {
  return useQuery({
    queryKey: ["post", postId],
    queryFn: async () => fromPostDetail(await services.getPost(postId as string)),
    enabled: Boolean(postId),
  });
}

export function useUpdateCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      commentId,
      patch,
    }: {
      commentId: string;
      patch: services.CommentUpdatePatch;
    }) => services.updateComment(commentId, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post"] });
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });
}

export function useVoiceProfileQuery() {
  return useQuery({
    queryKey: ["voice-profile"],
    queryFn: services.getVoiceProfile,
  });
}

export function useSaveVoiceProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: services.saveVoiceProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["voice-profile"] }),
  });
}
