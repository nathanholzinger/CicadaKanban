import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { checkFile } from './check.mts';
import { buildIndex, type IndexSource } from './repoIndex.mts';

const lines = (...parts: string[]): string => parts.join('\n');

const code = new Map([
  ['server/src/lib/itemTree.ts', 'export function assertWithinDepthCap() {}'],
  ['client/src/api/items.ts', 'export function moveItem() {}'],
  ['server/src/routes/items.ts', 'export const router = {};'],
]);

const DRAG_SUITE = 'docs/test-plans/board-drag-interaction/drag-5-detach.md';

const source: IndexSource = {
  wikiPages: new Map([
    ['item-attachment', '# Item attachment\n\n## 8. Depth cap\n\n## 11a. Hierarchy changes are logged\n'],
    ['board-drag-interaction', '## 2. Contexts\n\n## 5a. Collapse\n\n### 7.1 Gap and depth\n'],
  ]),
  codeFiles: [...code.keys()],
  readCode: file => code.get(file) ?? '',
  transientFiles: [
    'docs/planning/epic-4-decisions.md',
    'docs/planning/README.md',
    'docs/archive/code-quality-audit-epic1.md',
  ],
  otherFileNames: new Set(['README.md']),
  suites: new Map([
    [DRAG_SUITE, lines('# DRAG-5 — Detach', '', '**Next ID:** DRAG-5.3', '', '## DRAG-5.1 — A', '', '## DRAG-5.2 — B')],
    ['docs/test-plans/item-positioning/part-5a.md', '## TC-5a.1 — Pairs first'],
    ['docs/test-plans/item-positioning/cross-cutting.md', '## TC-X.2 — A guard'],
  ]),
};

const index = buildIndex(source);

const rulesIn = (file: string, text: string): string[] => checkFile(file, text, index).map(finding => finding.rule);
const IGNORE = (rules: string, reason = 'a fixture'): string => `// check-docs-ignore-next-line ${rules} -- ${reason}`;
const IGNORE_MD = (rules: string): string => `<!-- check-docs-ignore-next-line ${rules} -- a fixture -->`;

const CODE = 'client/src/a.ts';
const TEST = 'client/src/a.test.ts';

describe('transient-id', () => {
  it('flags each ID shape once', () => {
    const shapes = [
      'A Card is a region since Story 4.',
      'Built in Epic 3.5.',
      'Added in Phase D.',
      'Added in phase 2.',
      'Per audit epic-3-5-story-4 #8.',
      'See finding 3.',
      'Left over (#22).',
      'Ledger L1-7a.',
      'Ledger C-2.',
      'Per decision 4.',
      'Written 2026-09-24.',
    ];
    for (const shape of shapes) assert.deepEqual(rulesIn(CODE, `// ${shape}`), ['transient-id'], shape);
  });

  it('leaves the bare item-type words and workphase numbers alone', () => {
    assert.deepEqual(rulesIn(CODE, '// An Epic or a Story holds a Task; workphase 2 is terminal.'), []);
  });

  it('counts a bare finding number in code, but not in Markdown, where it can be a list item', () => {
    assert.deepEqual(rulesIn('.claude/guides/x.md', 'As signal #6 below shows.'), []);
    assert.deepEqual(rulesIn('docs/test-plans/x/README.md', 'Built for reconciliation #22.'), ['transient-id']);
    assert.deepEqual(rulesIn('.claude/guides/x.md', 'The ghost guard (#22) keeps it.'), ['transient-id']);
  });

  it('never reads strings as comments', () => {
    assert.deepEqual(rulesIn(CODE, "const label = '// Story 4';"), []);
  });

  it('checks test titles too', () => {
    assert.deepEqual(rulesIn(TEST, "it('drops the row (Story 6 seam)', () => {});"), ['transient-id']);
  });

  it('honors an ignore marker', () => {
    assert.deepEqual(rulesIn(CODE, lines(IGNORE('transient-id'), '// 2026-01-01 is the parsed date')), []);
  });
});

