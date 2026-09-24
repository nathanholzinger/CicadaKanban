// Epic 3.5 Story 3 — the tunable parameters of the board drag gesture
// (docs/wiki/board-drag-interaction §3.1, §7.1, §4). The wiki settles
// these *as parameters* with provisional values; the correct values are
// found by feel, so every one of them is exposed by the dev/test panel and
// persisted in localStorage — a change takes effect on the next drag, no
// rebuild. Tests are written against the configured value (seeded through
// the same storage key), never the literal.
//
// §5's reservation height (Story 4.1 Phase 1) left this file — it's a
// fixed fact about the shortCard component (`KanbanCard.tsx`'s
// `SHORT_CARD_HEIGHT_PX`), not a value found by feel, so there's nothing
// left here to tune by changing a number between two attempts.

export interface DragTuning {
  /** `THRESHOLD` — how long the cursor must stay outside the card's context before the card pops out and follows it. */
  popDelayMs: number;
  /** Optional distance term: pop out as soon as the cursor is this far outside the current context. 0 disables it. */
  popDistancePx: number;
  /** How long a popped-out card's cursor must rest in a column's pop-eligible band before the card pops in and locks there. */
  popInDelayMs: number;
  /**
   * Story 4 (re-plan, 2026-09-16): how long the cursor must rest over one of
   * the locked column's own Cards before the drag zooms into it — a
   * separate, duration-only threshold from `popInDelayMs`, since this one
   * signals a reparent (the layer-change doc's "the big distinguisher is
   * likely to be a context switch that signals reparenting"). No distance
   * term: zooming in is never a fast yank, only zooming out is (Q4).
   */
  cardPopInDelayMs: number;
  /**
   * Story 6, hands-on finding 3 (2026-09-24): how long the drag must hold
   * the *same* named relation (`boardDndUtils.ts::dropAnchorFor` — which
   * neighbor of the ghost the side highlight names, and on which side)
   * before the zoom-in cue even starts showing. A separate, earlier
   * threshold than `cardPopInDelayMs`: that one is now the *cue's* own
   * length (dwell, then cue, then the pop) rather than the whole hold, so
   * an ordinary pause while repositioning — the common case — never shows
   * anything before it's over.
   */
  cardZoomDwellMs: number;
  /**
   * Story 6 Phase D: how long the cursor must rest on a locked Card's own
   * descendants section before the drag zooms into it — its own,
   * duration-only clock (wiki §3.1's fourth clock), no dwell/cue split the
   * way the Column → Card edge got in finding 3: the target here is
   * always the same one section, never a choice between named neighbors,
   * so there's nothing for a dwell to guard against. Decision 6's
   * suggested default: the same value as `cardPopInDelayMs`.
   */
  descendantsPopInDelayMs: number;
  /** How long the card takes to travel from its clamped position to the cursor on a pop. 0 teleports. */
  popSnapMs: number;
  /** §4 overlays: the green "these are yours" ring, and how far a depth-capped target is dimmed. */
  overlayFreeDescendantColor: string;
  overlayDepthCappedOpacity: number;
  /**
   * An outline drawn around whichever region — column, sub-row, or Card —
   * is the pop machine's current `contextKey` (wiki §1.1), so the locked
   * layer is legible without reading the dev panel's text readout. Never
   * drawn at Board layer: nothing is a singular "current region" while
   * genuinely popped out.
   */
  activeContextOutlineColor: string;
}

export const DEFAULT_DRAG_TUNING: DragTuning = {
  popDelayMs: 500,
  popDistancePx: 0,
  popInDelayMs: 500,
  cardPopInDelayMs: 800,
  cardZoomDwellMs: 500,
  descendantsPopInDelayMs: 800,
  popSnapMs: 150,
  overlayFreeDescendantColor: 'rgba(16, 185, 129, 0.6)',
  overlayDepthCappedOpacity: 0.4,
  activeContextOutlineColor: 'rgba(139, 92, 246, 0.8)',
};

export const DRAG_TUNING_STORAGE_KEY = 'kanban_drag_tuning';

// The subset of Storage this module touches — localStorage in the app, a
// plain object in tests.
export interface TuningStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function browserStorage(): TuningStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

// Stored values are a *partial* override merged over the defaults, so a new
// parameter added later picks up its default without anyone clearing
// storage. A value of the wrong type (or a non-finite number) is ignored.
export function loadDragTuning(storage: TuningStorage | null = browserStorage()): DragTuning {
  const raw = storage?.getItem(DRAG_TUNING_STORAGE_KEY);
  if (!raw) return DEFAULT_DRAG_TUNING;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return DEFAULT_DRAG_TUNING;
  }
  if (!parsed || typeof parsed !== 'object') return DEFAULT_DRAG_TUNING;
  const override = parsed as Record<string, unknown>;
  const tuning = { ...DEFAULT_DRAG_TUNING };
  for (const key of Object.keys(DEFAULT_DRAG_TUNING) as (keyof DragTuning)[]) {
    const value = override[key];
    if (typeof value !== typeof DEFAULT_DRAG_TUNING[key]) continue;
    if (typeof value === 'number' && !Number.isFinite(value)) continue;
    (tuning as Record<string, unknown>)[key] = value;
  }
  return tuning;
}

export function saveDragTuning(tuning: DragTuning, storage: TuningStorage | null = browserStorage()): void {
  storage?.setItem(DRAG_TUNING_STORAGE_KEY, JSON.stringify(tuning));
}
