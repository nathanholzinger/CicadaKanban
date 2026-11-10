import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  extractBruno,
  extractCode,
  extractMarkdown,
  parseMarker,
  parseScript,
  testDeclarations,
  unfencedLines,
} from './extract.mts';

const lines = (...parts: string[]): string => parts.join('\n');
const commentTexts = (fileName: string, text: string): string[] =>
  extractCode(fileName, text)
    .segments.filter(segment => segment.source === 'comment')
    .map(segment => segment.text);

describe('extractCode: comments', () => {
  it('reads line, block and trailing comments, one segment per line', () => {
    const text = lines('// leading', 'const a = 1; // trailing', '/* block', '   second */', 'const b = 2;');
    assert.deepEqual(commentTexts('a.ts', text), ['// leading', '// trailing', '/* block', '   second */']);
  });

  it('never reads comment-like text inside strings, templates or regexes', () => {
    const text = lines(
      "const url = 'https://example.com'; // real",
      'const re = /\\/\\/ not a comment/;',
      'const t = `// not a comment ${1 /* inner */}`;',
    );
    assert.deepEqual(commentTexts('a.ts', text), ['// real', '/* inner */']);
  });

  it('never reads JSX text as a comment, but reads a comment in a JSX expression', () => {
    const text = 'const el = <p>// text, not a comment {/* real */}</p>;';
    assert.deepEqual(commentTexts('a.tsx', text), ['/* real */']);
  });

  it('reads a doc comment once, and nothing nested inside it', () => {
    const text = lines('/** See https://example.com for the format. */', 'export function f() {}');
    assert.deepEqual(commentTexts('a.ts', text), ['/** See https://example.com for the format. */']);
  });

  it('reports 1-based line and column', () => {
    const [segment] = extractCode('a.ts', lines('const a = 1;', '  // note')).segments;
    assert.equal(segment.line, 2);
    assert.equal(segment.col, 3);
  });
});

describe('extractCode: test titles', () => {
  it('reads the titles of it, test, describe and their members, and of an `.each` table', () => {
    const text = lines(
      "test.describe('outer', () => {",
      "  it('inner', () => {});",
      "  it.each([1, 2])('table %i', () => {});",
      "  test.each`a | b`('tagged', () => {});",
      '  test.skip(`skipped`, () => {});',
      '});',
      "helper('not a test');",
      "helper(it)('not a test either');",
    );
    const titles = extractCode('a.test.ts', text)
      .segments.filter(segment => segment.source === 'title')
      .map(segment => segment.text);
    assert.deepEqual(titles, ['outer', 'inner', 'table %i', 'tagged', 'skipped']);
  });

  it('points a title at its first character, inside the quotes', () => {
    const title = extractCode('a.test.ts', "it('abc', () => {});").segments.find(s => s.source === 'title');
    assert.equal(title?.col, 5);
  });
});

describe('extractCode: ignore markers', () => {
  it('reads a marker, targets the next line, and never checks the marker itself', () => {
    const text = lines('// check-docs-ignore-next-line transient-id, bare-section -- a fixture', '// next');
    const { segments, markers } = extractCode('a.ts', text);
    assert.deepEqual(
      segments.map(s => s.text),
      ['// next'],
    );
    assert.equal(markers.length, 1);
    assert.deepEqual(markers[0].rules, ['transient-id', 'bare-section']);
    assert.equal(markers[0].reason, 'a fixture');
    assert.equal(markers[0].targetLine, 2);
  });
});

describe('parseMarker', () => {
  it('leaves the reason empty when there is none', () => {
    assert.deepEqual(parseMarker('// check-docs-ignore-next-line transient-id'), {
      rules: ['transient-id'],
      reason: '',
    });
  });

  it('strips the closing of a block comment', () => {
    assert.deepEqual(parseMarker('/* check-docs-ignore-next-line transient-link -- tracked there */'), {
      rules: ['transient-link'],
      reason: 'tracked there',
    });
  });
});

