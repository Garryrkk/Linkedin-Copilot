"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { GlassPanel } from "@/components/shared/glass-panel";
import { InfluenceRing } from "@/components/shared/influence-ring";
import { MagneticButton } from "@/components/shared/magnetic-button";
import { TiltCard } from "@/components/shared/tilt-card";
import { STRATEGY_REFERENCE, colorForStrategy } from "@/lib/constants/strategies";
import { panelMorph } from "@/lib/motion/variants";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import type { EngagementStrategy } from "@/lib/types";

export function StrategyModuleCard({
  strategyKey,
  isSelectedByEngine,
  confidence,
  reasoning,
}: {
  strategyKey: string | null;
  isSelectedByEngine: boolean;
  confidence: number; // 0-100, 0 means "not available"
  reasoning: string;
}) {
  const router = useRouter();
  const setStrategyFilter = useWorkspaceStore((s) => s.setStrategyFilter);

  const reference = strategyKey
    ? STRATEGY_REFERENCE[strategyKey as EngagementStrategy]
    : null;
  const color = strategyKey ? colorForStrategy(strategyKey) : "var(--highlight)";

  return (
    <AnimatePresence mode="wait">
      {strategyKey && reference && (
        <motion.div key={strategyKey} initial="collapsed" animate="expanded" exit="collapsed" variants={panelMorph}>
          <GlassPanel strong className="grid gap-8 p-8 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.2em]" style={{ color }}>
                {isSelectedByEngine ? "Selected for this post" : "Reference — not used for this post"}
              </p>
              <h2 className="font-display mt-2 text-3xl">{reference.name}</h2>
              <p className="mt-3 max-w-xl text-sm text-highlight/60">{reference.description}</p>
              <p className="mt-2 text-xs uppercase tracking-wider text-highlight/30">
                Best for: {reference.bestFor.join(", ")}
              </p>

              {isSelectedByEngine && (
                <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <p className="mb-2 text-xs uppercase tracking-wider text-highlight/40">
                    Why the engine picked this
                  </p>
                  {reasoning ? (
                    <p className="text-sm leading-relaxed text-highlight/85">{reasoning}</p>
                  ) : (
                    <p className="text-sm text-highlight/40">
                      Reasoning is only returned at generation time — re-run analysis to see it for this post.
                    </p>
                  )}
                </div>
              )}

              {isSelectedByEngine && (
                <MagneticButton
                  className="mt-8"
                  onClick={() => {
                    setStrategyFilter(strategyKey);
                    router.push("/comments");
                  }}
                >
                  View generated comments
                </MagneticButton>
              )}
            </div>

            {isSelectedByEngine && confidence > 0 && (
              <div className="flex justify-center lg:justify-end">
                <TiltCard maxTilt={14} className="rounded-full">
                  <InfluenceRing value={confidence / 100} color={color} label="confidence" size={120} />
                </TiltCard>
              </div>
            )}
          </GlassPanel>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
