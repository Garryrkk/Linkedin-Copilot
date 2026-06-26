import type { Variants } from "framer-motion";

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

export const panelMorph: Variants = {
  collapsed: { opacity: 0, scale: 0.92, y: 16 },
  expanded: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
};

export const wordReveal: Variants = {
  hidden: { opacity: 0, y: "100%" },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

export const floatCard: Variants = {
  rest: { y: 0, rotate: 0 },
  hover: { y: -6, transition: { duration: 0.3, ease: "easeOut" } },
};
