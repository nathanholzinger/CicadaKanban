import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { readCatalog, readTests } from './sources.mts';

const suiteText = (id: string): string =>
  [
    '| ID | Case | Priority | Status |',
    '| -- | ---- | -------- | ------ |',
    `| ${id} | A case | P1 | Open |`,
    '',
    `## ${id} — A case`,
    '',
    '**Priority:** P1 · **Status:** Open',
    '',
    '**Automation test:** —',
    '',
  ].join('\n');

let root: string;
const write = (rel: string, text: string): void => {
  mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  writeFileSync(path.join(root, rel), text);
};

before(() => {
  root = mkdtempSync(path.join(tmpdir(), 'report-catalog-'));
  write('docs/test-plans/README.md', '# Test plans\n');
  write('docs/test-plans/f/INDEX.md', '# Feature\n');
  write('docs/test-plans/f/f-1-one.md', suiteText('F-1.1'));
  write('docs/test-plans/f/f-2-two.md', suiteText('F-2.1'));
  write('docs/test-plans/f/f-3-again.md', suiteText('F-1.1'));
  write('client/src/a.test.ts', "it('F-1.1: in client', () => {});");
  write('client/src/helper.ts', "it('F-1.1: not a test file', () => {});");
  write('client/src/node_modules/dep/x.test.ts', "it('F-1.1: a dependency', () => {});");
  write('server/tests/routes/b.test.ts', "it('F-2.1: in server', () => {});");
  write('tests/ui/c.spec.ts', "test('F-2.1: in playwright', async () => {});");
  write('tests/output/d.spec.ts', "test('F-2.1: a report artifact', async () => {});");
});

after(() => rmSync(root, { recursive: true, force: true }));

describe('readCatalog', () => {
  it('reads every suite file, and neither the README nor an INDEX', () => {
    const { suites, cases } = readCatalog(root);
    assert.equal(suites, 3);
    assert.deepEqual(
      cases.map(found => [found.id, found.suite]),
      [
        ['F-1.1', 'docs/test-plans/f/f-1-one.md'],
        ['F-2.1', 'docs/test-plans/f/f-2-two.md'],
      ],
    );
  });

  it('keeps the first of an ID that two suites both declare, and reports the second', () => {
    const { problems } = readCatalog(root);
    assert.deepEqual(problems, [
      {
        suite: 'docs/test-plans/f/f-3-again.md',
        id: 'F-1.1',
        message: 'also a case in docs/test-plans/f/f-1-one.md; the first is read',
      },
    ]);
  });

  it('throws when the catalog folder is not there', () => {
    assert.throws(() => readCatalog(path.join(root, 'nowhere')), /ENOENT/);
  });
});

describe('readTests', () => {
  it('reads the test files of the three roots, sorted, and neither a helper, a dependency nor the run output', () => {
    assert.deepEqual(
      readTests(root).map(found => found.path),
      ['client/src/a.test.ts', 'server/tests/routes/b.test.ts', 'tests/ui/c.spec.ts'],
    );
  });

  it('reads each file’s declarations', () => {
    const [first] = readTests(root);
    assert.deepEqual(
      first.declarations.map(declaration => declaration.openings),
      [['F-1.1: in client']],
    );
  });
});
