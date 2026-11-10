import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readSuite, statusOf } from './catalog.mts';

const lines = (...parts: string[]): string => parts.join('\n');
const SUITE = 'docs/test-plans/x/x-1.md';

const table = (...rows: string[]): string[] => [
  '| ID    | Case | Priority | Status |',
  '| ----- | ---- | -------- | ------ |',
  ...rows,
];
const section = (id: string, line: string, ...rest: string[]): string[] => [
  `## ${id} — A case`,
  '',
  line,
  '',
  '_Given_ a, _when_ b, _then_ c.',
  '',
  ...rest,
  '',
  '---',
  '',
];

describe('readSuite', () => {
  it('reads a case’s ID, priority, status, table status and Automation paths', () => {
    const text = lines(
      '# X-1 — Suite',
      '',
      ...table('| X-1.1 | A case | P0       | Open   |'),
      '',
      '---',
      '',
      ...section(
        'X-1.1',
        '**Priority:** P0 · **Status:** Open · **Rule:** wiki page §1',
        '**Automation test:** `tests/ui/a.spec.ts`, `client/src/b.test.ts`',
      ),
    );
    const { cases, problems } = readSuite(SUITE, text);
    assert.deepEqual(problems, []);
    assert.deepEqual(cases, [
      {
        id: 'X-1.1',
        suite: SUITE,
        priority: 'P0',
        status: 'Open',
        lineStatus: 'Open',
        tableStatus: 'Open',
        automation: { kind: 'files', paths: ['tests/ui/a.spec.ts', 'client/src/b.test.ts'] },
      },
    ]);
  });

  it('reads a table by its cells, padded or not', () => {
    const padded = lines(
      '| ID    | Case                | Priority | Status    |',
      '| ----- | ------------------- | -------- | --------- |',
      '| X-1.1 | A longer case title | P1       | Automated |',
      '',
      ...section('X-1.1', '**Priority:** P1 · **Status:** Automated', '**Automation test:** `a.spec.ts`'),
    );
    const bare = lines(
      '|ID|Case|Priority|Status|',
      '|---|---|---|---|',
      '|X-1.1|A case|P1|Automated|',
      '',
      ...section('X-1.1', '**Priority:** P1 · **Status:** Automated', '**Automation test:** `a.spec.ts`'),
    );
    for (const text of [padded, bare]) {
      const { cases, problems } = readSuite(SUITE, text);
      assert.deepEqual(problems, []);
      assert.equal(cases[0].tableStatus, 'Automated');
    }
  });

  it('keeps an escaped pipe in a title inside its cell', () => {
    const text = lines(
      ...table('| X-1.1 | A \\| B | P1 | Open |'),
      '',
      ...section('X-1.1', '**Priority:** P1 · **Status:** Open', '**Automation test:** —'),
    );
    const { cases, problems } = readSuite(SUITE, text);
    assert.deepEqual(problems, []);
    assert.deepEqual([cases[0].priority, cases[0].tableStatus], ['P1', 'Open']);
  });

  it('reads the three Automation forms: paths, an unconfirmed dash, and a manual line', () => {
    const text = lines(
      ...table(
        '| X-1.1 | a | P1 | Open |',
        '| X-1.2 | b | P1 | Manual |',
        '| X-1.3 | c | P2 | Planned, replaces X-1.1 |',
      ),
      '',
      ...section('X-1.1', '**Priority:** P1 · **Status:** Open', '**Automation test:** —'),
      ...section('X-1.2', '**Priority:** P1 · **Status:** Manual', '**Automation test:** none — manual: feel'),
      ...section(
        'X-1.3',
        '**Priority:** P2 · **Status:** Planned, replaces X-1.1 · **Rule:** wiki page §2',
        '**Automation test:** —',
      ),
    );
    const { cases, problems } = readSuite(SUITE, text);
    assert.deepEqual(problems, []);
    assert.deepEqual(
      cases.map(found => found.automation),
      [{ kind: 'unconfirmed' }, { kind: 'manual', reason: 'feel' }, { kind: 'unconfirmed' }],
    );
    assert.deepEqual([cases[2].status, cases[2].lineStatus], ['Planned', 'Planned, replaces X-1.1']);
  });

  it('reads no case, row or Automation line from inside a fence', () => {
    const text = lines(
      ...table('| X-1.1 | a | P1 | Open |'),
      '',
      ...section('X-1.1', '**Priority:** P1 · **Status:** Open', '**Automation test:** —'),
      '```',
      '## X-1.2 — An example',
      '**Automation test:** `shown.spec.ts`',
      '```',
    );
    const { cases, problems } = readSuite(SUITE, text);
    assert.deepEqual(problems, []);
    assert.deepEqual(
      cases.map(found => found.id),
      ['X-1.1'],
    );
  });

  it('keeps a fence-like content line from closing a fence: no case from inside it, the prose after it read', () => {
    const text = lines(
      ...table('| X-1.1 | a | P1 | Open |', '| X-1.3 | c | P1 | Open |'),
      '',
      ...section('X-1.1', '**Priority:** P1 · **Status:** Open', '**Automation test:** —'),
      '```md',
      '```this is content',
      '## X-1.2 — An example',
      '**Automation test:** `shown.spec.ts`',
      '```',
      '',
      ...section('X-1.3', '**Priority:** P1 · **Status:** Open', '**Automation test:** —'),
    );
    const { cases, problems } = readSuite(SUITE, text);
    assert.deepEqual(problems, []);
    assert.deepEqual(
      cases.map(found => found.id),
      ['X-1.1', 'X-1.3'],
    );
  });

  it('takes the status and priority from the table when the case has no line, and says so', () => {
    const text = lines(...table('| X-1.1 | a | P2 | Open |'), '', ...section('X-1.1', 'Prose, no fields.'));
    const { cases, problems } = readSuite(SUITE, text);
    assert.deepEqual([cases[0].status, cases[0].priority, cases[0].lineStatus], ['Open', 'P2', null]);
    assert.deepEqual(
      problems.map(problem => problem.message),
      ['no `**Priority:** … · **Status:** …` line', 'no `**Automation test:**` line'],
    );
  });

  it('reports a case with no table row, and a row with no case', () => {
    const text = lines(
      ...table('| X-1.2 | b | P1 | Open |'),
      '',
      ...section('X-1.1', '**Priority:** P1 · **Status:** Open', '**Automation test:** —'),
    );
    const { problems } = readSuite(SUITE, text);
    assert.deepEqual(
      problems.map(({ id, message }) => [id, message]),
      [
        ['X-1.1', 'no row in the summary table'],
        ['X-1.2', 'in the summary table, but no `## <ID>` section'],
      ],
    );
  });

  it('reports a status that is not one of the five, and leaves it out of the case’s status', () => {
    const text = lines(
      ...table('| X-1.1 | a | P1 | Done |'),
      '',
      ...section('X-1.1', '**Priority:** P1 · **Status:** Done', '**Automation test:** —'),
    );
    const { cases, problems } = readSuite(SUITE, text);
    assert.equal(cases[0].status, null);
    assert.equal(problems.length, 2);
    assert.match(problems[0].message, /status on the case line is not one of the five statuses: "Done"/);
    assert.match(problems[1].message, /status on the summary table is not one of the five statuses: "Done"/);
  });

  it('falls back to the table’s status when the case line’s is not one of the five, and still reports it', () => {
    const text = lines(
      ...table('| X-1.1 | a | P1 | Automated |'),
      '',
      ...section('X-1.1', '**Priority:** P1 · **Status:** Done', '**Automation test:** —'),
    );
    const { cases, problems } = readSuite(SUITE, text);
    assert.equal(cases[0].status, 'Automated');
    assert.equal(problems.length, 1);
    assert.match(problems[0].message, /status on the case line is not one of the five statuses: "Done"/);
  });

  it('reads no summary row from a table inside a case, and ends a case at a top-level heading', () => {
    const text = lines(
      ...table('| X-1.1 | a | P1 | Open |'),
      '',
      ...section(
        'X-1.1',
        '**Priority:** P1 · **Status:** Open',
        '| ID    | Case | Priority | Status |',
        '| ----- | ---- | -------- | ------ |',
        '| X-9.9 | not a case | P0 | Automated |',
        '**Automation test:** —',
      ),
      '# A later top-level heading',
      '**Automation test:** `stray.spec.ts`',
    );
    const { cases, problems } = readSuite(SUITE, text);
    assert.deepEqual(problems, []);
    assert.deepEqual(cases[0].automation, { kind: 'unconfirmed' });
  });

  it('reports a priority that differs between the line and the table', () => {
    const text = lines(
      ...table('| X-1.1 | a | P1 | Open |'),
      '',
      ...section('X-1.1', '**Priority:** P0 · **Status:** Open', '**Automation test:** —'),
    );
    const { cases, problems } = readSuite(SUITE, text);
    assert.equal(cases[0].priority, 'P0');
    assert.deepEqual(
      problems.map(problem => problem.message),
      ['priority P0 on the case line, P1 in the summary table'],
    );
  });

  it('reports an Automation line in no form the README gives, and a second Automation line', () => {
    const text = lines(
      ...table('| X-1.1 | a | P1 | Open |', '| X-1.2 | b | P1 | Open |'),
      '',
      ...section('X-1.1', '**Priority:** P1 · **Status:** Open', '**Automation test:** tests/a.spec.ts (partial)'),
      ...section(
        'X-1.2',
        '**Priority:** P1 · **Status:** Open',
        '**Automation test:** `a.spec.ts`',
        '**Automation test:** `b.spec.ts`',
      ),
    );
    const { cases, problems } = readSuite(SUITE, text);
    assert.deepEqual(cases[0].automation, { kind: 'unreadable', text: 'tests/a.spec.ts (partial)' });
    assert.deepEqual(cases[1].automation, { kind: 'files', paths: ['a.spec.ts'] });
    assert.equal(problems.length, 2);
    assert.match(problems[0].message, /Automation line is not backticked paths/);
    assert.match(problems[1].message, /more than one `\*\*Automation test:\*\*` line/);
  });

  it('reports an Automation list that ends in a comma, which runs on to a line it does not read', () => {
    const text = lines(
      ...table('| X-1.1 | a | P1 | Open |'),
      '',
      ...section('X-1.1', '**Priority:** P1 · **Status:** Open', '**Automation test:** `a.spec.ts`,', '`b.spec.ts`'),
    );
    const { cases, problems } = readSuite(SUITE, text);
    assert.deepEqual(cases[0].automation, { kind: 'unreadable', text: '`a.spec.ts`,' });
    assert.equal(problems.length, 1);
  });
});

describe('statusOf', () => {
  it('knows the five statuses, and `Planned, replaces <ID>` as a Planned', () => {
    for (const status of ['Automated', 'Open', 'Manual', 'Planned', 'Pending PO'])
      assert.equal(statusOf(status), status);
    assert.equal(statusOf('Planned, replaces DRAG-5.1'), 'Planned');
  });

  it('knows no other text', () => {
    for (const text of ['open', 'Done', 'Open, replaces X-1.1', 'Planned, replaces', ''])
      assert.equal(statusOf(text), null);
  });
});
