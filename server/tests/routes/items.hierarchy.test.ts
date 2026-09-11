import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { app } from '../../src/index.js';
import { db } from '../../src/db/index.js';
import { items, activityLog } from '../../src/db/schema.js';
import { ITEM_DEPTH_CAP } from '../../src/lib/itemTree.js';
import { createProject, createWorkflow, createWorkphase, createItem, createBoard } from '../fixtures.js';

// Epic 3.5 Story 1 — atomic reparent-with-placement. Rules under test:
// docs/wiki/item-attachment §1, §4–§11a and docs/wiki/item-positioning §2
// (scope-change table), §5 (disclosure), §7. Case ids in test names refer
// to docs/test-plans/item-attachment (ATT-n.m) and
// docs/test-plans/item-positioning/part-7 (TC-7.n).

type Row = typeof items.$inferSelect;

function getRow(id: string): Row {
  return db.select().from(items).where(eq(items.id, id)).get()!;
}

function setPosition(id: string, position: number | null) {
  db.update(items).set({ position }).where(eq(items.id, id)).run();
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

describe('PATCH /items/:id/move — request validation (wiki item-attachment §1, §7, §8; positioning §7.1)', () => {
  it('rejects a parentId naming no item, and stores nothing (ATT-4.1)', async () => {
    const { project, todo } = await setupWorkflow();
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
    const res = await move(x.id, { parentId: 'nope', isAttached: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/does not reference an existing item/);
    expect(getRow(x.id).parentId).toBeNull();
  });

  it('rejects the item itself and its descendants as parents; accepts moving up the tree (ATT-4.2, ATT-4.3)', async () => {
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

  it('enforces the depth cap on move: exactly CAP is legal, CAP + 1 is not (ATT-4.4)', async () => {
    const { project, todo } = await setupWorkflow();
    // Chain to depth CAP - 1 via ordinary creates.
    let deepest = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'L1' });
    for (let d = 2; d <= ITEM_DEPTH_CAP - 1; d++) {
      deepest = await createItem({ projectId: project.id, parentId: deepest.id, title: `L${d}` });
    }
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

  it('rejects isAttached: true with no resulting parent (ATT-1.1)', async () => {
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

  it('rejects a workphaseId that contradicts the parent an attached item inherits from; accepts a matching one', async () => {
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

  it('validates the anchor against the resulting scope: a new sibling is accepted (TC-7.9)', async () => {
    const { project, todo } = await setupWorkflow();
    const { p, s1 } = await cardWithTwoStubs(project.id, todo.id);
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
    // X isn't in P's sibling scope yet — the anchor is legal because it
    // will be, after the reparent.
    const res = await move(x.id, { parentId: p.id, isAttached: true, anchorId: s1.id, side: 'after' });
    expect(res.status).toBe(200);
  });

  it('rejects an anchor outside the resulting scope, committing nothing (TC-7.10, ATT-3.7)', async () => {
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
});

describe('PATCH /items/:id/move — attach / reparent / detach with placement (wiki §4–§6; positioning §7.2)', () => {
  it('attaches with placement: every field and the cascade land in one commit (TC-7.11, ATT-3.6)', async () => {
    const { project, todo, inProgress } = await setupWorkflow();
    const { p, s1, s2 } = await cardWithTwoStubs(project.id, inProgress.id);
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
    const x1 = await createItem({ projectId: project.id, parentId: x.id, title: 'X1' });
    setPosition(x.id, 50.0);

    const res = await move(x.id, { parentId: p.id, isAttached: true, anchorId: s1.id, side: 'after' });
    expect(res.status).toBe(200);
    expect(res.body.parentId).toBe(p.id);
    expect(res.body.isAttached).toBe(1);
    expect(res.body.workphaseId).toBe(inProgress.id); // inherited
    expect(res.body.positionScope).toBe('attached-siblings');
    // Drawn from P's sibling list — not 50.0 kept, not a workflow-wide value.
    expect(res.body.position).toBeGreaterThan(1.0);
    expect(res.body.position).toBeLessThan(2.0);
    expect(getRow(x1.id).workphaseId).toBe(inProgress.id); // cascaded
    expect([getRow(s1.id).position, getRow(s2.id).position]).toEqual([1.0, 2.0]); // siblings untouched
  });

  it('reparents while attached against the NEW parent\'s scope, never the old (TC-7.12, ATT-3.5)', async () => {
    const { project, todo } = await setupWorkflow();
    const a = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'A' });
    await createItem({ projectId: project.id, parentId: a.id, title: 'A1' });
    await createItem({ projectId: project.id, parentId: a.id, title: 'A2' });
    const x = await createItem({ projectId: project.id, parentId: a.id, title: 'X' });
    expect(x.position).toBe(3.0);
    const b = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'B' });
    const b1 = await createItem({ projectId: project.id, parentId: b.id, title: 'B1' });
    const b2 = await createItem({ projectId: project.id, parentId: b.id, title: 'B2' });
    setPosition(b1.id, 100.0);
    setPosition(b2.id, 200.0);

    const res = await move(x.id, { parentId: b.id, anchorId: b1.id, side: 'after' }); // flag omitted: stays attached
    expect(res.status).toBe(200);
    expect(res.body.isAttached).toBe(1);
    expect(res.body.position).toBeGreaterThan(100.0);
    expect(res.body.position).toBeLessThan(200.0);
    expect(getRow(b1.id).position).toBe(100.0);
    expect(getRow(b2.id).position).toBe(200.0);
  });

  it('detaches with placement into the workflow scope, keeping the parent (TC-7.13, ATT-7.1)', async () => {
    const { project, todo } = await setupWorkflow();
    const { p, s2: x } = await cardWithTwoStubs(project.id, todo.id);
    const f1 = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'F1' });
    const f2 = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'F2' });
    setPosition(f1.id, 10.0);
    setPosition(f2.id, 11.0);

    const res = await move(x.id, { isAttached: false, anchorId: f1.id, side: 'after' });
    expect(res.status).toBe(200);
    expect(res.body.isAttached).toBe(0);
    expect(res.body.parentId).toBe(p.id); // detaching is not un-parenting (§11)
    expect(res.body.positionScope).toBe('workflow');
    expect(res.body.position).toBeGreaterThan(10.0);
    expect(res.body.position).toBeLessThan(11.0);
    expect(res.body.workphaseId).toBe(todo.id); // keeps the inherited workphase
  });

  it('attaching into an empty Stub list takes the append fallback — bootstrap 1.0 (TC-7.7, ATT-3.3)', async () => {
    const { project, todo } = await setupWorkflow();
    const p = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'P' });
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
    setPosition(x.id, 50.0);
    const res = await move(x.id, { parentId: p.id, isAttached: true });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(1.0);
  });

  it('a redundant re-attach to the same parent is not a scope change and keeps its position', async () => {
    const { project, todo } = await setupWorkflow();
    const { p, s1 } = await cardWithTwoStubs(project.id, todo.id);
    const res = await move(s1.id, { parentId: p.id, isAttached: true });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(1.0);
    expect(hierarchyEntries(s1.id)).toHaveLength(0); // nothing changed, nothing logged (§11a)
  });

  it('a Free item can be reparented and stay Free; without an anchor its position is untouched (wiki §4)', async () => {
    const { project, todo } = await setupWorkflow();
    const p = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'P' });
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X', isAttached: false });
    setPosition(x.id, 7.5);
    const res = await move(x.id, { parentId: p.id });
    expect(res.status).toBe(200);
    expect(res.body.parentId).toBe(p.id);
    expect(res.body.isAttached).toBe(0);
    expect(res.body.position).toBe(7.5);
    expect(res.body.workphaseId).toBe(todo.id);
  });

  it('reparent to root (parentId: null) clears the flag and re-resolves a workflow position (wiki §11)', async () => {
    const { project, todo } = await setupWorkflow();
    const { s1: x } = await cardWithTwoStubs(project.id, todo.id);
    const f = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'F' });
    setPosition(f.id, 40.0);

    const res = await move(x.id, { parentId: null });
    expect(res.status).toBe(200);
    expect(res.body.parentId).toBeNull();
    expect(res.body.isAttached).toBe(0);
    expect(res.body.workphaseId).toBe(todo.id); // no workphase change implied
    expect(res.body.positionScope).toBe('workflow');
    expect(res.body.position).toBe(41); // appended past the workflow's true last item
  });

  it('reparent to root from under a done parent makes it a done Free item (wiki §11)', async () => {
    const { project, done } = await setupWorkflow();
    const { s1: x } = await cardWithTwoStubs(project.id, done.id);
    expect(getRow(x.id).completedAt).toBeNull();
    const res = await move(x.id, { parentId: null });
    expect(res.status).toBe(200);
    expect(res.body.position).toBeNull();
    expect(res.body.completedAt).not.toBeNull();
    expect(res.body.positionScope).toBe('none');
  });
});

