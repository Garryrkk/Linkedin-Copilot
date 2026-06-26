import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  strong?: boolean;
}

export function GlassPanel({ className, strong, ...props }: GlassPanelProps) {
  return (
    <div
      className={cn(
        "glass-panel rounded-2xl",
        strong && "glass-panel-strong",
        className
      )}
      {...props}
    />
  );
}
