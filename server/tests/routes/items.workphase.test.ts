import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { app } from '../../src/index.js';
import { db } from '../../src/db/index.js';
import { items } from '../../src/db/schema.js';
import { createWorkphase, createItem, setItemParent } from '../fixtures.js';
import { getRow, move, put, countItems, setupWorkflow } from '../itemHierarchyFixtures.js';

// The workphase a write leaves an item in (ATT-9): an Attached child takes its parent's, a
// detach leaves the item in the one it was shown in, and a write with none to leave it in
// must name one.

// P1's workflow has workphases w1 (Todo), w2 (In Progress) and w3 (Review), and a
// terminal Done. `r` is top-level in w1, `d` is a detached child of `r` in w2, `a` is
// attached to `d` and `x` to `a`. So `a` and `x` are Stubs in d's Card, and `d` is the
// nearest Free ancestor of each.
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

// The two ways out of the refusal when D, the Free item an item is shown with,
// has no workphase: naming one in the same write, or filing D into one first.
const WAYS_OUT = /workphaseId in the same write, or file "D" into a workphase first/;

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

  it('a create and a move refuse a workphaseId that names no workphase with one message, attached or not', async () => {
    const { project, w1, a } = await setupShownWithChain();
    const f = await createItem({ projectId: project.id, workphaseId: w1.id, title: 'F' });
    const before = countItems();

    const moved = await move(f.id, { parentId: a.id, isAttached: true, workphaseId: 'no-such-workphase' });
    expect(moved.status).toBe(400);
    expect(moved.body.error).toMatch(/workphaseId does not reference an existing workphase/);

    const creates = [
      ['a top-level item', { projectId: project.id }],
      ['an attached child', { parentId: a.id }],
      ['a detached child', { parentId: a.id, isAttached: false }],
    ] as const;
    for (const [label, body] of creates) {
      const res = await request(app)
        .post('/api/items')
        .send({ title: 'Y', workphaseId: 'no-such-workphase', ...body });
      expect(res.status, label).toBe(400);
      expect(res.body.error, label).toBe(moved.body.error);
    }
    expect(countItems()).toBe(before);
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

  it('a detached child created under a parentId cycle still resolves its workphase, instead of walking forever', async () => {
    const { project, w2, a, x } = await setupShownWithChain();
    // A is attached to D, so closing the loop makes A and X each other's ancestor.
    setItemParent(a.id, x.id);

    const res = await request(app)
      .post('/api/items')
      .send({ projectId: project.id, parentId: a.id, title: 'Y', isAttached: false });
    expect(res.status).toBe(201);
    expect(res.body.workphaseId).toBe(w2.id);
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
      expect(res.body.error, label).toMatch(WAYS_OUT);
      expect(res.body.error, label).not.toMatch(/null/);
      expect(getRow(s.id), label).toEqual(before);
    }
    const count = countItems();
    const created = await request(app).post('/api/items').send({ title: 'Y', parentId: a.id, isAttached: false });
    expect(created.status).toBe(400);
    expect(created.body.error).toMatch(WAYS_OUT);
    expect(created.body.error).not.toMatch(/null/);
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

  it('ATT-9.10: a detach that also reparents, naming no workphase, leaves the item in the one it was shown in', async () => {
    for (const [entryPoint, write] of [
      ['move', move],
      ['PUT', put],
    ] as const) {
      // X, shown in D's Card in W2, is given B as its parent, B being in W3.
      const shown = await setupShownWithChain(entryPoint);
      const b = await createItem({ projectId: shown.project.id, workphaseId: shown.w3.id, title: 'B' });
      const res = await write(shown.x.id, { parentId: b.id, isAttached: false });
      expect(res.status, entryPoint).toBe(200);
      // D's workphase, whose Card it was shown in, not B's.
      expect(res.body, entryPoint).toMatchObject({ parentId: b.id, isAttached: 0, workphaseId: shown.w2.id });

      // The stored copy has drifted, to a workphase that is neither: the item
      // still leaves where it was shown.
      const drifted = await setupShownWithChain(`${entryPoint} drifted`);
      db.update(items).set({ workphaseId: drifted.w1.id }).where(eq(items.id, drifted.x.id)).run();
      const driftedB = await createItem({ projectId: drifted.project.id, workphaseId: drifted.w3.id, title: 'B' });
      const left = await write(drifted.x.id, { parentId: driftedB.id, isAttached: false });
      expect(left.status, entryPoint).toBe(200);
      expect(left.body.workphaseId, entryPoint).toBe(drifted.w2.id);

      // D has no workphase, so there is none to leave X in: the write is refused
      // as ATT-9.7's are, and X is as it was.
      const bare = await setupShownWithChain(`${entryPoint} bare`);
      expect((await move(bare.d.id, { workphaseId: null })).status).toBe(200);
      const bareB = await createItem({ projectId: bare.project.id, workphaseId: bare.w3.id, title: 'B' });
      const before = getRow(bare.x.id);
      const refused = await write(bare.x.id, { parentId: bareB.id, isAttached: false });
      expect(refused.status, entryPoint).toBe(400);
      expect(refused.body.error, entryPoint).toMatch(WAYS_OUT);
      expect(getRow(bare.x.id), entryPoint).toEqual(before);
    }
  });

  it('ATT-9.11: naming workphaseId: null leaves an item Free with no workphase, whatever it was shown in', async () => {
    // X is shown in D's Card, and D is in W2. A move is the one edit that can
    // name a workphase: PUT takes none.
    const { project, x, a } = await setupShownWithChain();
    const detached = await move(x.id, { isAttached: false, workphaseId: null });
    expect(detached.status).toBe(200);
    expect(detached.body).toMatchObject({ isAttached: 0, workphaseId: null });

    // A create under A, which is shown in the same Card, is no different.
    const y = await createItem({
      projectId: project.id,
      parentId: a.id,
      title: 'Y',
      isAttached: false,
      workphaseId: null,
    });
    expect(y).toMatchObject({ parentId: a.id, isAttached: 0, workphaseId: null });
  });
});