describe('PATCH /items/:id/move — done parents and done columns (wiki §10; positioning §7.4)', () => {
  it('attaching to a done parent inherits the terminal workphase, no completedAt, keeps a position (ATT-6.1, TC-7.15)', async () => {
    const { project, todo, done } = await setupWorkflow();
    const { p, s1 } = await cardWithTwoStubs(project.id, done.id);
    expect(getRow(p.id).position).toBeNull(); // P is a done Free item
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });

    const res = await move(x.id, { parentId: p.id, isAttached: true, anchorId: s1.id, side: 'after' });
    expect(res.status).toBe(200);
    expect(res.body.workphaseId).toBe(done.id);
    expect(res.body.completedAt).toBeNull();
    expect(res.body.position).toBeGreaterThan(1.0);
    expect(res.body.position).toBeLessThan(2.0);
  });

  it('a done Free item cannot be an anchor (TC-7.8 server half, TC-2.8)', async () => {
    const { project, todo, done } = await setupWorkflow();
    const d = await createItem({ projectId: project.id, workphaseId: done.id, title: 'D' });
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
    const res = await move(x.id, { workphaseId: done.id, anchorId: d.id, side: 'after' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no position to anchor against/);
  });

  it('attaching a done Free item clears its completedAt (wiki §2)', async () => {
    const { project, todo, done } = await setupWorkflow();
    const p = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'P' });
    const x = await createItem({ projectId: project.id, workphaseId: done.id, title: 'X' });
    expect(getRow(x.id).completedAt).not.toBeNull();
    const res = await move(x.id, { parentId: p.id, isAttached: true });
    expect(res.status).toBe(200);
    expect(res.body.completedAt).toBeNull();
    expect(res.body.workphaseId).toBe(todo.id);
    expect(res.body.position).toBe(1.0);
  });
});

