import { create } from "zustand";
import type { NormalizedComment, NormalizedResult } from "@/lib/types";

export type SortMode = "score" | "rank";

interface WorkspaceState {
  activeResult: NormalizedResult | null;
  strategyFilter: string | null;
  sortMode: SortMode;

  setActiveResult: (result: NormalizedResult | null) => void;
  updateComment: (comment: NormalizedComment) => void;
  setStrategyFilter: (strategy: string | null) => void;
  setSortMode: (mode: SortMode) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeResult: null,
  strategyFilter: null,
  sortMode: "score",

  setActiveResult: (result) => set({ activeResult: result, strategyFilter: null }),
  updateComment: (comment) =>
    set((state) =>
      state.activeResult
        ? {
            activeResult: {
              ...state.activeResult,
              comments: state.activeResult.comments.map((c) =>
                c.id === comment.id ? comment : c
              ),
            },
          }
        : state
    ),
  setStrategyFilter: (strategy) => set({ strategyFilter: strategy }),
  setSortMode: (mode) => set({ sortMode: mode }),
}));
