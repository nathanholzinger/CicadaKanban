// Shared Tailwind class-string constants (buttons, inputs, pills) for item-detail sections.

import type { CSSProperties, KeyboardEvent } from 'react';
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
export const INPUT_BASE =
  'px-2 py-1 rounded text-xs bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60';
export const SELECT_BASE =
  'rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 focus:outline-none';
// Larger board-form variants (text-sm, rounded-lg) used by the board toolbar,
// column editor, and workphase manager. Prefix with `w-full ` where needed.
export const INPUT_LG =
  'px-3 py-1.5 rounded-lg text-sm bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60';
export const SELECT_SM =
  'px-2 py-0.5 rounded text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 focus:outline-none focus:border-blue-500/60';
// Select counterpart to INPUT_LG (same text-sm/py-1.5 board-form sizing),
// with select's own narrower px-2 horizontal padding matching SELECT_BASE/
// SELECT_SM's existing convention. Was independently re-typed with a
// slightly divergent rounded/placeholder-color combo in AgentsModal before
// being reconciled to this (INPUT_LG's own values). Prefix with `w-full `
// where needed, same as INPUT_LG.
export const SELECT_LG =
  'rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-300 focus:border-blue-500/60 focus:outline-none';
export const BTN_PRIMARY = 'px-3 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-500';
export const BTN_CANCEL = 'px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200';
export const BTN_ADD_TRIGGER = 'text-[11px] text-zinc-500 hover:text-blue-400 transition-colors';
export const EMPTY_STATE = 'text-xs text-zinc-600';
// Modal footer's Cancel/primary-submit pair (px-4 py-2 text-sm rounded-lg) —
// a distinct, larger scale from BTN_PRIMARY/BTN_CANCEL above, which are sized
// for compact inline item-detail-section forms. Was independently re-typed
// identically 3× (cancel) and 2× (primary) across SetupWorkflowModal,
// CreateProjectModal, and ColumnEditorModal (audit finding #10).
export const BTN_MODAL_CANCEL =
  'rounded-lg px-4 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200';
export const BTN_MODAL_PRIMARY =
  'rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50';
// A form field's label (as opposed to SECTION_LABEL, which titles a whole
// item-detail section like "Children" or "Parent") — same visual weight as
// SECTION_LABEL but a separate token since the two label different things
// and shouldn't be coupled. Standardized on AgentsModal's variant (also
// SECTION_LABEL's tracking/color) over ColumnEditorModal's silently-diverged
// tracking-widest/zinc-600 copy (audit finding #10).
export const FIELD_LABEL = 'mb-1 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500';
// Same visual family as INPUT_LG but for a modal/section-form text input
// (px-3 py-2, with a subtle focus ring) — was independently re-typed with
// three different ring/border-opacity combinations across ChildrenSection,
// BoardColumn, and CreateProjectModal (audit finding #10) before being
// reconciled to one here (CreateProjectModal's values, the majority of the
// three). Prefix with `w-full ` where needed, same as INPUT_LG.
export const INPUT_LG_RING =
  'rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 focus:outline-none';

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

// "Escape resets the draft and closes the add-form" was hand-rolled
// identically (different state setters, same shape) across every
// item-detail add-form's title/name input (audit Finding #28). `onCancel`
// is always the same function the form's own Cancel button calls, so
// Escape and Cancel end up doing exactly the same thing by construction.
export function escapeToCancel(onCancel: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === 'Escape') onCancel();
  };
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
