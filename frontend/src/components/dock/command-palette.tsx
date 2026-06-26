"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import { Orbit, ScanLine, Network, MessageSquareText, FileText } from "lucide-react";
import * as services from "@/lib/services";
import { fromPostDetail } from "@/lib/adapters";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { cn } from "@/lib/utils";

type CommandItem = {
  id: string;
  label: string;
  hint: string;
  icon: typeof Orbit;
  run: () => void | Promise<void>;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const setActiveResult = useWorkspaceStore((s) => s.setActiveResult);

  const { data: history } = useQuery({
    queryKey: ["history", 0, 10],
    queryFn: () => services.getHistory(0, 10),
    enabled: open && Boolean(token),
  });

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setQuery("");
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setQuery("");
  }

  const items = useMemo<CommandItem[]>(() => {
    const navItems: CommandItem[] = [
      { id: "nav-dashboard", label: "Go to Mission Control", hint: "Dashboard", icon: Orbit, run: () => router.push("/dashboard") },
      { id: "nav-analyze", label: "Go to Analyze Post", hint: "Intelligence", icon: ScanLine, run: () => router.push("/analyze") },
      { id: "nav-strategy", label: "Go to Strategy Center", hint: "War room", icon: Network, run: () => router.push("/strategy") },
      { id: "nav-comments", label: "Go to Comment Lab", hint: "Engagement", icon: MessageSquareText, run: () => router.push("/comments") },
    ];
    const postItems: CommandItem[] = (history?.posts ?? []).map((post) => ({
      id: `post-${post.id}`,
      label: `Open: ${post.author_name || post.topic || "Untitled post"}`,
      hint: post.topic || post.source,
      icon: FileText,
      run: async () => {
        const detail = await services.getPost(post.id);
        setActiveResult(fromPostDetail(detail));
        router.push("/comments");
      },
    }));
    return [...navItems, ...postItems];
  }, [router, history, setActiveResult]);

  const filtered = items.filter((item) =>
    `${item.label} ${item.hint}`.toLowerCase().includes(query.toLowerCase())
  );

  function runItem(item: CommandItem) {
    void item.run();
    setOpen(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[200] bg-bg-primary/70 backdrop-blur-sm" />
        <Dialog.Content
          className="glass-panel-strong fixed left-1/2 top-[18%] z-[201] w-[92vw] max-w-lg -translate-x-1/2 rounded-2xl p-2"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && filtered[0]) runItem(filtered[0]);
            }}
            placeholder="Jump to a screen or a past post…"
            className="w-full border-b border-white/10 bg-transparent px-4 py-3 text-sm text-highlight placeholder:text-highlight/30 focus:outline-none"
          />
          <div className="max-h-80 overflow-y-auto p-1.5">
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-highlight/40">No matches</p>
            )}
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => runItem(item)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-highlight/80",
                  "hover:bg-white/[0.05] hover:text-highlight"
                )}
              >
                <item.icon size={15} className="text-accent-teal/80" />
                <span className="flex-1">{item.label}</span>
                <span className="text-xs text-highlight/30">{item.hint}</span>
              </button>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
