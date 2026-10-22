import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { extractCode, extractMarkdown, parseMarker, unfencedLines } from './extract.mts';

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
