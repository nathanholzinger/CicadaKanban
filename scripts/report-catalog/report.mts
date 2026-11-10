// The report as text: the four checks and the catalog fields that couldn't be read, each as
// one line per finding or "none"; the totals by priority and status; then the map from each
// case to the files whose running tests carry it, with skipped carriers apart. It is
// Markdown, so it can be handed over as it is.

import type { Carriers } from './carriers.mts';
import { STATUSES, type CatalogCase, type CatalogProblem } from './catalog.mts';
import type { Checks } from './checks.mts';

export interface ReportInput {
  suites: number;
  cases: readonly CatalogCase[];
  problems: readonly CatalogProblem[];
  checks: Checks;
  carriers: ReadonlyMap<string, Carriers>;
  tests: { files: number; tests: number; skipped: number };
}

export function renderReport(input: ReportInput): string {
  const { cases, problems, checks, tests } = input;
  const out = [
    '# Catalog coverage report',
    '',
    `${cases.length} cases in ${input.suites} suites. ${tests.files} test files declare ${tests.tests} tests, ${tests.skipped} of them skipped.`,
    '',
    ...section(
      'Lost coverage',
      'Automated cases that no running test carries.',
      checks.lostCoverage.map(
        ({ id, automation, skipped }) =>
          `${id} — Automation line: ${list(automation)}${skipped.length > 0 ? `; skipped tests carry it in: ${list(skipped)}` : ''}`,
      ),
    ),
    ...section(
      'Manual cases a running test carries',
      'Manual cases that a running test now carries.',
      checks.manualCarried.map(({ id, files }) => `${id} — carried in: ${list(files)}`),
    ),
    ...section(
      'Stale Automation lines',
      'Paths that do not exist, or that name a file where no running test carries the case.',
      checks.staleAutomation.map(({ id, path, reason }) => `${id} — ${path}: ${reason}`),
    ),
    ...section(
      'Two statuses for one case',
      'Cases whose summary table row and own line give different statuses.',
      checks.statusDisagreements.map(
        ({ id, suite, table, caseLine }) => `${id} — table: ${table}; case line: ${caseLine} (${suite})`,
      ),
    ),
    ...section(
      'Catalog fields not read',
      'Fields in no form the test plans README gives. The report leaves them out of the checks it cannot make.',
      problems.map(({ suite, id, message }) => `${id ?? '(no case)'} — ${message} (${suite})`),
    ),
    '## Totals',
    '',
    ...totalsTable(cases),
    '',
    '## ID-to-files map',
    '',
    'Each case, its status and priority, then the files whose running tests carry it; skipped carriers follow apart.',
    '',
    ...caseMap(cases, input.carriers),
  ];
  return out.join('\n');
}

function section(title: string, about: string, findings: string[]): string[] {
  return [`## ${title}`, '', about, '', ...(findings.length === 0 ? ['none'] : findings.map(f => `- ${f}`)), ''];
}

const list = (paths: readonly string[]): string => (paths.length === 0 ? '—' : paths.join(', '));

function totalsTable(cases: readonly CatalogCase[]): string[] {
  const counted = cases.filter(found => found.priority !== null && found.status !== null);
  const priorities = [...new Set(counted.map(found => found.priority!))].sort();
  const count = (priority: string | null, status: string | null): number =>
    counted.filter(
      found => (priority === null || found.priority === priority) && (status === null || found.status === status),
    ).length;

  const rows = [
    ['Priority', ...STATUSES, 'Total'],
    ...[...priorities, null].map(priority => [
      priority ?? 'Total',
      ...[...STATUSES, null].map(status => String(count(priority, status))),
    ]),
  ];
  const widths = rows[0].map((_, column) => Math.max(...rows.map(row => row[column].length)));
  const line = (row: string[]): string =>
    `| ${row.map((cell, column) => (column === 0 ? cell.padEnd(widths[column]) : cell.padStart(widths[column]))).join(' | ')} |`;
  const rule = `| ${widths.map((width, column) => (column === 0 ? '-'.repeat(width) : `${'-'.repeat(width - 1)}:`)).join(' | ')} |`;

  const lines = [line(rows[0]), rule, ...rows.slice(1).map(line)];
  const unread = cases.length - counted.length;
  if (unread > 0) lines.push('', `${unread} cases have no readable priority or status and are not counted above.`);
  return lines;
}

function caseMap(cases: readonly CatalogCase[], carriers: ReadonlyMap<string, Carriers>): string[] {
  const idWidth = Math.max(0, ...cases.map(found => found.id.length));
  const statusWidth = Math.max(...[...STATUSES, 'unread'].map(status => status.length));
  return cases.map(found => {
    const carried = carriers.get(found.id);
    const running = [...(carried?.running ?? [])].sort();
    const skipped = [...(carried?.skipped ?? [])].sort();
    const fields = [
      found.id.padEnd(idWidth),
      (found.status ?? 'unread').padEnd(statusWidth),
      (found.priority ?? '?').padEnd(2),
      list(running),
    ];
    return `${fields.join('  ')}${skipped.length > 0 ? `  [skipped: ${list(skipped)}]` : ''}`;
  });
}
