import { describe, it, expect, vi } from 'vitest';
import {
  SIDEBAR_DEFAULT_WIDTH_PX,
  SIDEBAR_MAX_WIDTH_PX,
  SIDEBAR_MIN_WIDTH_PX,
  SIDEBAR_WIDTH_STORAGE_KEY,
  clampSidebarWidth,
  loadSidebarWidth,
  saveSidebarWidth,
} from './sidebarWidth';
import { memoryStorage, refusingStorage } from '../../test/storageFixtures';

// A storage holding `stored` under the sidebar's key, or nothing.
const storageHolding = (stored?: string) =>
  memoryStorage(stored === undefined ? {} : { [SIDEBAR_WIDTH_STORAGE_KEY]: stored });

describe('clampSidebarWidth', () => {
  it('holds a width inside the limits', () => {
    expect(clampSidebarWidth(SIDEBAR_MIN_WIDTH_PX - 1)).toBe(SIDEBAR_MIN_WIDTH_PX);
    expect(clampSidebarWidth(-50)).toBe(SIDEBAR_MIN_WIDTH_PX);
    expect(clampSidebarWidth(SIDEBAR_MAX_WIDTH_PX + 1)).toBe(SIDEBAR_MAX_WIDTH_PX);
    expect(clampSidebarWidth(5000)).toBe(SIDEBAR_MAX_WIDTH_PX);
  });

  it('leaves a width on a limit, or between them, alone', () => {
    expect(clampSidebarWidth(SIDEBAR_MIN_WIDTH_PX)).toBe(SIDEBAR_MIN_WIDTH_PX);
    expect(clampSidebarWidth(SIDEBAR_MAX_WIDTH_PX)).toBe(SIDEBAR_MAX_WIDTH_PX);
    expect(clampSidebarWidth(300)).toBe(300);
  });

  it('rounds to a whole pixel', () => {
    expect(clampSidebarWidth(300.4)).toBe(300);
    expect(clampSidebarWidth(300.6)).toBe(301);
  });

  it('starts at a default inside the limits', () => {
    expect(clampSidebarWidth(SIDEBAR_DEFAULT_WIDTH_PX)).toBe(SIDEBAR_DEFAULT_WIDTH_PX);
  });
});

describe('loadSidebarWidth', () => {
  it('is the default when nothing is stored', () => {
    expect(loadSidebarWidth(storageHolding())).toBe(SIDEBAR_DEFAULT_WIDTH_PX);
  });

  it('is the stored width', () => {
    expect(loadSidebarWidth(storageHolding('300'))).toBe(300);
  });

  it('pulls a stored width outside the limits back inside them', () => {
    expect(loadSidebarWidth(storageHolding('10'))).toBe(SIDEBAR_MIN_WIDTH_PX);
    expect(loadSidebarWidth(storageHolding('9999'))).toBe(SIDEBAR_MAX_WIDTH_PX);
  });

  it('is the default for a stored value that is no width', () => {
    expect(loadSidebarWidth(storageHolding(''))).toBe(SIDEBAR_DEFAULT_WIDTH_PX);
    expect(loadSidebarWidth(storageHolding('wide'))).toBe(SIDEBAR_DEFAULT_WIDTH_PX);
    expect(loadSidebarWidth(storageHolding('NaN'))).toBe(SIDEBAR_DEFAULT_WIDTH_PX);
    expect(loadSidebarWidth(storageHolding('Infinity'))).toBe(SIDEBAR_DEFAULT_WIDTH_PX);
  });

  it('is the default when there is no storage, or reading it throws', () => {
    expect(loadSidebarWidth(null)).toBe(SIDEBAR_DEFAULT_WIDTH_PX);
    expect(loadSidebarWidth(refusingStorage)).toBe(SIDEBAR_DEFAULT_WIDTH_PX);
  });
});

describe('saveSidebarWidth', () => {
  it('stores a width that loads back', () => {
    const storage = storageHolding();
    saveSidebarWidth(310, storage);
    expect(loadSidebarWidth(storage)).toBe(310);
  });

  it('stores a clamped, whole-pixel width', () => {
    const setItem = vi.fn();
    saveSidebarWidth(9999, { getItem: () => null, setItem });
    expect(setItem).toHaveBeenCalledWith(SIDEBAR_WIDTH_STORAGE_KEY, String(SIDEBAR_MAX_WIDTH_PX));
    saveSidebarWidth(200.4, { getItem: () => null, setItem });
    expect(setItem).toHaveBeenLastCalledWith(SIDEBAR_WIDTH_STORAGE_KEY, '200');
  });

  it('does nothing without storage, and survives a write that throws', () => {
    expect(() => saveSidebarWidth(300, null)).not.toThrow();
    expect(() => saveSidebarWidth(300, refusingStorage)).not.toThrow();
  });
});
