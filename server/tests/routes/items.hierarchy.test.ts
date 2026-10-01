import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { eq, inArray } from 'drizzle-orm';
import { app } from '../../src/index.js';
import { db } from '../../src/db/index.js';
import { items, activityLog } from '../../src/db/schema.js';
import { ITEM_DEPTH_CAP } from '../../src/lib/itemTree.js';
import {
  createProject,
  createWorkflow,
  createWorkphase,
  createItem,
  createBoard,
  setItemPosition,
} from '../fixtures.js';

// Atomic reparent-with-placement through the item routes: attach, detach and
// reparent, the depth cap, cross-project moves, the hierarchy activity log
// and reindex disclosure.

type Row = typeof items.$inferSelect;

function getRow(id: string): Row {
  return db.select().from(items).where(eq(items.id, id)).get()!;
}

function hierarchyEntries(itemId: string) {
  return db
    .select()
    .from(activityLog)
    .where(eq(activityLog.itemId, itemId))
    .all()
    .filter(e => e.type === 'hierarchy_change');
}

const move = (id: string, body: Record<string, unknown>) => request(app).patch(`/api/items/${id}/move`).send(body);
const put = (id: string, body: Record<string, unknown>) => request(app).put(`/api/items/${id}`).send(body);

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
    db.update(items)
      .set({ parentId: chain[d - 2].id, isAttached: 1 })
      .where(eq(items.id, link.id))
      .run();
    chain.push(getRow(link.id));
  }
  return chain;
}

// One project owning a three-phase workflow (Todo, In Progress, Done*).
async function setupWorkflow(name = 'P') {
  const project = await createProject({ name });
  const workflow = await createWorkflow(project.id);
  const todo = await createWorkphase(workflow.id, { name: 'Todo' });
  const inProgress = await createWorkphase(workflow.id, { name: 'In Progress' });
  const done = await createWorkphase(workflow.id, { name: 'Done', isTerminal: true });
  return { project, workflow, todo, inProgress, done };
}

