import { test, expect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { resetAndSeedDb } from '../helpers/db';
import {
  seedRepositioningScenario,
  columnOrder,
  fullOrder,
  type RepositioningScenario,
} from '../helpers/itemRepositioningScenario';
import { API as BASE } from '../helpers/api';

// 8 WHEN/THEN cases for item repositioning (grouped into 4 pairs), driven
// directly through PATCH /items/:id/move — no browser involved. Shared
// scenario (see repositioningScenario.ts): items A-E at positions 1.0-5.0,
// A/C/E in "Column One", B/D in "Column Two".
//
// Position is workflow-wide (de80b59, docs/wiki/item-positioning), not
// workphase-scoped — gap-finding for an anchor sees every item in the
// workflow, not just its own workphase/column. So a "boundary" anchor
// (first/last within its own column) can still have a true neighbor in a
// DIFFERENT column, and resolves a genuine midpoint against it rather than
// falling back to a flat +/-1.0 offset the way a workphase-scoped resolver
// would. Every expect below is the correct value under that rule — see
// each test's own comment for which true neighbor it resolves against.

let scenario: RepositioningScenario;

test.beforeEach(async ({ request }) => {
  await resetAndSeedDb();
  scenario = await seedRepositioningScenario(request, 'Repositioning API Project');
});

function moveC(request: APIRequestContext, body: Record<string, unknown>) {
  return request.patch(`${BASE}/items/${scenario.items.C.id}/move`, { data: body });
}

async function getC(request: APIRequestContext) {
  return (await request.get(`${BASE}/items/${scenario.items.C.id}`)).json();
}

test.describe('1: extreme boundary moves within column 1', () => {
  test('1.a — move C to before A', async ({ request }) => {
    await moveC(request, { anchorId: scenario.items.A.id, side: 'before' });

    const updated = await getC(request);
    // A is the true first item workflow-wide too (nothing precedes 1.0) ->
    // floor-anchored coarsest-fit between 0.0 and A's 1.0, not a flat
    // A.position - 1.0.
    expect(updated.position).toBe(0.5);
    expect(updated.workphaseId).toBe(scenario.colOnePhase.id);
    expect(await columnOrder(request, scenario.workflow.id, scenario.colOnePhase.id)).toBe('CAE');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('CABDE');
  });

  test('1.b — move C to after E', async ({ request }) => {
    await moveC(request, { anchorId: scenario.items.E.id, side: 'after' });

    const updated = await getC(request);
    // E is the true last item workflow-wide too -> append fallback,
    // E.position + 1.0.
    expect(updated.position).toBe(6.0);
    expect(updated.workphaseId).toBe(scenario.colOnePhase.id);
    expect(await columnOrder(request, scenario.workflow.id, scenario.colOnePhase.id)).toBe('AEC');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ABDEC');
  });
});

test.describe('2: extreme boundary moves into column 2', () => {
  test('2.a — move C to before B', async ({ request }) => {
    await moveC(request, { anchorId: scenario.items.B.id, side: 'before', workphaseId: scenario.colTwoPhase.id });

    const updated = await getC(request);
    // Scope is workflow-wide, so B's true predecessor is column 1's A
    // (1.0), not "none within column 2" -> coarsestFit(1.0, 2.0).
    expect(updated.position).toBe(1.5);
    expect(updated.workphaseId).toBe(scenario.colTwoPhase.id);
    expect(await columnOrder(request, scenario.workflow.id, scenario.colTwoPhase.id)).toBe('CBD');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ACBDE');
  });

  test('2.b — move C to after D', async ({ request }) => {
    await moveC(request, { anchorId: scenario.items.D.id, side: 'after', workphaseId: scenario.colTwoPhase.id });

    const updated = await getC(request);
    // Scope is workflow-wide, so D's true successor is column 1's E (5.0),
    // not "none within column 2" -> coarsestFit(4.0, 5.0).
    expect(updated.position).toBe(4.5);
    expect(updated.workphaseId).toBe(scenario.colTwoPhase.id);
    expect(await columnOrder(request, scenario.workflow.id, scenario.colTwoPhase.id)).toBe('BDC');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ABDCE');
  });
});

test.describe('3: interior moves that stay in column 1 ("drop it back where it was")', () => {
  test('3.a — move C to after A', async ({ request }) => {
    await moveC(request, { anchorId: scenario.items.A.id, side: 'after' });

    const updated = await getC(request);
    // A's true successor is workflow-wide B (2.0), not column 1's own E
    // (5.0) -> coarsestFit(1.0, 2.0), a genuine move (C leapfrogs B), not
    // the same-position no-op a workphase-scoped resolver would produce.
    expect(updated.position).toBe(1.5);
    expect(updated.workphaseId).toBe(scenario.colOnePhase.id);
    expect(await columnOrder(request, scenario.workflow.id, scenario.colOnePhase.id)).toBe('ACE');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ACBDE');
  });

  test('3.b — move C to before E', async ({ request }) => {
    await moveC(request, { anchorId: scenario.items.E.id, side: 'before' });

    const updated = await getC(request);
    // E's true predecessor is workflow-wide D (4.0), not column 1's own A
    // (1.0) -> coarsestFit(4.0, 5.0).
    expect(updated.position).toBe(4.5);
    expect(updated.workphaseId).toBe(scenario.colOnePhase.id);
    expect(await columnOrder(request, scenario.workflow.id, scenario.colOnePhase.id)).toBe('ACE');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ABDCE');
  });
});

test.describe("4: interior moves into column 2 that land in C's existing gap", () => {
  test('4.a — move C to after B', async ({ request }) => {
    await moveC(request, { anchorId: scenario.items.B.id, side: 'after', workphaseId: scenario.colTwoPhase.id });

    const updated = await getC(request);
    // B's true successor is workflow-wide D (4.0) — happens to be the same
    // pair column 2 alone would've given, since nothing else sits between
    // 2.0 and 4.0 -> coarsestFit(2.0, 4.0) = C's own original value.
    expect(updated.position).toBe(3.0);
    expect(updated.workphaseId).toBe(scenario.colTwoPhase.id);
    expect(await columnOrder(request, scenario.workflow.id, scenario.colTwoPhase.id)).toBe('BCD');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ABCDE');
  });

  test('4.b — move C to before D', async ({ request }) => {
    await moveC(request, { anchorId: scenario.items.D.id, side: 'before', workphaseId: scenario.colTwoPhase.id });

    const updated = await getC(request);
    // Same true bounding pair (B, D) as 4.a -> also resolves to 3.0.
    expect(updated.position).toBe(3.0);
    expect(updated.workphaseId).toBe(scenario.colTwoPhase.id);
    expect(await columnOrder(request, scenario.workflow.id, scenario.colTwoPhase.id)).toBe('BCD');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ABCDE');
  });
});
