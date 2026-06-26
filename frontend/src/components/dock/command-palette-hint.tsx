"use client";

export function CommandPaletteHint() {
  return (
    <button
      onClick={() =>
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "k", metaKey: true })
        )
      }
      className="glass-panel hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs text-highlight/50 transition-colors hover:text-accent-teal sm:flex"
    >
      Search
      <span className="rounded-md border border-white/10 px-1.5 py-0.5 font-mono text-[10px]">
        ⌘K
      </span>
    </button>
  );
}
