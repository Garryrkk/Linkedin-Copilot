"use client";

import { motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import { useTilt } from "@/lib/motion/use-tilt";
import { cn } from "@/lib/utils";

export function TiltCard({
  children,
  className,
  style,
  maxTilt = 8,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  maxTilt?: number;
}) {
  const { ref, rotateX, rotateY, onMouseMove, onMouseLeave } = useTilt(maxTilt);

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ ...style, rotateX, rotateY, transformPerspective: 900 }}
      className={cn("will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}
