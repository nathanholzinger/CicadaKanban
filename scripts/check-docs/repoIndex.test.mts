import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { declaredNames, headingSections } from './repoIndex.mts';

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
