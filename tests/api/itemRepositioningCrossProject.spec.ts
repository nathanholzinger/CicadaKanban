import { test, expect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { resetAndSeedDb } from '../helpers/db';
import {
  seedCrossProjectRepositioningScenario,
  projectOrder,
  fullOrder,
  type CrossProjectRepositioningScenario,
} from '../helpers/itemRepositioningScenario';
import { API as BASE } from '../helpers/api';

// The same 8-case structure as tests/api/itemRepositioning.spec.ts, this
// time scoped by PROJECT rather than workphase: items A/C/E belong to
// project1a, B/D to project1b, both children of a root project and sharing
// its one inherited workflow/workphase (see
// seedCrossProjectRepositioningScenario's header comment). Position scope
// is workflow-wide and provably blind to projectId (positionScopeFor,
// server/src/routes/items.ts:29-58) — no reference to items.projectId
// anywhere in scope-building or anchor validation — so these numbers are
// the same underlying math as the original suite's post-scope-fix values,
// just relabeled onto a project axis instead of a workphase axis.
//
// 1.a/1.b/2.a/2.b/3.a/3.b move C, anchored against A/B/D/E as in the
// original suite. 3.a and 3.b land on the SAME gap as 2.a/2.b respectively
// (A's true neighbor is now B, not E, once scope is workflow-wide) — kept
// as designed per user, since this documents a real, useful side effect of
// the workflow-wide scope fix rather than the "put it back" no-op it used
// to be. 4.a/4.b are redesigned from the original suite: instead of moving
// C, they move B/D (project1b items) anchored against E/A (project1a
// items), to exercise the reverse direction — a cross-project anchor
// correctly reordering the anchoring item's OWN sibling relative to its
// true project-mate, visible as a real flip on project1b's own board
// (BD -> DB).
let scenario: CrossProjectRepositioningScenario;

test.beforeEach(async ({ request }) => {
  await resetAndSeedDb();
  scenario = await seedCrossProjectRepositioningScenario(request, 'Cross Project API');
});

function moveItem(request: APIRequestContext, itemId: string, body: Record<string, unknown>) {
  return request.patch(`${BASE}/items/${itemId}/move`, { data: body });
}

async function getItem(request: APIRequestContext, itemId: string) {
  return (await request.get(`${BASE}/items/${itemId}`)).json();
}

test.describe('1: extreme boundary moves within project 1a', () => {
  test('1.a — move C to before A', async ({ request }) => {
    await moveItem(request, scenario.items.C.id, { anchorId: scenario.items.A.id, side: 'before' });

    const updated = await getItem(request, scenario.items.C.id);
    expect(updated.position).toBe(0.5);
    expect(updated.projectId).toBe(scenario.project1a.id); // immutable across a move
    expect(await projectOrder(request, scenario.workflow.id, scenario.project1a.id)).toBe('CAE');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('CABDE');
    expect(await projectOrder(request, scenario.workflow.id, scenario.project1b.id)).toBe('BD');
  });

  test('1.b — move C to after E', async ({ request }) => {
    await moveItem(request, scenario.items.C.id, { anchorId: scenario.items.E.id, side: 'after' });

    const updated = await getItem(request, scenario.items.C.id);
    expect(updated.position).toBe(6.0);
    expect(updated.projectId).toBe(scenario.project1a.id);
    expect(await projectOrder(request, scenario.workflow.id, scenario.project1a.id)).toBe('AEC');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ABDEC');
    expect(await projectOrder(request, scenario.workflow.id, scenario.project1b.id)).toBe('BD');
  });
});

test.describe('2: extreme boundary moves anchored against project 1b', () => {
  test('2.a — move C to before B', async ({ request }) => {
    await moveItem(request, scenario.items.C.id, { anchorId: scenario.items.B.id, side: 'before' });

    const updated = await getItem(request, scenario.items.C.id);
    expect(updated.position).toBe(1.5);
    expect(updated.projectId).toBe(scenario.project1a.id);
    expect(await projectOrder(request, scenario.workflow.id, scenario.project1a.id)).toBe('ACE');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ACBDE');
    expect(await projectOrder(request, scenario.workflow.id, scenario.project1b.id)).toBe('BD');
  });

  test('2.b — move C to after D', async ({ request }) => {
    await moveItem(request, scenario.items.C.id, { anchorId: scenario.items.D.id, side: 'after' });

    const updated = await getItem(request, scenario.items.C.id);
    expect(updated.position).toBe(4.5);
    expect(updated.projectId).toBe(scenario.project1a.id);
    expect(await projectOrder(request, scenario.workflow.id, scenario.project1a.id)).toBe('ACE');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ABDCE');
    expect(await projectOrder(request, scenario.workflow.id, scenario.project1b.id)).toBe('BD');
  });
});

test.describe('3: interior moves that stay in project 1a (collapse with group 2 under workflow-wide scope)', () => {
  test('3.a — move C to after A', async ({ request }) => {
    await moveItem(request, scenario.items.C.id, { anchorId: scenario.items.A.id, side: 'after' });

    // Same gap as 2.a (1.5) — not a no-op. A's true neighbor is B, not E,
    // once scope spans the whole workflow rather than stopping at a
    // workphase/project boundary.
    const updated = await getItem(request, scenario.items.C.id);
    expect(updated.position).toBe(1.5);
    expect(updated.projectId).toBe(scenario.project1a.id);
    expect(await projectOrder(request, scenario.workflow.id, scenario.project1a.id)).toBe('ACE');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ACBDE');
    expect(await projectOrder(request, scenario.workflow.id, scenario.project1b.id)).toBe('BD');
  });

  test('3.b — move C to before E', async ({ request }) => {
    await moveItem(request, scenario.items.C.id, { anchorId: scenario.items.E.id, side: 'before' });

    // Same gap as 2.b (4.5).
    const updated = await getItem(request, scenario.items.C.id);
    expect(updated.position).toBe(4.5);
    expect(updated.projectId).toBe(scenario.project1a.id);
    expect(await projectOrder(request, scenario.workflow.id, scenario.project1a.id)).toBe('ACE');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ABDCE');
    expect(await projectOrder(request, scenario.workflow.id, scenario.project1b.id)).toBe('BD');
  });
});

test.describe('4: reverse direction — moving a project 1b item against a project 1a anchor', () => {
  test('4.a — move B to after E', async ({ request }) => {
    await moveItem(request, scenario.items.B.id, { anchorId: scenario.items.E.id, side: 'after' });

    // No true successor beyond E (global max) -> flat +1.0, same degenerate
    // case as 1.b.
    const updated = await getItem(request, scenario.items.B.id);
    expect(updated.position).toBe(6.0);
    expect(updated.projectId).toBe(scenario.project1b.id); // immutable, even landing among 1a's items
    expect(await projectOrder(request, scenario.workflow.id, scenario.project1a.id)).toBe('ACE'); // unaffected
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ACDEB');
    // The real point of this group: project1b's own board genuinely
    // reorders (B was first, now last) even though the anchor (E) belongs
    // to a different project entirely.
    expect(await projectOrder(request, scenario.workflow.id, scenario.project1b.id)).toBe('DB');
  });

  test('4.b — move D to before A', async ({ request }) => {
    await moveItem(request, scenario.items.D.id, { anchorId: scenario.items.A.id, side: 'before' });

    // No true predecessor before A (global min) -> floor coarsestFit(0, 1),
    // same degenerate case as 1.a.
    const updated = await getItem(request, scenario.items.D.id);
    expect(updated.position).toBe(0.5);
    expect(updated.projectId).toBe(scenario.project1b.id);
    expect(await projectOrder(request, scenario.workflow.id, scenario.project1a.id)).toBe('ACE'); // unaffected
    expect(await fullOrder(request, scenario.workflow.id)).toBe('DABCE');
    expect(await projectOrder(request, scenario.workflow.id, scenario.project1b.id)).toBe('DB');
  });
});
