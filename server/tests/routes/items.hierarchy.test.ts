import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { eq, inArray } from 'drizzle-orm';
import { app } from '../../src/index.js';
import { db } from '../../src/db/index.js';
import { items, activityLog } from '../../src/db/schema.js';
import { ITEM_DEPTH_CAP } from '../../src/lib/itemTree.js';
import { createProject, createItem, createBoard, setItemPosition, setItemParent } from '../fixtures.js';
import { getRow, hierarchyEntries, move, put, setupWorkflow, cardWithTwoStubs } from '../itemHierarchyFixtures.js';

// Atomic reparent-with-placement through the item routes: attach, detach and reparent, done
// parents and done columns, the depth cap, atomicity, the hierarchy activity log, reindex
// disclosure, and the guards PUT and POST share.

// A straight parent chain L1 → L2 → … → L{length} built through POST, so
// the cap is exercised via the API rather than bypassed (contrast
// itemTree.test.ts's seedChain). Returns the deepest item. Each link is
// asserted to exist — createItem doesn't check status, and a silently
// failed link would hand the next one `parentId: undefined` and quietly
// flatten the chain, hiding exactly the off-by-one these tests pin.
async function createChain(projectId: string, workphaseId: string, length: number) {
  let deepest = await createItem({ projectId, workphaseId, title: 'L1' });
  expect(deepest.id).toBeDefined();
  for (let d = 2; d <= length; d++) {
    deepest = await createItem({ projectId, parentId: deepest.id, title: `L${d}` });
    expect(deepest.id).toBeDefined();
  }
  return deepest;
}

// A straight chain L1 → … → L{length} with parentId written directly, so it
// can run past the cap, which no write can do (contrast createChain). L1 is
// a Free item in `workphaseId`; every later link is attached to the one
// before. Returns the rows root-first.
async function seedChainPastCap(projectId: string, workphaseId: string, length: number) {
  const chain = [getRow((await createItem({ projectId, workphaseId, title: 'L1' })).id)];
  for (let d = 2; d <= length; d++) {
    const link = await createItem({ projectId, workphaseId, title: `L${d}` });
    setItemParent(link.id, chain[d - 2].id, true);
    chain.push(getRow(link.id));
  }
  return chain;
}

