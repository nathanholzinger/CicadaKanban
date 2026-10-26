import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index.js';
import {
  createItem,
  setItemPosition,
  setItemWorkphase,
  workflowWithPhases,
  setupWorkflow,
  getRow,
  countItems,
} from '../fixtures.js';

// Attached and detached children through the item routes: how a parent's workphase carries its
// children, and what a create, an edit and a reparent do to the flag.

describe('attached children', () => {
  it('ATT-1.3: moving a parent cascades through attached children and grandchildren', async () => {
    const {
      project,
      phases: [todo, inProgress],
    } = await workflowWithPhases(['Todo', 'In Progress']);
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' });
    const grandchild = await createItem({ projectId: project.id, parentId: child.id, title: 'Grandchild' });

    const res = await request(app).patch(`/api/items/${parent.id}/move`).send({ workphaseId: inProgress.id });
    expect(res.status).toBe(200);

    expect((await request(app).get(`/api/items/${child.id}`)).body.workphaseId).toBe(inProgress.id);
    expect((await request(app).get(`/api/items/${grandchild.id}`)).body.workphaseId).toBe(inProgress.id);
  });

  it("TC-2.25: cascading a non-terminal-to-non-terminal move leaves an attached child's position untouched", async () => {
    const {
      project,
      phases: [todo, inProgress],
    } = await workflowWithPhases(['Todo', 'In Progress']);
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' });
    // Off the 1.0 a re-placement among its siblings would give it, and the 2 among the workflow's items.
    setItemPosition(child.id, 0.37);

    const res = await request(app).patch(`/api/items/${parent.id}/move`).send({ workphaseId: inProgress.id });
    expect(res.status).toBe(200);

    // A cascade only ever writes {workphaseId, updatedAt} on a cascaded
    // child — position is a separate, untouched axis regardless of how many
    // times the parent's workphase changes.
    const updatedChild = await request(app).get(`/api/items/${child.id}`);
    expect(updatedChild.body.workphaseId).toBe(inProgress.id);
    expect(updatedChild.body.position).toBe(0.37);
  });

  it('ATT-1.4, ATT-1.5, TC-6.5, TC-6.6: an attached child keeps its position when its parent cascades into a terminal workphase', async () => {
    const { project, todo, done } = await setupWorkflow();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' });
    expect(child.position).toBe(1.0);

    const res = await request(app).patch(`/api/items/${parent.id}/move`).send({ workphaseId: done.id });
    expect(res.status).toBe(200);
    // The parent itself does go through the active->done transition...
    expect(res.body.position).toBeNull();
    expect(res.body.completedAt).toBeGreaterThan(0);

    // ...but the attached child's own scope is (parentId, isAttached), never
    // workphaseId, and done-tracking is for Free items only, so its position
    // and completedAt are untouched even though its cascaded workphaseId is
    // now terminal.
    const updatedChild = await request(app).get(`/api/items/${child.id}`);
    expect(updatedChild.body.workphaseId).toBe(done.id);
    expect(updatedChild.body.position).toBe(child.position);
    expect(updatedChild.body.completedAt).toBeNull();
    expect(updatedChild.body.positionScope).toBe('attached-siblings');
  });

  it('ATT-1.5: a Stub reads done under a done parent and not done once it reopens, with only its workphase written', async () => {
    const { project, todo, done } = await setupWorkflow();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' });
    const row = () => getRow(child.id);

    // Each change writes the cascaded workphase and the modification
    // timestamp on the child, and nothing else: no completedAt either way.
    for (const workphaseId of [done.id, todo.id]) {
      const before = row();
      expect((await request(app).patch(`/api/items/${parent.id}/move`).send({ workphaseId })).status).toBe(200);
      const after = row();
      expect(after).toEqual({ ...before, workphaseId, updatedAt: after.updatedAt });
      expect(after.completedAt).toBeNull();
    }
  });

  it('ATT-1.6: a detached child keeps its workphase, position and completedAt through every move of its parent', async () => {
    const { project, todo, inProgress, done } = await setupWorkflow();
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    const detachedChild = (title: string, workphaseId: string) =>
      createItem({ projectId: project.id, parentId: parent.id, title, isAttached: false, workphaseId });
    // One active (a position, no completedAt) and one done (completedAt, no position).
    const active = await detachedChild('Active', inProgress.id);
    const finished = await detachedChild('Finished', done.id);
    expect(finished.completedAt).not.toBeNull();
    const tracked = (id: string) => {
      const { workphaseId, position, completedAt } = getRow(id);
      return { workphaseId, position, completedAt };
    };
    const before = { active: tracked(active.id), finished: tracked(finished.id) };

    // Between live workphases, into a terminal one, and back out of it.
    for (const workphaseId of [inProgress.id, done.id, todo.id]) {
      expect((await request(app).patch(`/api/items/${parent.id}/move`).send({ workphaseId })).status).toBe(200);
      expect({ active: tracked(active.id), finished: tracked(finished.id) }).toEqual(before);
    }
  });

  it('ATT-1.3, ATT-1.6: a detached child halts the cascade for its whole branch', async () => {
    const {
      project,
      phases: [todo, inProgress],
    } = await workflowWithPhases(['Todo', 'In Progress']);
    const root = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Root' });
    const detached = await createItem({
      projectId: project.id,
      parentId: root.id,
      title: 'Detached',
      isAttached: false,
      workphaseId: todo.id,
    });
    // Attached under the detached child — inherits its phase, but must not follow the root.
    const branchChild = await createItem({ projectId: project.id, parentId: detached.id, title: 'Branch Child' });

    // Without this a refused move would leave both children in Todo too.
    const moved = await request(app).patch(`/api/items/${root.id}/move`).send({ workphaseId: inProgress.id });
    expect(moved.status).toBe(200);
    expect(getRow(root.id).workphaseId).toBe(inProgress.id);

    expect((await request(app).get(`/api/items/${detached.id}`)).body.workphaseId).toBe(todo.id);
    expect((await request(app).get(`/api/items/${branchChild.id}`)).body.workphaseId).toBe(todo.id);
  });

  it('reattaching snaps to the parent workphase and cascades to own attached descendants', async () => {
    const {
      project,
      phases: [todo, inProgress],
    } = await workflowWithPhases(['Todo', 'In Progress']);
    const parent = await createItem({ projectId: project.id, workphaseId: inProgress.id, title: 'Parent' });
    const child = await createItem({
      projectId: project.id,
      parentId: parent.id,
      title: 'Child',
      isAttached: false,
      workphaseId: todo.id,
    });
    const grandchild = await createItem({ projectId: project.id, parentId: child.id, title: 'Grandchild' });
    expect(grandchild.workphaseId).toBe(todo.id);

    const res = await request(app).put(`/api/items/${child.id}`).send({ isAttached: true });
    expect(res.status).toBe(200);
    expect(res.body.workphaseId).toBe(inProgress.id);

    expect((await request(app).get(`/api/items/${grandchild.id}`)).body.workphaseId).toBe(inProgress.id);
  });

  it('reparenting an attached item shifts it and its attached descendants to the new parent workphase', async () => {
    const {
      project,
      phases: [todo, inProgress],
    } = await workflowWithPhases(['Todo', 'In Progress']);
    const parent1 = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent 1' });
    const parent2 = await createItem({ projectId: project.id, workphaseId: inProgress.id, title: 'Parent 2' });
    const item = await createItem({ projectId: project.id, parentId: parent1.id, title: 'Item' });
    const itemChild = await createItem({ projectId: project.id, parentId: item.id, title: 'Item Child' });

    const res = await request(app).put(`/api/items/${item.id}`).send({ parentId: parent2.id });
    expect(res.status).toBe(200);
    expect(res.body.workphaseId).toBe(inProgress.id);

    expect((await request(app).get(`/api/items/${itemChild.id}`)).body.workphaseId).toBe(inProgress.id);
  });

  it('a title-only PUT does not re-sync or relocate an attached child, even if its workphase diverged', async () => {
    const {
      project,
      phases: [todo, inProgress],
    } = await workflowWithPhases(['Todo', 'In Progress']);
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' }); // attached, inherits Todo
    const grandchild = await createItem({ projectId: project.id, parentId: child.id, title: 'Grandchild' });
    // Force divergence: the attached child sits in a different workphase than its parent.
    setItemWorkphase(child.id, inProgress.id);
    setItemWorkphase(grandchild.id, inProgress.id);

    // A title-only edit must leave workphaseId untouched (no snap back to the parent's Todo).
    const res = await request(app).put(`/api/items/${child.id}`).send({ title: 'Renamed' });
    expect(res.status).toBe(200);
    expect(res.body.workphaseId).toBe(inProgress.id);
    expect((await request(app).get(`/api/items/${grandchild.id}`)).body.workphaseId).toBe(inProgress.id);
  });

  it('a detached child keeps its explicitly passed workphase', async () => {
    const {
      project,
      phases: [todo, inProgress],
    } = await workflowWithPhases(['Todo', 'In Progress']);
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });

    const child = await createItem({
      projectId: project.id,
      parentId: parent.id,
      title: 'Child',
      isAttached: false,
      workphaseId: inProgress.id,
    });
    expect(child.workphaseId).toBe(inProgress.id);
    expect(child.isAttached).toBe(0);
  });

  it('ATT-1.14: a create cannot set the flag without a parent, and a parentless create stores it clear', async () => {
    const {
      project,
      phases: [todo],
    } = await workflowWithPhases(['Todo', 'In Progress']);
    const before = countItems();
    const refused = await request(app)
      .post('/api/items')
      .send({ title: 'Solo Root', projectId: project.id, workphaseId: todo.id, isAttached: true });
    expect(refused.status).toBe(400);
    expect(refused.body.error).toMatch(/requires a parentId/);
    expect(countItems()).toBe(before);

    const unflagged = await request(app)
      .post('/api/items')
      .send({ title: 'Solo Root', projectId: project.id, workphaseId: todo.id });
    expect(unflagged.status).toBe(201);
    expect(unflagged.body.parentId).toBeNull();
    expect(unflagged.body.isAttached).toBe(0);
    // No parent to override it — the given workphaseId is used as-is.
    expect(unflagged.body.workphaseId).toBe(todo.id);
  });

  // "Attached ⇒ has a parent" holds in the stored row: clearing the parent
  // clears the flag.
  it('ATT-7.7: reparenting to null while attached clears isAttached and keeps the workphase', async () => {
    const {
      project,
      phases: [todo],
    } = await workflowWithPhases(['Todo', 'In Progress']);
    const parent = await createItem({ projectId: project.id, workphaseId: todo.id, title: 'Parent' });
    const child = await createItem({ projectId: project.id, parentId: parent.id, title: 'Child' }); // attached, inherits Todo
    expect(child.isAttached).toBe(1);

    const res = await request(app).put(`/api/items/${child.id}`).send({ parentId: null });
    expect(res.status).toBe(200);
    expect(res.body.parentId).toBeNull();
    expect(res.body.isAttached).toBe(0);
    expect(res.body.workphaseId).toBe(todo.id); // no workphase change is implied
    expect(res.body.positionScope).toBe('workflow'); // now a Free item, freshly positioned
    expect(res.body.position).not.toBeNull();
  });
});