describe('bare-section', () => {
  it('flags a section number with no page', () => {
    assert.deepEqual(rulesIn(CODE, '// See §7 for the rule.'), ['bare-section']);
  });

  it('accepts a wiki pointer, and a list of sections on the same page', () => {
    assert.deepEqual(rulesIn(CODE, '// wiki board-drag-interaction §2, §5a and §7.1'), []);
  });

  it('applies to test plans, which only use the pointer form', () => {
    assert.deepEqual(rulesIn('docs/test-plans/x/README.md', 'Covers §8.'), ['bare-section']);
  });

  it('reads a pointer wrapped across two comment lines as one', () => {
    assert.deepEqual(rulesIn(CODE, lines('// The cap is wiki item-attachment', '// §8.')), []);
  });

  it('names the fix when the page is named without the "wiki" prefix', () => {
    const [finding] = checkFile(CODE, '// See board-drag-interaction §2.', index);
    assert.equal(finding.rule, 'bare-section');
    assert.match(finding.message, /write "wiki board-drag-interaction §2"/);
  });

  it('honors an ignore marker', () => {
    assert.deepEqual(rulesIn(CODE, lines(IGNORE('bare-section'), '// §7')), []);
  });
});

describe('wiki-pointer', () => {
  it('flags a missing page and a missing section', () => {
    assert.deepEqual(rulesIn(CODE, '// wiki no-such-page §2'), ['wiki-pointer']);
    assert.deepEqual(rulesIn(CODE, '// wiki item-attachment §9'), ['wiki-pointer']);
  });

  it('accepts subsections and inserted sections', () => {
    assert.deepEqual(rulesIn(CODE, '// wiki item-attachment §11a; wiki board-drag-interaction §7.1'), []);
  });

  it('reads a bare section inside a wiki page as that page', () => {
    const page = 'docs/wiki/item-attachment/README.md';
    assert.deepEqual(rulesIn(page, 'See §8.'), []);
    assert.deepEqual(rulesIn(page, 'See §9.'), ['wiki-pointer']);
  });

  it('reads a section after a relative link inside the wiki as the linked page', () => {
    const page = 'docs/wiki/item-attachment/README.md';
    assert.deepEqual(rulesIn(page, 'See [the drag rules](../board-drag-interaction/README.md) §7.1.'), []);
    assert.deepEqual(rulesIn(page, 'See [the drag rules](../board-drag-interaction/README.md) §8.'), ['wiki-pointer']);
  });

  it('reads a link that ends the line before as naming the page', () => {
    const page = 'docs/wiki/item-attachment/README.md';
    assert.deepEqual(rulesIn(page, lines('See [the drag rules](../board-drag-interaction/)', '§7.1 for the gap.')), []);
  });

  it('flags another page named without a link or the "wiki" prefix, even in the wiki', () => {
    assert.deepEqual(rulesIn('docs/wiki/item-attachment/README.md', 'See board-drag-interaction §2.'), [
      'wiki-pointer',
    ]);
  });

  it('treats angle-bracket placeholders as formats, not references', () => {
    assert.deepEqual(rulesIn('.claude/guides/x.md', 'Write `wiki <page> §8` or `<file>::<symbol>`.'), []);
  });

  it('honors an ignore marker', () => {
    assert.deepEqual(rulesIn('.claude/guides/x.md', lines(IGNORE_MD('wiki-pointer'), 'wiki item-attachment §12')), []);
  });
});

describe('symbol-ref', () => {
  it('flags a missing file, a missing symbol and an ambiguous file name', () => {
    assert.deepEqual(rulesIn(CODE, '// itemTre.ts::assertWithinDepthCap'), ['symbol-ref']);
    assert.deepEqual(rulesIn(CODE, '// itemTree.ts::assertNothing'), ['symbol-ref']);
    assert.deepEqual(rulesIn(CODE, '// items.ts::moveItem'), ['symbol-ref']);
  });

  it('accepts a unique name, or the shortest unique path', () => {
    assert.deepEqual(rulesIn(CODE, '// itemTree.ts::assertWithinDepthCap and api/items.ts::moveItem'), []);
  });

  it('honors an ignore marker', () => {
    assert.deepEqual(rulesIn(CODE, lines(IGNORE('symbol-ref'), '// items.ts::moveItem')), []);
  });
});

