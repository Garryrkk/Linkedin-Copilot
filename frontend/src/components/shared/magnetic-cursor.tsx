"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const HOVER_SELECTOR = "a, button, [data-cursor='hover'], input, textarea";

function subscribeFinePointer(callback: () => void) {
  const mql = window.matchMedia("(pointer: fine)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getFinePointerSnapshot() {
  return window.matchMedia("(pointer: fine)").matches;
}

function getFinePointerServerSnapshot() {
  return false;
}

export function MagneticCursor() {
  const enabled = useSyncExternalStore(
    subscribeFinePointer,
    getFinePointerSnapshot,
    getFinePointerServerSnapshot
  );
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 280, damping: 26, mass: 0.5 });
  const ringY = useSpring(y, { stiffness: 280, damping: 26, mass: 0.5 });

  useEffect(() => {
    if (!enabled) return;

    document.documentElement.classList.add("cursor-none-custom");

    function handleMove(e: MouseEvent) {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
    }
    function handleLeave() {
      setVisible(false);
    }
    function handleOver(e: MouseEvent) {
      const target = e.target as HTMLElement;
      setHovering(Boolean(target.closest(HOVER_SELECTOR)));
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseout", handleLeave);
    window.addEventListener("mouseover", handleOver);

    return () => {
      document.documentElement.classList.remove("cursor-none-custom");
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseout", handleLeave);
      window.removeEventListener("mouseover", handleOver);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[999] transition-opacity duration-200"
      style={{ opacity: visible ? 1 : 0 }}
      aria-hidden
    >
      <motion.div
        className="absolute rounded-full bg-accent-teal"
        style={{ x, y, width: 6, height: 6, translateX: "-50%", translateY: "-50%" }}
      />
      <motion.div
        className="absolute rounded-full border border-accent-teal/50"
        animate={{
          width: hovering ? 56 : 32,
          height: hovering ? 56 : 32,
          opacity: hovering ? 0.9 : 0.5,
          backgroundColor: hovering ? "rgba(94,234,212,0.08)" : "rgba(94,234,212,0)",
        }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        style={{ x: ringX, y: ringY, translateX: "-50%", translateY: "-50%" }}
      />
    </div>
  );
}
