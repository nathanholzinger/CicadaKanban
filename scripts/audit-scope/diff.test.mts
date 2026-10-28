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
  const hunk = (oldStart: number, oldCount: number, newStart: number, newCount: number) => ({
    oldStart,
    oldCount,
    newStart,
    newCount,
  });
  const sitesOf = (
    hunks: ReturnType<typeof hunk>[],
    oldLines: string[],
    newLines: string[],
    changed: number[] = [],
  ): number[] => removalSites(hunks, { oldLines, newLines, changed: new Set(changed) });

  it('takes a hunk that removes code and adds nothing, at the line just above the removal', () => {
    const oldLines = ['keep', 'if (x) {', '  drop();', '}', 'keep'];
    assert.deepEqual(sitesOf([hunk(2, 3, 1, 0)], oldLines, ['keep', 'keep']), [1]);
  });

  it('leaves out a hunk that removes only blank lines', () => {
    assert.deepEqual(sitesOf([hunk(2, 1, 1, 0)], ['a', '', 'b'], ['a', 'b']), []);
  });

  it('leaves out a hunk that adds without removing', () => {
    assert.deepEqual(sitesOf([hunk(1, 0, 2, 2)], ['a'], ['a', 'b', 'c']), []);
  });

  it('takes a hunk whose added lines are all unchanged, since nothing was written in the removed lines’ place', () => {
    // A guard unwrapped: `run();` is the same line a level out, which blame, ignoring indent, puts before the base.
    const oldLines = ['keep', 'if (!ok) {', '  run();', '}'];
    assert.deepEqual(sitesOf([hunk(2, 3, 2, 1)], oldLines, ['keep', 'run();']), [1]);
    // Moved-in code takes a removed line's place just the same.
    assert.deepEqual(sitesOf([hunk(2, 1, 2, 3)], ['keep', 'placeholder();'], ['keep', 'moved(a);', 'moved(b);']), [1]);
  });

  it('leaves out a hunk that adds a changed line, which a scope lists', () => {
    const oldLines = ['keep', 'if (!ok) {', '  run();', '}'];
    assert.deepEqual(sitesOf([hunk(2, 3, 2, 1)], oldLines, ['keep', 'run(2);'], [2]), []);
  });

  it('leaves out a hunk that only reformats its lines: quotes, a wrapped call, a trailing comma', () => {
    assert.deepEqual(sitesOf([hunk(1, 1, 1, 1)], ['const label = "text";'], ["const label = 'text';"]), []);
    assert.deepEqual(sitesOf([hunk(1, 1, 1, 4)], ['foo(a, b);'], ['foo(', '  a,', '  b,', ');']), []);
  });

  it('takes a hunk that removes a guard beside a line that was only reformatted', () => {
    const oldLines = ['const label = "text";', 'if (!flag) {', '  return label;', '}'];
    assert.deepEqual(sitesOf([hunk(1, 4, 1, 1)], oldLines, ["const label = 'text';"]), [0]);
  });

  it('takes one site per hunk, in order', () => {
    const oldLines = ['a', 'b', 'c', 'd', 'e', 'f'];
    const newLines = ['a', 'c', 'e'];
    assert.deepEqual(sitesOf([hunk(2, 1, 1, 0), hunk(4, 1, 2, 0), hunk(6, 1, 3, 0)], oldLines, newLines), [1, 2, 3]);
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
