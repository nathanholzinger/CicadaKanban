import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index.js';
import { createWorkphase, createItem, setItemPosition, workflowWithPhases } from '../fixtures.js';

// Where an item's position comes from through the item routes: the create and move rules, which
// items count as neighbors, a move into or out of a terminal workphase, `positionScope` on a
// read, and the reindex scopes.

describe('position resolution', () => {
  async function setupTwoPhases(doneOverrides: Record<string, unknown> = {}) {
    const {
      project,
      workflow,
      phases: [todo, done],
    } = await workflowWithPhases(['Todo', { name: 'Done', isTerminal: true, ...doneOverrides }]);
    return { project, workflow, todo, done };
  }

  async function setupThreePhases() {
    const { project, workflow, todo, done } = await setupTwoPhases();
    const inProgress = await createWorkphase(workflow.id, { name: 'In Progress' });
    return { project, workflow, todo, inProgress, done };
  }

  const move = (id: string, body: Record<string, unknown>) => request(app).patch(`/api/items/${id}/move`).send(body);
  const fetchItem = async (id: string) => (await request(app).get(`/api/items/${id}`)).body;

  // An item created at the workflow's end, then pinned to `position` (written directly: no request names one).
  async function itemAt(projectId: string, workphaseId: string, position: number, title = 'Pinned') {
    const created = await createItem({ projectId, workphaseId, title });
    setItemPosition(created.id, position);
    return { ...created, position };
  }

  it('TC-2.6: a create with no anchor goes after the true last Free item, in whichever workphase it is', async () => {
    const { project, todo, inProgress } = await setupThreePhases();
    await itemAt(project.id, inProgress.id, 4.2);
    const created = await createItem({ projectId: project.id, workphaseId: todo.id });
    expect(created.position).toBe(5);
  });

  it("TC-2.7: an empty workphase isn't an empty scope: a create there goes after the workflow's last item", async () => {
    const { project, todo, inProgress } = await setupThreePhases();
    await itemAt(project.id, todo.id, 3.0);
    const created = await createItem({ projectId: project.id, workphaseId: inProgress.id });
    expect(created.position).toBe(4);
  });

  it("TC-2.10: a Free item's true neighbor may be in another workphase, and is never an attached child", async () => {
    const { project, todo, inProgress } = await setupThreePhases();
    const a = await itemAt(project.id, todo.id, 1.0, 'A');
    await itemAt(project.id, inProgress.id, 2.0, 'B');
    await itemAt(project.id, todo.id, 3.0, 'C');
    const child = await createItem({ projectId: project.id, parentId: a.id, title: 'A1' });
    setItemPosition(child.id, 1.2);
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });

    const res = await move(x.id, { anchorId: a.id, side: 'after' });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(1.5); // between A and B, not between A and its child's 1.2
  });

  it('TC-2.31: a move naming its own workphase and no anchor appends the item', async () => {
    const { project, todo, inProgress } = await setupThreePhases();
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
    expect(x.position).toBe(1.0);
    await createItem({ projectId: project.id, workphaseId: inProgress.id, title: 'Y' }); // 2.0

    const res = await move(x.id, { workphaseId: todo.id });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(3);
  });

  it('TC-2.5: every prepend before the true first item stays above 0.0, through the reindex that repeating it forces', async () => {
    const { project, todo } = await setupTwoPhases();
    let first = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'first' });
    expect(first.position).toBe(1.0);
    const resolved: number[] = [];
    let reindexed = false;
    // Each prepend halves the gap to the floor, so the resolver's decimal
    // depth runs out within a few dozen steps.
    for (let step = 0; step < 100 && !reindexed; step++) {
      const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: `x${step}` });
      const res = await move(x.id, { anchorId: first.id, side: 'before' });
      expect(res.status).toBe(200);
      resolved.push(res.body.position);
      reindexed = Array.isArray(res.body.reindexed);
      first = res.body;
    }
    expect(reindexed).toBe(true);
    expect(resolved[0]).toBe(0.5); // the floor-bounded fit, not 1.0 − 1.0
    expect(resolved.every(p => p > 0)).toBe(true);
  });

  it("TC-3.4: a new attached child goes after its own parent's last child, whatever is last in the workphase", async () => {
    const { project, todo } = await setupTwoPhases();
    const p = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'P' });
    const q = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Q' });
    await createItem({ projectId: project.id, parentId: p.id, title: 'P1' }); // 1.0
    await createItem({ projectId: project.id, parentId: p.id, title: 'P2' }); // 2.0
    const q1 = await createItem({ projectId: project.id, parentId: q.id, title: 'Q1' });
    setItemPosition(q1.id, 5.0);
    await itemAt(project.id, todo.id, 7.0, 'F');

    const child = await createItem({ projectId: project.id, parentId: p.id, title: 'P3' });
    expect(child.position).toBe(3);
  });

  it('TC-5.4, TC-5.13, TC-5.14: the magnitude trigger renumbers every active workphase in one sequence, and discloses them all', async () => {
    const { project, todo, inProgress } = await setupThreePhases();
    // Both created before either is pinned: a create after a pin this high would reindex on its own.
    const a = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'A' });
    const b = await createItem({ projectId: project.id, workphaseId: inProgress.id, title: 'B' });
    setItemPosition(a.id, 1100);
    setItemPosition(b.id, 1200);

    // n = 2, so the next append (1201) crosses max(1000, 102).
    const res = await request(app).post('/api/items').send({ title: 'N', projectId: project.id, workphaseId: todo.id });
    expect(res.status).toBe(201);
    expect(res.body.position).toBe(3);
    expect(res.body.reindexed).toEqual([
      { id: a.id, position: 1 },
      { id: b.id, position: 2 },
      { id: res.body.id, position: 3 },
    ]);
  });

  it('TC-6.9: a reopened done item takes the append fallback, not the position it had before', async () => {
    const { project, todo, done } = await setupTwoPhases();
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });
    expect(x.position).toBe(1.0);
    await itemAt(project.id, todo.id, 6.0, 'E');
    expect((await move(x.id, { workphaseId: done.id })).body.position).toBeNull();

    const res = await move(x.id, { workphaseId: todo.id });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(7);
  });

  it('TC-7.1: "first in list" is a before-anchor on the first item, and resolves by the floor-bounded prepend', async () => {
    const { project, todo } = await setupTwoPhases();
    const a = await itemAt(project.id, todo.id, 2.0, 'A');
    await itemAt(project.id, todo.id, 3.0, 'B');
    await itemAt(project.id, todo.id, 4.0, 'C');
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });

    const res = await move(x.id, { anchorId: a.id, side: 'before' });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(1);
  });

  it('TC-7.2: "last in list" is an after-anchor on the last item: an append when it is the true last, a fit before an unseen neighbor', async () => {
    const { project, todo } = await setupTwoPhases();
    await itemAt(project.id, todo.id, 2.0, 'A');
    await itemAt(project.id, todo.id, 3.0, 'B');
    const c = await itemAt(project.id, todo.id, 4.0, 'C');
    const x = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'X' });

    const last = await move(x.id, { anchorId: c.id, side: 'after' });
    expect(last.status).toBe(200);
    expect(last.body.position).toBe(5);

    await itemAt(project.id, todo.id, 4.4, 'unseen');
    const beforeUnseen = await move(x.id, { anchorId: c.id, side: 'after' });
    expect(beforeUnseen.status).toBe(200);
    expect(beforeUnseen.body.position).toBe(4.2);
  });

  it("TC-X.1: a detached child is positioned in the workflow, not among its parent's children", async () => {
    const { project, todo } = await setupTwoPhases();
    const p = await itemAt(project.id, todo.id, 10.0, 'P');
    const detachedChild = async (title: string, position: number) => {
      const created = await createItem({
        projectId: project.id,
        parentId: p.id,
        title,
        isAttached: false,
        workphaseId: todo.id,
      });
      setItemPosition(created.id, position);
      return created;
    };
    const d1 = await detachedChild('D1', 1.0);
    await itemAt(project.id, todo.id, 2.0, 'T');
    const d2 = await detachedChild('D2', 3.0);

    const res = await move(d2.id, { anchorId: d1.id, side: 'after' });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(1.5); // between D1 and its workflow neighbor T
  });

  it('TC-2.7, TC-2.18, TC-3.4: POST scopes a new attached child to its true siblings, not the whole workphase', async () => {
    const { project, todo } = await setupTwoPhases();
    // Unrelated top-level items sharing the workphase must not pollute the
    // new child's position, as they would if the scope were the workphase.
    await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Unrelated 1' });
    await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Unrelated 2' });
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });

    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' });
    expect(child.position).toBe(1.0); // first among the parent's own attached children
    expect(typeof child.position).toBe('number'); // TC-2.18: position's shape is unchanged (number|null)
  });

  it('TC-2.18, TC-6.1, TC-6.3: POST into a terminal workphase gets no position, but a completedAt timestamp', async () => {
    const { project, done } = await setupTwoPhases();
    const before = Date.now();
    const res = await request(app)
      .post('/api/items')
      .send({ title: 'Shipped', projectId: project.id, workphaseId: done.id });
    const after = Date.now();
    expect(res.status).toBe(201);
    expect(res.body.position).toBeNull(); // TC-2.18: the other half of position's number|null shape
    expect(res.body.completedAt).toBeGreaterThanOrEqual(before); // the time of the write
    expect(res.body.completedAt).toBeLessThanOrEqual(after);
  });

  it('TC-2.20: attaching to a parent reassigns a fresh position scoped to the new siblings', async () => {
    const { project, todo } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    await createItem({ projectId: project.id, parentId: parent.id, title: 'Existing sibling' }); // position 1.0
    const detached = await createItem({
      projectId: project.id,
      workphaseId: todo.id,
      title: 'Detached',
      isAttached: false,
    });
    // A workflow position the sibling append can't coincide with.
    setItemPosition(detached.id, 5.0);

    const res = await request(app).put(`/api/items/${detached.id}`).send({ parentId: parent.id, isAttached: true });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(2.0); // fresh, past the existing sibling — not its old workflow-scoped value
    expect(res.body.positionScope).toBe('attached-siblings');
  });

  it('ATT-7.2, TC-2.19: detaching reassigns a fresh position scoped to the workflow', async () => {
    const { project, todo } = await setupTwoPhases();
    await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Existing root' }); // position 1.0
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' }); // position 2.0
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' }); // attached, position 1.0 among siblings

    const res = await request(app).put(`/api/items/${child.id}`).send({ isAttached: false });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(3); // appended past the workflow's last Free item, not 1.0 kept
    expect(res.body.positionScope).toBe('workflow');
  });

  it('ATT-7.4, TC-6.3: detaching into a terminal workphase clears position and sets completedAt', async () => {
    const { project, done } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: done.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' }); // attached, inherits Done, keeps a position

    const res = await request(app).put(`/api/items/${child.id}`).send({ isAttached: false });
    expect(res.status).toBe(200);
    expect(res.body.position).toBeNull();
    expect(res.body.completedAt).toBeGreaterThan(0);
  });

  it('ATT-3.1, TC-2.21: reparenting while staying attached reassigns a fresh position scoped to the new parent', async () => {
    const { project, todo } = await setupTwoPhases();
    const parentA = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent A' });
    const parentB = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent B' });
    await createItem({ projectId: project.id, parentId: parentB.id, title: 'Existing under B' }); // position 1.0
    const child = await createItem({ projectId: project.id, parentId: parentA.id, title: 'Child' });

    const res = await request(app).put(`/api/items/${child.id}`).send({ parentId: parentB.id });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(2.0);
  });

  it('TC-2.23: a redundant re-attach to the same parent leaves position untouched', async () => {
    const { project, todo } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' });
    // A sibling after it: a re-attach treated as a scope change would append past this one, to 3.
    await createItem({ projectId: project.id, parentId: parent.id, title: 'Sibling' });

    const res = await request(app).put(`/api/items/${child.id}`).send({ parentId: parent.id, isAttached: true });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(child.position);
  });

  it('move resolves anchorId+side against the true neighbor, not a client-supplied guess', async () => {
    const { project, todo } = await setupTwoPhases();
    const a = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'A' }); // 1.0
    const b = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'B' }); // 2.0
    const c = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'C' }); // 3.0

    const res = await request(app).patch(`/api/items/${c.id}/move`).send({ anchorId: a.id, side: 'after' });
    expect(res.status).toBe(200);
    expect(res.body.position).toBeGreaterThan(a.position);
    expect(res.body.position).toBeLessThan(b.position);
  });

  describe('top-level items sharing one workphase', () => {
    // Fresh GET-based reads, not the move response — a genuine persisted-
    // order check on reload, same convention as
    // itemRepositioningAttachedSiblings.spec.ts's siblingOrder helper.
    async function orderOf(items: { id: string; title: string }[]): Promise<string> {
      const fetched = await Promise.all(items.map(i => request(app).get(`/api/items/${i.id}`)));
      return fetched
        .map((res, idx) => ({ title: items[idx].title, position: res.body.position as number }))
        .sort((x, y) => x.position - y.position)
        .map(i => i.title)
        .join('');
    }

    async function seedABC() {
      const { project, todo } = await setupTwoPhases();
      const a = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'A' }); // 1.0
      const b = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'B' }); // 2.0
      const c = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'C' }); // 3.0
      return { a, b, c };
    }

    it('TC-2.5: C before A — becomes the new true first item', async () => {
      const { a, b, c } = await seedABC();
      const res = await request(app).patch(`/api/items/${c.id}/move`).send({ anchorId: a.id, side: 'before' });
      expect(res.status).toBe(200);
      // No true predecessor before A -> floor-anchored coarsest-fit between
      // 0.0 and A's 1.0, not a flat A.position - 1.0.
      expect(res.body.position).toBe(0.5);
      expect(await orderOf([a, b, c])).toBe('CAB');
    });

    it('TC-2.1: C after A / C before B — same true-neighbor midpoint from either anchor', async () => {
      const { a, b, c } = await seedABC();
      const afterA = await request(app).patch(`/api/items/${c.id}/move`).send({ anchorId: a.id, side: 'after' });
      expect(afterA.body.position).toBe(1.5);
      expect(await orderOf([a, b, c])).toBe('ACB');

      const beforeB = await request(app).patch(`/api/items/${c.id}/move`).send({ anchorId: b.id, side: 'before' });
      expect(beforeB.body.position).toBe(1.5);
      expect(await orderOf([a, b, c])).toBe('ACB');
    });

    it('TC-2.4: A after C — becomes the new true last item, at C plus 1.0 rounded', async () => {
      const { a, b, c } = await seedABC();
      setItemPosition(c.id, 3.4); // so the append is 4.4 unrounded
      const res = await request(app).patch(`/api/items/${a.id}/move`).send({ anchorId: c.id, side: 'after' });
      expect(res.status).toBe(200);
      // No true successor after C -> append fallback, C.position + 1.0, rounded.
      expect(res.body.position).toBe(4);
      expect(await orderOf([a, b, c])).toBe('BCA');
    });
  });

  it('TC-X.6: excludes the item itself from its own scope query on reposition', async () => {
    const { project, todo } = await setupTwoPhases();
    const a = await createItem({ projectId: project.id, workphaseId: todo.id }); // 1.0
    const x = await createItem({ projectId: project.id, workphaseId: todo.id }); // 2.0
    await createItem({ projectId: project.id, workphaseId: todo.id }); // b: 3.0
    // Force x to sit numerically between a and b — if x's own (pre-move) row
    // weren't excluded from its scope query, resolving "after a" would find
    // x itself as the closest neighbor and anchor against its stale value.
    setItemPosition(x.id, 1.5);

    const res = await request(app).patch(`/api/items/${x.id}/move`).send({ anchorId: a.id, side: 'after' });
    expect(res.status).toBe(200);
    // Correctly resolves against the true next neighbor (b, at 3.0),
    // skipping x's own stale 1.5 — a buggy resolution would land below 1.5.
    expect(res.body.position).toBe(2);
  });

  it('move rejects an invalid side when anchorId is given', async () => {
    const { project, todo } = await setupTwoPhases();
    const a = await createItem({ projectId: project.id, workphaseId: todo.id });
    const res = await request(app).patch(`/api/items/${a.id}/move`).send({ anchorId: a.id, side: 'sideways' });
    expect(res.status).toBe(400);
  });

  it('TC-2.8: move rejects a non-existent anchorId, and writes neither the workphase nor a position', async () => {
    const { project, todo, done } = await setupTwoPhases();
    const a = await createItem({ projectId: project.id, workphaseId: todo.id });
    const res = await move(a.id, { anchorId: 'no-such-item', side: 'after', workphaseId: done.id });
    expect(res.status).toBe(400);
    expect(await fetchItem(a.id)).toMatchObject({ workphaseId: todo.id, position: a.position, completedAt: null });
  });

  it('TC-2.8: move rejects anchoring to a done item (no position to anchor against)', async () => {
    const { project, todo, done } = await setupTwoPhases();
    const active = await createItem({ projectId: project.id, workphaseId: todo.id });
    const doneItem = await request(app)
      .post('/api/items')
      .send({ title: 'Done item', projectId: project.id, workphaseId: done.id });

    const res = await request(app)
      .patch(`/api/items/${active.id}/move`)
      .send({ anchorId: doneItem.body.id, side: 'after' });
    expect(res.status).toBe(400);
  });

  describe("move rejects an anchorId outside the subject's position scope", () => {
    // What a refused move would have changed: none of it did.
    const unchanged = (item: { parentId: string | null; workphaseId: string | null; position: number | null }) => ({
      parentId: item.parentId,
      workphaseId: item.workphaseId,
      position: item.position,
    });

    it("TC-7.10: rejects anchoring a detached item against someone else's attached child", async () => {
      const { project, todo } = await setupTwoPhases();
      const detached = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Detached' });
      const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
      const attachedChild = await createItem({ projectId: project.id, parentId: parent.id, title: 'Attached Child' });

      const res = await request(app)
        .patch(`/api/items/${detached.id}/move`)
        .send({ anchorId: attachedChild.id, side: 'after' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/position scope/);
      expect(await fetchItem(detached.id)).toMatchObject(unchanged(detached));
    });

    it('rejects anchoring an attached child against an attached child of a different parent', async () => {
      const { project, todo } = await setupTwoPhases();
      const parentA = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent A' });
      const parentB = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent B' });
      const childOfA = await createItem({ projectId: project.id, parentId: parentA.id, title: 'Child of A' });
      const childOfB = await createItem({ projectId: project.id, parentId: parentB.id, title: 'Child of B' });

      const res = await request(app)
        .patch(`/api/items/${childOfA.id}/move`)
        .send({ anchorId: childOfB.id, side: 'after' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/position scope/);
    });

    it('TC-7.10: rejects anchoring against an item in a different workflow', async () => {
      const { project, todo } = await setupTwoPhases();
      const subject = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Subject' });

      const {
        project: otherProject,
        phases: [otherPhase],
      } = await workflowWithPhases(['Other Todo']);
      const foreignAnchor = await createItem({
        projectId: otherProject.id,
        workphaseId: otherPhase.id,
        title: 'Foreign Anchor',
      });

      const res = await request(app)
        .patch(`/api/items/${subject.id}/move`)
        .send({ anchorId: foreignAnchor.id, side: 'after' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/position scope/);
      expect(await fetchItem(subject.id)).toMatchObject(unchanged(subject));
    });

    it('still allows anchoring within the same workflow-wide scope (sanity check against a false-positive reject)', async () => {
      const { project, todo } = await setupTwoPhases();
      const a = await createItem({ projectId: project.id, workphaseId: todo.id });
      const b = await createItem({ projectId: project.id, workphaseId: todo.id });

      const res = await request(app).patch(`/api/items/${b.id}/move`).send({ anchorId: a.id, side: 'after' });
      expect(res.status).toBe(200);
    });

    it('still allows anchoring within the same attached-siblings scope (sanity check against a false-positive reject)', async () => {
      const { project, todo } = await setupTwoPhases();
      const parent = await createItem({ projectId: project.id, workphaseId: todo.id });
      const childA = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child A' });
      const childB = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child B' });

      const res = await request(app).patch(`/api/items/${childB.id}/move`).send({ anchorId: childA.id, side: 'after' });
      expect(res.status).toBe(200);
    });
  });

  it('TC-6.1, TC-6.3: moving into a terminal workphase clears position and sets completedAt', async () => {
    const { project, todo, done } = await setupTwoPhases();
    const item = await createItem({ projectId: project.id, workphaseId: todo.id });

    const before = Date.now();
    const res = await request(app).patch(`/api/items/${item.id}/move`).send({ workphaseId: done.id });
    const after = Date.now();
    expect(res.status).toBe(200);
    expect(res.body.position).toBeNull();
    expect(res.body.completedAt).toBeGreaterThanOrEqual(before); // the time of the write
    expect(res.body.completedAt).toBeLessThanOrEqual(after);
  });

  it('TC-6.2, TC-6.9: moving out of a terminal workphase clears completedAt and assigns a fresh position', async () => {
    const { project, todo, done } = await setupTwoPhases();
    const existing = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Existing' }); // position 1.0
    const item = await request(app)
      .post('/api/items')
      .send({ title: 'Shipped', projectId: project.id, workphaseId: done.id });
    expect(item.body.completedAt).toBeGreaterThan(0);

    const res = await request(app).patch(`/api/items/${item.body.id}/move`).send({ workphaseId: todo.id });
    expect(res.status).toBe(200);
    expect(res.body.completedAt).toBeNull();
    // TC-6.9: proves the fresh position specifically follows append-fallback
    // (past the true last item in scope) — not just "some non-null value".
    expect(res.body.position).toBeGreaterThan(existing.position);
  });

  it('TC-2.13: GET returns positionScope = "attached-siblings" for an attached child', async () => {
    const { project, todo } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' });

    const res = await request(app).get(`/api/items/${child.id}`);
    expect(res.status).toBe(200);
    expect(res.body.positionScope).toBe('attached-siblings');
  });

  // GET /:id computes every child's positionScope from one batched
  // workphase lookup; two distinct workphases across parent + children in
  // one response catch a batching mistake that only shows up with more than
  // one workphaseId involved.
  it('GET attaches positionScope to the item and to every child in its children array', async () => {
    const { project, todo, done } = await setupTwoPhases();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    const attachedChild = await createItem({ projectId: project.id, parentId: parent.id, title: 'Attached Child' });
    const detachedChild = await createItem({
      projectId: project.id,
      parentId: parent.id,
      workphaseId: done.id,
      isAttached: false,
      title: 'Detached Child',
    });

    const res = await request(app).get(`/api/items/${parent.id}`);
    expect(res.status).toBe(200);
    expect(res.body.positionScope).toBe('workflow');

    const children = res.body.children as Array<{ id: string; positionScope: string }>;
    expect(children.find(c => c.id === attachedChild.id)?.positionScope).toBe('attached-siblings');
    expect(children.find(c => c.id === detachedChild.id)?.positionScope).toBe('none');
  });

  it('ATT-1.1, TC-2.14: GET returns positionScope = "workflow" for a top-level item in a non-terminal workphase', async () => {
    const { project, todo } = await setupTwoPhases();
    const item = await createItem({ projectId: project.id, workphaseId: todo.id });

    const res = await request(app).get(`/api/items/${item.id}`);
    expect(res.status).toBe(200);
    expect(res.body.positionScope).toBe('workflow');
  });

  it('TC-2.15: GET returns positionScope = "none" for a done item', async () => {
    const { project, done } = await setupTwoPhases();
    const item = await request(app)
      .post('/api/items')
      .send({ title: 'Shipped', projectId: project.id, workphaseId: done.id });

    const res = await request(app).get(`/api/items/${item.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.positionScope).toBe('none');
  });

  describe('multi-workphase active-scope reindex', () => {
    async function getPosition(id: string) {
      return (await request(app).get(`/api/items/${id}`)).body.position;
    }

    it('TC-2.12, TC-5.1, TC-5.4, TC-5.9, TC-5.13, TC-5.14: reindexes every non-terminal workphase in the workflow together, in one coordinated pass, in their combined order', async () => {
      const { project, todo, inProgress } = await setupThreePhases();

      // An item in a DIFFERENT non-terminal workphase, same workflow — this is what
      // proves the coordinated (not per-workphase) scope. It is created first, and
      // `todo`'s last item sits past it, so neither the order the rows were inserted in
      // nor `todo` before `inProgress` gives the order by position: T1, T2, P1, T3.
      const itemP1 = await createItem({ projectId: project.id, workphaseId: inProgress.id, title: 'P1' });
      setItemPosition(itemP1.id, 5.0);

      // A tight, unresolvable gap within `todo` — the trigger.
      const itemT1 = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'T1' });
      const itemT2 = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'T2' });
      setItemPosition(itemT1.id, 1.0);
      setItemPosition(itemT2.id, 1.0 + 1e-13);
      const itemT3 = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'T3' });
      setItemPosition(itemT3.id, 6.0);

      const mover = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Mover' });
      const res = await request(app).patch(`/api/items/${mover.id}/move`).send({ anchorId: itemT1.id, side: 'after' });
      expect(res.status).toBe(200);

      // Precision exhausted between T1 and T2 -> the reindex ran over the
      // full workflow-wide scope (positionScopeFor), not just `todo` ->
      // T1/T2/P1 all land as clean sequential integers in one pass, then
      // Mover's insert retries and resolves the now-open T1/T2 gap.
      expect(await getPosition(itemT1.id)).toBe(1);
      expect(await getPosition(itemT2.id)).toBe(2);
      expect(await getPosition(itemP1.id)).toBe(3); // the coordination proof: a different workphase, reindexed together
      expect(await getPosition(itemT3.id)).toBe(4); // and in the combined order, past P1
      expect(res.body.position).toBe(1.5);
      // Every renumbered item is disclosed, In Progress's P1 too, and then the mover's own pair.
      expect(res.body.reindexed).toEqual([
        { id: itemT1.id, position: 1 },
        { id: itemT2.id, position: 2 },
        { id: itemP1.id, position: 3 },
        { id: itemT3.id, position: 4 },
        { id: mover.id, position: 1.5 },
      ]);
    });

    // positionScopeFor's workflow-wide scope includes terminal workphase ids
    // with no isTerminal filter, so a done item (position: null) is a scope
    // member by workphaseId alone. SQLite sorts NULL first in ASC order, so
    // a reindex that orders by position without its own isNotNull filter
    // would give that done item a real position, when a done item has none.
    // The neighbor lookups are safe on their own (gt()/lt() against a real
    // value never match a null); the reindex's order-and-renumber pass is
    // the one step that needs the filter.
    it('TC-5.5: excludes a done item from an active-scope reindex', async () => {
      const { project, todo, inProgress, done } = await setupThreePhases();

      const itemT1 = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'T1' });
      const itemT2 = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'T2' });
      setItemPosition(itemT1.id, 1.0);
      setItemPosition(itemT2.id, 1.0 + 1e-13);
      const itemP1 = await createItem({ projectId: project.id, workphaseId: inProgress.id, title: 'P1' });
      setItemPosition(itemP1.id, 5.0);

      const doneItem = await request(app)
        .post('/api/items')
        .send({ title: 'Shipped', projectId: project.id, workphaseId: done.id });
      expect(doneItem.body.position).toBeNull();
      expect(doneItem.body.completedAt).toBeGreaterThan(0);

      const mover = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Mover' });
      await request(app).patch(`/api/items/${mover.id}/move`).send({ anchorId: itemT1.id, side: 'after' });

      const reread = await request(app).get(`/api/items/${doneItem.body.id}`);
      expect(reread.body.position).toBeNull();
      expect(reread.body.completedAt).toBe(doneItem.body.completedAt);
    });
  });

  // positionScopeFor's two branches (attached-siblings: `parentId = X AND
  // isAttached = 1`; workflow-wide: everything else, explicitly excluding
  // `isAttached = 1 AND parentId IS NOT NULL`) are literal complements of
  // each other, so no row can satisfy both — but TC-5.5 (above) is proof
  // that reasoning about a scope predicate isn't the same as verifying it
  // under an actual reindex, so this checks both leak directions directly
  // rather than trusting the construction argument alone.
  describe('reindex scope isolation: attached-siblings vs. workflow-wide', () => {
    it('TC-5.7: an attached-siblings reindex does not touch an unrelated workflow-wide item', async () => {
      const { project, todo } = await setupTwoPhases();

      const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
      const childA = await createItem({ projectId: project.id, parentId: parent.id, title: 'ChildA' });
      const childB = await createItem({ projectId: project.id, parentId: parent.id, title: 'ChildB' });
      setItemPosition(childA.id, 1.0);
      setItemPosition(childB.id, 1.0 + 1e-13); // tight gap -> reindex trigger

      const farAway = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'FarAway' });
      setItemPosition(farAway.id, 500.0);

      const newChild = await createItem({ projectId: project.id, parentId: parent.id, title: 'NewChild' });
      const res = await request(app)
        .patch(`/api/items/${newChild.id}/move`)
        .send({ anchorId: childA.id, side: 'after' });

      // The attached-siblings reindex itself worked (childA/childB got
      // clean sequential positions, newChild resolved into the gap)...
      expect((await request(app).get(`/api/items/${childA.id}`)).body.position).toBe(1);
      expect((await request(app).get(`/api/items/${childB.id}`)).body.position).toBe(2);
      expect(res.body.position).toBe(1.5);
      // ...but a workflow-wide item sharing the same workphase, and the
      // parent itself, are both completely untouched by it.
      expect((await request(app).get(`/api/items/${farAway.id}`)).body.position).toBe(500);
      expect((await request(app).get(`/api/items/${parent.id}`)).body.position).toBe(parent.position);
    });

    it("TC-5.8: a workflow-wide reindex does not touch an unrelated parent's attached children", async () => {
      const { project, todo } = await setupTwoPhases();

      const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
      const childA = await createItem({ projectId: project.id, parentId: parent.id, title: 'ChildA' });
      const childB = await createItem({ projectId: project.id, parentId: parent.id, title: 'ChildB' });
      setItemPosition(childA.id, 1.0);
      setItemPosition(childB.id, 2.0); // plenty of room, not a trigger

      const t1 = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'T1' });
      const t2 = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'T2' });
      setItemPosition(t1.id, 10.0);
      setItemPosition(t2.id, 10.0 + 1e-13); // tight gap -> reindex trigger

      const mover = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Mover' });
      const res = await request(app).patch(`/api/items/${mover.id}/move`).send({ anchorId: t1.id, side: 'after' });

      // The workflow-wide reindex itself worked — `parent` is itself a
      // plain top-level (non-attached) item, so it's a workflow-wide scope
      // member too and gets swept into the same reindex, ahead of T1/T2 by
      // position order.
      expect((await request(app).get(`/api/items/${parent.id}`)).body.position).toBe(1);
      expect((await request(app).get(`/api/items/${t1.id}`)).body.position).toBe(2);
      expect((await request(app).get(`/api/items/${t2.id}`)).body.position).toBe(3);
      expect(res.body.position).toBe(2.5);
      // ...but the unrelated parent's attached children, sharing the same
      // workphase, are completely untouched by it.
      expect((await request(app).get(`/api/items/${childA.id}`)).body.position).toBe(1.0);
      expect((await request(app).get(`/api/items/${childB.id}`)).body.position).toBe(2.0);
    });
  });
});
