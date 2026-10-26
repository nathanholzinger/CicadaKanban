// The dev-only deep seed: project and item hierarchies about twelve levels down, with names
// as long as real ones, for looking at how the UI draws depth. It writes rows directly, so it
// goes past any depth cap: a cap gates writes and never invalidates data, so what is seeded
// stays readable at any cap (wiki hierarchy-placement §6). `seedDeep.ts` runs it against a
// database file of its own.

import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from './index.js';
import { items, projects, workflowTemplatePhases, workflowTemplates, workflows, workphases } from './schema.js';
import { createDefaultBoard } from '../lib/defaultBoard.js';

// The seeded project hierarchy: one chain, root first, with a few siblings along it and a
// second root beside it.
const PROJECT_CHAIN = [
  'Platform modernization program',
  'Customer-facing web application rewrite',
  'Account and billing experience overhaul',
  'Subscription management and invoicing',
  'Invoice generation and delivery pipeline',
  'PDF rendering and localization support',
  'Right-to-left layout and font coverage',
  'Arabic and Hebrew typography audit',
  'Glyph fallback behaviour across browsers',
  'Print stylesheet regression checklist',
  'Automated visual diff baseline upkeep',
  'Baseline refresh runbook for each release',
];
// A sibling of the chain's project at `chainIndex`, so the tree branches.
const PROJECT_SIBLINGS = [
  { chainIndex: 2, name: 'Internal tooling and observability' },
  { chainIndex: 5, name: 'Data retention and export controls' },
  { chainIndex: 8, name: 'Accessibility conformance review' },
];
const SECOND_ROOT = {
  name: 'Reading list and learning notes',
  children: ['Distributed systems papers to revisit', 'Typography references worth keeping'],
};

type ItemKind = 'Epic' | 'Story' | 'Task';
const ITEM_TYPE_IDS: Record<ItemKind, string> = {
  Epic: '00000000-0000-0000-0000-000000000001',
  Story: '00000000-0000-0000-0000-000000000002',
  Task: '00000000-0000-0000-0000-000000000003',
};

interface SeedNode {
  title: string;
  description?: string;
  /** A Free child: set apart from its parent, drawn as a Card of its own. */
  free?: boolean;
  /** The workphase a Card or Free child sits in; a Stub takes its Card's. */
  workphase?: string;
  children?: SeedNode[];
}

// A single path of nodes, each the only child of the one before, with `tail` under the last.
function chainOf(titles: string[], tail: SeedNode[] = []): SeedNode[] {
  const [first, ...rest] = titles;
  if (first === undefined) return tail;
  return [{ title: first, children: chainOf(rest, tail) }];
}

const DEEP_CHAIN_TITLES = [
  'Inventory every template the legacy generator still renders',
  'Map each template to a section in the new layout system',
  'Port the header and footer blocks with their tax lines',
  'Rebuild the line-item table with grouped discounts',
  'Handle multi-currency rounding in the totals row',
  'Cover the zero-amount and credit-note edge cases',
  "Verify output against last quarter's archived invoices",
  'Compare page breaks on long itemized statements',
  'Tune the PDF font subsetting to keep files small',
  'Add the accessibility tags to the generated documents',
  'Run the nightly batch against production-sized data',
  'Sign off the cutover plan with the finance team',
];

const FREE_CHILD_CHAIN_TITLES = [
  'List the saved cards that cannot migrate',
  'Group them by the reason the vault rejects them',
  'Draft the email for each group in plain language',
  'Review the wording with the support team',
  'Schedule the send outside the billing window',
];

// Letters mark the rows a hierarchy-modal and overflow-row walkthrough names: `P` is the
// Card, `A` heads a chain down to `Q`, which has `R` and `T`, and so on.
const CHECKOUT_CARD: SeedNode = {
  title: 'Overhaul the checkout and payment flow',
  description: 'The tree the overflow row and hierarchy modal are walked through on.',
  children: [
    {
      title: 'A · Audit the existing payment provider integrations',
      children: [
        {
          title: 'Q · Define the retry and idempotency rules for charges',
          children: [
            {
              title: 'R · Migrate card-on-file tokens to the new vault',
              children: [
                {
                  title: 'R1 · Backfill tokens for accounts created before 2021',
                  children: [{ title: 'R1a · Reconcile mismatched expiry dates by hand' }],
                },
                { title: 'R2 · Roll back safely when the vault rejects a batch' },
                {
                  title: "F · Notify customers whose saved cards can't migrate",
                  free: true,
                  children: chainOf(FREE_CHILD_CHAIN_TITLES),
                },
              ],
            },
            {
              title: 'T · Add 3-D Secure challenge handling for EU cards',
              children: [{ title: 'G · Draft the support macro for declined challenges', free: true }],
            },
          ],
        },
      ],
    },
    { title: 'B · Update the checkout copy and error messages' },
  ],
};

const WIDE_CARD: SeedNode = {
  title: 'Triage the backlog of reconciliation exceptions',
  description: 'One row at the third level with a long list of children under it.',
  workphase: 'In Progress',
  children: chainOf(
    ['Group the open exceptions by ledger and region', 'Rank each group by the amount still unreconciled'],
    [
      {
        title: 'Work through the regional exception queues',
        children: Array.from({ length: 20 }, (_, i) => ({
          title: `Resolve exception batch ${i + 1} from the quarterly close`,
        })),
      },
    ],
  ),
};

