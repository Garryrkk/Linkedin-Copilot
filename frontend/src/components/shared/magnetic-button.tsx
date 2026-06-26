"use client";

import { motion } from "framer-motion";
import type { ButtonHTMLAttributes } from "react";
import { useMagnetic } from "@/lib/motion/use-magnetic";
import { cn } from "@/lib/utils";

type SafeButtonAttributes = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onAnimationStart" | "onAnimationEnd" | "onDrag" | "onDragStart" | "onDragEnd"
>;

interface MagneticButtonProps extends SafeButtonAttributes {
  variant?: "primary" | "ghost";
}

export function MagneticButton({
  className,
  variant = "primary",
  children,
  ...props
}: MagneticButtonProps) {
  const { ref, x, y, onMouseMove, onMouseLeave } = useMagnetic(0.3);

  return (
    <motion.button
      ref={ref as React.RefObject<HTMLButtonElement>}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ x, y }}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-medium tracking-wide transition-colors",
        variant === "primary" &&
          "bg-highlight text-bg-primary shadow-[0_0_40px_-8px_var(--accent-teal)] hover:shadow-[0_0_55px_-6px_var(--accent-teal)]",
        variant === "ghost" &&
          "border border-white/15 text-highlight/90 hover:border-accent-teal/50 hover:text-accent-teal",
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
