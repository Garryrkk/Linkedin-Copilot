"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { staggerContainer, fadeUp } from "@/lib/motion/variants";
import { useHistoryQuery } from "@/lib/query/hooks";
import { fromPostDetail } from "@/lib/adapters";
import { getPost } from "@/lib/services";
import { useWorkspaceStore } from "@/lib/store/workspace-store";

export function RecentPostsStream() {
  const { data, isLoading } = useHistoryQuery(0, 6);
  const setActiveResult = useWorkspaceStore((s) => s.setActiveResult);
  const router = useRouter();

  async function open(postId: string) {
    const detail = await getPost(postId);
    setActiveResult(fromPostDetail(detail));
    router.push("/comments");
  }

  return (
    <div>
      <h3 className="font-display mb-4 text-sm tracking-wide text-highlight/80">
        Recent Posts
      </h3>
      {isLoading && <p className="text-sm text-highlight/40">Loading…</p>}
      {!isLoading && data?.posts.length === 0 && (
        <p className="text-sm text-highlight/40">Nothing analyzed yet.</p>
      )}
      <motion.ul initial="hidden" animate="visible" variants={staggerContainer} className="space-y-3">
        {data?.posts.map((post) => (
          <motion.li key={post.id} variants={fadeUp}>
            <button
              onClick={() => open(post.id)}
              className="w-full text-left text-sm transition-colors hover:text-accent-teal"
            >
              <p className="truncate text-highlight/80">
                {post.author_name || "Unknown"}
                <span className="ml-2 text-highlight/40">{post.topic}</span>
              </p>
              {post.top_strategy && (
                <p className="mt-0.5 text-xs text-highlight/40">{post.top_strategy.replace(/_/g, " ")}</p>
              )}
            </button>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}