describe('unfencedLines', () => {
  it('closes a fence only with the same character, at least as long as the one that opened it', () => {
    const text = lines('before', '````md', '```', 'inside', '```', '````', 'between', '~~~', '````', '~~~', 'after');
    assert.deepEqual(unfencedLines(text), [
      { text: 'before', line: 1 },
      { text: 'between', line: 7 },
      { text: 'after', line: 11 },
    ]);
  });

  it('numbers lines from 1 and drops each carriage return', () => {
    assert.deepEqual(unfencedLines('a\r\nb\r\n'), [
      { text: 'a', line: 1 },
      { text: 'b', line: 2 },
      { text: '', line: 3 },
    ]);
  });
});

describe('extractMarkdown', () => {
  it('skips fenced blocks of either fence character', () => {
    const text = lines('before', '```ts', 'inside', '```', 'between', '~~~', 'inside', '~~~', 'after');
    assert.deepEqual(
      extractMarkdown(text).segments.map(s => s.text),
      ['before', 'between', 'after'],
    );
  });

  it('reads a marker from an HTML comment and blanks it out of the line', () => {
    const text = lines('<!-- check-docs-ignore-next-line transient-link -- tracked there -->', 'the line');
    const { segments, markers } = extractMarkdown(text);
    assert.equal(segments[0].text.trim(), '');
    assert.equal(markers[0].targetLine, 2);
    assert.deepEqual(markers[0].rules, ['transient-link']);
  });
});

describe('extractBruno', () => {
  const request = lines(
    'meta {',
    '  name: Move Item',
    '}',
    '',
    'patch {',
    '  url: {{baseUrl}}/api/items/{{itemId}}/move',
    '}',
    '',
    'docs {',
    '  # Move Item',
    '',
    '  Named in Story 4.',
    '}',
    '',
    'get {',
    '  url: Story 5',
    '}',
  );
  const read = (text: string) =>
    extractBruno(text)
      .segments.filter(segment => segment.text.trim() !== '')
      .map(segment => [segment.line, segment.col, segment.text]);

  it('reads only the docs block, each line where the file has it', () => {
    assert.deepEqual(read(request), [
      [10, 1, '  # Move Item'],
      [12, 1, '  Named in Story 4.'],
    ]);
  });

  it('ends the block at a lone closing brace, not at a brace inside a line of the docs', () => {
    const text = lines('docs {', '  Send { "a": 1 } to {{baseUrl}}', '  More.', '}', 'get {', '  url: x', '}');
    assert.deepEqual(read(text), [
      [2, 1, '  Send { "a": 1 } to {{baseUrl}}'],
      [3, 1, '  More.'],
    ]);
  });

  it('reads nothing from a file with no docs block', () => {
    assert.deepEqual(read(lines('vars {', '  baseUrl: http://localhost:3001', '}')), []);
  });

  it('skips a fenced block inside the docs, as it does in Markdown', () => {
    const text = lines('docs {', '  Before.', '  ```json', '  { "title": "Story 4" }', '  ```', '  After.', '}');
    assert.deepEqual(read(text), [
      [2, 1, '  Before.'],
      [6, 1, '  After.'],
    ]);
  });

  it('drops each carriage return', () => {
    assert.deepEqual(read('docs {\r\n  A.\r\n}\r\n'), [[2, 1, '  A.']]);
  });

  it('reads a marker in the docs, and numbers it by the file', () => {
    const text = lines(
      'meta {',
      '}',
      'docs {',
      '  <!-- check-docs-ignore-next-line transient-id -- a fixture -->',
      '  Story 4.',
      '}',
    );
    const { markers } = extractBruno(text);
    assert.equal(markers.length, 1);
    assert.deepEqual([markers[0].line, markers[0].targetLine, markers[0].rules], [4, 5, ['transient-id']]);
  });
});

const declarationsOf = (text: string) => testDeclarations(parseScript('a.test.ts', text));
const openingsOf = (text: string): string[][] => declarationsOf(text).map(declaration => declaration.openings);