// Card P with attached Stubs S1 = 1.0, S2 = 2.0 (the standard "target
// parent with siblings" fixture from the test plans).
async function cardWithTwoStubs(projectId: string, workphaseId: string, title = 'P') {
  const p = await createItem({ projectId, workphaseId, title });
  const s1 = await createItem({ projectId, parentId: p.id, title: `${title}-S1` });
  const s2 = await createItem({ projectId, parentId: p.id, title: `${title}-S2` });
  expect([s1.position, s2.position]).toEqual([1.0, 2.0]);
  return { p, s1, s2 };
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

  it('ATT-1.8: rejects isAttached: true with no resulting parent', async () => {
    const { project, todo } = await setupWorkflow();
    const root = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'root' });
    const res = await move(root.id, { isAttached: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/requires a parentId/);

    // ...including when the same request clears the parent.
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'child' });
    const both = await move(child.id, { parentId: null, isAttached: true });
    expect(both.status).toBe(400);
    expect(getRow(child.id).parentId).toBe(parent.id);
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

    // The subject is excluded from its own scope, so without an explicit
    // check this would pass validation and throw inside the transaction.
    const res = await move(x.id, { anchorId: x.id, side: 'after' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cannot be the item itself/);
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

describe('cross-project reparenting', () => {
  // Root project R owns the workflow; P1 and P2 inherit it, so a board of
  // R's workflow shows both — the scenario a cross-project board drag
  // comes from.
  async function setupSiblingProjects() {
    const { project: root, workflow, todo, inProgress, done } = await setupWorkflow('R');
    const p1 = await createProject({ name: 'P1', parentId: root.id });
    const p2 = await createProject({ name: 'P2', parentId: root.id });
    return { root, workflow, todo, inProgress, done, p1, p2 };
  }

  it('ATT-2.2, ATT-3.6, ATT-5.1, ATT-5.2, TC-7.14: cascades projectId to the whole subtree, detached descendants included, and places normally', async () => {
    const { todo, inProgress, p1, p2 } = await setupSiblingProjects();
    const { p: q, s1: q1 } = await cardWithTwoStubs(p2.id, inProgress.id, 'Q');
    const x = await createItem({ projectId: p1.id, workphaseId: todo.id, title: 'X' });
    const x1 = await createItem({ projectId: p1.id, parentId: x.id, title: 'X1' });
    const x2 = await createItem({
      projectId: p1.id,
      parentId: x.id,
      title: 'X2',
      isAttached: false,
      workphaseId: todo.id,
    });
    const x2a = await createItem({ projectId: p1.id, parentId: x2.id, title: 'X2a' });
    const x2Position = getRow(x2.id).position;

    const res = await move(x.id, { parentId: q.id, isAttached: true, anchorId: q1.id, side: 'after' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ parentId: q.id, isAttached: 1, workphaseId: inProgress.id });
    expect(res.body.projectId).toBe(p2.id);
    for (const id of [x1.id, x2.id, x2a.id]) expect(getRow(id).projectId).toBe(p2.id);
    // No cross-project positioning rule: same anchor + true-neighbor math.
    expect(res.body.position).toBe(1.5);
    // Same workflow on both sides — nothing is foreign, nothing is nulled.
    expect(getRow(x2.id).workphaseId).toBe(todo.id);
    expect(getRow(x2.id).position).toBe(x2Position);
    expect(getRow(x1.id).workphaseId).toBe(inProgress.id); // attached: cascaded
    expect(getRow(x2a.id).workphaseId).toBe(todo.id); // attached to X2, which didn't move workphase
  });

  it('ATT-8.1: records the project change in the hierarchy activity entry', async () => {
    const { todo, p1, p2 } = await setupSiblingProjects();
    const q = await createItem({ projectId: p2.id, workphaseId: todo.id, title: 'Q' });
    const x = await createItem({ projectId: p1.id, workphaseId: todo.id, title: 'X' });
    await move(x.id, { parentId: q.id, isAttached: true });
    const [entry] = hierarchyEntries(x.id);
    expect(entry.content).toBe('Parented under "Q" (attached)');
    expect(JSON.parse(entry.metadata!)).toMatchObject({ fromProjectId: p1.id, toProjectId: p2.id, toAttached: true });
  });

  it('TC-7.14: a Free item reparented across projects with no anchor keeps its position', async () => {
    const { todo, p1, p2 } = await setupSiblingProjects();
    const a = await createItem({ projectId: p1.id, workphaseId: todo.id, title: 'A' });
    const b = await createItem({ projectId: p2.id, workphaseId: todo.id, title: 'B' });
    const x = await createItem({
      projectId: p1.id,
      parentId: a.id,
      title: 'X',
      isAttached: false,
      workphaseId: todo.id,
    });
    setItemPosition(x.id, 5.0);

    const res = await move(x.id, { parentId: b.id });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ parentId: b.id, isAttached: 0, projectId: p2.id, position: 5.0 });
  });

  describe('across workflows', () => {
    // ATT-5.9's setup: P1 on workflow WF1, P2 on WF2, and B in P2 at w2 of WF2.
    async function setupAcrossWorkflows() {
      const a = await setupWorkflow('P1');
      const b = await setupWorkflow('P2');
      const bItem = await createItem({ projectId: b.project.id, workphaseId: b.todo.id, title: 'B' });
      return { a, b, bItem, w1: a.todo, w2: b.todo };
    }

    it('ATT-5.9: a cross-workflow reparent that would leave a Free item in the moved subtree is refused', async () => {
      const { a, bItem, w1, w2 } = await setupAcrossWorkflows();
      const p1 = a.project.id;
      const detached = (parentId: string, title: string) =>
        createItem({ projectId: p1, parentId, title, isAttached: false, workphaseId: w1.id });
      const x = await createItem({ projectId: p1, workphaseId: w1.id, title: 'X' });
      const x1 = await createItem({ projectId: p1, parentId: x.id, title: 'X1' });
      const holder = await createItem({ projectId: p1, workphaseId: w1.id, title: 'A' });
      const y = await createItem({ projectId: p1, parentId: holder.id, title: 'Y' });
      const y2 = await detached(y.id, 'Y2');
      const z = await createItem({ projectId: p1, workphaseId: w1.id, title: 'Z' });
      const z2 = await detached(z.id, 'Z2');
      const subtree = [x, x1, y, y2, z, z2].map(i => i.id);
      const before = subtree.map(id => getRow(id));

      const refusals = [
        // X is reparented to B and stays Free, naming no workphase or, in a move, naming w2.
        ['X by PUT', () => put(x.id, { parentId: bItem.id }), /"X"/],
        ['X by move', () => move(x.id, { parentId: bItem.id }), /"X"/],
        ['X by move naming w2', () => move(x.id, { parentId: bItem.id, workphaseId: w2.id }), /"X"/],
        // Y is reparented to B and stays attached, with a detached descendant.
        ['Y by PUT', () => put(y.id, { parentId: bItem.id }), /"Y2"/],
        ['Y by move', () => move(y.id, { parentId: bItem.id }), /"Y2"/],
        // Z is attached to B, with a detached descendant.
        ['Z by PUT', () => put(z.id, { parentId: bItem.id, isAttached: true }), /"Z2"/],
        ['Z by move', () => move(z.id, { parentId: bItem.id, isAttached: true }), /"Z2"/],
      ] as const;
      for (const [label, write, mentions] of refusals) {
        const res = await write();
        expect(res.status, label).toBe(400);
        expect(res.body.error, label).toMatch(/crosses workflows/);
        expect(res.body.error, label).toMatch(mentions);
        expect(
          subtree.map(id => getRow(id)),
          label,
        ).toEqual(before);
      }
    });

    it('ATT-5.10: a cross-workflow reparent that leaves every moved item Attached is accepted', async () => {
      const { a, b, bItem, w1, w2 } = await setupAcrossWorkflows();
      const p1 = a.project.id;

      for (const [entryPoint, write] of [
        ['move', move],
        ['PUT', put],
      ] as const) {
        // Free X with an attached child is attached to B.
        const x = await createItem({ projectId: p1, workphaseId: w1.id, title: `X ${entryPoint}` });
        const x1 = await createItem({ projectId: p1, parentId: x.id, title: 'X1' });
        const res = await write(x.id, { parentId: bItem.id, isAttached: true });
        expect(res.status, entryPoint).toBe(200);
        expect(res.body, entryPoint).toMatchObject({
          parentId: bItem.id,
          isAttached: 1,
          projectId: b.project.id,
          workphaseId: w2.id,
        });
        expect(getRow(x1.id), entryPoint).toMatchObject({ projectId: b.project.id, workphaseId: w2.id });

        // An attached Y with an attached child stays attached when reparented to B.
        const holder = await createItem({ projectId: p1, workphaseId: w1.id, title: `A ${entryPoint}` });
        const y = await createItem({ projectId: p1, parentId: holder.id, title: `Y ${entryPoint}` });
        const y1 = await createItem({ projectId: p1, parentId: y.id, title: 'Y1' });
        const stub = await write(y.id, { parentId: bItem.id });
        expect(stub.status, entryPoint).toBe(200);
        expect(stub.body, entryPoint).toMatchObject({
          parentId: bItem.id,
          isAttached: 1,
          projectId: b.project.id,
          workphaseId: w2.id,
          positionScope: 'attached-siblings',
        });
        expect(getRow(y1.id), entryPoint).toMatchObject({ projectId: b.project.id, workphaseId: w2.id });
      }
    });

    it('TC-7.19: the cross-workflow reparent that is allowed nulls no position', async () => {
      const { a, bItem, w1, b } = await setupAcrossWorkflows();
      const p1 = a.project.id;
      const b1 = await createItem({ projectId: b.project.id, parentId: bItem.id, title: 'B1' });
      const b2 = await createItem({ projectId: b.project.id, parentId: bItem.id, title: 'B2' });
      expect([b1.position, b2.position]).toEqual([1.0, 2.0]);
      const freeWithChild = async (title: string) => {
        const x = await createItem({ projectId: p1, workphaseId: w1.id, title });
        setItemPosition(x.id, 5.0);
        const x1 = await createItem({ projectId: p1, parentId: x.id, title: `${title}1` });
        return { x, x1 };
      };

      const anchored = await freeWithChild('X');
      const after = await move(anchored.x.id, { parentId: bItem.id, isAttached: true, anchorId: b1.id, side: 'after' });
      expect(after.status).toBe(200);
      expect(after.body.position).toBe(1.5); // among B's attached children
      expect(getRow(anchored.x1.id).position).toBe(1.0); // scoped to X
      expect(after.body.reindexed).toBeUndefined();

      const appended = await freeWithChild('W');
      const last = await move(appended.x.id, { parentId: bItem.id, isAttached: true });
      expect(last.status).toBe(200);
      expect(last.body.position).toBe(3); // the append fallback among B's children
      for (const id of [anchored.x.id, anchored.x1.id, appended.x.id, appended.x1.id]) {
        expect(getRow(id).position, id).not.toBeNull();
      }
    });

    it("ATT-9.8: a move can't leave a Free item in a workphase its project's workflow doesn't use", async () => {
      const a = await setupWorkflow('P1');
      const other = await setupWorkflow('Other');
      const f = await createItem({ projectId: a.project.id, workphaseId: a.todo.id, title: 'F' });
      const b = await createItem({ projectId: a.project.id, workphaseId: a.todo.id, title: 'B' });
      const before = getRow(f.id);

      // v belongs to a workflow P1 doesn't use.
      const v = other.inProgress.id;
      for (const [label, body] of [
        ['no reparent', { workphaseId: v }],
        ['reparented under B, left Free', { parentId: b.id, isAttached: false, workphaseId: v }],
      ] as const) {
        const res = await move(f.id, body);
        expect(res.status, label).toBe(400);
        expect(res.body.error, label).toMatch(/workflow this item's project does not use; name a workphase of that/);
        expect(getRow(f.id), label).toEqual(before);
      }
    });

    it("ATT-9.9: a create can't name a workphase its project's workflow doesn't use", async () => {
      const a = await setupWorkflow('P1');
      const other = await setupWorkflow('Other');
      const b = await createItem({ projectId: a.project.id, workphaseId: a.todo.id, title: 'B' });
      const v = other.inProgress.id;
      const before = countItems();

      for (const [label, body] of [
        ['top-level', { title: 'T', projectId: a.project.id }],
        ['detached child of B', { title: 'C', parentId: b.id, isAttached: false }],
      ] as const) {
        const res = await request(app)
          .post('/api/items')
          .send({ ...body, workphaseId: v });
        expect(res.status, label).toBe(400);
        expect(res.body.error, label).toMatch(/workflow this item's project does not use/);
      }
      expect(countItems()).toBe(before);

      // A workphase of its own project's workflow is fine.
      const ok = await createItem({ projectId: a.project.id, title: 'T', workphaseId: a.inProgress.id });
      expect(ok.workphaseId).toBe(a.inProgress.id);
    });

    it('TC-7.18, TC-7.20: an item a project move leaves in another workflow’s workphase shows in Unsorted, with no position scope', async () => {
      const q1 = await setupWorkflow('Q1');
      const q2 = await setupWorkflow('Q2');
      // P1 has no workflow of its own, so it uses Q1's.
      const p1 = await createProject({ name: 'P1', parentId: q1.project.id });
      const x = await createItem({ projectId: p1.id, workphaseId: q1.todo.id, title: 'X' });

      const res = await request(app).patch(`/api/projects/${p1.id}/move`).send({ parentId: q2.project.id });
      expect(res.status).toBe(200);
      expect(getRow(x.id).workphaseId).toBe(q1.todo.id);

      const board = await createBoard(q2.workflow.id);
      const boardRes = await request(app).get(`/api/boards/${board.id}`);
      const invalid = boardRes.body.unsorted.invalidItems as { id: string; positionScope: string }[];
      expect(invalid.map(i => i.id)).toContain(x.id);

      // It still holds a workphase of WF1, so it classifies as "none", not "workflow", wherever it's read.
      expect(invalid.find(i => i.id === x.id)?.positionScope).toBe('none');
      expect((await request(app).get(`/api/items/${x.id}`)).body.positionScope).toBe('none');
    });

    it('TC-2.24: an item with no position takes the append fallback when it is assigned a workphase', async () => {
      const { project, todo, inProgress } = await setupWorkflow();
      const pb = await createItem({ projectId: project.id, workphaseId: inProgress.id, title: 'PB' });
      setItemPosition(pb.id, 3.0);
      const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
      setItemPosition(x.id, null);

      const refiled = await move(x.id, { workphaseId: inProgress.id });
      expect(refiled.status).toBe(200);
      expect(refiled.body.position).toBe(4); // append past the workflow's true last item
    });

    it("still allows a same-workflow reparent that names a workphaseId, and a re-file into the project's own workflow", async () => {
      const { todo, inProgress, p1, p2 } = await setupSiblingProjects();
      const q = await createItem({ projectId: p2.id, workphaseId: todo.id, title: 'Q' });
      const x = await createItem({ projectId: p1.id, workphaseId: todo.id, title: 'X' });
      // Sibling projects share the root's workflow: not a workflow change.
      const res = await move(x.id, { parentId: q.id, isAttached: false, workphaseId: inProgress.id });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ projectId: p2.id, workphaseId: inProgress.id });
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
    db.update(items)
      .set({ parentId: chain[chain.length - 2].id, isAttached: 1 })
      .where(eq(items.id, sibling.id))
      .run();
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

    // The facts, not the wording: how the entry reads isn't a rule.
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

  it('ATT-1.8: PUT rejects a parentless attach', async () => {
    const { project, todo } = await setupWorkflow();
    const root = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'root' });
    const res = await put(root.id, { isAttached: true });
    expect(res.status).toBe(400);
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

// ATT-9's setup: workflow WF with non-terminal workphases W1, W2 and W3, and
// project P1 on it. R is top-level in W1, D is a detached child of R in W2,
// A is attached to D and X to A. So A and X are Stubs in D's Card, and D is
// the nearest Free ancestor of each.
async function setupShownWithChain(name = 'P1') {
  const { project, workflow, todo: w1, inProgress: w2 } = await setupWorkflow(name);
  const w3 = await createWorkphase(workflow.id, { name: 'Review' });
  const r = await createItem({ projectId: project.id, workphaseId: w1.id, title: 'R' });
  const d = await createItem({
    projectId: project.id,
    parentId: r.id,
    title: 'D',
    isAttached: false,
    workphaseId: w2.id,
  });
  const a = await createItem({ projectId: project.id, parentId: d.id, title: 'A' });
  const x = await createItem({ projectId: project.id, parentId: a.id, title: 'X' });
  expect([a.workphaseId, x.workphaseId]).toEqual([w2.id, w2.id]);
  return { project, workflow, w1, w2, w3, r, d, a, x };
}

const countItems = () => db.select().from(items).all().length;

describe('the workphase a write leaves an item in', () => {
  it("ATT-9.1: a move that leaves an item Attached cannot name a workphase other than its parent's", async () => {
    const { project, w1, w2, w3, a, x } = await setupShownWithChain();
    const before = getRow(x.id);

    for (const body of [{ workphaseId: w3.id }, { isAttached: true, workphaseId: w3.id }]) {
      const res = await move(x.id, body);
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/inherits its parent's workphase; omit workphaseId or match the parent's/);
      expect(getRow(x.id)).toEqual(before);
    }
    for (const body of [{ workphaseId: w2.id }, { isAttached: true }]) {
      const res = await move(x.id, body);
      expect(res.status).toBe(200);
      expect(res.body.workphaseId).toBe(w2.id);
    }

    // The parent that counts is the one after the write.
    const f = await createItem({ projectId: project.id, workphaseId: w1.id, title: 'F' });
    const own = await move(f.id, { parentId: a.id, isAttached: true, workphaseId: w1.id });
    expect(own.status).toBe(400);
    expect(getRow(f.id).parentId).toBeNull();
    const parents = await move(f.id, { parentId: a.id, isAttached: true, workphaseId: w2.id });
    expect(parents.status).toBe(200);
    expect(parents.body).toMatchObject({ parentId: a.id, isAttached: 1, workphaseId: w2.id });

    const detached = await move(x.id, { isAttached: false, workphaseId: w3.id });
    expect(detached.status).toBe(200);
    expect(detached.body).toMatchObject({ isAttached: 0, workphaseId: w3.id });
  });

  it("ATT-9.2: a create that makes an Attached child cannot name a workphase other than its parent's", async () => {
    const { a, w2, w3, project } = await setupShownWithChain();
    const before = countItems();

    for (const extra of [{}, { isAttached: true }]) {
      const res = await request(app)
        .post('/api/items')
        .send({ title: 'Y', parentId: a.id, workphaseId: w3.id, ...extra });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/inherits its parent's workphase; omit workphaseId or match the parent's/);
    }
    expect(countItems()).toBe(before);

    const matching = await createItem({ projectId: project.id, parentId: a.id, title: 'Y', workphaseId: w2.id });
    expect(matching).toMatchObject({ isAttached: 1, workphaseId: w2.id });
  });

  it('ATT-9.4: a detach that names no workphase leaves the item in the one it was shown in', async () => {
    for (const [entryPoint, write] of [
      ['move', move],
      ['PUT', put],
    ] as const) {
      const { w1, w2, d, a, x } = await setupShownWithChain(entryPoint);
      const res = await write(x.id, { isAttached: false });
      expect(res.status, entryPoint).toBe(200);
      // D's workphase, whose Card it was shown in, not R's.
      expect(res.body, entryPoint).toMatchObject({ isAttached: 0, workphaseId: w2.id, positionScope: 'workflow' });

      // D moves; A follows it, and X, now detached, stays.
      expect((await move(d.id, { workphaseId: w1.id })).status).toBe(200);
      expect(getRow(a.id).workphaseId).toBe(w1.id);
      expect(getRow(x.id).workphaseId).toBe(w2.id);

      // The stored copy has drifted: the item still leaves where it was shown.
      const drifted = await setupShownWithChain(`${entryPoint} drifted`);
      db.update(items).set({ workphaseId: drifted.w3.id }).where(eq(items.id, drifted.x.id)).run();
      const left = await write(drifted.x.id, { isAttached: false });
      expect(left.status, entryPoint).toBe(200);
      expect(left.body.workphaseId, entryPoint).toBe(drifted.w2.id);
    }
  });

  it('ATT-9.5: a reparent to root of an Attached item that names no workphase leaves it in the one it was shown in', async () => {
    for (const [entryPoint, write] of [
      ['move', move],
      ['PUT', put],
    ] as const) {
      const { w2, x } = await setupShownWithChain(entryPoint);
      const res = await write(x.id, { parentId: null });
      expect(res.status, entryPoint).toBe(200);
      expect(res.body, entryPoint).toMatchObject({ parentId: null, isAttached: 0, workphaseId: w2.id });

      const drifted = await setupShownWithChain(`${entryPoint} drifted`);
      db.update(items).set({ workphaseId: drifted.w3.id }).where(eq(items.id, drifted.x.id)).run();
      const left = await write(drifted.x.id, { parentId: null });
      expect(left.status, entryPoint).toBe(200);
      expect(left.body.workphaseId, entryPoint).toBe(drifted.w2.id);
    }
  });

  it('ATT-9.6: a detached child created with no workphase takes the one its parent is shown in', async () => {
    const { project, w2, w3, d, a } = await setupShownWithChain();
    const create = (parentId: string) => createItem({ projectId: project.id, parentId, title: 'Y', isAttached: false });

    // A is shown in D's Card, and D is in W2.
    const underA = await create(a.id);
    expect(underA).toMatchObject({ parentId: a.id, isAttached: 0, workphaseId: w2.id, positionScope: 'workflow' });

    // A's own copy has drifted: Y is still created where A is shown.
    db.update(items).set({ workphaseId: w3.id }).where(eq(items.id, a.id)).run();
    expect((await create(a.id)).workphaseId).toBe(w2.id);

    // Under D itself, D's own workphase.
    expect((await create(d.id)).workphaseId).toBe(w2.id);
  });

  it('ATT-9.7: when the nearest Free ancestor has no workphase, a write that leaves an item Free must name one', async () => {
    const { project, w1, w3, d, a } = await setupShownWithChain();
    // D leaves every workphase, and A and X follow it.
    expect((await move(d.id, { workphaseId: null })).status).toBe(200);
    const stub = () => createItem({ projectId: project.id, parentId: a.id, title: 'S' });
    expect((await stub()).workphaseId).toBeNull();

    const refusals = [
      ['detach by move', (id: string) => move(id, { isAttached: false })],
      ['detach by PUT', (id: string) => put(id, { isAttached: false })],
      ['reparent to root by move', (id: string) => move(id, { parentId: null })],
      ['reparent to root by PUT', (id: string) => put(id, { parentId: null })],
    ] as const;
    for (const [label, write] of refusals) {
      const s = await stub();
      const before = getRow(s.id);
      const res = await write(s.id);
      expect(res.status, label).toBe(400);
      expect(res.body.error, label).toMatch(/workphaseId in the same write, or file "D" into a workphase first/);
      expect(res.body.error, label).not.toMatch(/null/);
      expect(getRow(s.id), label).toEqual(before);
    }
    const count = countItems();
    const created = await request(app).post('/api/items').send({ title: 'Y', parentId: a.id, isAttached: false });
    expect(created.status).toBe(400);
    expect(created.body.error).toMatch(/file "D" into a workphase first/);
    expect(countItems()).toBe(count);

    // Naming a workphase, or none on purpose, is a way out.
    const named = await move((await stub()).id, { isAttached: false, workphaseId: w1.id });
    expect(named.status).toBe(200);
    expect(named.body).toMatchObject({ isAttached: 0, workphaseId: w1.id });
    const none = await move((await stub()).id, { isAttached: false, workphaseId: null });
    expect(none.status).toBe(200);
    expect(none.body).toMatchObject({ isAttached: 0, workphaseId: null });

    // Filing D first is the other.
    expect((await move(d.id, { workphaseId: w3.id })).status).toBe(200);
    const filed = await put((await stub()).id, { isAttached: false });
    expect(filed.status).toBe(200);
    expect(filed.body.workphaseId).toBe(w3.id);
  });
});
