"use client";

import { motion } from "framer-motion";
import { DashboardCoreScene } from "@/components/three/dashboard-core";
import { GlassPanel } from "@/components/shared/glass-panel";
import { TiltCard } from "@/components/shared/tilt-card";
import { RecentPostsStream } from "@/components/dashboard/recent-posts-stream";
import { EngagementSummary } from "@/components/dashboard/engagement-summary";
import { StrategyDistributionChart } from "@/components/dashboard/strategy-distribution-chart";
import { TextReveal } from "@/components/shared/text-reveal";

export default function DashboardPage() {
  return (
    <div className="relative">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.25em] text-highlight/40">
          Mission control
        </p>
        <h1 className="font-display mt-2 text-4xl sm:text-5xl">
          <TextReveal text="The room, mapped." />
        </h1>
      </div>

      <div className="relative mx-auto h-[640px] max-w-6xl">
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 opacity-90">
          <DashboardCoreScene />
        </div>

        <motion.div
          drag
          dragElastic={0.18}
          dragMomentum={false}
          whileDrag={{ scale: 1.03 }}
          className="absolute left-0 top-4 w-[300px] cursor-grab active:cursor-grabbing"
        >
          <TiltCard maxTilt={6}>
            <GlassPanel className="p-6">
              <RecentPostsStream />
            </GlassPanel>
          </TiltCard>
        </motion.div>

        <motion.div
          drag
          dragElastic={0.18}
          dragMomentum={false}
          whileDrag={{ scale: 1.03 }}
          className="absolute right-0 top-0 w-[320px] cursor-grab active:cursor-grabbing"
        >
          <TiltCard maxTilt={6}>
            <GlassPanel className="animate-float-slower p-6">
              <StrategyDistributionChart />
            </GlassPanel>
          </TiltCard>
        </motion.div>

        <motion.div
          drag
          dragElastic={0.18}
          dragMomentum={false}
          whileDrag={{ scale: 1.03 }}
          className="absolute bottom-2 left-10 w-[320px] cursor-grab active:cursor-grabbing sm:left-24"
        >
          <TiltCard maxTilt={6}>
            <GlassPanel className="animate-float-slow p-6">
              <EngagementSummary />
            </GlassPanel>
          </TiltCard>
        </motion.div>
      </div>
    </div>
  );
}
