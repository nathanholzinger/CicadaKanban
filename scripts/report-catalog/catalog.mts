// Reads a test-plan suite file into its cases, in the forms the test plans' README fixes
// ("Fields the coverage report reads"): each case's ID, the priority and status on its own
// line, the status in the suite's summary table, and its Automation line. The table is read
// by its cells, trimmed, since Prettier pads some tables and not others. A field in no form
// the README gives is reported as a problem and left unread. Nothing here edits the catalog.

import { unfencedLines } from '../check-docs/extract.mts';
import { CASE_ID, caseIdOfHeading } from '../check-docs/repoIndex.mts';

export const STATUSES = ['Automated', 'Open', 'Manual', 'Planned', 'Pending PO'] as const;
export type Status = (typeof STATUSES)[number];

export type Automation =
  | { kind: 'files'; paths: string[] }
  /** `—`: coverage isn't confirmed. */
  | { kind: 'unconfirmed' }
  /** `none — manual: <reason>`. */
  | { kind: 'manual'; reason: string }
  | { kind: 'unreadable'; text: string };

export interface CatalogCase {
  id: string;
  /** Repo-relative path of the suite file. */
  suite: string;
  /** From the case's own line, else the table; null when neither gives one. */
  priority: string | null;
  /** The case's own line's status; the table's when the line's is missing or not one of the five. */
  status: Status | null;
  /** The text of each status as written (`Planned, replaces <ID>` included); null when absent. */
  lineStatus: string | null;
  tableStatus: string | null;
  /** Null when the case has no Automation line. */
  automation: Automation | null;
}

export interface CatalogProblem {
  suite: string;
  id: string | null;
  message: string;
}

const STATUS_NAMES = new Set<string>(STATUSES);
const WHOLE_ID = new RegExp(`^${CASE_ID}$`);
const TABLE_HEADER = ['ID', 'Case', 'Priority', 'Status'];
const SEPARATOR_CELL = /^:?-+:?$/;
const AUTOMATION_LABEL = '**Automation test:**';
const MANUAL_AUTOMATION = /^none\s+—\s+manual:\s*(.*)$/;
const PATH_LIST = /^`[^`]+`(?:\s*,\s*`[^`]+`)*$/;

/** The status a written status stands for: `Planned, replaces <ID>` is a `Planned`. Null for any other text. */
export function statusOf(written: string): Status | null {
  if (STATUS_NAMES.has(written)) return written as Status;
  return new RegExp(`^Planned, replaces ${CASE_ID}$`).test(written) ? 'Planned' : null;
}

export function readSuite(suite: string, text: string): { cases: CatalogCase[]; problems: CatalogProblem[] } {
  const problems: CatalogProblem[] = [];
  const problem = (id: string | null, message: string): void => {
    problems.push({ suite, id, message });
  };

  const rows = new Map<string, { priority: string; status: string }>();
  const sections: { id: string; body: string[] }[] = [];
  let inSection = false;
  let table: 'none' | 'separator' | 'rows' = 'none';

  for (const { text: line } of unfencedLines(text)) {
    const id = caseIdOfHeading(line);
    if (id !== null) {
      sections.push({ id, body: [] });
      inSection = true;
    } else if (/^#{1,2}\s/.test(line)) {
      inSection = false;
    } else if (inSection) {
      sections[sections.length - 1].body.push(line);
    }

    // The summary table sits ahead of the cases; a table inside a case is that case's own.
    const cells = inSection ? null : tableCells(line);
    if (cells === null) {
      table = 'none';
    } else if (table === 'rows') {
      readRow(cells, rows, problem);
    } else if (table === 'separator') {
      table = cells.every(cell => SEPARATOR_CELL.test(cell)) ? 'rows' : 'none';
    } else if (cells.length === TABLE_HEADER.length && TABLE_HEADER.every((name, i) => cells[i] === name)) {
      table = 'separator';
    }
  }

  const cases: CatalogCase[] = [];
  const seen = new Set<string>();
  for (const { id, body } of sections) {
    if (seen.has(id)) {
      problem(id, 'more than one section in this suite; the first is read');
      continue;
    }
    seen.add(id);
    cases.push(readCase(suite, id, body, rows.get(id) ?? null, problem));
  }
  for (const id of rows.keys()) if (!seen.has(id)) problem(id, 'in the summary table, but no `## <ID>` section');

  return { cases, problems };
}

