import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { checkFile } from './check.mts';
import {
  TRANSIENT_DIR,
  TRANSIENT_FOLDERS,
  isInTestPlans,
  isInWiki,
  isNeverChecked,
  resolveLink,
  wikiPageAt,
  wikiPageOfReadme,
} from './files.mts';
import { buildIndex } from './repoIndex.mts';

describe('the transient folders', () => {
  it('are one list: each is never checked, counts as transient, and is flagged when a file in it is named', () => {
    const index = buildIndex({
      wikiPages: new Map(),
      codeFiles: [],
      readCode: () => '',
      transientFiles: TRANSIENT_FOLDERS.map(folder => `docs/${folder}/plan.md`),
      otherFileNames: new Set(),
      suites: new Map(),
    });
    for (const folder of TRANSIENT_FOLDERS) {
      const file = `docs/${folder}/plan.md`;
      assert.ok(isNeverChecked(file), `${folder} is never checked`);
      assert.ok(TRANSIENT_DIR.test(file), `${folder} counts as transient`);
      const rules = checkFile('client/src/a.ts', `// See ${file} for why.`, index).map(finding => finding.rule);
      assert.deepEqual(rules, ['transient-link'], `${folder} is flagged`);
    }
  });
});

describe('the docs layout', () => {
  it('reads a wiki page from its folder or its README, and a file as a page only by its README', () => {
    assert.equal(wikiPageAt('docs/wiki/item-attachment/README.md'), 'item-attachment');
    assert.equal(wikiPageAt('docs/wiki/item-attachment/'), 'item-attachment');
    assert.equal(wikiPageAt('docs/wiki/item-attachment/notes.md'), null);
    assert.equal(wikiPageOfReadme('docs/wiki/item-attachment/README.md'), 'item-attachment');
    assert.equal(wikiPageOfReadme('docs/wiki/item-attachment/'), null);
    assert.equal(wikiPageOfReadme('docs/wiki/README.md'), null);
  });

  it('tells the wiki from the test plans', () => {
    assert.ok(isInWiki('docs/wiki/item-attachment/README.md') && !isInTestPlans('docs/wiki/item-attachment/README.md'));
    assert.ok(isInTestPlans('docs/test-plans/item-attachment/INDEX.md') && !isInWiki('docs/test-plans/x.md'));
  });

  it('resolves a relative link from the linking file, and leaves a URL or a bare anchor alone', () => {
    const from = 'docs/wiki/item-attachment/README.md';
    assert.equal(
      resolveLink(from, '../board-drag-interaction/README.md#7.1'),
      'docs/wiki/board-drag-interaction/README.md',
    );
    assert.equal(resolveLink(from, 'https://example.com/a'), null);
    assert.equal(resolveLink(from, '#8'), null);
  });
});