describe('cross-project reparenting (wiki §9; positioning §7.3)', () => {
  // Root project R owns the workflow; P1 and P2 inherit it, so a board of
  // R's workflow shows both — the scenario a cross-project board drag
  // comes from.
  async function setupSiblingProjects() {
    const { project: root, workflow, todo, inProgress, done } = await setupWorkflow('R');
    const p1 = await createProject({ name: 'P1', parentId: root.id });
    const p2 = await createProject({ name: 'P2', parentId: root.id });
    return { root, workflow, todo, inProgress, done, p1, p2 };
  }

  it('cascades projectId to the whole subtree, detached descendants included, and places normally (ATT-5.1, ATT-5.2, TC-7.14)', async () => {
    const { todo, inProgress, p1, p2 } = await setupSiblingProjects();
    const { p: q, s1: q1 } = await cardWithTwoStubs(p2.id, inProgress.id, 'Q');
    const x = await createItem({ projectId: p1.id, workphaseId: todo.id, title: 'X' });
    const x1 = await createItem({ projectId: p1.id, parentId: x.id, title: 'X1' });
    const x2 = await createItem({ projectId: p1.id, parentId: x.id, title: 'X2', isAttached: false, workphaseId: todo.id });
    const x2a = await createItem({ projectId: p1.id, parentId: x2.id, title: 'X2a' });
    const x2Position = getRow(x2.id).position;

    const res = await move(x.id, { parentId: q.id, isAttached: true, anchorId: q1.id, side: 'after' });
    expect(res.status).toBe(200);
    expect(res.body.projectId).toBe(p2.id);
    for (const id of [x1.id, x2.id, x2a.id]) expect(getRow(id).projectId).toBe(p2.id);
    // No cross-project positioning rule: same anchor + true-neighbor math.
    expect(res.body.position).toBeGreaterThan(1.0);
    expect(res.body.position).toBeLessThan(2.0);
    // Same workflow on both sides — nothing is foreign, nothing is nulled.
    expect(getRow(x2.id).workphaseId).toBe(todo.id);
    expect(getRow(x2.id).position).toBe(x2Position);
    expect(getRow(x1.id).workphaseId).toBe(inProgress.id); // attached: cascaded
    expect(getRow(x2a.id).workphaseId).toBe(todo.id); // attached to X2, which didn't move workphase
  });

  it('records the project change in the hierarchy activity entry', async () => {
    const { todo, p1, p2 } = await setupSiblingProjects();
    const q = await createItem({ projectId: p2.id, workphaseId: todo.id, title: 'Q' });
    const x = await createItem({ projectId: p1.id, workphaseId: todo.id, title: 'X' });
    await move(x.id, { parentId: q.id, isAttached: true });
    const [entry] = hierarchyEntries(x.id);
    expect(entry.content).toBe('Parented under "Q" (attached)');
    expect(JSON.parse(entry.metadata!)).toMatchObject({ fromProjectId: p1.id, toProjectId: p2.id, toAttached: true });
  });

  describe('cross-workflow (API-only)', () => {
    it('a Free reparent keeps every workphase, nulls foreign positions, and surfaces as Unknown status on the new board', async () => {
      const a = await setupWorkflow('A');
      const b = await setupWorkflow('B');
      const pb = await createItem({ projectId: b.project.id, workphaseId: b.todo.id, title: 'PB' });
      const x = await createItem({ projectId: a.project.id, workphaseId: a.todo.id, title: 'X' });
      const x1 = await createItem({ projectId: a.project.id, parentId: x.id, title: 'X1' });
      const x2 = await createItem({ projectId: a.project.id, parentId: x.id, title: 'X2', isAttached: false, workphaseId: a.todo.id });
      expect(getRow(x2.id).position).not.toBeNull();

      const res = await move(x.id, { parentId: pb.id, isAttached: false });
      expect(res.status).toBe(200);
      expect(res.body.projectId).toBe(b.project.id);
      expect(res.body.workphaseId).toBe(a.todo.id); // untouched — not remapped, not nulled
      expect(res.body.position).toBeNull(); // no comparison scope in B's workflow
      expect(res.body.positionScope).toBe('workflow'); // still classifies by its own workphase's workflow
      expect(getRow(x2.id)).toMatchObject({ projectId: b.project.id, workphaseId: a.todo.id, position: null });
      // X1 is attached: inherits X's (unchanged) workphase and keeps its sibling-scoped position.
      expect(getRow(x1.id)).toMatchObject({ projectId: b.project.id, workphaseId: a.todo.id, position: 1.0 });

      const board = await createBoard(b.workflow.id);
      const boardRes = await request(app).get(`/api/boards/${board.id}`);
      const invalidIds = boardRes.body.unsorted.invalidItems.map((i: { id: string }) => i.id);
      expect(invalidIds).toEqual(expect.arrayContaining([x.id, x1.id, x2.id]));
      expect(boardRes.body.unsorted.needsAttention).toBe(true);
    });

    it('an attached reparent inherits the new workflow\'s workphase; only detached descendants are left foreign', async () => {
      const a = await setupWorkflow('A');
      const b = await setupWorkflow('B');
      const pb = await createItem({ projectId: b.project.id, workphaseId: b.todo.id, title: 'PB' });
      const x = await createItem({ projectId: a.project.id, workphaseId: a.todo.id, title: 'X' });
      const x1 = await createItem({ projectId: a.project.id, parentId: x.id, title: 'X1' });
      const x2 = await createItem({ projectId: a.project.id, parentId: x.id, title: 'X2', isAttached: false, workphaseId: a.todo.id });

      const res = await move(x.id, { parentId: pb.id, isAttached: true });
      expect(res.status).toBe(200);
      expect(res.body.workphaseId).toBe(b.todo.id);
      expect(res.body.position).toBe(1.0); // PB's empty Stub list
      expect(getRow(x1.id).workphaseId).toBe(b.todo.id); // cascaded
      expect(getRow(x2.id)).toMatchObject({ workphaseId: a.todo.id, position: null });
    });

    it('re-filing a foreign-workphase item into the new workflow assigns a fresh position (positioning §7.3)', async () => {
      const a = await setupWorkflow('A');
      const b = await setupWorkflow('B');
      const pb = await createItem({ projectId: b.project.id, workphaseId: b.todo.id, title: 'PB' });
      setPosition(pb.id, 3.0);
      const x = await createItem({ projectId: a.project.id, workphaseId: a.todo.id, title: 'X' });
      await move(x.id, { parentId: pb.id, isAttached: false });
      expect(getRow(x.id).position).toBeNull();

      const refiled = await move(x.id, { workphaseId: b.inProgress.id });
      expect(refiled.status).toBe(200);
      expect(refiled.body.position).toBe(4); // append past B's true last item
    });
  });
});