function readRow(
  cells: string[],
  rows: Map<string, { priority: string; status: string }>,
  problem: (id: string | null, message: string) => void,
): void {
  const id = cells[0];
  if (cells.length < 4 || !WHOLE_ID.test(id)) {
    problem(WHOLE_ID.test(id) ? id : null, `summary table row can't be read: | ${cells.join(' | ')} |`);
    return;
  }
  if (rows.has(id)) {
    problem(id, 'in the summary table more than once; the first is read');
    return;
  }
  // A case title holding an unescaped "|" adds cells in the middle; priority and status end the row.
  rows.set(id, { priority: cells[cells.length - 2], status: cells[cells.length - 1] });
}

function readCase(
  suite: string,
  id: string,
  body: string[],
  row: { priority: string; status: string } | null,
  problem: (id: string | null, message: string) => void,
): CatalogCase {
  const fields = caseLineFields(body);
  const lineStatus = fields?.get('Status') ?? null;
  const linePriority = fields?.get('Priority') ?? null;
  if (fields === null) problem(id, 'no `**Priority:** … · **Status:** …` line');
  else if (lineStatus === null || linePriority === null) problem(id, 'case line lacks a priority or a status');
  if (row === null) problem(id, 'no row in the summary table');

  const tableStatus = row?.status ?? null;
  for (const [where, written] of [
    ['case line', lineStatus],
    ['summary table', tableStatus],
  ] as const) {
    if (written !== null && statusOf(written) === null) {
      problem(id, `status on the ${where} is not one of the five statuses: "${written}"`);
    }
  }
  if (linePriority !== null && row !== null && linePriority !== row.priority) {
    problem(id, `priority ${linePriority} on the case line, ${row.priority} in the summary table`);
  }

  const readable = (written: string | null): Status | null => (written === null ? null : statusOf(written));
  return {
    id,
    suite,
    priority: linePriority ?? row?.priority ?? null,
    status: readable(lineStatus) ?? readable(tableStatus),
    lineStatus,
    tableStatus,
    automation: readAutomation(id, body, problem),
  };
}

// The first line of the section that starts `**Priority:**`, split into its `**Name:** value`
// fields at the " · " that separates them. Null when the section has no such line.
function caseLineFields(body: string[]): Map<string, string> | null {
  const line = body.find(text => text.startsWith('**Priority:**'));
  if (line === undefined) return null;
  const fields = new Map<string, string>();
  for (const part of line.split(' · ')) {
    const field = /^\*\*([^*:]+):\*\*\s*(.*)$/.exec(part.trim());
    if (field) fields.set(field[1], field[2].trim());
  }
  return fields;
}

function readAutomation(
  id: string,
  body: string[],
  problem: (id: string | null, message: string) => void,
): Automation | null {
  const lines = body.filter(text => text.startsWith(AUTOMATION_LABEL));
  if (lines.length === 0) {
    problem(id, 'no `**Automation test:**` line');
    return null;
  }
  if (lines.length > 1) problem(id, 'more than one `**Automation test:**` line; the first is read');

  const value = lines[0].slice(AUTOMATION_LABEL.length).trim();
  if (value === '—') return { kind: 'unconfirmed' };
  const manual = MANUAL_AUTOMATION.exec(value);
  if (manual) return { kind: 'manual', reason: manual[1].trim() };

  // A list that ends in a comma runs on to the next line, which this reader does not follow.
  if (PATH_LIST.test(value)) {
    return { kind: 'files', paths: [...value.matchAll(/`([^`]+)`/g)].map(match => match[1].trim()) };
  }
  problem(id, `Automation line is not backticked paths, "—" or "none — manual: <reason>": ${value}`);
  return { kind: 'unreadable', text: value };
}

// The trimmed cells of a table row, or null for a line that is not one. A "|" escaped with a
// backslash belongs to its cell.
function tableCells(line: string): string[] | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|')) return null;
  const inner = trimmed.slice(1).replace(/(?<!\\)\|$/, '');
  return inner.split(/(?<!\\)\|/).map(cell => cell.trim());
}