describe('PATCH /items/:id/move — request validation', () => {
  it('ATT-4.1, ATT-4.10: rejects a parentId naming no item, and stores nothing', async () => {
    const { project, todo } = await setupWorkflow();
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
    const res = await move(x.id, { parentId: 'nope', isAttached: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/does not reference an existing item/);
    expect(getRow(x.id).parentId).toBeNull();
  });

  it('ATT-2.2, ATT-4.2, ATT-4.3, ATT-4.10: rejects the item itself and its descendants as parents; accepts moving up the tree', async () => {
    const { project, todo } = await setupWorkflow();
    const a = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'A' });
    const b = await createItem({ projectId: project.id, parentId: a.id, title: 'B' });
    const c = await createItem({ projectId: project.id, parentId: b.id, title: 'C', isAttached: false });

    expect((await move(a.id, { parentId: a.id })).status).toBe(400);
    expect((await move(a.id, { parentId: b.id })).status).toBe(400);
    expect((await move(a.id, { parentId: c.id })).status).toBe(400);
    expect(getRow(a.id).parentId).toBeNull();

    const up = await move(c.id, { parentId: a.id });
    expect(up.status).toBe(200);
    expect(up.body.parentId).toBe(a.id);
  });

  it('ATT-2.2, ATT-4.4, ATT-4.10: enforces the depth cap on move: exactly CAP is legal, CAP + 1 is not', async () => {
    const { project, todo } = await setupWorkflow();
    const deepest = await createChain(project.id, todo.id, ITEM_DEPTH_CAP - 1);
    const leaf = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'leaf' });
    const ok = await move(leaf.id, { parentId: deepest.id, isAttached: true });
    expect(ok.status).toBe(200);

    const mover = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'mover' });
    await createItem({ projectId: project.id, parentId: mover.id, title: 'mover-child' });
    const tooDeep = await move(mover.id, { parentId: deepest.id, isAttached: true });
    expect(tooDeep.status).toBe(400);
    expect(tooDeep.body.error).toMatch(/exceeds the cap/);
    expect(getRow(mover.id).parentId).toBeNull();
  });

  it('ATT-4.5: the cap counts the deepest resulting leaf, through a detached branch', async () => {
    const { project, todo } = await setupWorkflow();
    // M → M1 (attached) is one level; M → M2 (detached) → M2a is two.
    const m = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'M' });
    await createItem({ projectId: project.id, parentId: m.id, title: 'M1' });
    const m2 = await createItem({
      projectId: project.id,
      parentId: m.id,
      title: 'M2',
      isAttached: false,
      workphaseId: todo.id,
    });
    await createItem({ projectId: project.id, parentId: m2.id, title: 'M2a' });
    // The chain's last link is at depth CAP − 2, and its parent at CAP − 3.
    const tooDeep = await createChain(project.id, todo.id, ITEM_DEPTH_CAP - 2);
    const deepEnough = tooDeep.parentId;
    const before = getRow(m.id);

    // CAP − 2 + 1 + 2 = CAP + 1. Counting only the attached branch would admit it.
    const refused = await move(m.id, { parentId: tooDeep.id, isAttached: true });
    expect(refused.status).toBe(400);
    expect(refused.body.error).toMatch(/exceeds the cap/);
    expect(getRow(m.id)).toEqual(before);

    const accepted = await move(m.id, { parentId: deepEnough, isAttached: true });
    expect(accepted.status).toBe(200);
    expect(accepted.body.parentId).toBe(deepEnough);
  });

  it('ATT-1.8: a move or an edit that would leave the flag on a parentless item is refused', async () => {
    const { project, todo } = await setupWorkflow();
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
    const p = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'P' });
    const y = await createItem({ projectId: project.id, parentId: p.id, title: 'Y' });
    const before = { x: getRow(x.id), y: getRow(y.id) };

    for (const [entryPoint, write] of [
      ['move', move],
      ['PUT', put],
    ] as const) {
      const refusals = [
        ['the flag set on a top-level item', x.id, { isAttached: true }],
        ['the parent cleared and the flag set', y.id, { parentId: null, isAttached: true }],
      ] as const;
      for (const [label, id, body] of refusals) {
        const res = await write(id, body);
        expect(res.status, `${entryPoint}: ${label}`).toBe(400);
        expect(res.body.error, `${entryPoint}: ${label}`).toMatch(/requires a parentId/);
        // Neither row moved: not the one written, not the other.
        expect({ x: getRow(x.id), y: getRow(y.id) }, `${entryPoint}: ${label}`).toEqual(before);
      }
    }
  });

  it('ATT-9.1: rejects a workphaseId that contradicts the parent an attached item inherits from; accepts a matching one', async () => {
    const { project, todo, inProgress } = await setupWorkflow();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'parent' });
    const x = await createItem({ projectId: project.id, workphaseId: inProgress.id, title: 'X' });

    const contradicting = await move(x.id, { parentId: parent.id, isAttached: true, workphaseId: inProgress.id });
    expect(contradicting.status).toBe(400);
    expect(contradicting.body.error).toMatch(/inherits its parent's workphase/);
    expect(getRow(x.id).workphaseId).toBe(inProgress.id);

    const matching = await move(x.id, { parentId: parent.id, isAttached: true, workphaseId: todo.id });
    expect(matching.status).toBe(200);
    expect(matching.body.workphaseId).toBe(todo.id);
  });

  it('rejects a non-boolean isAttached', async () => {
    const { project, todo } = await setupWorkflow();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'parent' });
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
    const res = await move(x.id, { parentId: parent.id, isAttached: 'yes' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/isAttached must be a boolean/);
  });

  it('TC-7.11: validates the anchor against the resulting scope: a new sibling is accepted', async () => {
    const { project, todo } = await setupWorkflow();
    const { p, s1 } = await cardWithTwoStubs(project.id, todo.id);
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
    // X isn't in P's sibling scope yet — the anchor is legal because it
    // will be, after the reparent.
    const res = await move(x.id, { parentId: p.id, isAttached: true, anchorId: s1.id, side: 'after' });
    expect(res.status).toBe(200);
  });

  it('ATT-3.7, TC-7.10: rejects an anchor outside the resulting scope, committing nothing', async () => {
    const { project, todo } = await setupWorkflow();
    const { p } = await cardWithTwoStubs(project.id, todo.id, 'P');
    const q = await cardWithTwoStubs(project.id, todo.id, 'Q');
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
    const x1 = await createItem({ projectId: project.id, parentId: x.id, title: 'X1' });
    const before = { x: getRow(x.id), x1: getRow(x1.id) };

    const res = await move(x.id, { parentId: p.id, isAttached: true, anchorId: q.s1.id, side: 'after' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/resulting position scope/);
    expect(getRow(x.id)).toEqual(before.x);
    expect(getRow(x1.id)).toEqual(before.x1);
  });

  it('TC-7.10: rejects the item as its own anchor with a 400, not a 500', async () => {
    const { project, todo } = await setupWorkflow();
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
    const before = getRow(x.id);

    // The subject is left out of its own scope, so the refusal names the item itself
    // rather than calling it a stranger to the scope.
    const res = await move(x.id, { anchorId: x.id, side: 'after' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cannot be the item itself/);
    expect(getRow(x.id)).toEqual(before);
  });

  it('TC-7.10: rejects an anchor for an item that ends with no workphase, which has no scope', async () => {
    const { project, todo } = await setupWorkflow();
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
    const b = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'B' });
    const before = getRow(x.id);

    const res = await move(x.id, { workphaseId: null, anchorId: b.id, side: 'after' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/resulting position scope/);
    expect(getRow(x.id)).toEqual(before);
  });
});

