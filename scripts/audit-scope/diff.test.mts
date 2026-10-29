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
    path = 'x.ts',
  ): number[] => removalSites(hunks, { path, oldLines, newLines, changed: new Set(changed) });

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
    assert.deepEqual(sitesOf([hunk(2, 1, 2, 2)], ['keep', 'placeholder();'], ['keep', 'moved(a);', 'moved(b);']), [1]);
  });

  it('leaves out a hunk that adds a changed line, which a scope lists', () => {
    const oldLines = ['keep', 'if (!ok) {', '  run();', '}'];
    assert.deepEqual(sitesOf([hunk(2, 3, 2, 1)], oldLines, ['keep', 'run(2);'], [2]), []);
  });

  it('leaves out a hunk that only reformats its lines: quotes, a wrapped call, a trailing comma', () => {
    assert.deepEqual(sitesOf([hunk(1, 1, 1, 1)], ['const label = "text";'], ["const label = 'text';"]), []);
    assert.deepEqual(sitesOf([hunk(1, 1, 1, 4)], ['foo(a, b);'], ['foo(', '  a,', '  b,', ');']), []);
  });

  it('takes a hunk that changes the text inside a string, a template or a regular expression', () => {
    const sitesOfLine = (before: string, after: string): number[] => sitesOf([hunk(1, 1, 1, 1)], [before], [after]);
    // A split on a space becomes a split into characters: a space in a string is its value.
    assert.deepEqual(sitesOfLine("const words = s.split(' ');", "const words = s.split('');"), [0]);
    assert.deepEqual(sitesOfLine("const isSpace = x === ' ';", "const isSpace = x === '';"), [0]);
    assert.deepEqual(sitesOfLine("const list = items.join(', ');", "const list = items.join(',');"), [0]);
    assert.deepEqual(sitesOfLine('const text = `a b`;', 'const text = `ab`;'), [0]);
    assert.deepEqual(sitesOfLine('const text = `a ${x} b`;', 'const text = `a ${x}b`;'), [0]);
    assert.deepEqual(sitesOfLine('const words = /a b/;', 'const words = /ab/;'), [0]);
    // The parentheses and commas a formatter moves are text inside a regular expression: dropping the
    // group changes what it captures.
    assert.deepEqual(sitesOfLine('const pair = /(a|b)/;', 'const pair = /a|b/;'), [0]);
    assert.deepEqual(sitesOfLine('const pair = /a,b/;', 'const pair = /ab/;'), [0]);
    assert.deepEqual(sitesOfLine("const clean = s.replace(/a b/g, '');", "const clean = s.replace(/ab/g, '');"), [0]);
  });

  // A line inside a template literal is its value, but alone it reads as words: the hunk's lines
  // don't carry the backtick that opened it. The whole file says which lines are inside one.
  describe('a change inside a template literal that spans lines', () => {
    const template = (middle: string): string[] => ['export const text = `', middle, '`;'];

    it('takes a hunk that changes a middle line, though its words are the same', () => {
      assert.deepEqual(sitesOf([hunk(2, 1, 2, 1)], template('a b'), template('a  b')), [1]);
      // The parentheses and commas a formatter moves are the value here too.
      assert.deepEqual(sitesOf([hunk(2, 1, 2, 1)], template('a, (b)'), template('a (b),')), [1]);
    });

    it('takes a hunk that changes the text between substitutions', () => {
      const text = (middle: string): string[] => ['const s = `a ${x}', middle, 'e`;'];
      assert.deepEqual(sitesOf([hunk(2, 1, 2, 1)], text('b c ${y} d'), text('b  c ${y} d')), [1]);
      assert.deepEqual(sitesOf([hunk(2, 1, 2, 1)], text('b c ${y} d'), text('b c ${y}  d')), [1]);
    });

    it('takes a hunk that changes the text after a substitution that closes on a line of its own', () => {
      const text = (tail: string): string[] => ['const s = `a ${', '  x', tail, 'more`;'];
      assert.deepEqual(sitesOf([hunk(3, 1, 3, 1)], text('} text'), text('}  text')), [2]);
    });

    it('takes a hunk that removes a blank line from inside it, which is part of the value', () => {
      const old = ['export const text = `', 'a', '', 'b', '`;'];
      assert.deepEqual(sitesOf([hunk(3, 1, 2, 0)], old, ['export const text = `', 'a', 'b', '`;']), [2]);
    });

    it('takes a hunk that adds a line inside it in place of one removed', () => {
      assert.deepEqual(sitesOf([hunk(2, 1, 2, 2)], template('a b'), ['export const text = `', 'a', 'b', '`;']), [1]);
    });

    it('leaves a hunk beside it, outside it, as formatting', () => {
      const file = (label: string): string[] => [label, 'export const text = `', 'a b', '`;'];
      assert.deepEqual(sitesOf([hunk(1, 1, 1, 1)], file('const label = "text";'), file("const label = 'text';")), []);
      // The line it opens on is read with its backtick, so spacing before the backtick is only spacing.
      assert.deepEqual(sitesOf([hunk(1, 1, 1, 1)], template('a b'), ['export const text =  `', 'a b', '`;']), []);
    });

    it('still reads the code beside a template on one line as code', () => {
      const file = (call: string): string[] => ['const t = `a b`;', call];
      assert.deepEqual(sitesOf([hunk(2, 1, 2, 1)], file('foo(a, b);'), file('foo(a, b)')), []);
    });
  });

  it('leaves out a hunk that only swaps the quotes of a string with spaces, commas and parentheses in it', () => {
    assert.deepEqual(sitesOf([hunk(1, 1, 1, 1)], ['const s = "a, (b); c";'], ["const s = 'a, (b); c';"]), []);
  });

  it('reads a slash after a value as a division, so spacing around it is formatting', () => {
    assert.deepEqual(
      sitesOf([hunk(1, 1, 1, 1)], ['const half = total / 2 / count;'], ['const half = total/2/count;']),
      [],
    );
    assert.deepEqual(sitesOf([hunk(1, 1, 1, 1)], ['const mean = (a + b) / 2;'], ['const mean = (a + b)/2;']), []);
  });

  it('folds the whitespace, quotes and punctuation of a file it does not read as code, as it always has', () => {
    assert.deepEqual(sitesOf([hunk(1, 1, 1, 2)], ['one "two" three'], ['one two', 'three'], [], 'notes.md'), []);
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
