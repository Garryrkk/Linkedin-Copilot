"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import { GlassPanel } from "@/components/shared/glass-panel";
import { MagneticButton } from "@/components/shared/magnetic-button";
import { TopicAudienceIntentReveal } from "./topic-audience-intent-reveal";
import type { NormalizedResult } from "@/lib/types";
import { fadeIn } from "@/lib/motion/variants";

export function SplitView({ result }: { result: NormalizedResult }) {
  return (
    <motion.div initial="hidden" animate="visible" variants={fadeIn} className="grid gap-6 lg:grid-cols-2">
      <GlassPanel className="p-7">
        <p className="mb-4 text-xs uppercase tracking-[0.2em] text-highlight/40">
          Original post
        </p>
        <p className="text-sm text-highlight/90">{result.authorName || "Unknown author"}</p>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-highlight/80">
          {result.postText}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/strategy">
            <MagneticButton variant="ghost" className="text-xs">
              View strategy <ArrowRight size={13} />
            </MagneticButton>
          </Link>
          <Link href="/comments">
            <MagneticButton variant="ghost" className="text-xs">
              <MessageCircle size={13} /> {result.comments.length} comments generated
            </MagneticButton>
          </Link>
        </div>

        {result.errors.length > 0 && (
          <div className="mt-5 rounded-xl border border-warning/30 bg-warning/5 p-3 text-xs text-warning">
            {result.errors.map((err, i) => (
              <p key={i}>{err}</p>
            ))}
          </div>
        )}
      </GlassPanel>

      <GlassPanel strong className="space-y-6 p-7">
        <p className="text-xs uppercase tracking-[0.2em] text-accent-teal/70">
          Intelligence engine output
        </p>
        <TopicAudienceIntentReveal analysis={result.analysis} />
      </GlassPanel>
    </motion.div>
  );
}
