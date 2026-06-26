"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { useHistoryQuery } from "@/lib/query/hooks";
import { nameForStrategy, colorForStrategy } from "@/lib/constants/strategies";

export function StrategyDistributionChart() {
  const { data, isLoading } = useHistoryQuery(0, 50);

  const chartData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of data?.posts ?? []) {
      if (!post.top_strategy) continue;
      counts.set(post.top_strategy, (counts.get(post.top_strategy) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([strategy, count]) => ({ strategy, name: nameForStrategy(strategy), count }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  return (
    <div className="h-full">
      <h3 className="font-display mb-4 text-sm tracking-wide text-highlight/80">
        Strategy Distribution
      </h3>
      {isLoading ? (
        <p className="text-sm text-highlight/40">Loading…</p>
      ) : chartData.length === 0 ? (
        <p className="text-sm text-highlight/40">Analyze a few posts to see this fill in.</p>
      ) : (
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 12 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                tick={{ fill: "rgba(248,250,252,0.55)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#131a2e",
                  border: "1px solid rgba(248,250,252,0.1)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.strategy} fill={colorForStrategy(entry.strategy)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
