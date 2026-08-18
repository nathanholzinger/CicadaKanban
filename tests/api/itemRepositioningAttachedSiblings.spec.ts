import { test, expect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { resetAndSeedDb } from '../helpers/db';
import { seedAttachedSiblingsScenario, siblingOrder, type AttachedSiblingsScenario } from '../helpers/itemRepositioningScenario';

const BASE = 'http://localhost:3002/api';

// 3 WHEN/THEN cases exercising anchor+side resolution against the
// (parentId, isAttached) comparison scope (Part 3), driven directly through
// PATCH /items/:id/move — no browser involved. Closes three findings from
// docs/audits/test-reconciliation-report-epic-3-2.md together:
//
//   - A.5 / TC-3.5: the resolver is scope-agnostic by design, but nothing
//     previously instantiated it against an attached-sibling scope. The
//     three moves below re-run TC-2.5 (append fallback, no true
//     predecessor), TC-2.1 (insert between two true neighbors), and TC-2.4
//     (append fallback, no true successor) with that scope instead of
//     workflow-wide.
//   - B.6 / TC-3.1: "reorder 3+ attached siblings, check persisted order on
//     reload" — each test re-fetches the parent's `children` via a
//     different endpoint (siblingOrder, GET /api/items/:parentId) than the
//     move response itself, a genuine reload check.
//   - B.7 / TC-3.2: isolation — the scenario seeds an unrelated second
//     parent's attached child and an unrelated top-level item sharing the
//     same workphase; every test confirms neither one moves.
//
// Scenario (see itemRepositioningScenario.ts): parent's three attached
// children A/B/C, created via plain POST with no explicit position —
// natural append gives A=1.0, B=2.0, C=3.0.

let scenario: AttachedSiblingsScenario;

test.beforeEach(async ({ request }) => {
  await resetAndSeedDb();
  scenario = await seedAttachedSiblingsScenario(request, 'Attached Siblings API Project');
});

function moveItem(request: APIRequestContext, itemId: string, body: Record<string, unknown>) {
  return request.patch(`${BASE}/items/${itemId}/move`, { data: body });
}

async function getItem(request: APIRequestContext, itemId: string) {
  return (await request.get(`${BASE}/items/${itemId}`)).json();
}

// TC-3.2: confirms the isolation control group is untouched by a reorder
// among `parent`'s own children.
async function expectIsolationUnaffected(request: APIRequestContext) {
  const otherChild = await getItem(request, scenario.otherChild.id);
  expect(otherChild.position).toBe(1.0); // unchanged — only child of its own parent
  expect(otherChild.parentId).toBe(scenario.otherParent.id);

  const topLevel = await getItem(request, scenario.topLevel.id);
  expect(topLevel.position).toBe(scenario.topLevel.position); // unchanged from creation
}

test('C before A — becomes the new true first sibling (TC-2.5-equivalent)', async ({ request }) => {
  await moveItem(request, scenario.items.C.id, { anchorId: scenario.items.A.id, side: 'before' });

  const updated = await getItem(request, scenario.items.C.id);
  // No true predecessor before A -> floor-anchored coarsest-fit between 0.0
  // and A's 1.0, not a flat A.position - 1.0.
  expect(updated.position).toBe(0.5);
  expect(updated.positionScope).toBe('attached-siblings');
  expect(await siblingOrder(request, scenario.parent.id)).toBe('CAB');
  await expectIsolationUnaffected(request);
});

test('C after A / C before B — same true-neighbor midpoint from either anchor (TC-2.1-equivalent)', async ({ request }) => {
  await moveItem(request, scenario.items.C.id, { anchorId: scenario.items.A.id, side: 'after' });
  const afterA = await getItem(request, scenario.items.C.id);
  expect(afterA.position).toBe(1.5);
  expect(await siblingOrder(request, scenario.parent.id)).toBe('ACB');

  // Re-anchor from the opposite side of the same gap — B's true predecessor
  // (A, excluding C's own row) resolves to the identical coarsest-fit value,
  // proving the true-neighbor lookup is symmetric regardless of which side
  // it's approached from.
  await moveItem(request, scenario.items.C.id, { anchorId: scenario.items.B.id, side: 'before' });
  const beforeB = await getItem(request, scenario.items.C.id);
  expect(beforeB.position).toBe(1.5);
  expect(await siblingOrder(request, scenario.parent.id)).toBe('ACB');
  await expectIsolationUnaffected(request);
});

test('A after C — becomes the new true last sibling (TC-2.4-equivalent)', async ({ request }) => {
  await moveItem(request, scenario.items.A.id, { anchorId: scenario.items.C.id, side: 'after' });

  const updated = await getItem(request, scenario.items.A.id);
  // No true successor after C -> append fallback, C.position + 1.0.
  expect(updated.position).toBe(4.0);
  expect(await siblingOrder(request, scenario.parent.id)).toBe('BCA');
  await expectIsolationUnaffected(request);
});
