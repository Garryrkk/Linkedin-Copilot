"use client";

import { useMemo } from "react";
import { CommentNode } from "./comment-node";
import type { NormalizedComment } from "@/lib/types";

function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function positionFor(id: string, index: number) {
  const h = hashString(id);
  const col = index % 3;
  const row = Math.floor(index / 3);
  const jitterTop = (h % 14) - 7;
  const jitterLeft = ((h >> 4) % 14) - 7;
  return {
    top: `${row * 230 + 20 + jitterTop}px`,
    left: `${col * 30 + 4 + jitterLeft / 10}%`,
    rotate: ((h % 7) - 3) * 1.1,
  };
}

export function CommentLabCanvas({
  comments,
  selectedId,
  onSelect,
}: {
  comments: NormalizedComment[];
  selectedId: string | null;
  onSelect: (comment: NormalizedComment) => void;
}) {
  const rows = Math.ceil(comments.length / 3);
  const height = Math.max(rows * 230 + 60, 320);

  const positioned = useMemo(
    () => comments.map((comment, i) => ({ comment, position: positionFor(comment.id, i) })),
    [comments]
  );

  return (
    <div className="relative grid-noise-mask" style={{ height }}>
      {positioned.map(({ comment, position }) => (
        <CommentNode
          key={comment.id}
          comment={comment}
          position={position}
          isSelected={comment.id === selectedId}
          onSelect={() => onSelect(comment)}
        />
      ))}
    </div>
  );
}