describe('testDeclarations', () => {
  it('reads each test and describe, with the describes around it, outermost first', () => {
    const text = lines(
      "describe('outer', () => {",
      "  describe('inner', () => {",
      "    it('a test', () => {});",
      '  });',
      "  test('beside', () => {});",
      '});',
      "it('alone', () => {});",
    );
    assert.deepEqual(
      declarationsOf(text).map(d => [d.openings[0], d.group, d.within.map(w => w.openings[0])]),
      [
        ['outer', true, []],
        ['inner', true, ['outer']],
        ['a test', false, ['outer', 'inner']],
        ['beside', false, ['outer']],
        ['alone', false, []],
      ],
    );
  });

  it('reads a Playwright describe, and an each table, as the same kinds of call', () => {
    const text = lines(
      "test.describe('group', () => {",
      "  it.each([1, 2])('table %i', () => {});",
      '});',
      "describe.each([1])('grouped table', () => {});",
    );
    assert.deepEqual(
      declarationsOf(text).map(d => [d.openings[0], d.group]),
      [
        ['group', true],
        ['table %i', false],
        ['grouped table', true],
      ],
    );
  });

  it('marks a declared skip: .skip, .fixme and .todo, on a test or on a describe', () => {
    const text = lines(
      "test.skip('s', () => {});",
      "it.skip('i', () => {});",
      "test.fixme('f', () => {});",
      "it.todo('t');",
      "test.describe.skip('d', () => {});",
      "it('running', () => {});",
    );
    assert.deepEqual(
      declarationsOf(text).map(d => d.skipped),
      [true, true, true, true, true, false],
    );
  });

  it('leaves a skip decided at run time as a running test', () => {
    const text = lines(
      "it.skipIf(process.platform === 'win32')('conditional', () => {});",
      "test('body', () => { test.skip(true, 'not here'); });",
    );
    assert.deepEqual(
      declarationsOf(text).map(d => [d.openings[0], d.skipped]),
      [
        ['conditional', false],
        ['body', false],
      ],
    );
  });

  it('reads no hook, test.use, test.step or call without a title as a declaration', () => {
    const text = lines(
      'test.beforeEach(async () => {});',
      'test.use({ viewport: { width: 1, height: 1 } });',
      "test('real', async () => { await test.step('a step', async () => {}); });",
      'it.each([1, 2])(name, () => {});',
    );
    assert.deepEqual(openingsOf(text), [['real']]);
  });

  it('reads no titled hook as a declaration', () => {
    const text = lines(
      "test.beforeEach('X-1.1: set up', async () => {});",
      "test.afterAll('X-1.1: tear down', async () => {});",
      "test('X-1.2: real', async () => {});",
    );
    assert.deepEqual(openingsOf(text), [['X-1.2: real']]);
  });

  it('reads a title chosen by a conditional, in parentheses or after a cast', () => {
    const text = lines(
      "test(wide ? 'X-1.1: wide' : 'X-1.2: narrow', async () => {});",
      "test((wide ? 'X-1.3: a' : 'X-1.4: b') as string, async () => {});",
    );
    assert.deepEqual(openingsOf(text), [
      ['X-1.1: wide', 'X-1.2: narrow'],
      ['X-1.3: a', 'X-1.4: b'],
    ]);
  });

  it('gives a title that opens with a conditional one opening for each branch', () => {
    const text = "test(`${a ? 'X-1.1, X-1.2' : 'X-1.1'}: first ${b}`, () => {});";
    assert.deepEqual(openingsOf(text), [['X-1.1, X-1.2: first ${b}', 'X-1.1: first ${b}']]);
  });

  it('follows a conditional whose branch is a template, and a title built with +', () => {
    const nested = "test(`${a ? 'X-1.1' : `X-1.2${b ? ', X-1.3' : ''}`}: t`, () => {});";
    assert.deepEqual(openingsOf(nested), [['X-1.1: t', 'X-1.2, X-1.3: t', 'X-1.2: t']]);
    const sum = "test('X-1.1: part ' + (c ? 'one' : 'two') + ')', () => {});";
    assert.deepEqual(openingsOf(sum), [['X-1.1: part one)', 'X-1.1: part two)']]);
  });

  it('leaves a substitution it cannot resolve as written', () => {
    assert.deepEqual(openingsOf('test(`${name}: t`, () => {});'), [['${name}: t']]);
  });
});