describe('bare-case-id', () => {
  it('flags a case number with no suite part in a title or a comment', () => {
    assert.deepEqual(rulesIn(TEST, "it('TC-4: moves a card', () => {});"), ['bare-case-id']);
    assert.deepEqual(rulesIn(TEST, '// covers TC-4'), ['bare-case-id']);
  });

  it('accepts qualified case IDs', () => {
    assert.deepEqual(rulesIn(TEST, "it('DRAG-5.1 and TC-5a.1: moves a card', () => {});"), []);
  });

  it('does not apply to Markdown', () => {
    assert.deepEqual(rulesIn('docs/test-plans/x/README.md', 'Case TC-4.'), []);
  });

  it('honors an ignore marker', () => {
    assert.deepEqual(rulesIn(TEST, lines(IGNORE('bare-case-id'), "it('TC-4 fixture', () => {});")), []);
  });
});

describe('claude-ref', () => {
  it('flags a code comment that names an agent-instruction file', () => {
    assert.deepEqual(rulesIn(CODE, '// Read CLAUDE.md first.'), ['claude-ref']);
    assert.deepEqual(rulesIn(CODE, '// Per .claude/guides.'), ['claude-ref']);
  });

  it('does not apply to Markdown', () => {
    assert.deepEqual(rulesIn('.claude/guides/x.md', 'Read CLAUDE.md first.'), []);
  });

  it('honors an ignore marker', () => {
    assert.deepEqual(rulesIn(CODE, lines(IGNORE('claude-ref'), '// CLAUDE.md')), []);
  });
});

describe('transient-link', () => {
  it('flags a path, a relative link and a bare file name', () => {
    assert.deepEqual(rulesIn(CODE, '// See docs/planning/epic-4-decisions.md for why.'), ['transient-link']);
    assert.deepEqual(rulesIn('docs/wiki/item-attachment/README.md', '[why](../../planning/epic-4-decisions.md)'), [
      'transient-link',
    ]);
    assert.deepEqual(rulesIn(CODE, '// epic-4-decisions.md asks this.'), ['transient-link']);
  });

  it('does not count naming a folder, or a file name a living doc shares', () => {
    assert.deepEqual(rulesIn('.claude/guides/x.md', 'Closed docs move to docs/archive/.'), []);
    assert.deepEqual(rulesIn('.claude/guides/x.md', 'Start from README.md.'), []);
  });

  it('honors an ignore marker', () => {
    const text = lines(IGNORE_MD('transient-link'), 'Open work is tracked in docs/planning/epic-4-decisions.md.');
    assert.deepEqual(rulesIn('.claude/guides/x.md', text), []);
  });
});

describe('wiki-code-name', () => {
  const page = 'docs/wiki/item-attachment/README.md';

  it('flags a code file, a code path and a double-colon name in the wiki', () => {
    assert.deepEqual(rulesIn(page, 'The cap lives in itemTree.ts.'), ['wiki-code-name']);
    assert.deepEqual(rulesIn(page, 'See client/src/components.'), ['wiki-code-name']);
    assert.deepEqual(rulesIn(page, 'See `itemTree.ts::assertWithinDepthCap`.'), ['wiki-code-name']);
  });

  it('accepts links to other docs and API routes', () => {
    assert.deepEqual(
      rulesIn(page, 'See [positioning](../item-positioning/README.md) and `PATCH /items/:id/move`.'),
      [],
    );
    assert.deepEqual(rulesIn(page, 'Cases are in [the plan](../../test-plans/attachment/README.md).'), []);
  });

  it('applies only inside the wiki', () => {
    assert.deepEqual(rulesIn('.claude/guides/x.md', 'The cap lives in itemTree.ts.'), []);
  });

  it('honors an ignore marker', () => {
    assert.deepEqual(rulesIn(page, lines(IGNORE_MD('wiki-code-name'), 'The cap lives in itemTree.ts.')), []);
  });
});