describe('atomicity (wiki §6)', () => {
  it('a depth-cap rejection leaves the item and its subtree byte-identical (ATT-3.7)', async () => {
    const { project, todo, inProgress } = await setupWorkflow();
    let deepest = await createItem({ projectId: project.id, workphaseId: inProgress.id, title: 'L1' });
    for (let d = 2; d <= ITEM_DEPTH_CAP - 1; d++) {
      deepest = await createItem({ projectId: project.id, parentId: deepest.id, title: `L${d}` });
    }
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

describe('hierarchy activity log (wiki §11a)', () => {
  it('logs attach, detach, reparent and top-level with the right content, at both entry points', async () => {
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

  it('a PUT attach that snaps the workphase also logs the status change, like move does', async () => {
    const { project, todo, inProgress } = await setupWorkflow();
    const p = await createItem({ projectId: project.id, workphaseId: inProgress.id, title: 'P' });
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
    await put(x.id, { parentId: p.id, isAttached: true });
    const statusEntries = db
      .select()
      .from(activityLog)
      .where(eq(activityLog.itemId, x.id))
      .all()
      .filter(e => e.type === 'status_change');
    expect(statusEntries.map(e => e.content)).toContain('Moved from "Todo" to "In Progress"');
  });
});

describe('reindex disclosure (wiki item-positioning §5)', () => {
  // Two positioned items at ≥ 1000 in a scope of two trips the magnitude
  // threshold (max(1000, count + 100)) on the next append.
  async function setupNearThreshold() {
    const { project, todo } = await setupWorkflow();
    const a = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'A' });
    const b = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'B' });
    setPosition(a.id, 1100);
    setPosition(b.id, 1200);
    return { project, todo, a, b };
  }

  it('move: the response carries every renumbered {id, position} pair, the moved item included', async () => {
    const { project, todo, a, b } = await setupNearThreshold();
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
    // X's own create already reindexed (A=1, B=2, X=3) — push A/B back up so
    // the move is what trips it.
    setPosition(a.id, 1100);
    setPosition(b.id, 1200);
    setPosition(x.id, 5);

    const res = await move(x.id, { anchorId: b.id, side: 'after' });
    expect(res.status).toBe(200);
    expect(res.body.reindexed).toEqual([
      { id: a.id, position: 1 },
      { id: b.id, position: 2 },
      { id: x.id, position: 3 },
    ]);
    expect(res.body.position).toBe(3);
  });

  it('PUT and POST disclose the same way', async () => {
    const { project, todo, a, b } = await setupNearThreshold();
    const created = await request(app).post('/api/items').send({ projectId: project.id, workphaseId: todo.id, title: 'C' });
    expect(created.status).toBe(201);
    expect(created.body.reindexed).toEqual([
      { id: a.id, position: 1 },
      { id: b.id, position: 2 },
      { id: created.body.id, position: 3 },
    ]);

    const p = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'P' });
    const s1 = await createItem({ projectId: project.id, parentId: p.id, title: 'S1' });
    setPosition(s1.id, 1500);
    const attached = await put(created.body.id, { parentId: p.id, isAttached: true });
    expect(attached.status).toBe(200);
    expect(attached.body.reindexed).toEqual([
      { id: s1.id, position: 1 },
      { id: created.body.id, position: 2 },
    ]);
  });

  it('is absent when no reindex fired', async () => {
    const { project, todo } = await setupWorkflow();
    const a = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'A' });
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
    const res = await move(x.id, { anchorId: a.id, side: 'before' });
    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('reindexed');
  });
});

