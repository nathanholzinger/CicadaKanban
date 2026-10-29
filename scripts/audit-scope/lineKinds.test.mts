import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isScriptFile, lineKinds, splitLines, strippedCode, templateLines } from './lineKinds.mts';

const lines = (...parts: string[]): string => parts.join('\n') + '\n';

describe('splitLines', () => {
  it('drops the carriage return of each line, and ends with the empty line after the last break', () => {
    assert.deepEqual(splitLines('a\r\nb\n'), ['a', 'b', '']);
  });

  it('numbers the lines as lineKinds does, for a script and for any other file', () => {
    const text = 'const a = 1;\r\n\r\n// note\r\nconst b = 2;\n';
    for (const file of ['a.ts', 'a.json', 'a.md']) {
      assert.equal(lineKinds(file, text).length, splitLines(text).length, file);
    }
  });
});

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

  it('is the same for two versions that differ only in comments, test titles and imports', () => {
    const before = lines(
      "import { a } from './a.ts';",
      '// old header',
      "it('one', () => {",
      '  run(); // note',
      '});',
    );
    const after = lines(
      'import {',
      '  b,',
      "} from './b.ts';",
      '// a rewritten',
      '// header',
      '',
      "it('two', () => {",
      '  run();',
      '});',
    );
    assert.deepEqual(stripped(before), stripped(after));
  });

  it('differs when the code does', () => {
    assert.notDeepEqual(stripped(lines('run(1);')), stripped(lines('run(2);')));
    assert.notDeepEqual(stripped(lines('run(1);')), stripped(lines('run(1);', 'stop();')));
  });

  it('drops the lines it is told to skip, numbered from 1', () => {
    assert.deepEqual(strippedCode('a.ts', lines('run(1);', 'stop();', 'go();'), new Set([2])), ['run(1);', 'go();']);
  });

  it("keeps a string that holds comment characters, which isn't a comment", () => {
    assert.deepEqual(stripped(lines("const url = 'http://example.com'; // the site")), [
      "const url = 'http://example.com';",
    ]);
  });

  // A line inside a multiline template is its value: collapsed or dropped, two versions that differ
  // in a space or a blank line would strip to the same code.
  describe('a template literal that spans lines', () => {
    const template = (...body: string[]): string => lines('export const text = `', ...body, '`;');

    it('differs when a line inside it gains a space, or loses a blank line', () => {
      assert.notDeepEqual(stripped(template('a b')), stripped(template('a  b')));
      assert.notDeepEqual(stripped(template('a b')), stripped(template(' a b')));
      assert.notDeepEqual(stripped(template('a', '', 'b')), stripped(template('a', 'b')));
    });

    it('differs when text between its substitutions does', () => {
      const text = (middle: string): string => lines('const s = `a ${x}', middle, 'e`;');
      assert.notDeepEqual(stripped(text('b c ${y} d')), stripped(text('b  c ${y} d')));
    });

    it('is the same for two versions that differ only in the code around it', () => {
      const before = lines('// old', 'export const text = `', 'a  b', '`;');
      const after = lines('// a longer', '// header', 'export const text =  `', 'a  b', '`;');
      assert.deepEqual(stripped(before), stripped(after));
    });

    it('still drops a line of it that it is told to skip', () => {
      assert.deepEqual(strippedCode('a.ts', template('a', 'b'), new Set([3])).includes('"b"'), false);
    });
  });
});

describe('templateLines', () => {
  it('numbers the lines a template reaches after the one it starts on', () => {
    const text = lines(
      'const one = `x`;', // 1: one line
      'const two = `', // 2: starts here, so it is read with its backtick
      'a b', // 3
      '`;', // 4
      'const three = `a ${x}', // 5: starts here, so it is read with its backtick too
      'b ${y} c', // 6: a piece of it starts at the `}` after y, with no backtick before it
      'd`;', // 7
      'run();', // 8
    );
    assert.deepEqual(
      [...templateLines('a.ts', text)].sort((a, b) => a - b),
      [3, 4, 6, 7],
    );
  });

  it('numbers the line a substitution closes on, when the template opened on an earlier line', () => {
    // The text after the `}` on line 3 is the template's, though the line has no backtick before it.
    const text = lines('const s = `a ${', '  x', '} text', 'more`;');
    assert.deepEqual(
      [...templateLines('a.ts', text)].sort((a, b) => a - b),
      [3, 4],
    );
  });

  it('is empty for a file with no template that spans lines', () => {
    assert.equal(templateLines('a.ts', lines('const a = `x`;', 'run(`y ${a}`);')).size, 0);
  });

  it('reads a template inside JSX, which a scan of the text alone would not', () => {
    const text = lines('export const view = (', '  <p title={`a', 'b`}>it’s</p>', ');');
    assert.deepEqual([...templateLines('a.tsx', text)], [3]);
  });
});

describe('isScriptFile', () => {
  it('takes the extensions the TypeScript parse reads', () => {
    for (const file of ['a.ts', 'a.tsx', 'a.mts', 'a.cts', 'a.js', 'a.jsx', 'a.mjs', 'a.cjs'])
      assert.ok(isScriptFile(file), file);
    for (const file of ['a.json', 'a.md', 'a.bru', '.prettierrc']) assert.ok(!isScriptFile(file), file);
  });
});