describe('PATCH /items/:id/move — attach / reparent / detach with placement', () => {
  it("ATT-2.1: attaching A to B writes A; B's own row is untouched, at move and at PUT", async () => {
    const { project, todo, inProgress } = await setupWorkflow();
    const b = await createItem({ projectId: project.id, workphaseId: inProgress.id, title: 'B' });
    // A timestamp no write would leave, so any write to B shows.
    db.update(items).set({ updatedAt: 1 }).where(eq(items.id, b.id)).run();
    const before = getRow(b.id);

    for (const write of [move, put]) {
      const a = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'A' });
      const res = await write(a.id, { parentId: b.id, isAttached: true });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        parentId: b.id,
        isAttached: 1,
        workphaseId: inProgress.id,
        positionScope: 'attached-siblings',
      });
      expect(getRow(b.id)).toEqual(before);
    }
  });

  it('ATT-1.7, ATT-3.6, TC-7.11: attaches with placement: every field and the cascade land in one commit', async () => {
    const { project, todo, inProgress } = await setupWorkflow();
    const { p, s1, s2 } = await cardWithTwoStubs(project.id, inProgress.id);
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
    const x1 = await createItem({ projectId: project.id, parentId: x.id, title: 'X1' });
    setItemPosition(x.id, 50.0);

    const res = await move(x.id, { parentId: p.id, isAttached: true, anchorId: s1.id, side: 'after' });
    expect(res.status).toBe(200);
    expect(res.body.parentId).toBe(p.id);
    expect(res.body.isAttached).toBe(1);
    expect(res.body.workphaseId).toBe(inProgress.id); // inherited
    expect(res.body.positionScope).toBe('attached-siblings');
    // Drawn from P's sibling list — not 50.0 kept, not a workflow-wide value.
    expect(res.body.position).toBe(1.5);
    expect(getRow(x1.id).workphaseId).toBe(inProgress.id); // cascaded
    expect([getRow(s1.id).position, getRow(s2.id).position]).toEqual([1.0, 2.0]); // siblings untouched
  });

  it("ATT-3.1, ATT-3.5, ATT-3.9, ATT-7.5: reparents while attached against the NEW parent's scope, never the old", async () => {
    const { project, todo } = await setupWorkflow();
    const a = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'A' });
    await createItem({ projectId: project.id, parentId: a.id, title: 'A1' });
    await createItem({ projectId: project.id, parentId: a.id, title: 'A2' });
    const x = await createItem({ projectId: project.id, parentId: a.id, title: 'X' });
    expect(x.position).toBe(3.0);
    const b = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'B' });
    const b1 = await createItem({ projectId: project.id, parentId: b.id, title: 'B1' });
    const b2 = await createItem({ projectId: project.id, parentId: b.id, title: 'B2' });
    setItemPosition(b1.id, 100.0);
    setItemPosition(b2.id, 200.0);

    const res = await move(x.id, { parentId: b.id, anchorId: b1.id, side: 'after' }); // flag omitted: stays attached
    expect(res.status).toBe(200);
    expect(res.body.isAttached).toBe(1);
    expect(res.body.position).toBeGreaterThan(100.0);
    expect(res.body.position).toBeLessThan(200.0);
    expect(getRow(b1.id).position).toBe(100.0);
    expect(getRow(b2.id).position).toBe(200.0);
  });

  it('ATT-3.4: a reparent whose new position equals the old one is still a real reparent', async () => {
    const { project, todo } = await setupWorkflow();
    const a = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'A' });
    const b = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'B' });
    const x = await createItem({ projectId: project.id, parentId: a.id, title: 'X' });
    expect(x.position).toBe(1.0);
    const logged = hierarchyEntries(x.id).length;

    // B has no Stubs, so the append fallback's first value is 1.0 again.
    const res = await move(x.id, { parentId: b.id });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      parentId: b.id,
      isAttached: 1,
      positionScope: 'attached-siblings',
      position: 1.0,
    });
    expect(
      hierarchyEntries(x.id)
        .slice(logged)
        .map(e => e.content),
    ).toEqual(['Reparented from "A" to "B" (attached)']);
    expect((await request(app).get(`/api/items/${a.id}`)).body.children).toEqual([]);
  });

  it('ATT-7.5: moving a Stub into another Card as its Stub is one reparent, never a detach', async () => {
    const { project, todo, inProgress } = await setupWorkflow();
    const p = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'P' });
    const x = await createItem({ projectId: project.id, parentId: p.id, title: 'X' });
    const { p: q, s1: q1 } = await cardWithTwoStubs(project.id, inProgress.id, 'Q');
    const logged = hierarchyEntries(x.id).length;

    const res = await move(x.id, { parentId: q.id, isAttached: true, anchorId: q1.id, side: 'after' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      parentId: q.id,
      isAttached: 1,
      workphaseId: inProgress.id,
      positionScope: 'attached-siblings',
    });
    expect(res.body.position).toBeGreaterThan(1.0);
    expect(res.body.position).toBeLessThan(2.0);
    // One entry, the reparent: no detach from P on the way.
    expect(
      hierarchyEntries(x.id)
        .slice(logged)
        .map(e => e.content),
    ).toEqual(['Reparented from "P" to "Q" (attached)']);
  });

  it('ATT-1.2, ATT-1.7, ATT-7.1, ATT-7.2, ATT-9.4, TC-2.14, TC-7.13: detaches with placement into the workflow scope, keeping the parent', async () => {
    const { project, todo } = await setupWorkflow();
    const { p, s2: x } = await cardWithTwoStubs(project.id, todo.id);
    const f1 = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'F1' });
    const f2 = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'F2' });
    setItemPosition(f1.id, 10.0);
    setItemPosition(f2.id, 11.0);

    const res = await move(x.id, { isAttached: false, anchorId: f1.id, side: 'after' });
    expect(res.status).toBe(200);
    expect(res.body.isAttached).toBe(0);
    expect(res.body.parentId).toBe(p.id); // detaching is not un-parenting
    expect(res.body.positionScope).toBe('workflow');
    expect(res.body.position).toBe(10.5); // against the anchor, not the sibling-scoped 2.0
    expect(res.body.workphaseId).toBe(todo.id); // keeps the inherited workphase
  });

  it('TC-2.20: attaching into an empty Stub list takes the append fallback — bootstrap 1.0', async () => {
    const { project, todo } = await setupWorkflow();
    const p = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'P' });
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
    setItemPosition(x.id, 50.0);
    const res = await move(x.id, { parentId: p.id, isAttached: true });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(1.0);
  });

  it('ATT-7.6, ATT-8.2: a redundant re-attach to the same parent is not a scope change and keeps its position', async () => {
    const { project, todo } = await setupWorkflow();
    const { p, s1 } = await cardWithTwoStubs(project.id, todo.id);
    const logged = hierarchyEntries(s1.id).length;
    const res = await move(s1.id, { parentId: p.id, isAttached: true });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(1.0);
    expect(hierarchyEntries(s1.id)).toHaveLength(logged); // nothing changed, nothing logged
  });

  // The same request body as above, but from a *detached* child: the parent
  // is unchanged, the flag is not, and the flag is the scope. Pinned because
  // a caller that reads "same parentId" as "already here" no-ops the
  // gesture.
  it('ATT-7.6, ATT-8.1: a detached child re-attached to the parent it still names is a real attach', async () => {
    const { project, todo, inProgress } = await setupWorkflow();
    const { p, s1, s2 } = await cardWithTwoStubs(project.id, todo.id);
    const logged = hierarchyEntries(s1.id).length;
    await move(s1.id, { isAttached: false, workphaseId: inProgress.id }); // detach, own workphase
    expect(getRow(s1.id)).toMatchObject({ parentId: p.id, isAttached: 0, workphaseId: inProgress.id });

    const res = await move(s1.id, { parentId: p.id, isAttached: true });
    expect(res.status).toBe(200);
    expect(res.body.parentId).toBe(p.id);
    expect(res.body.isAttached).toBe(1);
    expect(res.body.workphaseId).toBe(todo.id); // re-inherited (ATT-1.7)
    expect(res.body.positionScope).toBe('attached-siblings');
    expect(res.body.position).toBeGreaterThan(s2.position); // last among P's Stubs — a fresh sibling-scoped position
    expect(
      hierarchyEntries(s1.id)
        .slice(logged)
        .map(e => e.content),
    ).toEqual(['Detached from "P"', 'Attached to "P"']);
  });

  it('ATT-3.10, ATT-3.11: a top-level item reparented without the flag becomes a detached child, and keeps its position', async () => {
    for (const [entryPoint, write] of [
      ['move', move],
      ['PUT', put],
    ] as const) {
      const { project, todo, inProgress } = await setupWorkflow(entryPoint);
      const p = await createItem({ projectId: project.id, workphaseId: inProgress.id, title: 'P' });
      const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
      expect(getRow(x.id).isAttached).toBe(0);
      setItemPosition(x.id, 7.5);

      const res = await write(x.id, { parentId: p.id });
      expect(res.status, entryPoint).toBe(200);
      expect(res.body, entryPoint).toMatchObject({
        parentId: p.id,
        isAttached: 0,
        workphaseId: todo.id,
        position: 7.5,
        positionScope: 'workflow',
      });
    }
  });

  it('ATT-3.9: a reparent that omits the flag keeps each child Free or Attached; one that names it lands in that state', async () => {
    const { project, todo, inProgress } = await setupWorkflow();
    const a = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'A' });
    const { p: b } = await cardWithTwoStubs(project.id, inProgress.id, 'B');
    const freeChild = () =>
      createItem({ projectId: project.id, parentId: a.id, title: 'X', isAttached: false, workphaseId: todo.id });
    const attachedChild = () => createItem({ projectId: project.id, parentId: a.id, title: 'Y' });
    const free = { parentId: b.id, isAttached: 0, workphaseId: todo.id, positionScope: 'workflow' };
    const attached = { parentId: b.id, isAttached: 1, workphaseId: inProgress.id, positionScope: 'attached-siblings' };

    // Flag omitted: X keeps its own workphase; Y takes B's, appended after B's two Stubs.
    const x = await move((await freeChild()).id, { parentId: b.id });
    expect(x.status).toBe(200);
    expect(x.body).toMatchObject(free);
    const y = await move((await attachedChild()).id, { parentId: b.id });
    expect(y.status).toBe(200);
    expect(y.body).toMatchObject({ ...attached, position: 3.0 });

    // Flag named: every combination lands in the state it names.
    const named = [
      { label: 'Free to Free', create: freeChild, isAttached: false, state: free },
      { label: 'Free to Attached', create: freeChild, isAttached: true, state: attached },
      { label: 'Attached to Free', create: attachedChild, isAttached: false, state: free },
      { label: 'Attached to Attached', create: attachedChild, isAttached: true, state: attached },
    ];
    for (const { label, create, isAttached, state } of named) {
      const res = await move((await create()).id, { parentId: b.id, isAttached });
      expect(res.status, label).toBe(200);
      expect(res.body, label).toMatchObject(state);
    }
  });

  it('ATT-3.10: a Free reparent keeps its position with no anchor, and takes the anchor it names', async () => {
    const { project, todo } = await setupWorkflow();
    const a = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'A' });
    const b = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'B' });
    const f1 = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'F1' });
    const f2 = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'F2' });
    const x = await createItem({
      projectId: project.id,
      parentId: a.id,
      title: 'X',
      isAttached: false,
      workphaseId: todo.id,
    });
    setItemPosition(f1.id, 10.0);
    setItemPosition(f2.id, 11.0);
    setItemPosition(x.id, 7.5);

    const kept = await move(x.id, { parentId: b.id });
    expect(kept.status).toBe(200);
    expect(kept.body).toMatchObject({ parentId: b.id, isAttached: 0, positionScope: 'workflow', position: 7.5 });

    const anchored = await move(x.id, { parentId: a.id, anchorId: f1.id, side: 'after' });
    expect(anchored.status).toBe(200);
    expect(anchored.body).toMatchObject({ parentId: a.id, isAttached: 0, positionScope: 'workflow' });
    expect(anchored.body.position).toBeGreaterThan(10.0);
    expect(anchored.body.position).toBeLessThan(11.0);
  });

  it('ATT-1.8, ATT-7.7: reparent to root (parentId: null) clears the flag and re-resolves a workflow position', async () => {
    const { project, todo } = await setupWorkflow();
    const { s1: x } = await cardWithTwoStubs(project.id, todo.id);
    const f = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'F' });
    setItemPosition(f.id, 40.0);

    const res = await move(x.id, { parentId: null });
    expect(res.status).toBe(200);
    expect(res.body.parentId).toBeNull();
    expect(res.body.isAttached).toBe(0);
    expect(res.body.workphaseId).toBe(todo.id); // no workphase change implied
    expect(res.body.positionScope).toBe('workflow');
    expect(res.body.position).toBe(41); // appended past the workflow's true last item
  });

  it('ATT-7.7: reparent to root from under a done parent makes it a done Free item', async () => {
    const { project, done } = await setupWorkflow();
    const { s1: x } = await cardWithTwoStubs(project.id, done.id);
    expect(getRow(x.id).completedAt).toBeNull();
    const res = await move(x.id, { parentId: null });
    expect(res.status).toBe(200);
    expect(res.body.position).toBeNull();
    expect(res.body.completedAt).not.toBeNull();
    expect(res.body.positionScope).toBe('none');
  });

  it('ATT-7.8: a Free child made top-level keeps its position with no anchor, and takes the anchor it names', async () => {
    const { project, todo } = await setupWorkflow();
    const p = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'P' });
    const f1 = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'F1' });
    const f2 = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'F2' });
    const freeChild = (title: string) =>
      createItem({ projectId: project.id, parentId: p.id, title, isAttached: false, workphaseId: todo.id });
    const x = await freeChild('X');
    const y = await freeChild('Y');
    setItemPosition(f1.id, 10.0);
    setItemPosition(f2.id, 11.0);
    setItemPosition(x.id, 7.5);

    const kept = await move(x.id, { parentId: null });
    expect(kept.status).toBe(200);
    expect(kept.body).toMatchObject({ parentId: null, isAttached: 0, positionScope: 'workflow', position: 7.5 });

    const anchored = await move(y.id, { parentId: null, anchorId: f1.id, side: 'after' });
    expect(anchored.status).toBe(200);
    expect(anchored.body).toMatchObject({ parentId: null, isAttached: 0, positionScope: 'workflow' });
    expect(anchored.body.position).toBeGreaterThan(10.0);
    expect(anchored.body.position).toBeLessThan(11.0);
  });
});

