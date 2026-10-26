import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MOVE_MIN, settleMoves } from './moves.mts';

// The file's text at the end of the range: line n reads "line n", with the indentation varying.
const text = Array.from({ length: 14 }, (_, i) => `${i % 2 === 0 ? '  ' : ''}line ${i + 1}`);

const sourceHolding =
  (...numbers: number[]) =>
  () => ['other', ...numbers.map(n => `line ${n}`), 'other'];

describe('settleMoves', () => {
  it(`keeps a run of ${MOVE_MIN} or more lines from one source as moved`, () => {
    const result = settleMoves([1], new Map([['src.ts', [5, 6, 7, 8]]]), text, () => null);
    assert.deepEqual(result, { changed: [1], moved: new Map([['src.ts', [5, 6, 7, 8]]]) });
  });

  it('counts fewer than that from one source as changed', () => {
    const result = settleMoves([1], new Map([['src.ts', [5, 6, 7]]]), text, () => null);
    assert.deepEqual(result, { changed: [1, 5, 6, 7], moved: new Map() });
  });

  it('counts the lines of a source that still holds them as changed: a copy is not a move', () => {
    const result = settleMoves([], new Map([['src.ts', [5, 6, 7, 8]]]), text, sourceHolding(5, 6, 7, 8));
    assert.deepEqual(result, { changed: [5, 6, 7, 8], moved: new Map() });
  });

  it('reads the source and the moved lines past their indentation and the spacing inside them', () => {
    const result = settleMoves([], new Map([['src.ts', [1, 2, 3, 4]]]), text, () => [
      'line 1',
      '    line 2',
      'line    3',
      'line 4  ',
    ]);
    assert.deepEqual(result.moved.size, 0);
  });

  it("needs the source's lines in a row, in order", () => {
    const result = settleMoves([], new Map([['src.ts', [5, 6, 7, 8]]]), text, () => [
      'line 5',
      'line 6',
      'gap',
      'line 7',
      'line 8',
    ]);
    assert.deepEqual(result.moved, new Map([['src.ts', [5, 6, 7, 8]]]));
  });

  it('splits a source into runs, so part of it can be a copy and the rest a move', () => {
    const numbers = [3, 4, 5, 6, 9, 10, 11, 12];
    const result = settleMoves([], new Map([['src.ts', numbers]]), text, sourceHolding(3, 4, 5, 6));
    assert.deepEqual(result, { changed: [3, 4, 5, 6], moved: new Map([['src.ts', [9, 10, 11, 12]]]) });
  });

  it("counts what's left of a source as changed once a copy takes it below the minimum", () => {
    const result = settleMoves([], new Map([['src.ts', [3, 4, 5, 6, 9, 10]]]), text, sourceHolding(3, 4, 5, 6));
    assert.deepEqual(result, { changed: [3, 4, 5, 6, 9, 10], moved: new Map() });
  });

  it('keeps each source apart', () => {
    const moved = new Map([
      ['a.ts', [1, 2, 3, 4]],
      ['b.ts', [8, 9]],
    ]);
    const result = settleMoves([], moved, text, () => null);
    assert.deepEqual(result, { changed: [8, 9], moved: new Map([['a.ts', [1, 2, 3, 4]]]) });
  });
});
