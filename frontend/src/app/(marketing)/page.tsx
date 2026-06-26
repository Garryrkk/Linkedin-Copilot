import { Hero } from "@/components/landing/hero";
import { FlowStory } from "@/components/landing/flow-story";
import { StrategyShowcase } from "@/components/landing/strategy-showcase";
import { ClosingCta } from "@/components/landing/closing-cta";

export default function LandingPage() {
  return (
    <main>
      <Hero />
      <FlowStory />
      <StrategyShowcase />
      <ClosingCta />
    </main>
  );
}
