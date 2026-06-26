"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Megaphone } from "lucide-react";
import { GlassPanel } from "@/components/shared/glass-panel";
import { CommentEnergyMeter } from "./comment-energy-meter";
import { QualityRadar } from "./quality-radar";
import { panelMorph } from "@/lib/motion/variants";
import { useUpdateCommentMutation } from "@/lib/query/hooks";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import type { NormalizedComment } from "@/lib/types";

export function CommentEditorPanel({ comment }: { comment: NormalizedComment | null }) {
  const updateComment = useWorkspaceStore((s) => s.updateComment);
  const { mutate, isPending } = useUpdateCommentMutation();
  const [copied, setCopied] = useState(false);
  const [likes, setLikes] = useState("");
  const [replies, setReplies] = useState("");

  if (!comment) {
    return (
      <GlassPanel className="flex h-full min-h-[260px] items-center justify-center p-8 text-center text-sm text-highlight/40">
        Select a comment node to open the editor.
      </GlassPanel>
    );
  }

  function handleCopy() {
    if (!comment) return;
    navigator.clipboard.writeText(comment.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function markAsPosted() {
    if (!comment) return;
    const current = comment;
    mutate(
      { commentId: current.id, patch: { was_posted: true } },
      {
        onSuccess: (updated) =>
          updateComment({
            ...current,
            wasPosted: updated.was_posted,
          }),
      }
    );
  }

  function savePerformance() {
    if (!comment) return;
    const current = comment;
    const patch: Record<string, number> = {};
    if (likes !== "") patch.likes_received = Number(likes);
    if (replies !== "") patch.replies_received = Number(replies);
    mutate(
      { commentId: current.id, patch },
      {
        onSuccess: (updated) =>
          updateComment({
            ...current,
            likesReceived: updated.likes_received,
            repliesReceived: updated.replies_received,
          }),
      }
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div key={comment.id} initial="collapsed" animate="expanded" exit="collapsed" variants={panelMorph}>
        <GlassPanel strong className="space-y-5 p-7">
          <div className="flex items-center justify-between">
            <CommentEnergyMeter score={comment.scores.total} />
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-highlight/70 hover:border-accent-teal/40 hover:text-accent-teal"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <p className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-sm leading-relaxed text-highlight/90">
            {comment.text}
          </p>

          <QualityRadar scores={comment.scores} />

          <div className="border-t border-white/5 pt-5">
            {!comment.wasPosted ? (
              <button
                disabled={isPending}
                onClick={markAsPosted}
                className="flex items-center gap-1.5 rounded-full border border-accent-teal/40 bg-accent-teal/10 px-3 py-1.5 text-xs text-accent-teal disabled:opacity-40"
              >
                <Megaphone size={13} />
                {isPending ? "Marking…" : "Mark as posted"}
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-accent-teal/80">Posted — log how it performed</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    placeholder="Likes"
                    value={likes}
                    onChange={(e) => setLikes(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm placeholder:text-highlight/30 focus:border-accent-teal/40 focus:outline-none"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Replies"
                    value={replies}
                    onChange={(e) => setReplies(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm placeholder:text-highlight/30 focus:border-accent-teal/40 focus:outline-none"
                  />
                </div>
                <button
                  disabled={isPending}
                  onClick={savePerformance}
                  className="w-full rounded-lg border border-white/10 py-2 text-xs text-highlight/70 hover:border-accent-teal/40 hover:text-accent-teal disabled:opacity-40"
                >
                  Save performance
                </button>
                {(comment.likesReceived !== null || comment.repliesReceived !== null) && (
                  <p className="text-center text-xs text-highlight/40">
                    Currently: {comment.likesReceived ?? 0} likes · {comment.repliesReceived ?? 0} replies
                  </p>
                )}
              </div>
            )}
          </div>
        </GlassPanel>
      </motion.div>
    </AnimatePresence>
  );
}
