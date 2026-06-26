"use client";

import { motion } from "framer-motion";

const MAX_SCORE = 50; // 5 dimensions x 0-10, see Backend/agents/agent6_quality.py

function colorForScore(pct: number) {
  if (pct >= 80) return "var(--accent-teal)";
  if (pct >= 60) return "var(--accent-blue)";
  return "var(--warning)";
}

export function CommentEnergyMeter({ score, compact }: { score: number; compact?: boolean }) {
  const pct = Math.min(100, Math.round((score / MAX_SCORE) * 100));
  const color = colorForScore(pct);

  return (
    <div className={compact ? "flex items-center gap-2" : "space-y-1"}>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-highlight/40">
        {!compact && <span>Quality</span>}
        <span style={{ color }}>{Math.round(score)}/{MAX_SCORE}</span>
      </div>
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