describe('PATCH /items/:id/move — done parents and done columns', () => {
  it('ATT-6.1, ATT-6.2, TC-2.20, TC-7.15: attaching to a done parent inherits the terminal workphase, no completedAt, keeps a position', async () => {
    const { project, todo, done } = await setupWorkflow();
    const { p, s1 } = await cardWithTwoStubs(project.id, done.id);
    expect(getRow(p.id).position).toBeNull(); // P is a done Free item
    expect(getRow(p.id).completedAt).not.toBeNull();
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
    // What an attached child under a done parent reads as: done by its
    // workphase alone, with no completedAt and a real sibling position.
    const attachedUnderP = { parentId: p.id, isAttached: 1, workphaseId: done.id, completedAt: null };

    const res = await move(x.id, { parentId: p.id, isAttached: true, anchorId: s1.id, side: 'after' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ...attachedUnderP, positionScope: 'attached-siblings', position: 1.5 });

    // With no anchor, it lands last among P's Stubs.
    const y = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Y' });
    const last = await move(y.id, { parentId: p.id, isAttached: true });
    expect(last.status).toBe(200);
    expect(last.body).toMatchObject({ ...attachedUnderP, positionScope: 'attached-siblings', position: 3.0 });
  });

  it('ATT-6.3: reopening a done parent makes its Stub not done, writing only the cascaded workphase on it', async () => {
    const { project, todo, done } = await setupWorkflow();
    const p = await createItem({ projectId: project.id, workphaseId: done.id, title: 'P' });
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
    expect((await move(x.id, { parentId: p.id, isAttached: true })).status).toBe(200);
    const before = getRow(x.id);
    expect(before).toMatchObject({ workphaseId: done.id, completedAt: null });

    expect((await move(p.id, { workphaseId: todo.id })).status).toBe(200);
    const after = getRow(x.id);
    expect(after).toEqual({ ...before, workphaseId: todo.id, updatedAt: after.updatedAt });
  });

  it('ATT-7.4: a detached child moved into a terminal workphase is done like any Free item, and keeps its parent', async () => {
    const { project, todo, done } = await setupWorkflow();
    const p = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'P' });
    const x = await createItem({ projectId: project.id, parentId: p.id, title: 'X' });
    expect((await move(x.id, { isAttached: false })).status).toBe(200);

    const res = await move(x.id, { workphaseId: done.id });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ parentId: p.id, isAttached: 0, workphaseId: done.id, position: null });
    expect(res.body.completedAt).not.toBeNull();
  });

  it('TC-2.8: a done Free item cannot be an anchor, and the refused move writes nothing', async () => {
    const { project, todo, done } = await setupWorkflow();
    const d = await createItem({ projectId: project.id, workphaseId: done.id, title: 'D' });
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
    const before = getRow(x.id);
    const res = await move(x.id, { workphaseId: done.id, anchorId: d.id, side: 'after' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no position to anchor against/);
    expect(getRow(x.id)).toEqual(before); // no workphase change, no position
  });

  it('ATT-1.12: attaching a done Free item clears its completedAt, under a live parent or a done one', async () => {
    const { project, todo, done } = await setupWorkflow();
    const p = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'P' });
    const x = await createItem({ projectId: project.id, workphaseId: done.id, title: 'X' });
    expect(getRow(x.id)).toMatchObject({ position: null, completedAt: expect.any(Number) });
    const res = await move(x.id, { parentId: p.id, isAttached: true });
    expect(res.status).toBe(200);
    expect(res.body.completedAt).toBeNull();
    expect(res.body.workphaseId).toBe(todo.id);
    expect(res.body.position).toBe(1.0);
    expect(res.body).toMatchObject({ isAttached: 1, positionScope: 'attached-siblings' });

    // Under a done parent it takes the terminal workphase, and still holds no completedAt.
    const doneParent = await createItem({ projectId: project.id, workphaseId: done.id, title: 'Done P' });
    const y = await createItem({ projectId: project.id, workphaseId: done.id, title: 'Y' });
    expect(getRow(y.id).completedAt).not.toBeNull();
    const underDone = await move(y.id, { parentId: doneParent.id, isAttached: true });
    expect(underDone.status).toBe(200);
    expect(underDone.body).toMatchObject({
      isAttached: 1,
      workphaseId: done.id,
      completedAt: null,
      positionScope: 'attached-siblings',
      position: 1.0,
    });
  });
});

