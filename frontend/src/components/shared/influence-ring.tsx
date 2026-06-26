"use client";

import { motion } from "framer-motion";

interface InfluenceRingProps {
  value: number; // 0-1
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
}

export function InfluenceRing({
  value,
  size = 88,
  stroke = 6,
  color = "var(--accent-teal)",
  label,
}: InfluenceRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(248,250,252,0.08)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="font-display text-lg leading-none">{Math.round(value * 100)}</span>
        {label && <span className="mt-1 text-[10px] uppercase tracking-wider text-highlight/50">{label}</span>}
      </div>
    </div>
  );
}
