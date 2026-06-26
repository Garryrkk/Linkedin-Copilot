"use client";

import { motion } from "framer-motion";
import { staggerContainer, fadeUp } from "@/lib/motion/variants";
import { useHistoryQuery } from "@/lib/query/hooks";

export function EngagementSummary() {
  const { data, isLoading } = useHistoryQuery(0, 50);

  const commentsGenerated = data?.posts.reduce((sum, p) => sum + p.comments_generated, 0) ?? 0;
  const commentsPosted = data?.posts.reduce((sum, p) => sum + p.comments_posted, 0) ?? 0;

  const stats = [
    { label: "Posts analyzed", value: data?.total ?? 0 },
    { label: "Comments generated", value: commentsGenerated },
    { label: "Comments posted", value: commentsPosted },
  ];

  return (
    <div>
      <h3 className="font-display mb-4 text-sm tracking-wide text-highlight/80">
        Engagement Summary
      </h3>
      {isLoading ? (
        <p className="text-sm text-highlight/40">Loading…</p>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-4">
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={fadeUp} className="flex items-baseline justify-between">
              <span className="text-xs text-highlight/50">{stat.label}</span>
              <span className="font-display text-2xl text-highlight/90">{stat.value}</span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
