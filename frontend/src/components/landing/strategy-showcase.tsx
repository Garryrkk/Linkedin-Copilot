"use client";

import { motion } from "framer-motion";
import { STRATEGY_ORDER, STRATEGY_REFERENCE, colorForStrategy } from "@/lib/constants/strategies";
import { staggerContainer, fadeUp } from "@/lib/motion/variants";
import { TiltCard } from "@/components/shared/tilt-card";

export function StrategyShowcase() {
  return (
    <section className="relative px-6 py-32 sm:px-10">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        variants={fadeUp}
        className="mx-auto mb-16 max-w-2xl text-center"
      >
        <p className="text-xs uppercase tracking-[0.25em] text-highlight/40">
          Strategy engine
        </p>
        <h2 className="font-display mt-4 text-4xl sm:text-5xl">
          Seven lenses. One decisive strategy per post.
        </h2>
        <p className="mt-4 text-highlight/60">
          The engine weighs all seven engagement strategies, then commits to
          the single best one for the post in front of it — with visible
          reasoning, not a black box.
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
        className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2"
      >
        {STRATEGY_ORDER.map((key, i) => {
          const strategy = STRATEGY_REFERENCE[key];
          return (
            <motion.div key={key} variants={fadeUp}>
              <TiltCard
                maxTilt={6}
                style={{ animationDelay: `${i * 0.4}s` }}
                className="glass-panel animate-float-slow rounded-2xl p-7"
              >
                <h3
                  className="font-display text-xl"
                  style={{ color: colorForStrategy(key) }}
                >
                  {strategy.name}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-highlight/70">
                  {strategy.description}
                </p>
                <p className="mt-4 text-xs uppercase tracking-wider text-highlight/30">
                  Best for: {strategy.bestFor.join(", ")}
                </p>
              </TiltCard>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
