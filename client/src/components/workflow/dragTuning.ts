// The tunable parameters of the board drag gesture, and where they persist
// (wiki board-drag-interaction §3.1). The wiki settles these *as
// parameters* with provisional values; the correct values are found by
// feel, so every one of them is exposed by the dev/test panel and persisted
// in localStorage — a change takes effect on the next drag, no rebuild.
// Tests are written against the configured value (seeded through the same
// storage key), never the literal.
//
// The band reservation's height isn't here: it's a fixed fact about the
// shortCard component (`cardMetrics.ts::SHORT_CARD_HEIGHT_PX`), not a value
// found by feel (wiki board-drag-interaction §5).

export interface DragTuning {
  /** How long the cursor must stay outside the card's context before the card pops out and follows it. */
  popDelayMs: number;
  /** Optional distance term: pop out as soon as the cursor is this far outside the current context. 0 disables it. */
  popDistancePx: number;
  /**
   * How long a popped-out card's cursor must rest in a column/sub-row before
   * the card pops in and locks there. Time anywhere in the region counts;
   * the pop fires only from the middle band.
   */
  popInDelayMs: number;
  /**
   * The zoom-in cue's length: once `cardZoomDwellMs` has passed, how much
   * longer the named relation must hold before the drag zooms into that
   * Card. Separate from `popInDelayMs` because this edge can mean a
   * reparent. No distance term: zooming in is never a fast yank, only
   * zooming out is.
   */
  cardPopInDelayMs: number;
  /**
   * How long the drag must hold the *same* named relation
   * (`dragCollision.ts::dropAnchorFor` — which neighbor of the ghost the
   * side highlight names, and on which side) before the zoom-in cue even
   * starts showing. The cue then runs for `cardPopInDelayMs`, so an
   * ordinary pause while repositioning — the common case — never shows
   * anything before it's over.
   */
  cardZoomDwellMs: number;
  /**
   * How long the cursor must rest on a locked Card's own descendants
   * section before the drag zooms into it — its own, duration-only clock,
   * with no dwell/cue split the way the Column → Card edge has: the target
   * here is always the same one section, never a choice between named
   * neighbors, so there's nothing for a dwell to guard against. Defaults to
   * the same value as `cardPopInDelayMs`.
   */
  descendantsPopInDelayMs: number;
  /** How long the card takes to travel from its clamped position to the cursor on a pop. 0 teleports. */
  popSnapMs: number;
  /** Classification overlays: the green "these are yours" ring, and how far a depth-capped target is dimmed. */
  overlayFreeDescendantColor: string;
  overlayDepthCappedOpacity: number;
  /**
   * An outline drawn around whichever region — column, sub-row, or Card —
   * is the pop machine's current `contextKey`, so the locked layer is
   * legible without reading the dev panel's text readout. Never
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
