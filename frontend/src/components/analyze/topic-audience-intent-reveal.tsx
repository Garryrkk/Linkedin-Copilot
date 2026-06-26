"use client";

import { motion } from "framer-motion";
import type { PostAnalysis } from "@/lib/types";
import { staggerContainer, fadeUp } from "@/lib/motion/variants";

const CHIPS: { key: keyof PostAnalysis; label: string }[] = [
  { key: "topic", label: "Topic" },
  { key: "industry", label: "Industry" },
  { key: "intent", label: "Intent" },
  { key: "audience", label: "Audience" },
  { key: "sentiment", label: "Sentiment" },
  { key: "emotional_driver", label: "Emotional driver" },
];

const BLOCKS: { key: keyof PostAnalysis; label: string }[] = [
  { key: "main_claim", label: "Main claim" },
  { key: "hidden_claim", label: "Hidden claim" },
  { key: "contrarian_angle", label: "Contrarian angle" },
];

export function TopicAudienceIntentReveal({ analysis }: { analysis: PostAnalysis }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-6"
    >
      <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
        {CHIPS.map(({ key, label }) =>
          analysis[key] ? (
            <span
              key={key}
              className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-highlight/70"
            >
              <span className="text-highlight/40">{label}:</span> {String(analysis[key])}
            </span>
          ) : null
        )}
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="mb-1 flex justify-between text-xs text-highlight/60">
          <span>Controversial score</span>
          <span>{Math.round(analysis.controversial_score * 100)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5">
          <motion.div
            className="h-full rounded-full bg-warning"
            initial={{ width: 0 }}
            animate={{ width: `${analysis.controversial_score * 100}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </motion.div>

      {BLOCKS.map(({ key, label }) =>
        analysis[key] ? (
          <motion.div key={key} variants={fadeUp} className="rounded-xl border border-white/5 p-4">
            <p className="mb-1 text-xs uppercase tracking-wider text-highlight/40">{label}</p>
            <p className="text-sm leading-relaxed text-highlight/85">{String(analysis[key])}</p>
          </motion.div>
        ) : null
      )}
    </motion.div>
  );
}
