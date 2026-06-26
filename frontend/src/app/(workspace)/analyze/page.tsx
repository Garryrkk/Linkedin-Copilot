"use client";

import { useState } from "react";
import { TextReveal } from "@/components/shared/text-reveal";
import { PostIntakePanel } from "@/components/analyze/post-intake-panel";
import { IntelligenceProgress } from "@/components/analyze/intelligence-progress";
import { SplitView } from "@/components/analyze/split-view";
import { useAnalyzeMutation } from "@/lib/query/hooks";
import { fromPostDetail } from "@/lib/adapters";
import { getPost } from "@/lib/services";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import type { AnalyzeInput } from "@/lib/query/hooks";

export default function AnalyzePage() {
  const activeResult = useWorkspaceStore((s) => s.activeResult);
  const setActiveResult = useWorkspaceStore((s) => s.setActiveResult);
  const { mutate, isPending, error } = useAnalyzeMutation();
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  function handleRun(input: AnalyzeInput) {
    mutate(input, { onSuccess: setActiveResult });
  }

  async function handleOpenHistoryPost(postId: string) {
    setIsLoadingHistory(true);
    try {
      const detail = await getPost(postId);
      setActiveResult(fromPostDetail(detail));
    } finally {
      setIsLoadingHistory(false);
    }
  }

  const loading = isPending || isLoadingHistory;

  return (
    <div>
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.25em] text-highlight/40">
          Analyze post
        </p>
        <h1 className="font-display mt-2 text-4xl sm:text-5xl">
          <TextReveal text="Read the room first." />
        </h1>
      </div>

      {!activeResult && !loading && (
        <PostIntakePanel
          onRun={handleRun}
          onOpenHistoryPost={handleOpenHistoryPost}
          isPending={loading}
        />
      )}

      {loading && <IntelligenceProgress />}

      {error && !loading && (
        <p className="mx-auto max-w-lg text-center text-sm text-warning">
          {error instanceof Error ? error.message : "Something went wrong."}
        </p>
      )}

      {activeResult && !loading && (
        <div className="space-y-6">
          <button
            onClick={() => setActiveResult(null)}
            className="text-xs text-highlight/40 hover:text-highlight/70"
          >
            ← Analyze a different post
          </button>
          <SplitView result={activeResult} />
        </div>
      )}
    </div>
  );
}
