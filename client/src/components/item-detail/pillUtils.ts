import type { CSSProperties } from 'react';
import type { ItemType } from '../../types';

export const PILL = 'inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border';
export const PILL_NEUTRAL = `${PILL} bg-zinc-500/20 text-zinc-300 border-zinc-500/30`;
export const PILL_DEPTH = `${PILL} bg-zinc-500/20 text-zinc-400 border-zinc-500/30`;
export const MINI = 'inline-block text-[9px] font-semibold uppercase tracking-wider px-1 py-0.5 rounded border';
export const MINI_NEUTRAL = `${MINI} bg-zinc-500/20 text-zinc-300 border-zinc-500/30`;
export const MINI_DEPTH = `${MINI} bg-zinc-500/20 text-zinc-400 border-zinc-500/30`;

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