describe('atomicity', () => {
  it('ATT-3.7, ATT-4.4: a depth-cap rejection leaves the item and its subtree byte-identical', async () => {
    const { project, todo, inProgress } = await setupWorkflow();
    const deepest = await createChain(project.id, inProgress.id, ITEM_DEPTH_CAP - 1);
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
    const x1 = await createItem({ projectId: project.id, parentId: x.id, title: 'X1' });
    const before = { x: getRow(x.id), x1: getRow(x1.id) };

    const res = await move(x.id, { parentId: deepest.id, isAttached: true });
    expect(res.status).toBe(400);
    expect(getRow(x.id)).toEqual(before.x);
    expect(getRow(x1.id)).toEqual(before.x1);
    expect(hierarchyEntries(x.id)).toHaveLength(0);
  });
});

describe('data already past the cap', () => {
  it('ATT-4.7: a tree already past the cap loads, and takes every write that reparents nothing', async () => {
    const { project, workflow, todo, inProgress } = await setupWorkflow();
    const chain = await seedChainPastCap(project.id, todo.id, ITEM_DEPTH_CAP + 1);
    const deepest = chain[chain.length - 1];
    // A second child beside the deepest link, so the deepest level has a sibling to reorder.
    const sibling = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'sibling' });
    setItemParent(sibling.id, chain[chain.length - 2].id, true);
    const members = [...chain, getRow(sibling.id)];

    for (const m of members) expect((await request(app).get(`/api/items/${m.id}`)).status).toBe(200);
    const board = await createBoard(workflow.id);
    const boardRes = await request(app).get(`/api/boards/${board.id}`);
    const inColumns = boardRes.body.columns.flatMap((c: { subRows: { items: { id: string }[] }[] }) =>
      c.subRows.flatMap(r => r.items.map(i => i.id)),
    );
    expect(inColumns).toEqual(expect.arrayContaining(members.map(m => m.id)));
    expect(boardRes.body.unsorted.needsAttention).toBe(false);
    // Reading repaired nothing.
    for (const m of members) expect(getRow(m.id)).toEqual(m);

    expect((await move(sibling.id, { anchorId: deepest.id, side: 'before' })).status).toBe(200);
    expect((await put(deepest.id, { title: 'renamed' })).status).toBe(200);
    expect((await move(chain[0].id, { workphaseId: inProgress.id })).status).toBe(200);
  });

  it('ATT-4.11: a move that brings an over-cap subtree up, but not within the cap, is refused', async () => {
    const { project, todo } = await setupWorkflow();
    const chain = await seedChainPastCap(project.id, todo.id, ITEM_DEPTH_CAP + 2);
    // M is at depth 3 with height CAP − 1, so its deepest leaf sits at CAP + 2.
    const m = chain[2];
    const root = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'root' });
    const before = getRow(m.id);

    // Under a root item that leaf would sit at 1 + 1 + (CAP − 1) = CAP + 1: shallower, still over.
    const res = await move(m.id, { parentId: root.id });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/exceeds the cap/);
    expect(getRow(m.id)).toEqual(before);
  });

  it('ATT-4.11: the top level is no exception: a subtree too tall for the cap is refused it by move and by PUT, and one that fits is not', async () => {
    const { project, todo } = await setupWorkflow();
    // The chain's second link has height CAP, so at the top level its deepest leaf
    // would sit at CAP + 1. The third has height CAP − 1, which just fits.
    const [, tooTall, fits] = await seedChainPastCap(project.id, todo.id, ITEM_DEPTH_CAP + 2);
    const before = getRow(tooTall.id);

    for (const [entryPoint, write] of [
      ['move', move],
      ['PUT', put],
    ] as const) {
      const res = await write(tooTall.id, { parentId: null });
      expect(res.status, entryPoint).toBe(400);
      expect(res.body.error, entryPoint).toMatch(/exceeds the cap/);
      expect(getRow(tooTall.id), entryPoint).toEqual(before);
    }

    const accepted = await move(fits.id, { parentId: null });
    expect(accepted.status).toBe(200);
    expect(accepted.body.parentId).toBeNull();
  });
});

