"use client";

import { useState } from "react";
import Link from "next/link";
import { TextReveal } from "@/components/shared/text-reveal";
import { MagneticButton } from "@/components/shared/magnetic-button";
import { StrategyConstellationScene } from "@/components/three/strategy-constellation";
import { StrategyModuleCard } from "@/components/strategy/strategy-module-card";
import { STRATEGY_ORDER, STRATEGY_REFERENCE, colorForStrategy } from "@/lib/constants/strategies";
import { useWorkspaceStore } from "@/lib/store/workspace-store";

export default function StrategyPage() {
  const activeResult = useWorkspaceStore((s) => s.activeResult);
  const [selectedKey, setSelectedKey] = useState<string | null>(
    activeResult?.selectedStrategy || null
  );

  const nodes = STRATEGY_ORDER.map((key) => ({
    key,
    name: STRATEGY_REFERENCE[key].name,
    color: colorForStrategy(key),
  }));

  if (!activeResult) {
    return (
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-highlight/40">Strategy center</p>
        <h1 className="font-display mt-2 text-4xl sm:text-5xl">
          <TextReveal text="No post in the room yet." />
        </h1>
        <p className="mt-4 max-w-md text-sm text-highlight/50">
          Analyze a post first — the engine picks one strategy per post and shows its reasoning here.
        </p>
        <Link href="/analyze" className="mt-6 inline-block">
          <MagneticButton>Analyze a post</MagneticButton>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-highlight/40">Strategy center</p>
        <h1 className="font-display mt-2 text-4xl sm:text-5xl">
          <TextReveal text="The war room." />
        </h1>
        <p className="mt-2 max-w-lg text-sm text-highlight/50">
          Analyzing <span className="text-highlight/80">{activeResult.authorName || "this post"}</span>.
          The teal node is what the engine actually picked — drag to orbit, click any node for its definition.
        </p>
      </div>

      <div className="relative mx-auto mb-10 h-[420px] max-w-4xl">
        <StrategyConstellationScene
          nodes={nodes}
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
        />
      </div>

      <StrategyModuleCard
        strategyKey={selectedKey}
        isSelectedByEngine={selectedKey === activeResult.selectedStrategy}
        confidence={activeResult.strategyConfidence}
        reasoning={activeResult.strategyReasoning}
      />
    </div>
  );
}
