// The project sidebar's width: its default and limits, and the per-browser
// storage of the width a user dragged it to. A working placeholder, tuned by feel.

export const SIDEBAR_DEFAULT_WIDTH_PX = 240;
// Narrow enough to be a sliver, wide enough that the handle stays easy to grab.
export const SIDEBAR_MIN_WIDTH_PX = 120;
// Wide enough to show a 30-character name in full at a depth of 10 levels.
export const SIDEBAR_MAX_WIDTH_PX = 420;

export const SIDEBAR_WIDTH_STORAGE_KEY = 'kanban_sidebar_width';

// The subset of Storage this module touches: localStorage in the app, a plain
// object in tests.
export interface WidthStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function browserStorage(): WidthStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

// `px` held inside the limits, to a whole pixel.
export function clampSidebarWidth(px: number): number {
  return Math.min(SIDEBAR_MAX_WIDTH_PX, Math.max(SIDEBAR_MIN_WIDTH_PX, Math.round(px)));
}

// The stored width, clamped, or the default when nothing usable is stored. A
// limit that moved since it was stored pulls the stored width inside it.
export function loadSidebarWidth(storage: WidthStorage | null = browserStorage()): number {
  let raw: string | null | undefined;
  try {
    raw = storage?.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
  } catch {
    return SIDEBAR_DEFAULT_WIDTH_PX;
  }
  if (!raw) return SIDEBAR_DEFAULT_WIDTH_PX;
  const stored = Number(raw);
  return Number.isFinite(stored) ? clampSidebarWidth(stored) : SIDEBAR_DEFAULT_WIDTH_PX;
}

// Storage can refuse a write (a full quota, blocked site data); the width then
// holds for the session and nothing else.
export function saveSidebarWidth(px: number, storage: WidthStorage | null = browserStorage()): void {
  try {
    storage?.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(clampSidebarWidth(px)));
  } catch {
    // Not stored; see above.
  }
}
