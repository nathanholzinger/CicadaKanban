import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Carriers } from './carriers.mts';
import type { CatalogCase } from './catalog.mts';
import { renderReport, type ReportInput } from './report.mts';

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
const input = (over: Partial<ReportInput> = {}): ReportInput => ({
  suites: 1,
  cases: [],
  problems: [],
  checks: { lostCoverage: [], manualCarried: [], staleAutomation: [], statusDisagreements: [] },
  carriers: new Map(),
  tests: { files: 2, tests: 10, skipped: 1 },
  ...over,
});
/** The lines under a `## <title>` heading, up to the next one. */
const under = (report: string, title: string): string[] => {
  const all = report.split('\n');
  const start = all.indexOf(`## ${title}`);
  assert.notEqual(start, -1, `no section ${title}`);
  const rest = all.slice(start + 1);
  const end = rest.findIndex(line => line.startsWith('## '));
  return (end === -1 ? rest : rest.slice(0, end)).filter(line => line !== '');
};

describe('renderReport: the checks', () => {
  it('says "none" under each check and under the unread fields when there is nothing to report', () => {
    const report = renderReport(input({ cases: [make({})] }));
    for (const title of [
      'Lost coverage',
      'Manual cases a running test carries',
      'Stale Automation lines',
      'Two statuses for one case',
      'Catalog fields not read',
    ]) {
      assert.equal(under(report, title).at(-1), 'none', title);
    }
  });

  it('prints one line per finding, with the case ID and the file paths', () => {
    const report = renderReport(
      input({
        checks: {
          lostCoverage: [{ id: 'X-1.1', automation: ['a.spec.ts'], skipped: ['b.spec.ts'] }],
          manualCarried: [{ id: 'X-1.2', files: ['c.test.ts', 'd.spec.ts'] }],
          staleAutomation: [{ id: 'X-1.3', path: 'e.spec.ts', reason: 'file missing' }],
          statusDisagreements: [{ id: 'X-1.4', suite: 'x-1.md', table: 'Open', caseLine: 'Automated' }],
        },
        problems: [
          { suite: 'x-1.md', id: 'X-1.5', message: 'no row in the summary table' },
          { suite: 'x-1.md', id: null, message: "summary table row can't be read" },
        ],
      }),
    );
    assert.equal(
      under(report, 'Lost coverage').at(-1),
      '- X-1.1 — Automation line: a.spec.ts; skipped tests carry it in: b.spec.ts',
    );
    assert.equal(
      under(report, 'Manual cases a running test carries').at(-1),
      '- X-1.2 — carried in: c.test.ts, d.spec.ts',
    );
    assert.equal(under(report, 'Stale Automation lines').at(-1), '- X-1.3 — e.spec.ts: file missing');
    assert.equal(
      under(report, 'Two statuses for one case').at(-1),
      '- X-1.4 — table: Open; case line: Automated (x-1.md)',
    );
    assert.deepEqual(under(report, 'Catalog fields not read').slice(-2), [
      '- X-1.5 — no row in the summary table (x-1.md)',
      "- (no case) — summary table row can't be read (x-1.md)",
    ]);
  });

  it('shows a lost case with no Automation files as a dash', () => {
    const report = renderReport(
      input({ checks: { ...input().checks, lostCoverage: [{ id: 'X-1.1', automation: [], skipped: [] }] } }),
    );
    assert.equal(under(report, 'Lost coverage').at(-1), '- X-1.1 — Automation line: —');
  });
});

describe('renderReport: totals', () => {
  it('counts cases by priority and status, with a total for each', () => {
    const cases = [
      make({ id: 'X-1.1', priority: 'P0', status: 'Automated' }),
      make({ id: 'X-1.2', priority: 'P0', status: 'Open' }),
      make({ id: 'X-1.3', priority: 'P1', status: 'Open' }),
      make({ id: 'X-1.4', priority: 'P1', status: 'Planned' }),
      make({ id: 'X-1.5', priority: 'P1', status: 'Pending PO' }),
    ];
    assert.deepEqual(under(renderReport(input({ cases })), 'Totals'), [
      '| Priority | Automated | Open | Manual | Planned | Pending PO | Total |',
      '| -------- | --------: | ---: | -----: | ------: | ---------: | ----: |',
      '| P0       |         1 |    1 |      0 |       0 |          0 |     2 |',
      '| P1       |         0 |    1 |      0 |       1 |          1 |     3 |',
      '| Total    |         1 |    2 |      0 |       1 |          1 |     5 |',
    ]);
  });

  it('leaves out a case with no readable priority or status, and says how many', () => {
    const cases = [make({ id: 'X-1.1' }), make({ id: 'X-1.2', status: null }), make({ id: 'X-1.3', priority: null })];
    const lines = under(renderReport(input({ cases })), 'Totals');
    assert.ok(lines.includes('| Total    |         0 |    1 |      0 |       0 |          0 |     1 |'));
    assert.ok(lines.includes('2 cases have no readable priority or status and are not counted above.'));
  });
});

describe('renderReport: the ID-to-files map', () => {
  it('lists each case with its status, priority and running carriers, and skipped carriers apart', () => {
    const cases = [
      make({ id: 'X-1.1', status: 'Automated', priority: 'P0' }),
      make({ id: 'X-1.2', status: 'Open' }),
      make({ id: 'X-1.3', status: 'Open', priority: 'P2' }),
    ];
    const carriers = new Map([
      ['X-1.1', carrying(['b.spec.ts', 'a.test.ts'])],
      ['X-1.2', carrying([], ['c.spec.ts'])],
    ]);
    assert.deepEqual(under(renderReport(input({ cases, carriers })), 'ID-to-files map').slice(1), [
      'X-1.1  Automated   P0  a.test.ts, b.spec.ts',
      'X-1.2  Open        P1  —  [skipped: c.spec.ts]',
      'X-1.3  Open        P2  —',
    ]);
  });

  it('opens with the counts of cases, suites and tests', () => {
    const report = renderReport(input({ cases: [make({})], suites: 3 }));
    assert.match(report, /^1 cases in 3 suites\. 2 test files declare 10 tests, 1 of them skipped\.$/m);
  });
});
