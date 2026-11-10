import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseScript, testDeclarations } from '../check-docs/extract.mts';
import { carriersByCase, type Carriers, type TestFile } from './carriers.mts';
import type { Automation, CatalogCase } from './catalog.mts';
import { runChecks } from './checks.mts';

const lines = (...parts: string[]): string => parts.join('\n');
const make = (over: Partial<CatalogCase>): CatalogCase => ({
  id: 'X-1.1',
  suite: 'docs/test-plans/x/x-1.md',
  priority: 'P1',
  status: 'Open',
  lineStatus: 'Open',
  tableStatus: 'Open',
  automation: { kind: 'unconfirmed' },
  ...over,
});
const carrying = (running: string[], skipped: string[] = []): Carriers => ({
  running: new Set(running),
  skipped: new Set(skipped),
});
const everythingExists = (): boolean => true;

describe('lost coverage', () => {
  it('reports an Automated case no running test carries, with its Automation files and skipped carriers', () => {
    const cases = [make({ status: 'Automated', automation: { kind: 'files', paths: ['a.spec.ts'] } })];
    const { lostCoverage } = runChecks(cases, new Map([['X-1.1', carrying([], ['b.spec.ts'])]]), everythingExists);
    assert.deepEqual(lostCoverage, [{ id: 'X-1.1', automation: ['a.spec.ts'], skipped: ['b.spec.ts'] }]);
  });

  it('reports an Automated case with no carrier at all', () => {
    const { lostCoverage } = runChecks([make({ status: 'Automated' })], new Map(), everythingExists);
    assert.deepEqual(lostCoverage, [{ id: 'X-1.1', automation: [], skipped: [] }]);
  });

  it('reports nothing for an Automated case a running test carries, or for a case that is not Automated', () => {
    const carried = new Map([['X-1.1', carrying(['a.spec.ts'])]]);
    assert.deepEqual(runChecks([make({ status: 'Automated' })], carried, everythingExists).lostCoverage, []);
    for (const status of ['Open', 'Manual', 'Planned', 'Pending PO'] as const) {
      assert.deepEqual(runChecks([make({ status })], new Map(), everythingExists).lostCoverage, []);
    }
  });
});

describe('a Manual case a running test carries', () => {
  it('reports the files whose running tests carry it', () => {
    const cases = [make({ status: 'Manual', automation: { kind: 'manual', reason: 'feel' } })];
    const { manualCarried } = runChecks(cases, new Map([['X-1.1', carrying(['b.spec.ts', 'a.test.ts'])]]), () => true);
    assert.deepEqual(manualCarried, [{ id: 'X-1.1', files: ['a.test.ts', 'b.spec.ts'] }]);
  });

  it('reports nothing when only a skipped test carries it, or none does', () => {
    const cases = [make({ status: 'Manual' })];
    assert.deepEqual(runChecks(cases, new Map([['X-1.1', carrying([], ['a.spec.ts'])]]), () => true).manualCarried, []);
    assert.deepEqual(runChecks(cases, new Map(), () => true).manualCarried, []);
  });
});

describe('stale Automation lines', () => {
  const automation: Automation = {
    kind: 'files',
    paths: ['gone.spec.ts', 'empty.spec.ts', 'skipped.spec.ts', 'good.spec.ts'],
  };
  const carried = new Map([['X-1.1', carrying(['good.spec.ts'], ['skipped.spec.ts'])]]);

  it('reports a path that does not exist, and a file where no running test carries the case', () => {
    const exists = (repoPath: string): boolean => repoPath !== 'gone.spec.ts';
    const { staleAutomation } = runChecks([make({ automation })], carried, exists);
    assert.deepEqual(staleAutomation, [
      { id: 'X-1.1', path: 'gone.spec.ts', reason: 'file missing' },
      { id: 'X-1.1', path: 'empty.spec.ts', reason: 'no running test in it carries the case' },
      { id: 'X-1.1', path: 'skipped.spec.ts', reason: 'only skipped tests in it carry the case' },
    ]);
  });

  it('leaves a `none — manual` line and a dash alone', () => {
    const cases = [
      make({ id: 'X-1.1', status: 'Manual', automation: { kind: 'manual', reason: 'feel' } }),
      make({ id: 'X-1.2', automation: { kind: 'unconfirmed' } }),
      make({ id: 'X-1.3', automation: null }),
    ];
    assert.deepEqual(runChecks(cases, new Map(), () => false).staleAutomation, []);
  });
});

describe('two statuses for one case', () => {
  it('reports a case whose table row and own line differ', () => {
    const cases = [make({ status: 'Automated', lineStatus: 'Automated', tableStatus: 'Open' })];
    assert.deepEqual(runChecks(cases, new Map(), () => true).statusDisagreements, [
      { id: 'X-1.1', suite: 'docs/test-plans/x/x-1.md', table: 'Open', caseLine: 'Automated' },
    ]);
  });

  it('reads `Planned, replaces <ID>` as a different status from `Planned`', () => {
    const cases = [make({ status: 'Planned', lineStatus: 'Planned, replaces X-1.2', tableStatus: 'Planned' })];
    assert.equal(runChecks(cases, new Map(), () => true).statusDisagreements.length, 1);
  });

  it('reports nothing for matching statuses, or when either is missing', () => {
    const cases = [
      make({ id: 'X-1.1' }),
      make({ id: 'X-1.2', lineStatus: null }),
      make({ id: 'X-1.3', tableStatus: null }),
    ];
    assert.deepEqual(runChecks(cases, new Map(), () => true).statusDisagreements, []);
  });
});

describe('the checks over test source', () => {
  const file = (path: string, text: string): TestFile => ({
    path,
    declarations: testDeclarations(parseScript(path, text)),
  });

  it('takes a skipped test carrying an ID as no coverage, and an ID on a describe as coverage', () => {
    const carriers = carriersByCase([
      file('skipped.spec.ts', "test.skip('X-1.1: held off', async () => {});"),
      file('grouped.test.ts', lines("describe('X-1.2: group', () => {", "  it('inside', () => {});", '});')),
    ]);
    const cases = [
      make({ id: 'X-1.1', status: 'Automated', automation: { kind: 'files', paths: ['skipped.spec.ts'] } }),
      make({ id: 'X-1.2', status: 'Automated', automation: { kind: 'files', paths: ['grouped.test.ts'] } }),
    ];
    const checks = runChecks(cases, carriers, () => true);
    assert.deepEqual(
      checks.lostCoverage.map(found => found.id),
      ['X-1.1'],
    );
    assert.deepEqual(
      checks.staleAutomation.map(found => [found.id, found.reason]),
      [['X-1.1', 'only skipped tests in it carry the case']],
    );
  });
});
