import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseScript, testDeclarations } from '../check-docs/extract.mts';
import { carriersByCase, countTests, leadingIds, type TestFile } from './carriers.mts';

const lines = (...parts: string[]): string => parts.join('\n');
const file = (path: string, text: string): TestFile => ({
  path,
  declarations: testDeclarations(parseScript(path, text)),
});
const carried = (files: TestFile[], id: string): { running: string[]; skipped: string[] } => {
  const found = carriersByCase(files).get(id);
  return { running: [...(found?.running ?? [])], skipped: [...(found?.skipped ?? [])] };
};

describe('leadingIds', () => {
  it('reads a list of IDs, under any prefix, that ends in a colon', () => {
    assert.deepEqual(leadingIds('X-1.2: a title'), ['X-1.2']);
    assert.deepEqual(leadingIds('X-1.2, Y-5a.10 ,TC-3.1: a title'), ['X-1.2', 'Y-5a.10', 'TC-3.1']);
    assert.deepEqual(leadingIds('Z-X.4: a cross-cutting case'), ['Z-X.4']);
  });

  it('reads nothing from an ID that is not at the start, or has no colon after the list', () => {
    assert.deepEqual(leadingIds('delegates to X-1.2: a title'), []);
    assert.deepEqual(leadingIds('X-1.2 a title'), []);
    assert.deepEqual(leadingIds('X-1.2 and X-1.3: a title'), []);
    assert.deepEqual(leadingIds('a title'), []);
  });
});

describe('carriersByCase', () => {
  it('has a running test carry the IDs its title opens with', () => {
    const files = [file('a.test.ts', lines("it('X-1.1, X-1.2: both', () => {});", "it('X-1.2: one', () => {});"))];
    assert.deepEqual(carried(files, 'X-1.1'), { running: ['a.test.ts'], skipped: [] });
    assert.deepEqual(carried(files, 'X-1.2'), { running: ['a.test.ts'], skipped: [] });
  });

  it('never counts a skipped test as covering a case, and lists its file as a skipped carrier', () => {
    const files = [
      file('skipped.spec.ts', "test.skip('X-1.1: not run', async () => {});"),
      file('other.spec.ts', "test('X-1.1: run', async () => {});"),
    ];
    assert.deepEqual(carried(files, 'X-1.1'), { running: ['other.spec.ts'], skipped: ['skipped.spec.ts'] });
  });

  it('lists a file in both when it has a running carrier and a skipped one', () => {
    const files = [file('a.spec.ts', lines("test('X-1.1: run', () => {});", "test.skip('X-1.1: skipped', () => {});"))];
    assert.deepEqual(carried(files, 'X-1.1'), { running: ['a.spec.ts'], skipped: ['a.spec.ts'] });
  });

  it('has an ID on a describe cover every test inside it, at any depth', () => {
    const text = lines(
      "describe('X-2.1: the group', () => {",
      "  it('first', () => {});",
      "  describe('deeper', () => {",
      "    it('second', () => {});",
      '  });',
      '});',
      "it('outside', () => {});",
    );
    const files = [file('group.test.ts', text), file('plain.test.ts', "it('no id', () => {});")];
    assert.deepEqual(carried(files, 'X-2.1'), { running: ['group.test.ts'], skipped: [] });
    assert.equal(carriersByCase([file('outside.test.ts', "it('outside', () => {});")]).size, 0);
  });

  it('has a describe with no test inside it cover nothing', () => {
    const files = [file('a.test.ts', "describe('X-2.1: an empty group', () => {});")];
    assert.deepEqual(carried(files, 'X-2.1'), { running: [], skipped: [] });
  });

  it('counts the tests inside a skipped describe as skipped', () => {
    const text = lines("test.describe.skip('X-2.1: the group', () => {", "  test('inside', async () => {});", '});');
    assert.deepEqual(carried([file('a.spec.ts', text)], 'X-2.1'), { running: [], skipped: ['a.spec.ts'] });
  });

  it('carries the IDs of both the test and its describe', () => {
    const text = lines("describe('X-2.1: group', () => {", "  it('X-2.2: test', () => {});", '});');
    const files = [file('a.test.ts', text)];
    assert.deepEqual(carried(files, 'X-2.1').running, ['a.test.ts']);
    assert.deepEqual(carried(files, 'X-2.2').running, ['a.test.ts']);
  });

  it('reads an ID a title computes from every branch', () => {
    const text = "test(`${wide ? 'X-3.1, X-3.2' : 'X-3.1'}: a variant`, async () => {});";
    const files = [file('a.spec.ts', text)];
    assert.deepEqual(carried(files, 'X-3.1').running, ['a.spec.ts']);
    assert.deepEqual(carried(files, 'X-3.2').running, ['a.spec.ts']);
  });

  it('does not read an ID mentioned inside a title as a stamp', () => {
    const files = [file('a.test.ts', "it('something X-4.1: later', () => {});")];
    assert.equal(carriersByCase(files).size, 0);
  });
});

describe('countTests', () => {
  it('counts tests and skipped tests, and not describes', () => {
    const text = lines(
      "describe('group', () => {",
      "  it('a', () => {});",
      "  it.skip('b', () => {});",
      '});',
      "test.describe.skip('skipped group', () => {",
      "  test('c', () => {});",
      '});',
    );
    assert.deepEqual(countTests([file('a.test.ts', text)]), { tests: 3, skipped: 2 });
  });
});
