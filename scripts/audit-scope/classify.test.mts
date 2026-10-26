import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readingOf, readWholeReason, READ_WHOLE_CODE_LINES, type FileFacts } from './classify.mts';

const lines = (...parts: string[]): string => parts.join('\n') + '\n';

const facts = (overrides: Partial<FileFacts> & Pick<FileFacts, 'newText'>): FileFacts => ({
  path: 'server/src/a.ts',
  isNew: false,
  changed: [1],
  movedIn: false,
  removalSites: [],
  oldText: '',
  hunks: [],
  ...overrides,
});

describe('readingOf', () => {
  it('reads nothing of a file whose changes were all formatting', () => {
    assert.equal(readingOf(facts({ changed: [], newText: 'run();\n' })), 'none');
  });

  it('gives a file with code changes to every pass', () => {
    const oldText = lines('run(1);');
    const newText = lines('run(2);');
    assert.equal(readingOf(facts({ oldText, newText })), 'all');
  });

  it('gives a new file to every pass', () => {
    assert.equal(readingOf(facts({ isNew: true, oldText: null, newText: lines('// a header', 'run();') })), 'all');
  });

  it('gives a file changed in its comments and test titles only to the drift pass', () => {
    const oldText = lines('// the old header', "it('one', () => {", '  run();', '});');
    const newText = lines('// a new header', '// of two lines', "it('two', () => {", '  run();', '});');
    assert.equal(readingOf(facts({ path: 'server/src/a.test.ts', oldText, newText })), 'drift');
  });

  it('gives a file changed in its imports only to the drift pass, removed imports included', () => {
    const oldText = lines("import { a } from './a.ts';", "import { b } from './b.ts';", 'run(a);');
    const newText = lines("import { a } from './a.ts';", "import { c } from './c.ts';", 'run(a);');
    const hunks = [{ oldStart: 2, oldCount: 1, newStart: 2, newCount: 1 }];
    assert.equal(readingOf(facts({ oldText, newText, hunks })), 'drift');
  });

  it('gives a file that changed an import and a line of code to every pass', () => {
    const oldText = lines("import { a } from './a.ts';", 'run(a);');
    const newText = lines("import { a } from './a.ts';", "import { c } from './c.ts';", 'run(a, c);');
    const hunks = [{ oldStart: 2, oldCount: 1, newStart: 2, newCount: 2 }];
    assert.equal(readingOf(facts({ oldText, newText, hunks })), 'all');
  });

  it('gives a file that lost a line of code, and nothing else, to every pass', () => {
    const oldText = lines('run(1);', 'stop();');
    const newText = lines('run(1);');
    const hunks = [{ oldStart: 2, oldCount: 1, newStart: 1, newCount: 0 }];
    assert.equal(readingOf(facts({ changed: [], removalSites: [1], oldText, newText, hunks })), 'all');
  });

  it('gives a file that received moved code to every pass, even when the rest is comments', () => {
    const oldText = lines('// the old header');
    const newText = lines('// a new header');
    assert.equal(readingOf(facts({ changed: [1], movedIn: true, oldText, newText })), 'all');
  });

  it('gives an agent-instruction file to the drift pass alone', () => {
    const newText = lines('# Notes', 'More text.');
    assert.equal(readingOf(facts({ path: 'CLAUDE.md', oldText: '# Notes', newText })), 'drift');
    assert.equal(readingOf(facts({ path: 'client/src/CLAUDE.md', isNew: true, oldText: null, newText })), 'drift');
  });
});

describe('readWholeReason', () => {
  const none = new Set<string>();
  const code = (count: number): string => lines(...Array.from({ length: count }, (_, i) => `const v${i} = ${i};`));
  const upTo = (count: number): number[] => Array.from({ length: count }, (_, i) => i + 1);
  const reason = (given: Partial<FileFacts> & Pick<FileFacts, 'newText'>, marked = none) =>
    readWholeReason(facts(given), marked);

  it('marks a new file, and a file that received moved code', () => {
    assert.equal(reason({ isNew: true, newText: code(1) }), 'new file');
    assert.equal(reason({ movedIn: true, newText: code(1) }), 'received moved code');
  });

  it(`marks a file with ${READ_WHOLE_CODE_LINES} or more changed lines of code`, () => {
    assert.equal(reason({ changed: upTo(READ_WHOLE_CODE_LINES), newText: code(20) }), '10 changed lines of code');
    assert.equal(reason({ changed: upTo(READ_WHOLE_CODE_LINES - 1), newText: code(20) }), null);
  });

  it("doesn't count imports, comments, test titles or blank lines", () => {
    const newText = lines(
      "import { a } from './a.ts';",
      "import { b } from './b.ts';",
      '// one',
      '// two',
      '',
      "it('a title', () => {",
      "it('another title', () => {",
      '  run();',
      '  stop();',
      '  go();',
      '  wait();',
    );
    assert.equal(reason({ changed: upTo(11), newText }), null);
  });

  it('marks a file the orchestrator names, whatever its changes', () => {
    assert.equal(reason({ newText: code(1) }, new Set(['server/src/a.ts'])), 'marked by the orchestrator');
  });
});
