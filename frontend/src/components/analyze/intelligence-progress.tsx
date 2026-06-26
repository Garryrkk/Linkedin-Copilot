"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassPanel } from "@/components/shared/glass-panel";

// Mirrors the 7 real pipeline stages in Backend/agents/pipeline.py. There is
// no progress-streaming endpoint, so this cycles through the stages as a
// sense of "what's happening" rather than a precise, fake completion %.
const STAGES = [
  "Reading the post…",
  "Understanding context…",
  "Selecting engagement strategy…",
  "Generating comment variations…",
  "Matching your voice…",
  "Scoring quality…",
  "Ranking results…",
];

export function IntelligenceProgress() {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((i) => (i + 1) % STAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <GlassPanel strong className="mx-auto max-w-lg p-10 text-center">
      <div className="relative mx-auto mb-6 h-16 w-16">
        <span className="absolute inset-0 rounded-full border-2 border-accent-teal/20" />
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-t-accent-teal border-transparent"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
        />
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={stageIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="font-display text-lg text-highlight/90"
        >
          {STAGES[stageIndex]}
        </motion.p>
      </AnimatePresence>
      <p className="mt-4 text-xs text-highlight/40">
        This runs 7 sequential model calls — usually 20-60s depending on input.
      </p>
      <div className="mx-auto mt-6 flex max-w-xs justify-between gap-1">
        {STAGES.map((_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= stageIndex ? "bg-accent-teal" : "bg-white/10"
            }`}
          />
        ))}
      </div>
    </GlassPanel>
  );
}
