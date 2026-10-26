import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isScriptFile, lineKinds, strippedCode } from './lineKinds.mts';

const lines = (...parts: string[]): string => parts.join('\n') + '\n';

describe('lineKinds', () => {
  it('sorts the lines of a script into blank, comment, title, import and code', () => {
    const text = lines(
      "import { a } from './a.ts';",
      'import {',
      '  b,',
      "} from './b.ts';",
      '',
      '// a line comment',
      '/* a block',
      '   comment */',
      'const x = 1; // trailing',
      "it('a title', () => {",
      '  run();',
      '});',
      '// check-docs-ignore-next-line transient-id -- a fixture',
      'const y = 2;',
    );
    assert.deepEqual(lineKinds('a.test.ts', text), [
      'import',
      'import',
      'import',
      'import',
      'blank',
      'comment',
      'comment',
      'comment',
      'code',
      'title',
      'code',
      'code',
      'comment',
      'code',
      'blank',
    ]);
  });

  it('calls a line with code and a comment code, and a line with a test title a title line', () => {
    const kinds = lineKinds('a.ts', lines('run(); // then stop', "describe('about it', () => {"));
    assert.deepEqual(kinds.slice(0, 2), ['code', 'title']);
  });

  it('reads a Markdown file as prose and any other file as code', () => {
    assert.deepEqual(lineKinds('x.md', '# Title\n\ntext'), ['comment', 'blank', 'comment']);
    assert.deepEqual(lineKinds('x.json', '{\n\n}'), ['code', 'blank', 'code']);
  });
});

describe('strippedCode', () => {
  const stripped = (text: string): string[] => strippedCode('a.ts', text);

  it('is the same for two versions that differ only in comments and test titles', () => {
    const before = lines('// old header', "it('one', () => {", '  run(); // note', '});');
    const after = lines('// a rewritten', '// header', '', "it('two', () => {", '  run();', '});');
    assert.deepEqual(stripped(before), stripped(after));
  });

  it('differs when the code does', () => {
    assert.notDeepEqual(stripped(lines('run(1);')), stripped(lines('run(2);')));
    assert.notDeepEqual(stripped(lines("import { a } from './a.ts';")), stripped(lines('')));
  });

  it("keeps a string that holds comment characters, which isn't a comment", () => {
    assert.deepEqual(stripped(lines("const url = 'http://example.com'; // the site")), [
      "const url = 'http://example.com';",
    ]);
  });
});

describe('isScriptFile', () => {
  it('takes the extensions the TypeScript parse reads', () => {
    for (const file of ['a.ts', 'a.tsx', 'a.mts', 'a.cts', 'a.js', 'a.jsx', 'a.mjs', 'a.cjs'])
      assert.ok(isScriptFile(file), file);
    for (const file of ['a.json', 'a.md', 'a.bru', '.prettierrc']) assert.ok(!isScriptFile(file), file);
  });
});
