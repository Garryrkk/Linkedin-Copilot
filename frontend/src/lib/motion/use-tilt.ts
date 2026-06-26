"use client";

import { useRef } from "react";
import { useMotionValue, useSpring } from "framer-motion";

export function useTilt(maxTilt = 10) {
  const ref = useRef<HTMLElement | null>(null);
  const rotateXRaw = useMotionValue(0);
  const rotateYRaw = useMotionValue(0);
  const rotateX = useSpring(rotateXRaw, { stiffness: 200, damping: 20, mass: 0.5 });
  const rotateY = useSpring(rotateYRaw, { stiffness: 200, damping: 20, mass: 0.5 });

  function onMouseMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateYRaw.set(px * maxTilt * 2);
    rotateXRaw.set(-py * maxTilt * 2);
  }

  function onMouseLeave() {
    rotateXRaw.set(0);
    rotateYRaw.set(0);
  }

  return { ref, rotateX, rotateY, onMouseMove, onMouseLeave };
}
