import { describe, it, expect } from 'vitest';
import { DEFAULT_DRAG_TUNING, DRAG_TUNING_STORAGE_KEY, loadDragTuning } from './dragTuning';
import { memoryStorage } from '../../test/storageFixtures';

describe('loadDragTuning', () => {
  const load = (raw: string) => loadDragTuning(memoryStorage({ [DRAG_TUNING_STORAGE_KEY]: raw }));

  // A browser can hold a key a previous build wrote, such as `descendantsPopInDelayMs`; the
  // stored object is read key by key against the defaults, so it never reaches the tuning.
  it('ignores a stored value for a key the tuning does not have, and keeps the rest', () => {
    const tuning = load(JSON.stringify({ descendantsPopInDelayMs: 123, popDelayMs: 777 }));

    expect(tuning).toEqual({ ...DEFAULT_DRAG_TUNING, popDelayMs: 777 });
    expect(tuning).not.toHaveProperty('descendantsPopInDelayMs');
  });

  it('ignores a stored value of the wrong type, or a number that is not finite', () => {
    // `1e999` reads back as Infinity, which JSON.stringify could not have written.
    expect(load('{"popDelayMs":"soon","popInDelayMs":null,"cardPopInDelayMs":1e999}')).toEqual(DEFAULT_DRAG_TUNING);
  });

  // The carried branch's switch is off until it is turned on, so a tuning stored before it existed, and
  // a drag spec that seeds the tuning, both get today's drag.
  it('keeps a carried Stub’s branch drawn where it is, unless the stored tuning turns the switch on', () => {
    expect(DEFAULT_DRAG_TUNING.collapseCarriedBranch).toBe(false);
    expect(load(JSON.stringify({ popDelayMs: 777 })).collapseCarriedBranch).toBe(false);
    expect(load('{"collapseCarriedBranch":"yes"}').collapseCarriedBranch).toBe(false);
    expect(load('{"collapseCarriedBranch":true}').collapseCarriedBranch).toBe(true);
  });
});
