"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TextRevealProps {
  text: string;
  className?: string;
  by?: "word" | "letter";
  delay?: number;
}

export function TextReveal({ text, className, by = "word", delay = 0 }: TextRevealProps) {
  const units = by === "word" ? text.split(" ") : text.split("");

  return (
    <span className={cn("inline-block", className)} aria-label={text}>
      {units.map((unit, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{
              duration: 0.7,
              ease: [0.16, 1, 0.3, 1],
              delay: delay + i * (by === "word" ? 0.06 : 0.018),
            }}
          >
            {unit}
            {by === "word" && i < units.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
