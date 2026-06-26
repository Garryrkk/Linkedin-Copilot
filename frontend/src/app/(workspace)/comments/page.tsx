"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { TextReveal } from "@/components/shared/text-reveal";
import { MagneticButton } from "@/components/shared/magnetic-button";
import { CommentLabCanvas } from "@/components/comments/comment-lab-canvas";
import { CommentEditorPanel } from "@/components/comments/comment-editor-panel";
import { nameForStrategy } from "@/lib/constants/strategies";
import { useWorkspaceStore, type SortMode } from "@/lib/store/workspace-store";
import { cn } from "@/lib/utils";

const SORT_OPTIONS: { key: SortMode; label: string }[] = [
  { key: "rank", label: "Engine rank" },
  { key: "score", label: "Top score" },
];

export default function CommentsPage() {
  const activeResult = useWorkspaceStore((s) => s.activeResult);
  const sortMode = useWorkspaceStore((s) => s.sortMode);
  const setSortMode = useWorkspaceStore((s) => s.setSortMode);
  const strategyFilter = useWorkspaceStore((s) => s.strategyFilter);
  const setStrategyFilter = useWorkspaceStore((s) => s.setStrategyFilter);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visibleComments = useMemo(() => {
    if (!activeResult) return [];
    let list = strategyFilter
      ? activeResult.comments.filter((c) => c.strategy === strategyFilter)
      : activeResult.comments;

    list = [...list].sort((a, b) => {
      if (sortMode === "score") return b.scores.total - a.scores.total;
      return (a.rank ?? 99) - (b.rank ?? 99);
    });
    return list;
  }, [activeResult, strategyFilter, sortMode]);

  const selectedComment = visibleComments.find((c) => c.id === selectedId) ?? null;

  if (!activeResult) {
    return (
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-highlight/40">Comment lab</p>
        <h1 className="font-display mt-2 text-4xl sm:text-5xl">
          <TextReveal text="Nothing to engage with yet." />
        </h1>
        <p className="mt-4 max-w-md text-sm text-highlight/50">
          Analyze a post to generate ranked, voice-matched comments here.
        </p>
        <Link href="/analyze" className="mt-6 inline-block">
          <MagneticButton>Analyze a post</MagneticButton>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-highlight/40">
            Comment lab
          </p>
          <h1 className="font-display mt-2 text-4xl sm:text-5xl">
            <TextReveal text="Find the line that lands." />
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {strategyFilter && (
            <button
              onClick={() => setStrategyFilter(null)}
              className="flex items-center gap-1.5 rounded-full border border-accent-teal/40 bg-accent-teal/10 px-3 py-1.5 text-xs text-accent-teal"
            >
              {nameForStrategy(strategyFilter)}
              <X size={12} />
            </button>
          )}
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortMode(opt.key)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition-colors",
                sortMode === opt.key
                  ? "border-accent-teal/50 bg-accent-teal/10 text-accent-teal"
                  : "border-white/10 text-highlight/50 hover:text-highlight/80"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {visibleComments.length === 0 ? (
        <div className="flex h-96 items-center justify-center text-sm text-highlight/40">
          No comments match this filter.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <CommentLabCanvas
            comments={visibleComments}
            selectedId={selectedId}
            onSelect={(comment) => setSelectedId(comment.id)}
          />
          <div className="lg:sticky lg:top-24 lg:self-start">
            <CommentEditorPanel comment={selectedComment} />
          </div>
        </div>
      )}
    </div>
  );
}