const SEED_CARDS: SeedNode[] = [
  {
    title: 'Replace the legacy invoice generator end to end',
    description: 'A single path twelve levels below the Card.',
    children: chainOf(DEEP_CHAIN_TITLES),
  },
  CHECKOUT_CARD,
  WIDE_CARD,
  {
    title: 'X · An item to drag into a section from elsewhere',
    description: 'A Free Card with no children.',
  },
];

const KIND_BY_LEVEL: ItemKind[] = ['Epic', 'Story'];
const kindAt = (level: number): ItemKind => KIND_BY_LEVEL[level] ?? 'Task';

export interface DeepSeedSummary {
  rootProjectId: string;
  /** The deepest project, counted from a root at 0. */
  deepestProjectDepth: number;
  /** The deepest item, counted from its Free ancestor at 0. */
  deepestItemDepth: number;
}

// Inserts into a migrated database and clears nothing, so the caller hands over an empty one.
export function seedDeepData(): DeepSeedSummary {
  const now = Date.now();
  let tick = 0;
  const stamp = () => now + tick++;

  return db.transaction(tx => {
    // ── Projects ──
    let deepestProjectDepth = 0;
    let parentId: string | null = null;
    let rootProjectId = '';
    const chainIds: string[] = [];
    const insertProject = (name: string, parent: string | null, position: number) => {
      const id = randomUUID();
      const at = stamp();
      tx.insert(projects).values({ id, parentId: parent, name, position, createdAt: at, updatedAt: at }).run();
      return id;
    };
    PROJECT_CHAIN.forEach((name, depth) => {
      const id = insertProject(name, parentId, 1);
      if (depth === 0) rootProjectId = id;
      chainIds.push(id);
      deepestProjectDepth = depth;
      parentId = id;
    });
    for (const { chainIndex, name } of PROJECT_SIBLINGS) {
      insertProject(name, chainIds[chainIndex - 1], 2);
    }
    const secondRootId = insertProject(SECOND_ROOT.name, null, 2);
    SECOND_ROOT.children.forEach((name, i) => insertProject(name, secondRootId, i + 1));

    // ── A workflow on the root project, as `POST /workflows` builds one from the "flow" template ──
    const flow = tx.select().from(workflowTemplates).where(eq(workflowTemplates.name, 'flow')).get();
    if (!flow) throw new Error('The "flow" workflow template is missing: migrate the database first');
    const workflowId = randomUUID();
    const at = stamp();
    tx.insert(workflows)
      .values({ id: workflowId, projectId: rootProjectId, name: 'Deep workflow', createdAt: at, updatedAt: at })
      .run();
    const templatePhases = tx
      .select()
      .from(workflowTemplatePhases)
      .where(eq(workflowTemplatePhases.templateId, flow.id))
      .orderBy(workflowTemplatePhases.position)
      .all();
    for (const phase of templatePhases) {
      tx.insert(workphases)
        .values({
          id: randomUUID(),
          workflowId,
          name: phase.name,
          position: phase.position,
          triggersNotification: phase.triggersNotification,
          isTerminal: phase.isTerminal,
          createdAt: at,
        })
        .run();
    }
    const phases = tx.select().from(workphases).where(eq(workphases.workflowId, workflowId)).all();
    createDefaultBoard(workflowId, 'Default Board', phases, at, tx);
    const phaseId = (name: string) => {
      const phase = phases.find(p => p.name === name);
      if (!phase) throw new Error(`The "flow" template has no workphase named "${name}"`);
      return phase.id;
    };

    // ── Items ──
    // Free items (Cards and Free children) are ordered within their workphase.
    const freePositions = new Map<string, number>();
    const nextFreePosition = (workphaseId: string) => {
      const position = (freePositions.get(workphaseId) ?? 0) + 1;
      freePositions.set(workphaseId, position);
      return position;
    };
    let deepestItemDepth = 0;

    // `level` counts from the nearest Free ancestor (0 at a Card or a Free child).
    function insertNode(
      node: SeedNode,
      parent: { id: string; workphaseId: string } | null,
      level: number,
      siblingPosition: number,
    ) {
      const isFree = parent === null || node.free === true;
      const workphaseId = isFree ? phaseId(node.workphase ?? 'Todo') : parent.workphaseId;
      const id = randomUUID();
      const at = stamp();
      tx.insert(items)
        .values({
          id,
          type: ITEM_TYPE_IDS[kindAt(parent === null ? 0 : level)],
          parentId: parent?.id ?? null,
          projectId: rootProjectId,
          workphaseId,
          title: node.title,
          description: node.description ?? null,
          position: isFree ? nextFreePosition(workphaseId) : siblingPosition,
          isAttached: isFree ? 0 : 1,
          createdAt: at,
          updatedAt: at,
        })
        .run();
      const childLevel = isFree ? 1 : level + 1;
      deepestItemDepth = Math.max(deepestItemDepth, isFree ? 0 : level);
      (node.children ?? []).forEach((child, i) => insertNode(child, { id, workphaseId }, childLevel, i + 1));
    }
    SEED_CARDS.forEach(card => insertNode(card, null, 0, 0));

    return { rootProjectId, deepestProjectDepth, deepestItemDepth };
  });
}