describe('hierarchy activity log', () => {
  it('ATT-8.1: each parent or attachment change logs one entry on the moving item, at both entry points, and none on the parents', async () => {
    for (const [entryPoint, write] of [
      ['move', move],
      ['PUT', put],
    ] as const) {
      const { project, todo } = await setupWorkflow(entryPoint);
      const p = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'P' });
      const q = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Q' });
      const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
      const parentsActivity = () =>
        db
          .select()
          .from(activityLog)
          .where(inArray(activityLog.itemId, [p.id, q.id]))
          .all();
      const parentsBefore = parentsActivity();

      const steps: [Record<string, unknown>, string][] = [
        [{ parentId: p.id, isAttached: true }, 'Parented under "P" (attached)'],
        [{ isAttached: false }, 'Detached from "P"'],
        [{ parentId: q.id }, 'Reparented from "P" to "Q" (detached)'],
        [{ isAttached: true }, 'Attached to "Q"'],
        [{ parentId: p.id }, 'Reparented from "Q" to "P" (attached)'],
        [{ parentId: null }, 'Made top-level (was under "P")'],
      ];
      for (const [body, entry] of steps) {
        const step = `${entryPoint} ${JSON.stringify(body)}`;
        const logged = hierarchyEntries(x.id).length;
        expect((await write(x.id, body)).status, step).toBe(200);
        expect(
          hierarchyEntries(x.id)
            .slice(logged)
            .map(e => e.content),
          step,
        ).toEqual([entry]);
      }
      expect(parentsActivity()).toEqual(parentsBefore);
    }
  });

  it('ATT-8.1: logs attach, detach, reparent and top-level with the right content, at both entry points', async () => {
    const { project, todo } = await setupWorkflow();
    const a = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'A' });
    const b = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'B' });
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });

    await move(x.id, { parentId: a.id, isAttached: true });
    await put(x.id, { isAttached: false });
    await move(x.id, { parentId: b.id, isAttached: true });
    await put(x.id, { parentId: null });

    expect(hierarchyEntries(x.id).map(e => e.content)).toEqual([
      'Parented under "A" (attached)',
      'Detached from "A"',
      'Reparented from "A" to "B" (attached)',
      'Made top-level (was under "B")',
    ]);
  });

  it('ATT-8.2: a write that changes neither parent nor attachment logs no hierarchy entry', async () => {
    const { project, todo, inProgress } = await setupWorkflow();
    const p = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'P' });
    const f = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'F' });
    const x = await createItem({
      projectId: project.id,
      parentId: p.id,
      title: 'X',
      isAttached: false,
      workphaseId: todo.id,
    });
    const y = await createItem({ projectId: project.id, parentId: p.id, title: 'Y' });
    const logged = { x: hierarchyEntries(x.id).length, y: hierarchyEntries(y.id).length };

    expect((await move(x.id, { workphaseId: inProgress.id })).status).toBe(200);
    expect((await move(x.id, { anchorId: f.id, side: 'after' })).status).toBe(200);
    expect((await put(x.id, { title: 'X renamed' })).status).toBe(200);
    expect((await move(y.id, { parentId: p.id, isAttached: true })).status).toBe(200);
    expect((await put(y.id, { parentId: p.id, isAttached: true })).status).toBe(200);

    expect(hierarchyEntries(x.id)).toHaveLength(logged.x);
    expect(hierarchyEntries(y.id)).toHaveLength(logged.y);
  });

  it("ATT-8.3: an item created under a parent records that parent, and whether it's attached, in its own activity", async () => {
    const { project, todo } = await setupWorkflow();
    const p = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'P' });
    const attached = await createItem({ projectId: project.id, parentId: p.id, title: 'X' });
    const free = await createItem({
      projectId: project.id,
      parentId: p.id,
      title: "X'",
      isAttached: false,
      workphaseId: todo.id,
    });

    // The facts, not the wording: how an entry reads is pinned by ATT-8.1's tests.
    for (const [item, isAttached] of [
      [attached, true],
      [free, false],
    ] as const) {
      const entries = hierarchyEntries(item.id);
      expect(entries).toHaveLength(1);
      expect(JSON.parse(entries[0].metadata!)).toMatchObject({ toParentId: p.id, toAttached: isAttached });
    }
  });

  it('ATT-8.4: an attach that snaps the workphase logs the status change beside the hierarchy entry, at PUT as at move', async () => {
    const { project, todo, inProgress } = await setupWorkflow();
    const p = await createItem({ projectId: project.id, workphaseId: inProgress.id, title: 'P' });
    for (const write of [put, move]) {
      const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
      expect((await write(x.id, { parentId: p.id, isAttached: true })).status).toBe(200);
      const entries = db.select().from(activityLog).where(eq(activityLog.itemId, x.id)).all();
      const ofType = (type: string) => entries.filter(e => e.type === type).map(e => e.content);
      expect(ofType('hierarchy_change')).toEqual(['Parented under "P" (attached)']);
      expect(ofType('status_change')).toContain('Moved from "Todo" to "In Progress"');
    }
  });
});

