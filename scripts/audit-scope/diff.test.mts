import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseHunks, parseNameStatus, removalSites, touchedLines } from './diff.mts';

describe('parseNameStatus', () => {
  it('reads an addition, a modification, a deletion and a rename, each ended by a NUL', () => {
    const output = ['A', 'new.ts', 'M', 'kept.ts', 'D', 'gone.ts', 'R087', 'old.ts', 'renamed.ts', ''].join('\0');
    assert.deepEqual(parseNameStatus(output), [
      { status: 'A', path: 'new.ts', oldPath: null },
      { status: 'M', path: 'kept.ts', oldPath: null },
      { status: 'D', path: 'gone.ts', oldPath: null },
      { status: 'R', path: 'renamed.ts', oldPath: 'old.ts' },
    ]);
  });

  it('reads a type change as a modification, and an empty diff as no changes', () => {
    assert.deepEqual(parseNameStatus(['T', 'link.ts', ''].join('\0')), [
      { status: 'M', path: 'link.ts', oldPath: null },
    ]);
    assert.deepEqual(parseNameStatus(''), []);
  });
});

describe('parseHunks', () => {
  it('reads the old and new side of each header, and counts a left-out count as 1', () => {
    const diff = [
      'diff --git a/x.ts b/x.ts',
      '@@ -3 +3,2 @@ context',
      '+a',
      '+b',
      '@@ -10,2 +11,0 @@',
      '-c',
      '-d',
    ].join('\n');
    assert.deepEqual(parseHunks(diff), [
      { oldStart: 3, oldCount: 1, newStart: 3, newCount: 2 },
      { oldStart: 10, oldCount: 2, newStart: 11, newCount: 0 },
    ]);
  });
});

describe('removalSites', () => {
  it('takes the hunks that add nothing, at the line just above each', () => {
    const hunks = [
      { oldStart: 3, oldCount: 1, newStart: 3, newCount: 2 },
      { oldStart: 10, oldCount: 2, newStart: 11, newCount: 0 },
      { oldStart: 20, oldCount: 1, newStart: 19, newCount: 0 },
    ];
    assert.deepEqual(removalSites(hunks), [11, 19]);
  });
});

describe('touchedLines', () => {
  it('numbers the removed lines in the old file and the added lines in the new', () => {
    const hunks = [
      { oldStart: 3, oldCount: 2, newStart: 3, newCount: 1 },
      { oldStart: 9, oldCount: 0, newStart: 8, newCount: 2 },
    ];
    assert.deepEqual(touchedLines(hunks), { removed: [3, 4], added: [3, 8, 9] });
  });
});
