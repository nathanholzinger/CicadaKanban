// The project sidebar's width: its default and limits, and the per-browser
// storage of the width a user dragged it to. A working placeholder, tuned by feel.

import { browserStorage, readStored, writeStored, type KeyValueStorage } from '../../lib/browserStorage';

export const SIDEBAR_DEFAULT_WIDTH_PX = 240;
// Narrow enough to be a sliver, wide enough that the handle stays easy to grab.
export const SIDEBAR_MIN_WIDTH_PX = 120;
// Wide enough to show a 30-character name in full at a depth of 10 levels. A name deeper than
// that may be cut off: the sidebar is dragged wider to read it.
export const SIDEBAR_MAX_WIDTH_PX = 420;

export const SIDEBAR_WIDTH_STORAGE_KEY = 'kanban_sidebar_width';

// `px` held inside the limits, to a whole pixel.
export function clampSidebarWidth(px: number): number {
  return Math.min(SIDEBAR_MAX_WIDTH_PX, Math.max(SIDEBAR_MIN_WIDTH_PX, Math.round(px)));
}

// The stored width, clamped, or the default when nothing usable is stored. A
// limit that moved since it was stored pulls the stored width inside it.
export function loadSidebarWidth(storage: KeyValueStorage | null = browserStorage()): number {
  const raw = readStored(storage, SIDEBAR_WIDTH_STORAGE_KEY);
  if (!raw) return SIDEBAR_DEFAULT_WIDTH_PX;
  const stored = Number(raw);
  return Number.isFinite(stored) ? clampSidebarWidth(stored) : SIDEBAR_DEFAULT_WIDTH_PX;
}

// Storage can refuse a write; the width then holds for the session and nothing else.
export function saveSidebarWidth(px: number, storage: KeyValueStorage | null = browserStorage()): void {
  writeStored(storage, SIDEBAR_WIDTH_STORAGE_KEY, String(clampSidebarWidth(px)));
}
