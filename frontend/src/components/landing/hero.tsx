"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AmbientNetworkScene } from "@/components/three/ambient-network";
import { TextReveal } from "@/components/shared/text-reveal";
import { MagneticButton } from "@/components/shared/magnetic-button";
import { fadeUp } from "@/lib/motion/variants";

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      <AmbientNetworkScene className="opacity-80" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-bg-primary/40 to-bg-primary" />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="relative z-10 mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-highlight/60"
      >
        Founder engagement operating system
      </motion.div>

      <h1 className="font-display relative z-10 max-w-5xl text-[13vw] leading-[0.95] tracking-tight sm:text-[8vw] lg:text-[6.2vw]">
        <TextReveal text="Win the room" className="block" />
        <TextReveal
          text="before you comment."
          className="text-gradient-signal block"
          delay={0.5}
        />
      </h1>

      <motion.p
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ delay: 1.1 }}
        className="relative z-10 mx-auto mt-8 max-w-xl text-balance text-base text-highlight/60 sm:text-lg"
      >
        Audience AI reads the post, maps the audience, builds the strategy,
        and hands you the comment that moves the conversation — before
        anyone else gets there.
      </motion.p>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ delay: 1.3 }}
        className="relative z-10 mt-10 flex flex-wrap items-center justify-center gap-4"
      >
        <Link href="/dashboard">
          <MagneticButton>Enter the workspace</MagneticButton>
        </Link>
        <Link href="#flow">
          <MagneticButton variant="ghost">See how it thinks</MagneticButton>
        </Link>
      </motion.div>
    </section>
  );
}
