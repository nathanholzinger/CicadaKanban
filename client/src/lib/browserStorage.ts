// The browser's localStorage, guarded, for what persists per viewer: the sidebar's width
// (`components/sidebar/sidebarWidth.ts`), the drag tuning (`components/workflow/dragTuning.ts`),
// the active project (`App.tsx`) and each workflow's active board
// (`components/workflow/useBoardManagement.ts`). Storage can be missing, throw as it is reached
// (blocked site data) or refuse a write (a full quota), and none of that may break the page: a
// value then holds for the session and nothing else.

// The subset of Storage the app touches: localStorage in the app, a plain object in tests
// (`test/storageFixtures.ts`).
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

// The browser's localStorage, or null where there is none or reaching it throws.
export function browserStorage(): KeyValueStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

// The value stored under `key`, or null when nothing is, there is no storage, or the read throws.
export function readStored(storage: KeyValueStorage | null, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

// Stores `value` under `key`. A write storage refuses is dropped.
export function writeStored(storage: KeyValueStorage | null, key: string, value: string): void {
  try {
    storage?.setItem(key, value);
  } catch {
    // Not stored; see the header.
  }
}

// Removes the value stored under `key`. A remove storage refuses is dropped.
export function removeStored(storage: KeyValueStorage | null, key: string): void {
  try {
    storage?.removeItem(key);
  } catch {
    // Not removed; see the header.
  }
}
