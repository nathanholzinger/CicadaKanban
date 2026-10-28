import { describe, it, expect } from 'vitest';
import { DEFAULT_DRAG_TUNING, DRAG_TUNING_STORAGE_KEY, loadDragTuning, saveDragTuning } from './dragTuning';
import { memoryStorage as storage, refusingStorage } from '../../test/storageFixtures';

describe('loadDragTuning', () => {
  it('returns the defaults with no storage or nothing stored', () => {
    expect(loadDragTuning(null)).toEqual(DEFAULT_DRAG_TUNING);
    expect(loadDragTuning(storage())).toEqual(DEFAULT_DRAG_TUNING);
  });

  it('returns the defaults when reading the storage throws', () => {
    expect(loadDragTuning(refusingStorage)).toEqual(DEFAULT_DRAG_TUNING);
  });

  it('merges a partial override over the defaults', () => {
    const s = storage({ [DRAG_TUNING_STORAGE_KEY]: JSON.stringify({ popDelayMs: 120, popSnapMs: 300 }) });
    expect(loadDragTuning(s)).toEqual({ ...DEFAULT_DRAG_TUNING, popDelayMs: 120, popSnapMs: 300 });
  });

  it('ignores malformed JSON, wrong types, non-finite numbers and unknown keys', () => {
    expect(loadDragTuning(storage({ [DRAG_TUNING_STORAGE_KEY]: '{not json' }))).toEqual(DEFAULT_DRAG_TUNING);
    const s = storage({
      [DRAG_TUNING_STORAGE_KEY]: JSON.stringify({
        popDelayMs: '500',
        popDistancePx: Infinity,
        overlayFreeDescendantColor: 12,
        somethingElse: 1,
      }),
    });
    expect(loadDragTuning(s)).toEqual(DEFAULT_DRAG_TUNING);
  });
});

describe('the hierarchy modal hold', () => {
  it('DRAG-1.34: starts at a Card zoom-in’s dwell and cue, and persists a change', () => {
    expect(DEFAULT_DRAG_TUNING.modalHoldDwellMs).toBe(DEFAULT_DRAG_TUNING.cardZoomDwellMs);
    expect(DEFAULT_DRAG_TUNING.modalHoldCueMs).toBe(DEFAULT_DRAG_TUNING.cardPopInDelayMs);
    const s = storage();
    saveDragTuning({ ...DEFAULT_DRAG_TUNING, modalHoldDwellMs: 250, modalHoldCueMs: 400 }, s);
    expect(loadDragTuning(s)).toMatchObject({ modalHoldDwellMs: 250, modalHoldCueMs: 400 });
  });
});

describe('saveDragTuning', () => {
  it('round-trips through storage', () => {
    const s = storage();
    const tuning = { ...DEFAULT_DRAG_TUNING, popDelayMs: 250 };
    saveDragTuning(tuning, s);
    expect(loadDragTuning(s)).toEqual(tuning);
  });

  // The panel's `onChange` calls it unguarded, so a throw would escape into a React handler.
  it('does nothing without storage, and survives a write that throws', () => {
    const tuning = { ...DEFAULT_DRAG_TUNING, popDelayMs: 250 };
    expect(() => saveDragTuning(tuning, null)).not.toThrow();
    expect(() => saveDragTuning(tuning, refusingStorage)).not.toThrow();
  });
});
