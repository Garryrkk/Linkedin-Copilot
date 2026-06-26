"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { CommentScores } from "@/lib/types";

const AXES: { key: keyof Omit<CommentScores, "total">; label: string }[] = [
  { key: "adds_information", label: "Adds info" },
  { key: "originality", label: "Originality" },
  { key: "depth", label: "Depth" },
  { key: "founder_voice", label: "Founder voice" },
  { key: "screenshot_worthy", label: "Screenshot-worthy" },
];

export function QualityRadar({ scores }: { scores: CommentScores }) {
  const data = AXES.map(({ key, label }) => ({ axis: label, value: scores[key] }));

  return (
    <div>
      <h3 className="font-display mb-2 text-sm text-highlight/70">Quality breakdown</h3>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="75%">
            <PolarGrid stroke="rgba(248,250,252,0.1)" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: "rgba(248,250,252,0.55)", fontSize: 11 }}
            />
            <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
            <Radar
              dataKey="value"
              stroke="#5eead4"
              fill="#5eead4"
              fillOpacity={0.32}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
