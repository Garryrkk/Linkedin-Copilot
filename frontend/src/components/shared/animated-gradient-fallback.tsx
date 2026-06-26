import { cn } from "@/lib/utils";

export function AnimatedGradientFallback({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-animated-gradient rounded-[2.5rem] blur-2xl opacity-70",
        className
      )}
      aria-hidden
    />
  );
}
