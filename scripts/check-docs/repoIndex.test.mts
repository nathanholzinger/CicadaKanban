import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isSuiteFile } from './files.mts';
import { caseHeadings, declaredNames, headingSections } from './repoIndex.mts';

describe('headingSections', () => {
  it('reads numbered headings of every depth and form, outside fences', () => {
    const text = [
      '# Title',
      '## 8. Depth cap',
      '### 1.1 The board is a stack',
      '## 5a. Collapse',
      '```',
      '## 9. Inside a fence',
      '```',
      '## Open questions',
    ].join('\n');
    assert.deepEqual([...headingSections(text)], ['8', '1.1', '5a']);
  });

  it('reads no section from inside a fence that shows a shorter one', () => {
    const text = [
      '````md',
      '```',
      '## 9. Shown in the example',
      '```',
      '## 10. Still the example',
      '````',
      '## 11. Real',
    ];
    assert.deepEqual([...headingSections(text.join('\n'))], ['11']);
  });
});

describe('caseHeadings', () => {
  it('reads the level-2 headings that open with a case ID, outside fences', () => {
    const text = [
      '# DRAG-5 — Detach',
      '**Next ID:** DRAG-5.4',
      '## DRAG-5.1 — A Stub becomes Free',
      '### DRAG-5.2 — Not a case heading',
      '## TC-5a.1 — Pairs first',
      '## TC-X.2 — A guard',
      '```',
      '## DRAG-5.3 — Inside a fence',
      '```',
      '## Open questions',
    ].join('\n');
    assert.deepEqual(caseHeadings(text), ['DRAG-5.1', 'TC-5a.1', 'TC-X.2']);
  });

  it('reads no case from inside a fence that shows a shorter one', () => {
    const text = ['````md', '```', '## DRAG-5.9 — Shown in the example', '```', '````', '## DRAG-5.1 — Real'];
    assert.deepEqual(caseHeadings(text.join('\n')), ['DRAG-5.1']);
  });
});

describe('isSuiteFile', () => {
  it('takes every test-plan Markdown file but the README and INDEX files', () => {
    assert.ok(isSuiteFile('docs/test-plans/item-attachment/att-4-legal-parent-depth-cap.md'));
    assert.ok(!isSuiteFile('docs/test-plans/README.md'));
    assert.ok(!isSuiteFile('docs/test-plans/item-attachment/INDEX.md'));
    assert.ok(!isSuiteFile('docs/wiki/item-attachment/README.md'));
  });
});

describe('declaredNames', () => {
  it('reads declarations at every depth, and re-exports', () => {
    const text = [
      'export function outer() { function inner() {} }',
      'const { picked } = source;',
      'export type Shape = { width: number };',
      'export { renamed } from "./elsewhere";',
      'import { imported } from "./elsewhere";',
    ].join('\n');
    const names = declaredNames('a.ts', text);
    for (const name of ['outer', 'inner', 'picked', 'Shape', 'width', 'renamed']) assert.ok(names.has(name), name);
    assert.ok(!names.has('imported'));
  });
});