describe('reindex disclosure', () => {
  // Two positioned items at ≥ 1000 in a scope of two trips the magnitude
  // threshold (max(1000, count + 100)) on the next append.
  async function setupNearThreshold() {
    const { project, todo } = await setupWorkflow();
    const a = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'A' });
    const b = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'B' });
    setItemPosition(a.id, 1100);
    setItemPosition(b.id, 1200);
    return { project, todo, a, b };
  }

  it('TC-5.10, TC-5.11, TC-5.14: move: the response carries every renumbered {id, position} pair, the moved item included', async () => {
    const { project, todo, a, b } = await setupNearThreshold();
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
    // X's own create already reindexed (A=1, B=2, X=3) — push A/B back up so
    // the move is what trips it.
    setItemPosition(a.id, 1100);
    setItemPosition(b.id, 1200);
    setItemPosition(x.id, 5);

    const res = await move(x.id, { anchorId: b.id, side: 'after' });
    expect(res.status).toBe(200);
    expect(res.body.reindexed).toEqual([
      { id: a.id, position: 1 },
      { id: b.id, position: 2 },
      { id: x.id, position: 3 },
    ]);
    expect(res.body.position).toBe(3);
  });

  it('TC-5.2, TC-5.10, TC-5.13, TC-5.14: PUT and POST disclose the same way', async () => {
    const { project, todo, a, b } = await setupNearThreshold();
    const created = await request(app)
      .post('/api/items')
      .send({ projectId: project.id, workphaseId: todo.id, title: 'C' });
    expect(created.status).toBe(201);
    expect(created.body.reindexed).toEqual([
      { id: a.id, position: 1 },
      { id: b.id, position: 2 },
      { id: created.body.id, position: 3 },
    ]);

    const p = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'P' });
    const s1 = await createItem({ projectId: project.id, parentId: p.id, title: 'S1' });
    setItemPosition(s1.id, 1500);
    const attached = await put(created.body.id, { parentId: p.id, isAttached: true });
    expect(attached.status).toBe(200);
    expect(attached.body.reindexed).toEqual([
      { id: s1.id, position: 1 },
      { id: created.body.id, position: 2 },
    ]);
  });

  it('TC-5.12: is absent when no reindex fired, for a gap that fits and for an append under the threshold', async () => {
    const { project, todo } = await setupWorkflow();
    const a = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'A' });
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
    const res = await move(x.id, { anchorId: a.id, side: 'before' });
    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('reindexed');

    const appended = await request(app)
      .post('/api/items')
      .send({ projectId: project.id, workphaseId: todo.id, title: 'Y' });
    expect(appended.status).toBe(201);
    expect(appended.body).not.toHaveProperty('reindexed');
  });
});

