import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readingOf, readWholeReason, READ_WHOLE_CODE_LINES, type FileFacts } from './classify.mts';

const lines = (...parts: string[]): string => parts.join('\n') + '\n';

const facts = (overrides: Partial<FileFacts> & Pick<FileFacts, 'newText'>): FileFacts => ({
  path: 'server/src/a.ts',
  isNew: false,
  changed: [1],
  moved: [],
  removalSites: [],
  oldText: '',
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
    assert.equal(readingOf(facts({ oldText, newText })), 'drift');
  });

  it('gives a file changed in its comments and its imports, with nothing else, to the drift pass', () => {
    const oldText = lines('// the old header', "import { a } from './a.ts';", 'run(a);');
    const newText = lines('// a new header', "import { a } from './a.ts';", "import { c } from './c.ts';", 'run(a);');
    assert.equal(readingOf(facts({ changed: [1, 3], oldText, newText })), 'drift');
  });

  it('gives a file that changed an import and a line of code to every pass', () => {
    const oldText = lines("import { a } from './a.ts';", 'run(a);');
    const newText = lines("import { a } from './a.ts';", "import { c } from './c.ts';", 'run(a, c);');
    assert.equal(readingOf(facts({ oldText, newText })), 'all');
  });

  it('gives a file that lost a line of code, and nothing else, to every pass', () => {
    const oldText = lines('run(1);', 'stop();');
    const newText = lines('run(1);');
    assert.equal(readingOf(facts({ changed: [], removalSites: [1], oldText, newText })), 'all');
  });

  it('reads nothing of a file whose only change is code moved in', () => {
    const oldText = lines('run(1);');
    const newText = lines('run(1);', 'stop();', 'go();', 'wait();', 'end();');
    assert.equal(readingOf(facts({ changed: [], moved: [2, 3, 4, 5], oldText, newText })), 'none');
  });

  it('sets moved code aside: a file that received it with the import it needs goes to the drift pass alone', () => {
    const oldText = lines('run(1);');
    const newText = lines("import { s } from './s.ts';", 'run(1);', 'stop(s);', 'go();', 'wait();', 'end();');
    assert.equal(readingOf(facts({ changed: [1], moved: [3, 4, 5, 6], oldText, newText })), 'drift');
  });

  it('gives a file that received moved code and changed a line of code besides to every pass', () => {
    const oldText = lines('run(1);');
    const newText = lines('run(2);', 'stop();', 'go();', 'wait();', 'end();');
    assert.equal(readingOf(facts({ changed: [1], moved: [2, 3, 4, 5], oldText, newText })), 'all');
  });

  it('gives a new file whose only code moved there, with its header and imports, to the drift pass alone', () => {
    const newText = lines(
      '// A module split out.',
      "import { s } from './s.ts';",
      'stop(s);',
      'go();',
      'wait();',
      'end();',
    );
    const given = facts({ isNew: true, changed: [1, 2], moved: [3, 4, 5, 6], oldText: null, newText });
    assert.equal(readingOf(given), 'drift');
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

  it('marks a new file', () => {
    assert.equal(reason({ isNew: true, newText: code(1) }), 'new file');
  });

  it("doesn't count moved code: receiving it marks nothing, nor does a new file whose only code moved there", () => {
    assert.equal(reason({ changed: [], moved: upTo(20), newText: code(20) }), null);
    assert.equal(reason({ isNew: true, changed: [], moved: upTo(4), newText: code(4) }), null);
  });

  it('marks a new file that holds code of its own beside moved code', () => {
    assert.equal(reason({ isNew: true, changed: [5], moved: upTo(4), newText: code(5) }), 'new file');
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
