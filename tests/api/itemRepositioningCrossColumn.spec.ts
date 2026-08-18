import { test, expect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { resetAndSeedDb } from '../helpers/db';
import { seedRepositioningScenario, columnOrder, fullOrder, type RepositioningScenario } from '../helpers/itemRepositioningScenario';

const BASE = 'http://localhost:3002/api';

// 8 WHEN/THEN cases for item repositioning (grouped into 4 pairs), driven
// directly through PATCH /items/:id/move — no browser involved. Shared
// scenario (see repositioningScenario.ts): items A-E at positions 1.0-5.0,
// A/C/E in "Column One", B/D in "Column Two".
//
// Every "expect" below asserts the ORIGINALLY SPEC'D value, not the value
// the real server computes today — that's deliberate (see the plan this
// suite came from). Tracing positionScopeFor (server/src/routes/items.ts)
// and resolveNear (server/src/lib/positionResolver.ts) shows gap-finding is
// always scoped to a single workphase: a cross-column move's neighbor
// search never sees the source column, and an anchor that's first/last
// within its own workphase resolves via a flat +/-1.0 offset rather than a
// midpoint toward a neighboring column's value. Several "boundary" cases
// below (1.a, 2.a, 2.b) are expected to fail on the exact position number
// even though the resulting order is still correct. 3.a/3.b are expected to
// fail on order too, once the position number diverges enough to change
// which column the value would place C in relative to the full sequence.
// These failures are not bugs in the test — they document a real,
// unresolved gap between the spec and the implementation.

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
    // Real server: no bounding neighbor before A within column 1's scope ->
    // flat A.position - 1.0 = 0.0, not the spec'd 0.5. Expected to fail.
    expect(updated.position).toBe(0.5);
    expect(updated.workphaseId).toBe(scenario.colOnePhase.id);
    expect(await columnOrder(request, scenario.workflow.id, scenario.colOnePhase.id)).toBe('CAE');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('CABDE');
  });

  test('1.b — move C to after E', async ({ request }) => {
    await moveC(request, { anchorId: scenario.items.E.id, side: 'after' });

    const updated = await getC(request);
    // Real server: no bounding neighbor after E -> flat E.position + 1.0 =
    // 6.0, which happens to match the spec'd value exactly. Expected to pass.
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
    // Real server: scope is column 2 only (B, D) — never sees column 1's A
    // — so "before B" with no bounding neighbor resolves to a flat
    // B.position - 1.0 = 1.0 (ties with A's own 1.0 in a different
    // workphase), not the spec'd 1.5. Expected to fail.
    expect(updated.position).toBe(1.5);
    expect(updated.workphaseId).toBe(scenario.colTwoPhase.id);
    expect(await columnOrder(request, scenario.workflow.id, scenario.colTwoPhase.id)).toBe('CBD');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ACBDE');
  });

  test('2.b — move C to after D', async ({ request }) => {
    await moveC(request, { anchorId: scenario.items.D.id, side: 'after', workphaseId: scenario.colTwoPhase.id });

    const updated = await getC(request);
    // Real server: scope is column 2 only (B, D) — never sees column 1's E
    // — so "after D" resolves to a flat D.position + 1.0 = 5.0 (ties with
    // E's own 5.0), not the spec'd 4.5. Expected to fail.
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
    // Real server: bounding neighbors A and E ARE both in scope here (same
    // workphase) -> coarsestFit(1.0, 5.0) = 3.0, i.e. C's position is
    // genuinely unchanged, not the spec'd 1.5. Order still comes out
    // correct (unchanged), but full-context order diverges from the spec'd
    // string since C never actually moved. Expected to fail on position and
    // full order; expected to pass on column order.
    expect(updated.position).toBe(1.5);
    expect(updated.workphaseId).toBe(scenario.colOnePhase.id);
    expect(await columnOrder(request, scenario.workflow.id, scenario.colOnePhase.id)).toBe('ACE');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ACBDE');
  });

  test('3.b — move C to before E', async ({ request }) => {
    await moveC(request, { anchorId: scenario.items.E.id, side: 'before' });

    const updated = await getC(request);
    // Same bounding pair (A, E) as 3.a -> also resolves to 3.0, unchanged.
    // Expected to fail on position and full order; pass on column order.
    expect(updated.position).toBe(4.5);
    expect(updated.workphaseId).toBe(scenario.colOnePhase.id);
    expect(await columnOrder(request, scenario.workflow.id, scenario.colOnePhase.id)).toBe('ACE');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ABDCE');
  });
});

test.describe('4: interior moves into column 2 that land in C\'s existing gap', () => {
  test('4.a — move C to after B', async ({ request }) => {
    await moveC(request, { anchorId: scenario.items.B.id, side: 'after', workphaseId: scenario.colTwoPhase.id });

    const updated = await getC(request);
    // Bounding neighbors B and D are both in column 2's scope ->
    // coarsestFit(2.0, 4.0) = 3.0 = C's own original value. Expected to
    // fully pass — this is the one case where the workphase-scoped
    // resolver happens to reproduce the spec'd number exactly.
    expect(updated.position).toBe(3.0);
    expect(updated.workphaseId).toBe(scenario.colTwoPhase.id);
    expect(await columnOrder(request, scenario.workflow.id, scenario.colTwoPhase.id)).toBe('BCD');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ABCDE');
  });

  test('4.b — move C to before D', async ({ request }) => {
    await moveC(request, { anchorId: scenario.items.D.id, side: 'before', workphaseId: scenario.colTwoPhase.id });

    const updated = await getC(request);
    // Same bounding pair (B, D) as 4.a -> also resolves to 3.0. Expected to
    // fully pass.
    expect(updated.position).toBe(3.0);
    expect(updated.workphaseId).toBe(scenario.colTwoPhase.id);
    expect(await columnOrder(request, scenario.workflow.id, scenario.colTwoPhase.id)).toBe('BCD');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ABCDE');
  });
});
