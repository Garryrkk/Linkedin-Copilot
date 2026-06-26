"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Link2, Type, ImageIcon, FileText } from "lucide-react";
import { GlassPanel } from "@/components/shared/glass-panel";
import { MagneticButton } from "@/components/shared/magnetic-button";
import { useHistoryQuery } from "@/lib/query/hooks";
import type { AnalyzeInput } from "@/lib/query/hooks";
import { cn } from "@/lib/utils";

const schema = z.object({
  input: z.string().min(1, "Paste a URL or post text to continue"),
});
type FormValues = z.infer<typeof schema>;

const MODES = [
  { key: "url", label: "URL", icon: Link2 },
  { key: "text", label: "Paste text", icon: Type },
  { key: "screenshot", label: "Screenshot", icon: ImageIcon },
  { key: "pdf", label: "PDF", icon: FileText },
] as const;

export function PostIntakePanel({
  onRun,
  onOpenHistoryPost,
  isPending,
}: {
  onRun: (input: AnalyzeInput) => void;
  onOpenHistoryPost: (postId: string) => void;
  isPending: boolean;
}) {
  const [mode, setMode] = useState<(typeof MODES)[number]["key"]>("url");
  const [file, setFile] = useState<File | null>(null);
  const { data: history, isLoading: historyLoading } = useHistoryQuery(0, 8);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  function handleTextSubmit(values: FormValues) {
    if (mode === "url") onRun({ mode: "url", url: values.input });
    if (mode === "text") onRun({ mode: "text", text: values.input });
  }

  function handleFileSubmit() {
    if (!file) return;
    if (mode === "screenshot") onRun({ mode: "screenshot", file });
    if (mode === "pdf") onRun({ mode: "pdf", file });
  }

  const isFileMode = mode === "screenshot" || mode === "pdf";

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <GlassPanel strong className="p-8">
        <div className="mb-6 flex flex-wrap gap-2">
          {MODES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setMode(key);
                setFile(null);
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs transition-colors",
                mode === key
                  ? "border-accent-teal/50 bg-accent-teal/10 text-accent-teal"
                  : "border-white/10 text-highlight/50 hover:text-highlight/80"
              )}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {isFileMode ? (
          <div className="space-y-4">
            <label className="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 text-sm text-highlight/50 hover:border-accent-teal/40">
              {mode === "screenshot" ? <ImageIcon size={22} /> : <FileText size={22} />}
              {file?.name ?? `Drop a ${mode === "screenshot" ? "screenshot" : "PDF"} or click to upload`}
              <input
                type="file"
                accept={mode === "screenshot" ? "image/png,image/jpeg,image/webp" : "application/pdf"}
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <MagneticButton
              type="button"
              disabled={isPending || !file}
              onClick={handleFileSubmit}
              className="w-full"
            >
              {isPending ? "Running intelligence…" : "Run Intelligence"}
            </MagneticButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit(handleTextSubmit)} className="space-y-4">
            <textarea
              {...register("input")}
              placeholder={
                mode === "url"
                  ? "https://linkedin.com/posts/..."
                  : "Paste the full post text here..."
              }
              className="h-40 w-full resize-none rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-highlight placeholder:text-highlight/30 focus:border-accent-teal/40 focus:outline-none"
            />
            {errors.input && (
              <p className="text-xs text-warning">{errors.input.message}</p>
            )}
            <MagneticButton type="submit" disabled={isPending} className="w-full">
              {isPending ? "Running intelligence…" : "Run Intelligence"}
            </MagneticButton>
          </form>
        )}
      </GlassPanel>

      <GlassPanel className="p-6">
        <h3 className="font-display mb-4 text-sm text-highlight/70">
          Recent posts
        </h3>
        {historyLoading && (
          <p className="text-sm text-highlight/40">Loading history…</p>
        )}
        {!historyLoading && history?.posts.length === 0 && (
          <p className="text-sm text-highlight/40">
            Nothing analyzed yet — run your first post.
          </p>
        )}
        <div className="space-y-3">
          {history?.posts.map((post) => (
            <motion.button
              key={post.id}
              type="button"
              whileHover={{ x: 4 }}
              onClick={() => onOpenHistoryPost(post.id)}
              className="flex w-full items-start gap-3 rounded-xl border border-white/5 p-3 text-left transition-colors hover:border-accent-teal/30 hover:bg-white/[0.02]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-highlight/90">
                  {post.author_name || "Unknown author"}
                  <span className="ml-1 text-highlight/40">{post.source}</span>
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-highlight/50">
                  {post.post_preview || post.topic}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}
