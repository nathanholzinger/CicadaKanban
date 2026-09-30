import type { ReactNode } from 'react';

// Shared badge chrome for board column headers (BoardColumn, UnsortedBucket):
// the item-count pill and the amber attention pill. `AttentionBadge` covers
// two distinct meanings (a single column's `broken` range vs. a board-wide
// `needsAttention`) that share only their look, so it takes the label/tooltip
// as props rather than hardcoding either one.

export const COUNT_BADGE = 'text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded-full shrink-0';

interface AttentionBadgeProps {
  title: string;
  children: ReactNode;
}

export function AttentionBadge({ title, children }: AttentionBadgeProps) {
  return (
    <span className="shrink-0 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400" title={title}>
      {children}
    </span>
  );
}
