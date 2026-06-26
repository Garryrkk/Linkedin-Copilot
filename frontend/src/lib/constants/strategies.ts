import type { EngagementStrategy } from "@/lib/types";

/**
 * Static reference copy mirrored verbatim from the STRATEGIES dict in
 * Backend/agents/agent3_strategy.py — this is the engine's own
 * documentation of what each strategy means, not per-post data. Per-post,
 * only ONE of these is ever selected (state.selected_strategy).
 */
export const STRATEGY_REFERENCE: Record<
  EngagementStrategy,
  { name: string; description: string; bestFor: string[] }
> = {
  reality_compression: {
    name: "Reality Compression",
    description:
      "Compress a complex reality into a single, sharper, more accurate truth. Strip the fluff and surface the essential.",
    bestFor: ["inspirational posts", "big claims", "oversimplifications"],
  },
  hidden_layer: {
    name: "Hidden Layer",
    description:
      "Reveal what's actually happening beneath the surface claim. The interesting thing isn't what they said — it's what's underneath.",
    bestFor: ["business advice", "leadership posts", "strategy posts"],
  },
  pattern_recognition: {
    name: "Pattern Recognition",
    description:
      "Connect this specific post to a broader pattern you've observed. 'Every time X, I notice Y.'",
    bestFor: ["trend posts", "observation posts", "comparison posts"],
  },
  second_order: {
    name: "Second Order Thinking",
    description:
      "Reveal downstream consequences the post didn't consider. What happens after the obvious first effect?",
    bestFor: ["advice posts", "how-to posts", "prediction posts"],
  },
  bottleneck_reversal: {
    name: "Bottleneck Reversal",
    description:
      "Flip the problem to find the real constraint. The stated problem is rarely the actual bottleneck.",
    bestFor: ["problem-solution posts", "productivity posts", "startup advice"],
  },
  constructive_contrarian: {
    name: "Constructive Contrarian",
    description:
      "Respectful pushback with evidence or a different frame. Not just disagreement — a better model.",
    bestFor: ["strong consensus posts", "hot take posts", "viral opinion posts"],
  },
  agreement_extension: {
    name: "Agreement + Extension",
    description:
      "Agree with the core claim, then add a layer, a nuance, or a related insight they missed.",
    bestFor: ["good insight posts", "posts with a solid but incomplete point"],
  },
};

export const STRATEGY_ORDER: EngagementStrategy[] = [
  "hidden_layer",
  "reality_compression",
  "pattern_recognition",
  "second_order",
  "bottleneck_reversal",
  "constructive_contrarian",
  "agreement_extension",
];

// Literal hex values (not CSS var() references) — these get passed
// directly into Three.js material colors in some places (e.g.
// strategy-constellation.tsx), and Three.js's color parser doesn't
// resolve CSS custom properties, only literal hex/rgb/named colors.
const STRATEGY_COLORS: Record<EngagementStrategy, string> = {
  hidden_layer: "#5eead4", // --accent-teal
  reality_compression: "#f59e0b", // --warning
  pattern_recognition: "#3b82f6", // --accent-blue
  second_order: "#7c3aed", // --accent-violet
  bottleneck_reversal: "#f472b6",
  constructive_contrarian: "#fb7185",
  agreement_extension: "#a3e635",
};

export function colorForStrategy(strategy: string): string {
  return STRATEGY_COLORS[strategy as EngagementStrategy] ?? "#f8fafc";
}

export function nameForStrategy(strategy: string): string {
  return STRATEGY_REFERENCE[strategy as EngagementStrategy]?.name ?? strategy;
}
