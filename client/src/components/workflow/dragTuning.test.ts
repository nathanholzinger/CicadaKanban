import { describe, it, expect } from 'vitest';
import {
  DEFAULT_DRAG_TUNING,
  DRAG_TUNING_STORAGE_KEY,
  loadDragTuning,
  saveDragTuning,
  type TuningStorage,
} from './dragTuning';

function storage(initial: Record<string, string> = {}): TuningStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: key => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
  };
}

describe('loadDragTuning', () => {
  it('returns the defaults with no storage or nothing stored', () => {
    expect(loadDragTuning(null)).toEqual(DEFAULT_DRAG_TUNING);
    expect(loadDragTuning(storage())).toEqual(DEFAULT_DRAG_TUNING);
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

describe('saveDragTuning', () => {
  it('round-trips through storage', () => {
    const s = storage();
    const tuning = { ...DEFAULT_DRAG_TUNING, popDelayMs: 250 };
    saveDragTuning(tuning, s);
    expect(loadDragTuning(s)).toEqual(tuning);
  });
});
