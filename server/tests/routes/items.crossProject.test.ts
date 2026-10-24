import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index.js';
import {
  createProject,
  createItem,
  createBoard,
  setItemPosition,
  readBoard,
  getRow,
  move,
  put,
  setupWorkflow,
} from '../fixtures.js';
import { hierarchyEntries, cardWithTwoStubs } from '../itemHierarchyFixtures.js';

// Reparenting across projects through the item routes: what a move or an edit carries to the
// new project, and what it refuses when the two projects use different workflows.

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

  it('ATT-5.1: PUT accepts reparenting under a parent in a different project and adopts its projectId', async () => {
    const projectA = await createProject();
    const projectB = await createProject();
    const itemA = await createItem({ projectId: projectA.id, title: 'Item A' });
    const parentB = await createItem({ projectId: projectB.id, title: 'Parent B' });

    const res = await put(itemA.id, { parentId: parentB.id });
    expect(res.status).toBe(200);
    expect(res.body.parentId).toBe(parentB.id);
    expect(res.body.projectId).toBe(projectB.id);
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

  it('ATT-5.12: a Free item reparented to a sibling project on one workflow may name a workphase of that workflow', async () => {
    const { todo, inProgress, p1, p2 } = await setupSiblingProjects();
    const b = await createItem({ projectId: p2.id, workphaseId: todo.id, title: 'B' });
    const x = await createItem({ projectId: p1.id, workphaseId: todo.id, title: 'X' });
    // Sibling projects share the root's workflow: not a workflow change.
    const res = await move(x.id, { parentId: b.id, isAttached: false, workphaseId: inProgress.id });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ parentId: b.id, isAttached: 0, projectId: p2.id, workphaseId: inProgress.id });
  });

  describe('across workflows', () => {
    // P1 (`a`) on one workflow and P2 (`b`) on another, with `bItem` in P2's Todo (`w2`).
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
      const invalid = (await readBoard(board.id)).unsorted.invalidItems;
      expect(invalid.map(i => i.id)).toContain(x.id);

      // It still holds a workphase of Q1's workflow, so it classifies as "none", not "workflow", wherever it's read.
      expect(invalid.find(i => i.id === x.id)?.positionScope).toBe('none');
      expect((await request(app).get(`/api/items/${x.id}`)).body.positionScope).toBe('none');
    });
  });
});
