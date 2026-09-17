// Epic 3.5 Story 3 — the tunable parameters of the board drag gesture
// (docs/wiki/board-drag-interaction §3.1, §5, §7.1, §4). The wiki settles
// these *as parameters* with provisional values; the correct values are
// found by feel, so every one of them is exposed by the dev/test panel and
// persisted in localStorage — a change takes effect on the next drag, no
// rebuild. Tests are written against the configured value (seeded through
// the same storage key), never the literal.

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
  /** How long the card takes to travel from its clamped position to the cursor on a pop. 0 teleports. */
  popSnapMs: number;
  /**
   * Story 8 re-plan (2026-09-16) — the reserved height of one collapsed
   * ghost card, in pixels. At Board layer this is carved out at the top and
   * bottom of a region's real content (never its visible-scrolled slice) as
   * two half-height dead zones ("Move Top"/"Move Bottom"); the top/bottom
   * band boundary sits a full one of these in from each edge, so it cuts
   * across the middle of the first/last rendered card. A region with
   * exactly one card halves both edges instead (dragRegions.ts::bandFor),
   * so the card itself stays a real, unlabeled middle band rather than
   * being split in two.
   */
  ghostCardHeightPx: number;
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
  popSnapMs: 150,
  ghostCardHeightPx: 96,
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