describe('PUT /items/:id and POST /items share the guards (wiki §7 "every write")', () => {
  it('PUT enforces the depth cap', async () => {
    const { project, todo } = await setupWorkflow();
    let deepest = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'L1' });
    for (let d = 2; d <= ITEM_DEPTH_CAP; d++) {
      deepest = await createItem({ projectId: project.id, parentId: deepest.id, title: `L${d}` });
    }
    const leaf = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'leaf' });
    const res = await put(leaf.id, { parentId: deepest.id });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/exceeds the cap/);
  });

  it('POST enforces the depth cap: a child at depth CAP is fine, CAP + 1 is refused', async () => {
    const { project, todo } = await setupWorkflow();
    let deepest = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'L1' });
    for (let d = 2; d <= ITEM_DEPTH_CAP; d++) {
      deepest = await createItem({ projectId: project.id, parentId: deepest.id, title: `L${d}` });
      expect(deepest.id).toBeDefined();
    }
    const res = await request(app).post('/api/items').send({ projectId: project.id, parentId: deepest.id, title: 'too deep' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/exceeds the cap/);
  });

  it('PUT rejects a parentless attach (ATT-1.1)', async () => {
    const { project, todo } = await setupWorkflow();
    const root = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'root' });
    const res = await put(root.id, { isAttached: true });
    expect(res.status).toBe(400);
  });

  it('PUT cascades projectId to detached descendants on a cross-project reparent (ATT-5.2)', async () => {
    const projectA = await createProject({ name: 'A' });
    const projectB = await createProject({ name: 'B' });
    const q = await createItem({ projectId: projectB.id, title: 'Q' });
    const x = await createItem({ projectId: projectA.id, title: 'X' });
    const x2 = await createItem({ projectId: projectA.id, parentId: x.id, title: 'X2', isAttached: false });
    const res = await put(x.id, { parentId: q.id });
    expect(res.status).toBe(200);
    expect(getRow(x2.id).projectId).toBe(projectB.id);
  });
});
