import type { CSSProperties } from 'react';
import type { ItemType } from '../../types';

// ─── Pill / badge tokens ──────────────────────────────────────────────────────

export const PILL = 'inline-block text-micro font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border';
export const PILL_NEUTRAL = `${PILL} bg-zinc-500/20 text-zinc-300 border-zinc-500/30`;
export const PILL_DEPTH = `${PILL} bg-zinc-500/20 text-zinc-400 border-zinc-500/30`;
export const MINI = 'inline-block text-2xs font-semibold uppercase tracking-wider px-1 py-0.5 rounded border';
export const MINI_NEUTRAL = `${MINI} bg-zinc-500/20 text-zinc-300 border-zinc-500/30`;
export const MINI_DEPTH = `${MINI} bg-zinc-500/20 text-zinc-400 border-zinc-500/30`;

// ─── Shared UI tokens (repeated across section components) ────────────────────

export const SECTION_LABEL = 'text-[11px] font-semibold uppercase tracking-wider text-zinc-500';
export const INPUT_BASE = 'px-2 py-1 rounded text-xs bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60';
export const BTN_PRIMARY = 'px-3 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-500';
export const BTN_CANCEL = 'px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200';
export const BTN_ADD_TRIGGER = 'text-[11px] text-zinc-500 hover:text-blue-400 transition-colors';
export const EMPTY_STATE = 'text-xs text-zinc-600';

// ─── Pill helpers ─────────────────────────────────────────────────────────────

export function depthLabel(depth: number): string {
  return depth === 0 ? 'TOP' : `SUB${depth}`;
}

export function typePillStyle(typeId: string | null, itemTypes: ItemType[]): CSSProperties | undefined {
  const t = typeId ? itemTypes.find(x => x.id === typeId) : null;
  return t?.color ? { backgroundColor: t.color + '33', borderColor: t.color + '66', color: t.color } : undefined;
}

export function typePillClass(typeId: string | null, itemTypes: ItemType[], mini = false): string {
  const base = mini ? MINI : PILL;
  const neutral = mini ? MINI_NEUTRAL : PILL_NEUTRAL;
  const t = typeId ? itemTypes.find(x => x.id === typeId) : null;
  return t?.color ? base : neutral;
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}
