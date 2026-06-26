"use client";

import { motion } from "framer-motion";
import { CommentEnergyMeter } from "./comment-energy-meter";
import { colorForStrategy } from "@/lib/constants/strategies";
import type { NormalizedComment } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CommentNode({
  comment,
  position,
  isSelected,
  onSelect,
}: {
  comment: NormalizedComment;
  position: { top: string; left: string; rotate: number };
  isSelected: boolean;
  onSelect: () => void;
}) {
  const color = colorForStrategy(comment.strategy);

  return (
    <motion.button
      type="button"
      drag
      dragMomentum={false}
      dragElastic={0.2}
      onClick={onSelect}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1, rotate: position.rotate }}
      whileHover={{ scale: 1.04, rotate: 0, zIndex: 20 }}
      whileTap={{ scale: 0.98 }}
      style={{ position: "absolute", top: position.top, left: position.left }}
      className={cn(
        "glass-panel w-64 cursor-grab rounded-2xl p-4 text-left active:cursor-grabbing",
        isSelected && "glass-panel-strong"
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className="truncate rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider"
          style={{ color, borderColor: color }}
        >
          {comment.strategyDisplay || comment.strategy}
        </span>
        {comment.rankLabel && (
          <span className="shrink-0 rounded-full bg-success/15 px-2 py-0.5 text-[10px] text-success">
            {comment.rankLabel}
          </span>
        )}
      </div>
      <p className="line-clamp-4 text-sm text-highlight/85">{comment.text}</p>
      <div className="mt-3 flex items-center justify-between">
        <CommentEnergyMeter score={comment.scores.total} compact />
        {comment.wasPosted && (
          <span className="text-[10px] text-accent-teal/70">Posted</span>
        )}
      </div>
    </motion.button>
  );
}
