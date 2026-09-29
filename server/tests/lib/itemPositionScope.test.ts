import { describe, it, expect } from 'vitest';
import { classifyPositionScope } from '../../src/lib/itemPositionScope.js';

describe('classifyPositionScope', () => {
  it('classifies an attached child with a parent as attached-siblings', () => {
    expect(classifyPositionScope({ isAttached: true, parentId: 'p1', workphaseId: 'w1' }, false)).toBe(
      'attached-siblings',
    );
  });

  it('classifies an attached child as attached-siblings even under a terminal cascade', () => {
    // The attached-siblings branch precedes the terminal check in source
    // order, so an attached child never falls into 'none' just because its
    // (cascaded) workphase turned terminal — its scope stays (parentId,
    // isAttached), per Part 6's "attached children keep their position"
    // exception.
    expect(classifyPositionScope({ isAttached: true, parentId: 'p1', workphaseId: 'w1' }, true)).toBe(
      'attached-siblings',
    );
  });

  it('classifies a null-workphase item as none (unsorted, not currently ordered)', () => {
    expect(classifyPositionScope({ isAttached: false, parentId: null, workphaseId: null }, null)).toBe('none');
  });

  it('classifies a detached/root item in a terminal workphase as none (done, ordered by completedAt)', () => {
    expect(classifyPositionScope({ isAttached: false, parentId: null, workphaseId: 'w1' }, true)).toBe('none');
  });

  it('classifies a detached/root item in a non-terminal workphase as workflow', () => {
    expect(classifyPositionScope({ isAttached: false, parentId: null, workphaseId: 'w1' }, false)).toBe('workflow');
  });

  it('classifies an attached-but-parentless item as workflow, not attached-siblings', () => {
    expect(classifyPositionScope({ isAttached: true, parentId: null, workphaseId: 'w1' }, false)).toBe('workflow');
  });
});