describe('case-id', () => {
  const INDEX_FILE = 'docs/test-plans/board-drag-interaction/INDEX.md';

  it('flags an ID no case heading declares, in a title, a comment and a test plan', () => {
    assert.deepEqual(rulesIn(TEST, "it('DRAG-5.4: detaches', () => {});"), ['case-id']);
    assert.deepEqual(rulesIn(CODE, '// covers DRAG-7.1'), ['case-id']);
    assert.deepEqual(rulesIn(INDEX_FILE, 'Also see DRAG-5.9.'), ['case-id']);
  });

  it('accepts every ID the catalog declares, whatever its suite part', () => {
    assert.deepEqual(rulesIn(TEST, "it('DRAG-5.1, DRAG-5.2, TC-5a.1 and TC-X.2: moves a card', () => {});"), []);
  });

  it('takes its prefixes from the catalog, so a new suite works without a code change', () => {
    assert.deepEqual(rulesIn(CODE, '// BCU-1.2'), []);
    const withBoards = buildIndex({
      ...source,
      suites: new Map([...source.suites, ['docs/test-plans/boards/bcu-1.md', '## BCU-1.1 — A board']]),
    });
    assert.deepEqual(
      checkFile(CODE, '// BCU-1.1 and BCU-1.2', withBoards).map(finding => finding.message),
      ['no case "BCU-1.2" in the test-plan catalog'],
    );
  });

  it('leaves bare case numbers, placeholders and the tail of a range alone', () => {
    assert.deepEqual(rulesIn(INDEX_FILE, 'Cases DRAG-5.1–5.9 are `<suite>.<n>`; see TC-4.'), []);
  });

  it('checks Markdown only in the test plans', () => {
    assert.deepEqual(rulesIn('.claude/guides/x.md', 'For example, DRAG-9.9.'), []);
  });

  it("exempts a suite's Next ID from the lookup, and checks it's past every case", () => {
    assert.deepEqual(rulesIn(DRAG_SUITE, '**Next ID:** DRAG-5.3'), []);
    const [finding] = checkFile(DRAG_SUITE, '**Next ID:** DRAG-5.2', index);
    assert.equal(finding.rule, 'case-id');
    assert.match(finding.message, /must be past DRAG-5\.2, this suite's highest case/);
  });

  it('flags a Next ID that names another suite', () => {
    assert.deepEqual(rulesIn(DRAG_SUITE, '**Next ID:** DRAG-6.1'), ['case-id']);
  });

  it('exempts only the Next ID line of a suite file', () => {
    assert.deepEqual(rulesIn(INDEX_FILE, '**Next ID:** DRAG-5.3'), ['case-id']);
    assert.deepEqual(rulesIn(DRAG_SUITE, 'The next case is DRAG-5.3.'), ['case-id']);
  });

  it('honors an ignore marker', () => {
    assert.deepEqual(rulesIn(TEST, lines(IGNORE('case-id'), "it('DRAG-5.4: a fixture', () => {});")), []);
  });
});

describe('limiting a run to some rules', () => {
  const rulesOnly = (text: string, ...only: string[]): string[] =>
    checkFile(CODE, text, index, new Set(only)).map(finding => finding.rule);

  it('reports only the named rules', () => {
    assert.deepEqual(rulesOnly('// Story 4 covers DRAG-9.9', 'case-id'), ['case-id']);
    assert.deepEqual(rulesOnly('// Story 4 covers DRAG-9.9', 'case-id', 'transient-id'), ['transient-id', 'case-id']);
  });

  it("still applies a marker for a rule it doesn't report", () => {
    assert.deepEqual(rulesOnly(lines(IGNORE('transient-id'), '// Story 4 covers DRAG-9.9'), 'case-id'), ['case-id']);
  });

  it('reports a marker problem only when the marker names a rule being reported, or an unknown one', () => {
    const unused = lines(IGNORE('transient-id'), 'const a = 1;');
    assert.deepEqual(rulesOnly(unused, 'case-id'), []);
    assert.deepEqual(rulesOnly(unused, 'transient-id'), ['ignore-marker']);
    assert.deepEqual(rulesOnly(lines(IGNORE('case-idd'), 'const a = 1;'), 'case-id'), ['ignore-marker']);
  });
});

describe('ignore markers', () => {
  it('reports a marker with no reason, and suppresses nothing', () => {
    const text = lines('// check-docs-ignore-next-line transient-id', '// Story 4');
    assert.deepEqual(rulesIn(CODE, text), ['ignore-marker', 'transient-id']);
  });

  it('reports a marker that names an unknown rule', () => {
    assert.deepEqual(rulesIn(CODE, lines(IGNORE('no-such-rule'), '// fine')), ['ignore-marker']);
  });

  it('reports a marker that covers nothing', () => {
    assert.deepEqual(rulesIn(CODE, lines(IGNORE('transient-id'), 'const a = 1;')), ['ignore-marker']);
  });

  it('covers only the next line', () => {
    assert.deepEqual(rulesIn(CODE, lines(IGNORE('transient-id'), '// Story 4', '// Story 5')), ['transient-id']);
  });
});