describe('PUT /items/:id and POST /items share the guards — every write', () => {
  it('ATT-4.10: PUT enforces the depth cap', async () => {
    const { project, todo } = await setupWorkflow();
    const deepest = await createChain(project.id, todo.id, ITEM_DEPTH_CAP);
    const leaf = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'leaf' });
    const res = await put(leaf.id, { parentId: deepest.id });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/exceeds the cap/);
  });

  it('ATT-4.10: POST enforces the depth cap: a child at depth CAP is fine, CAP + 1 is refused', async () => {
    const { project, todo } = await setupWorkflow();
    const deepest = await createChain(project.id, todo.id, ITEM_DEPTH_CAP);
    const res = await request(app)
      .post('/api/items')
      .send({ projectId: project.id, parentId: deepest.id, title: 'too deep' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/exceeds the cap/);
  });

  it('ATT-4.10: a refused PUT leaves the row unchanged, a refused POST creates nothing, and a legal parent is accepted', async () => {
    const { project, todo } = await setupWorkflow();
    const deepest = await createChain(project.id, todo.id, ITEM_DEPTH_CAP);
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
    const x1 = await createItem({ projectId: project.id, parentId: x.id, title: 'X1' });
    const before = getRow(x.id);

    // A missing parent, the item itself, a descendant, a parent too deep.
    for (const parentId of ['nope', x.id, x1.id, deepest.id]) {
      expect((await put(x.id, { parentId })).status, parentId).toBe(400);
      expect(getRow(x.id), parentId).toEqual(before);
    }

    const create = (title: string, parentId: string) =>
      request(app).post('/api/items').send({ projectId: project.id, parentId, title });
    for (const [title, parentId] of [
      ['under nothing', 'nope'],
      ['too deep', deepest.id],
    ]) {
      expect((await create(title, parentId)).status, title).toBe(400);
      expect(db.select().from(items).where(eq(items.title, title)).all(), title).toEqual([]);
    }

    // A leaf under a parent at depth CAP − 1 lands at exactly CAP, created or moved there.
    expect((await create('deep enough', deepest.parentId)).status).toBe(201);
    expect((await put(x1.id, { parentId: deepest.parentId })).status).toBe(200);
  });

  it('ATT-5.2: PUT cascades projectId to detached descendants on a cross-project reparent', async () => {
    const projectA = await createProject({ name: 'A' });
    const projectB = await createProject({ name: 'B' });
    const q = await createItem({ projectId: projectB.id, title: 'Q' });
    const x = await createItem({ projectId: projectA.id, title: 'X' });
    const x2 = await createItem({
      projectId: projectA.id,
      parentId: x.id,
      title: 'X2',
      isAttached: false,
      workphaseId: null,
    });
    const res = await put(x.id, { parentId: q.id });
    expect(res.status).toBe(200);
    expect(getRow(x2.id).projectId).toBe(projectB.id);
  });
});
