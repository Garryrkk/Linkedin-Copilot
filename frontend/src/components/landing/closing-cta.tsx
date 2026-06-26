"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TextReveal } from "@/components/shared/text-reveal";
import { MagneticButton } from "@/components/shared/magnetic-button";
import { fadeUp } from "@/lib/motion/variants";

export function ClosingCta() {
  return (
    <section className="relative px-6 py-32 text-center sm:px-10">
      <div className="bg-animated-gradient pointer-events-none absolute inset-x-0 top-1/2 mx-auto h-72 max-w-3xl -translate-y-1/2 rounded-full opacity-30 blur-3xl" />

      <h2 className="font-display relative z-10 mx-auto max-w-3xl text-4xl leading-tight sm:text-6xl">
        <TextReveal text="Stop guessing what to say." />
      </h2>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        transition={{ delay: 0.2 }}
        className="relative z-10 mt-10"
      >
        <Link href="/dashboard">
          <MagneticButton>Open Mission Control</MagneticButton>
        </Link>
      </motion.div>

      <footer className="relative z-10 mt-28 flex flex-col items-center gap-3 text-xs text-highlight/30">
        <span className="font-display text-highlight/50">Audience AI</span>
        <span>Founder engagement operating system — built for the comment section.</span>
      </footer>
    </section>
  );
}
