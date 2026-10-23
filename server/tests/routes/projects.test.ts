import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { app } from '../../src/index.js';
import { db } from '../../src/db/index.js';
import { resetTestDb } from '../../src/db/resetTestDb.js';
import { PROJECT_DEPTH_CAP } from '../../src/lib/itemTree.js';
import {
  labels,
  itemLabels,
  attachments,
  notifications,
  chatThreads,
  chatMessages,
  boards,
  columns,
  projects,
  workphases,
} from '../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import {
  createProject,
  createWorkflow,
  createWorkphase,
  createItem,
  createColumn,
  boardsOf,
  readBoard,
  itemIdsOn,
  setProjectParent,
  setProjectPosition,
  templatedWorkflow,
} from '../fixtures.js';

type ProjectBody = { id: string; name: string; parentId: string | null; position: number | null };
type Pair = { id: string; position: number };

// Disclosed pairs come in no particular order (wiki positioning §7), so they're compared by id.
const byId = (pairs: Pair[]) => [...pairs].sort((a, b) => a.id.localeCompare(b.id));

const getProject = async (id: string) => (await request(app).get(`/api/projects/${id}`)).body as ProjectBody;
const listProjects = async () => (await request(app).get('/api/projects')).body as ProjectBody[];
const placeOf = async (id: string) => {
  const { parentId, position } = await getProject(id);
  return { parentId, position };
};
const editProject = (id: string, body: Record<string, unknown>) => request(app).put(`/api/projects/${id}`).send(body);
const moveProject = (id: string, body: Record<string, unknown>) =>
  request(app).patch(`/api/projects/${id}/move`).send(body);

// A refusal says the write would put the subtree past the cap.
const pastCap = /exceeds the cap/i;

// A chain of projects, each the only child of the one before, from a top-level
// project down to depth `depth` (top-level projects are at depth 1).
async function chainTo(depth: number) {
  const chain: ProjectBody[] = [];
  for (let level = 1; level <= depth; level++) {
    chain.push(await createProject({ name: `P${level}`, parentId: chain[level - 2]?.id }));
  }
  return chain;
}

const depthOf = async (id: string) => {
  let depth = 1;
  for (let p = await getProject(id); p.parentId; p = await getProject(p.parentId)) depth++;
  return depth;
};

// A project with a workflow of its own, a board and one workphase, and an item
// in that workphase.
async function projectWithItem(name: string, overrides: Record<string, unknown> = {}) {
  const project = await createProject({ name, ...overrides });
  const workflow = await createWorkflow(project.id, { name: `${name}'s workflow` });
  const workphase = await createWorkphase(workflow.id, { name: 'Todo' });
  const item = await createItem({ projectId: project.id, workphaseId: workphase.id, title: `${name}'s item` });
  const [board] = await boardsOf(workflow.id);
  return { project, workflow, workphase, item, board };
}

describe('GET /api/projects', () => {
  it('returns an empty list when no projects exist', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('TREE-4.2: lists projects by position, then creation time, a missing position first', async () => {
    const b = await createProject({ name: 'B' });
    const a = await createProject({ name: 'A' });
    const c = await createProject({ name: 'C' });
    const n = await createProject({ name: 'N' });
    // A and B tie at 2.0, with B created first. N has no position, which only
    // a direct database edit gives.
    db.update(projects).set({ createdAt: 1 }).where(eq(projects.id, b.id)).run();
    db.update(projects).set({ createdAt: 2 }).where(eq(projects.id, a.id)).run();
    setProjectPosition(a.id, 2.0);
    setProjectPosition(b.id, 2.0);
    setProjectPosition(c.id, 1.5);
    setProjectPosition(n.id, null);

    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(200);
    expect(res.body.map((p: ProjectBody) => p.id)).toEqual([n.id, c.id, b.id, a.id]);
  });
});

describe('GET /api/projects/:id', () => {
  it('returns a project with its nested workflows array', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const res = await request(app).get(`/api/projects/${project.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(project.id);
    expect(res.body.workflows).toHaveLength(1);
    expect(res.body.workflows[0].id).toBe(workflow.id);
  });

  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).get('/api/projects/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

describe('POST /api/projects', () => {
  it('creates a root project with parentId null and description null by default', async () => {
    const res = await request(app).post('/api/projects').send({ name: 'Root' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Root');
    expect(res.body.parentId).toBeNull();
    expect(res.body.description).toBeNull();
  });

  it('TREE-5.1: a create makes a top-level project or a child, after its siblings’ true last', async () => {
    const a = await createProject({ name: 'A' });
    const p = await createProject({ name: 'P' });
    expect([a.position, p.position]).toEqual([1, 2]);

    // No parent: top-level, after the last top-level project.
    const top = await createProject({ name: 'Top' });
    expect(top.parentId).toBeNull();
    expect(top.position).toBe(3);

    // P has no children: its first child is at 1, and the second at 2.
    const first = await createProject({ name: 'P1', parentId: p.id });
    const second = await createProject({ name: 'P2', parentId: p.id });
    expect([first.parentId, first.position]).toEqual([p.id, 1]);
    expect([second.parentId, second.position]).toEqual([p.id, 2]);

    // A's children sit at 1.0 and 4.2: the create goes after the true last,
    // whatever the top-level projects' positions.
    await createProject({ name: 'A1', parentId: a.id });
    const a2 = await createProject({ name: 'A2', parentId: a.id });
    setProjectPosition(a2.id, 4.2);
    const last = await createProject({ name: 'A3', parentId: a.id });
    expect(last.position).toBe(5);
  });

  it('TREE-3.4: a create naming a parent that isn’t a project is refused, and nothing is stored', async () => {
    await createProject({ name: 'Existing' });
    const before = await listProjects();

    const res = await request(app).post('/api/projects').send({ name: 'Orphan', parentId: 'does-not-exist' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/existing project/i);
    expect(await listProjects()).toEqual(before);
  });

  it('TREE-8.4: a name of only spaces counts as no name, for a create and an edit', async () => {
    const alpha = await createProject({ name: 'Alpha' });
    const before = await listProjects();

    const created = await request(app).post('/api/projects').send({ name: '   ' });
    expect(created.status).toBe(400);
    expect(await listProjects()).toEqual(before);

    const renamed = await editProject(alpha.id, { name: '   ' });
    expect(renamed.status).toBe(400);
    expect((await getProject(alpha.id)).name).toBe('Alpha');
  });

  it('TREE-8.1: a create whose name is left out, null or empty is refused, and nothing is stored', async () => {
    await createProject({ name: 'Existing' });
    const before = await listProjects();

    for (const body of [{}, { name: null }, { name: '' }]) {
      const res = await request(app).post('/api/projects').send(body);
      expect(res.status, JSON.stringify(body)).toBe(400);
      expect(res.body.error).toBeDefined();
    }
    expect(await listProjects()).toEqual(before);
  });
});

describe('PUT /api/projects/:id', () => {
  it('updates only the provided fields', async () => {
    const project = await createProject({ name: 'Original', description: 'Original desc' });
    const res = await request(app).put(`/api/projects/${project.id}`).send({ name: 'Renamed' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Renamed');
    expect(res.body.description).toBe('Original desc');
  });

  it('TREE-8.2: an edit that leaves the name out keeps it', async () => {
    const project = await createProject({ name: 'Alpha' });
    const res = await editProject(project.id, { description: 'Now described' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Alpha');
    expect(res.body.description).toBe('Now described');
  });

  it('clears parentId to null only when explicitly included in the body', async () => {
    const parent = await createProject();
    const child = await createProject({ parentId: parent.id });

    const unchanged = await request(app).put(`/api/projects/${child.id}`).send({ name: 'Still child' });
    expect(unchanged.body.parentId).toBe(parent.id);

    const cleared = await request(app).put(`/api/projects/${child.id}`).send({ parentId: null });
    expect(cleared.body.parentId).toBeNull();
  });

  it('reparents to a valid new parent', async () => {
    const parentA = await createProject();
    const parentB = await createProject();
    const child = await createProject({ parentId: parentA.id });

    const res = await request(app).put(`/api/projects/${child.id}`).send({ parentId: parentB.id });
    expect(res.status).toBe(200);
    expect(res.body.parentId).toBe(parentB.id);
  });

  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).put('/api/projects/does-not-exist').send({ name: 'X' });
    expect(res.status).toBe(404);
  });

  it('TREE-7.1: an edit that leaves the parent as it is keeps the project’s position', async () => {
    const p = await createProject({ name: 'P' });
    await createProject({ name: 'A', parentId: p.id });
    const x = await createProject({ name: 'X', parentId: p.id });
    await createProject({ name: 'B', parentId: p.id });
    setProjectPosition(x.id, 2.37);

    const renamed = await editProject(x.id, { name: 'X, renamed' });
    expect(renamed.status).toBe(200);
    expect(await placeOf(x.id)).toEqual({ parentId: p.id, position: 2.37 });

    const again = await editProject(x.id, { parentId: p.id });
    expect(again.status).toBe(200);
    expect(await placeOf(x.id)).toEqual({ parentId: p.id, position: 2.37 });
  });

  it('TREE-8.3: an edit naming an empty name, or null, is refused', async () => {
    const alpha = await createProject({ name: 'Alpha' });

    for (const name of ['', null]) {
      const res = await editProject(alpha.id, { name });
      expect(res.status, String(name)).toBe(400);
      expect(res.body.error).toBeDefined();
    }
    expect((await getProject(alpha.id)).name).toBe('Alpha');
  });

  it('TREE-7.2: an edit that changes the parent places the project after its new siblings’ true last', async () => {
    // P (1.0) has children at 1.0, 2.0 and 3.0, and X (2.0) is top-level.
    const p = await createProject({ name: 'P' });
    const x = await createProject({ name: 'X' });
    for (let i = 0; i < 3; i++) await createProject({ parentId: p.id });
    expect([p.position, x.position]).toEqual([1, 2]);

    // It doesn't keep 2.0, which would tie a new sibling.
    expect((await editProject(x.id, { parentId: p.id })).status).toBe(200);
    expect(await placeOf(x.id)).toEqual({ parentId: p.id, position: 4 });

    // Top-level again, after P, the true last top-level project.
    expect((await editProject(x.id, { parentId: null })).status).toBe(200);
    expect(await placeOf(x.id)).toEqual({ parentId: null, position: 2 });
  });

  it('ignores a supplied position field entirely', async () => {
    const project = await createProject();
    const before = await request(app).get(`/api/projects/${project.id}`);
    const res = await request(app).put(`/api/projects/${project.id}`).send({ position: 999999 });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(before.body.position);
  });
});

describe('a project’s parent, on an edit and on a move', () => {
  it('TREE-3.1: a parent that names no project is refused, and nothing changes', async () => {
    const x = await createProject({ name: 'X' });
    const before = await placeOf(x.id);

    for (const write of [editProject, moveProject]) {
      const res = await write(x.id, { parentId: 'does-not-exist' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/existing project/i);
    }
    expect(await placeOf(x.id)).toEqual(before);
  });

  it('TREE-3.2: a project can’t be its own parent', async () => {
    const x = await createProject({ name: 'X' });
    const before = await placeOf(x.id);

    for (const write of [editProject, moveProject]) {
      const res = await write(x.id, { parentId: x.id });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/own parent/i);
    }
    expect(await placeOf(x.id)).toEqual(before);
  });

  it('TREE-3.3: a project in the moving project’s subtree isn’t a legal parent', async () => {
    const a = await createProject({ name: 'A' });
    const b = await createProject({ name: 'B', parentId: a.id });
    const c = await createProject({ name: 'C', parentId: b.id });
    const before = await placeOf(a.id);

    for (const parent of [b, c]) {
      for (const write of [editProject, moveProject]) {
        const res = await write(a.id, { parentId: parent.id });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/descendant/i);
      }
    }
    expect(await placeOf(a.id)).toEqual(before);

    // Up the tree is fine: the check is whether the new parent is in the moving
    // project's own subtree.
    const up = await moveProject(c.id, { parentId: a.id });
    expect(up.status).toBe(200);
    expect(up.body.parentId).toBe(a.id);
  });
});

describe('PATCH /api/projects/:id/move', () => {
  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).patch('/api/projects/does-not-exist/move').send({});
    expect(res.status).toBe(404);
  });

  it('TREE-6.1: a move places the project next to the sibling it names', async () => {
    // Top-level A (1.0), B (2.0) and C (3.0), and A's children X and Y: each
    // move is made from this one starting state.
    const [a, , c] = [await createProject(), await createProject(), await createProject()];
    const x = await createProject({ parentId: a.id });
    const y = await createProject({ parentId: a.id });

    expect((await moveProject(x.id, { parentId: null, prevId: a.id })).status).toBe(200);
    expect(await placeOf(x.id)).toEqual({ parentId: null, position: 1.5 });
    expect((await moveProject(y.id, { parentId: null, nextId: c.id })).status).toBe(200);
    expect(await placeOf(y.id)).toEqual({ parentId: null, position: 2.5 });

    // X sits between A and B already, at 1.5. It isn't counted as A's neighbor,
    // so a move after A puts it between A and B, at 2.
    resetTestDb();
    const [a2, x2, b2] = [await createProject(), await createProject(), await createProject()];
    setProjectPosition(x2.id, 1.5);
    setProjectPosition(b2.id, 3.0);
    expect((await moveProject(x2.id, { prevId: a2.id })).status).toBe(200);
    expect(await placeOf(x2.id)).toEqual({ parentId: null, position: 2 });
  });

  it('TREE-6.2: a move naming no neighbor places the project after its true last sibling, even under the same parent', async () => {
    // Top-level A (1.0), B (2.0) and C (3.0), A's children X and Y, and B's
    // child Q, which has none.
    const [a, b] = [await createProject(), await createProject()];
    await createProject();
    const x = await createProject({ parentId: a.id });
    const y = await createProject({ parentId: a.id });
    const q = await createProject({ parentId: b.id });

    expect((await moveProject(x.id, { parentId: null })).status).toBe(200);
    expect(await placeOf(x.id)).toEqual({ parentId: null, position: 4 });
    // Explicit nulls name nothing either.
    expect((await moveProject(y.id, { parentId: q.id, prevId: null, nextId: null })).status).toBe(200);
    expect(await placeOf(y.id)).toEqual({ parentId: q.id, position: 1 });

    // X at 1.5 among A (1.0), B (2.0) and C (3.0), its parent unchanged: a move
    // always places the project.
    resetTestDb();
    const [a2, b2, c2] = [await createProject(), await createProject(), await createProject()];
    const x2 = await createProject();
    setProjectPosition(x2.id, 1.5);
    expect([a2, b2, c2].map(p => p.position)).toEqual([1, 2, 3]);
    expect((await moveProject(x2.id, {})).status).toBe(200);
    expect(await placeOf(x2.id)).toEqual({ parentId: null, position: 4 });
  });

  it('TREE-6.3: a neighbor the move can’t use is refused, and nothing changes', async () => {
    const a = await createProject({ name: 'A' });
    const x = await createProject({ name: 'X' });
    const p = await createProject({ name: 'P' });
    const p1 = await createProject({ name: 'P1', parentId: p.id });
    await createProject({ name: 'P2', parentId: p.id });
    // N is top-level with no position, which only a direct database edit gives.
    const n = await createProject({ name: 'N' });
    setProjectPosition(n.id, null);
    const before = await placeOf(x.id);

    const refused: [string, Record<string, unknown>][] = [
      ['an id that is no project', { parentId: p.id, neighbor: 'does-not-exist' }],
      ['a sibling in X’s current group, not the resulting one', { parentId: p.id, neighbor: a.id }],
      ['a child of P, with X moved to the top level', { parentId: null, neighbor: p1.id }],
      ['a project with no position', { parentId: null, neighbor: n.id }],
    ];
    for (const [label, { parentId, neighbor }] of refused) {
      for (const side of ['prevId', 'nextId']) {
        const res = await moveProject(x.id, { parentId, [side]: neighbor });
        expect(res.status, `${label}, ${side}`).toBe(400);
        expect(res.body.error).toBeDefined();
        expect(await placeOf(x.id), `${label}, ${side}`).toEqual(before);
      }
    }
  });

  it('TREE-6.5: a move naming the project itself as its neighbor is refused', async () => {
    const a = await createProject({ name: 'A' });
    const x = await createProject({ name: 'X' });
    const before = await placeOf(x.id);

    for (const side of ['prevId', 'nextId']) {
      const res = await moveProject(x.id, { [side]: x.id });
      expect(res.status, side).toBe(400);
      expect(res.body.error).toMatch(/itself/i);
    }
    expect(await placeOf(x.id)).toEqual(before);
    expect(await placeOf(a.id)).toEqual({ parentId: null, position: 1 });
  });

  it('TREE-6.6: a move can’t name a position', async () => {
    const x = await createProject({ name: 'X' });
    const a = await createProject({ name: 'A' });
    setProjectPosition(x.id, 2.0);
    setProjectPosition(a.id, 4.0);

    for (const body of [{ position: 3.0 }, { position: 3.0, prevId: a.id }]) {
      const res = await moveProject(x.id, body);
      expect(res.status, JSON.stringify(body)).toBe(400);
      expect(res.body.error).toMatch(/prevId or nextId/);
    }
    expect((await getProject(x.id)).position).toBe(2.0);
  });

  it('TREE-4.5: a move that reindexes discloses every renumbered sibling, the moved project included', async () => {
    // P's children A and B sit at 1500 and 1600, and X is top-level.
    const p = await createProject({ name: 'P' });
    const a = await createProject({ name: 'A', parentId: p.id });
    const b = await createProject({ name: 'B', parentId: p.id });
    const x = await createProject({ name: 'X' });
    setProjectPosition(a.id, 1500);
    setProjectPosition(b.id, 1600);

    const res = await moveProject(x.id, { parentId: p.id });
    expect(res.status).toBe(200);
    expect(res.body.position).toBe(3);
    expect(byId(res.body.reindexed)).toEqual(
      byId([
        { id: a.id, position: 1 },
        { id: b.id, position: 2 },
        { id: x.id, position: 3 },
      ]),
    );

    // At 1.0 and 2.0 there's nothing to renumber, and nothing is disclosed.
    const calm = await createProject({ name: 'Q' });
    const q1 = await createProject({ name: 'Q1', parentId: calm.id });
    await createProject({ name: 'Q2', parentId: calm.id });
    const y = await createProject({ name: 'Y' });
    const quiet = await moveProject(y.id, { parentId: calm.id });
    expect(quiet.status).toBe(200);
    expect(quiet.body.position).toBe(3);
    expect(quiet.body.reindexed ?? []).toEqual([]);
    expect((await getProject(q1.id)).position).toBe(1);
  });

  it('TREE-4.6: a create, and an edit that changes the parent, disclose a reindex too', async () => {
    // P's children A and B sit at 1500 and 1600, and X is top-level.
    const tree = async () => {
      resetTestDb();
      const p = await createProject({ name: 'P' });
      const a = await createProject({ name: 'A', parentId: p.id });
      const b = await createProject({ name: 'B', parentId: p.id });
      const x = await createProject({ name: 'X' });
      setProjectPosition(a.id, 1500);
      setProjectPosition(b.id, 1600);
      return { p, a, b, x };
    };

    const forCreate = await tree();
    const created = await request(app).post('/api/projects').send({ name: 'New', parentId: forCreate.p.id });
    expect(created.status).toBe(201);
    expect(byId(created.body.reindexed)).toEqual(
      byId([
        { id: forCreate.a.id, position: 1 },
        { id: forCreate.b.id, position: 2 },
        { id: created.body.id, position: 3 },
      ]),
    );

    const forEdit = await tree();
    const edited = await editProject(forEdit.x.id, { parentId: forEdit.p.id });
    expect(edited.status).toBe(200);
    expect(byId(edited.body.reindexed)).toEqual(
      byId([
        { id: forEdit.a.id, position: 1 },
        { id: forEdit.b.id, position: 2 },
        { id: forEdit.x.id, position: 3 },
      ]),
    );
  });

  it('TREE-6.4: a moved project’s subtree goes with it, keeping its parents and positions', async () => {
    const a = await createProject({ name: 'A' });
    const x = await createProject({ name: 'X' });
    const x1 = await createProject({ name: 'X1', parentId: x.id });
    const x2 = await createProject({ name: 'X2', parentId: x.id });
    const x1a = await createProject({ name: 'X1a', parentId: x1.id });
    const subtree = [x1, x2, x1a];
    const before = await Promise.all(subtree.map(p => placeOf(p.id)));

    expect((await moveProject(x.id, { parentId: a.id })).status).toBe(200);

    expect(await Promise.all(subtree.map(p => placeOf(p.id)))).toEqual(before);
    expect(before.map(p => p.parentId)).toEqual([x.id, x.id, x1.id]);
    expect(before.map(p => p.position)).toEqual([1, 2, 1]);
  });

  it('returns the full updated project, not a bare success flag', async () => {
    const project = await createProject();
    const res = await request(app).patch(`/api/projects/${project.id}/move`).send({});
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(project.id);
    expect(typeof res.body.position).toBe('number');
    expect(res.body).toHaveProperty('parentId');
    expect(res.body).toHaveProperty('updatedAt');
  });

  it('TREE-4.1: a project write compares and renumbers positions only among the siblings the project ends with', async () => {
    // Top-level A (1.0), B (2.0) and C (3.0), and A's children A1 and A2, which
    // sit at `positions`.
    const tree = async (positions: [number, number]) => {
      resetTestDb();
      const [a, b, c] = [await createProject(), await createProject(), await createProject()];
      const [a1, a2] = [await createProject({ parentId: a.id }), await createProject({ parentId: a.id })];
      setProjectPosition(a1.id, positions[0]);
      setProjectPosition(a2.id, positions[1]);
      return { a, b, c, a1, a2 };
    };

    // C goes after A1, between A1 and A2: the top-level projects at 2.0 and 3.0
    // aren't its neighbors there.
    const near = await tree([1.0, 3.0]);
    expect((await moveProject(near.c.id, { parentId: near.a.id, prevId: near.a1.id })).status).toBe(200);
    expect(await placeOf(near.c.id)).toEqual({ parentId: near.a.id, position: 2 });

    // A's children sit at 1500 and 1600: with no neighbor named, they're
    // reindexed first, in the same order, and C lands after them.
    const far = await tree([1500, 1600]);
    expect((await moveProject(far.c.id, { parentId: far.a.id })).status).toBe(200);
    expect(await placeOf(far.a1.id)).toEqual({ parentId: far.a.id, position: 1 });
    expect(await placeOf(far.a2.id)).toEqual({ parentId: far.a.id, position: 2 });
    expect(await placeOf(far.c.id)).toEqual({ parentId: far.a.id, position: 3 });
    // Nothing outside A's children is renumbered.
    expect(await placeOf(far.a.id)).toEqual({ parentId: null, position: 1 });
    expect(await placeOf(far.b.id)).toEqual({ parentId: null, position: 2 });
  });

  it('TREE-10.2: a move changes the workflow a project with none of its own uses, and its subtree’s', async () => {
    const q1 = await templatedWorkflow('quick', { name: 'Q1' });
    const q2 = await templatedWorkflow('quick', { name: 'Q2' });
    const [board1] = await boardsOf(q1.workflow.id);
    const [board2] = await boardsOf(q2.workflow.id);
    // P1 has none of its own, under Q1. Its children are P1a, with none, and
    // P1b, with W3.
    const p1 = await createProject({ name: 'P1', parentId: q1.project.id });
    const p1a = await createProject({ name: 'P1a', parentId: p1.id });
    const own = await projectWithItem('P1b', { parentId: p1.id });
    const itemIn = (projectId: string, title: string) =>
      createItem({ projectId, workphaseId: q1.workphaseIds[0], title });
    const i1 = await itemIn(p1.id, 'p1');
    const i1a = await itemIn(p1a.id, 'p1a');

    expect(itemIdsOn(await readBoard(board1.id))).toEqual(new Set([i1.id, i1a.id]));

    const moved = await moveProject(p1.id, { parentId: q2.project.id });
    expect(moved.status).toBe(200);

    expect(itemIdsOn(await readBoard(board1.id))).toEqual(new Set());
    const onNew = await readBoard(board2.id);
    expect(itemIdsOn(onNew)).toEqual(new Set([i1.id, i1a.id]));
    expect(new Set(onNew.unsorted.invalidItems.map(i => i.id))).toEqual(new Set([i1.id, i1a.id]));
    expect(itemIdsOn(await readBoard(own.board.id))).toEqual(new Set([own.item.id]));

    // A project that owns a workflow keeps it, wherever it's moved.
    const q3 = await projectWithItem('Q3');
    expect((await moveProject(q3.project.id, { parentId: q2.project.id })).status).toBe(200);
    expect(itemIdsOn(await readBoard(q3.board.id))).toEqual(new Set([q3.item.id]));
    expect(itemIdsOn(await readBoard(board2.id)).has(q3.item.id)).toBe(false);
  });
});

describe('GET /api/projects/depth-cap', () => {
  it('TREE-3.9: the cap the API reports is the one it enforces', async () => {
    const res = await request(app).get('/api/projects/depth-cap');
    expect(res.status).toBe(200);
    expect(Object.keys(res.body)).toEqual(['projectDepthCap']);
    const cap: number = res.body.projectDepthCap;
    expect(Number.isInteger(cap) && cap > 0).toBe(true);

    // A project at the reported depth is accepted, and one below it is refused:
    // the value is read off the API, never the code's constant.
    const chain = await chainTo(cap);
    expect(await depthOf(chain[cap - 1].id)).toBe(cap);
    const past = await request(app)
      .post('/api/projects')
      .send({ name: 'Past', parentId: chain[cap - 1].id });
    expect(past.status).toBe(400);
    expect(past.body.error).toMatch(pastCap);
    expect(await depthOf(chain[cap - 1].id)).toBe(cap);
  });
});

describe('the project depth cap', () => {
  // A chain from a top-level project down to T, at depth PROJECT_DEPTH_CAP − 1, whose parent
  // S is at PROJECT_DEPTH_CAP − 2; and top-level M with one child M1, so M's height is 1.
  async function capTree() {
    resetTestDb();
    const chain = await chainTo(PROJECT_DEPTH_CAP - 1);
    const m = await createProject({ name: 'M' });
    const m1 = await createProject({ name: 'M1', parentId: m.id });
    return { s: chain[chain.length - 2], t: chain[chain.length - 1], m, m1 };
  }

  it('TREE-3.5: a write that leaves the deepest descendant at PROJECT_DEPTH_CAP is accepted, and one past it isn’t', async () => {
    const accepted = await capTree();
    expect((await moveProject(accepted.m.id, { parentId: accepted.s.id })).status).toBe(200);
    expect(await depthOf(accepted.m1.id)).toBe(PROJECT_DEPTH_CAP);

    const tooDeep = await capTree();
    const refused = await moveProject(tooDeep.m.id, { parentId: tooDeep.t.id });
    expect(refused.status).toBe(400);
    expect(refused.body.error).toMatch(pastCap);
    expect((await getProject(tooDeep.m.id)).parentId).toBeNull();

    // An edit holds the same.
    const edit = await capTree();
    const editRefused = await editProject(edit.m.id, { parentId: edit.t.id });
    expect(editRefused.status).toBe(400);
    expect(editRefused.body.error).toMatch(pastCap);
    expect((await getProject(edit.m.id)).parentId).toBeNull();
    expect((await editProject(edit.m.id, { parentId: edit.s.id })).status).toBe(200);

    // A new project has no subtree, so it fits under T, at PROJECT_DEPTH_CAP, and nothing fits under it.
    const create = await capTree();
    const fits = await request(app).post('/api/projects').send({ name: 'N', parentId: create.t.id });
    expect(fits.status).toBe(201);
    expect(await depthOf(fits.body.id)).toBe(PROJECT_DEPTH_CAP);
    const before = await listProjects();
    const past = await request(app).post('/api/projects').send({ name: 'Past', parentId: fits.body.id });
    expect(past.status).toBe(400);
    expect(past.body.error).toMatch(pastCap);
    expect(await listProjects()).toEqual(before);
  });

  it('TREE-3.6: subtree height is the project’s deepest descendant', async () => {
    // M has children M1, with none, and M2, whose child is M2a: H is 2.
    const underTarget = async (targetDepth: number) => {
      resetTestDb();
      const chain = await chainTo(targetDepth);
      const m = await createProject({ name: 'M' });
      await createProject({ name: 'M1', parentId: m.id });
      const m2 = await createProject({ name: 'M2', parentId: m.id });
      await createProject({ name: 'M2a', parentId: m2.id });
      return { m, target: chain[chain.length - 1] };
    };

    // D + 1 + 2 is at most PROJECT_DEPTH_CAP: accepted. One level deeper, it isn't.
    const fits = await underTarget(PROJECT_DEPTH_CAP - 3);
    expect((await moveProject(fits.m.id, { parentId: fits.target.id })).status).toBe(200);
    const past = await underTarget(PROJECT_DEPTH_CAP - 2);
    expect((await moveProject(past.m.id, { parentId: past.target.id })).status).toBe(400);
  });

  it('TREE-3.7: the cap gates writes that give a parent, not existing data', async () => {
    // A tree two levels deeper than the cap, made by writing rows.
    const chain = await chainTo(PROJECT_DEPTH_CAP);
    const beyond = [await createProject({ name: 'Past 1' }), await createProject({ name: 'Past 2' })];
    setProjectParent(beyond[0].id, chain[chain.length - 1].id);
    setProjectParent(beyond[1].id, beyond[0].id);
    const sibling = await createProject({ name: 'Sibling' });
    setProjectParent(sibling.id, beyond[0].id);
    expect(await depthOf(beyond[1].id)).toBe(PROJECT_DEPTH_CAP + 2);

    // Every one of them is returned.
    const listed = new Set((await listProjects()).map(p => p.id));
    for (const p of [...chain, ...beyond, sibling]) expect(listed.has(p.id), p.name).toBe(true);

    // One past the cap is renamed, and moved among its own siblings, its parent
    // unchanged.
    expect((await editProject(beyond[1].id, { name: 'Renamed' })).status).toBe(200);
    expect((await moveProject(beyond[1].id, { prevId: sibling.id })).status).toBe(200);
    expect((await getProject(beyond[1].id)).parentId).toBe(beyond[0].id);
  });

  it('TREE-3.8: a subtree already taller than the cap allows can’t be moved, even to a shallower place', async () => {
    // M is at depth 3, under P1 and P2, and has a chain of PROJECT_DEPTH_CAP descendants.
    const [, p2] = await chainTo(2);
    const m = await createProject({ name: 'M', parentId: p2.id });
    let parent = m;
    for (let level = 0; level < PROJECT_DEPTH_CAP; level++) {
      const child = await createProject({ name: `D${level}` });
      setProjectParent(child.id, parent.id);
      parent = child;
    }
    const before = await placeOf(m.id);

    // The top level would put its deepest descendant at 1 + PROJECT_DEPTH_CAP, still past it.
    const res = await moveProject(m.id, { parentId: null });
    expect(res.status).toBe(400);
    expect(await placeOf(m.id)).toEqual(before);
  });
});

describe('DELETE /api/projects/:id', () => {
  it('returns 404 for a non-existent id', async () => {
    const res = await request(app).delete('/api/projects/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('deletes a leaf project with no workflow', async () => {
    const project = await createProject();
    const res = await request(app).delete(`/api/projects/${project.id}`);
    expect(res.status).toBe(204);
    const check = await request(app).get(`/api/projects/${project.id}`);
    expect(check.status).toBe(404);
  });

  it('TREE-9.1: deleting a project deletes its whole subtree, and is never refused', async () => {
    // P owns W, with a board, a column and a workphase. Its child C has no
    // workflow, and C's child D owns W2, with the same.
    const p = await projectWithItem('P');
    const c = await createProject({ name: 'C', parentId: p.project.id });
    const d = await projectWithItem('D', { parentId: c.id });
    for (const owner of [p, d]) await createColumn(owner.board.id, owner.workphase.id, owner.workphase.id);
    // An item in each, some with a child of their own.
    const itemC = await createItem({ projectId: c.id, workphaseId: p.workphase.id, title: 'c' });
    const children = [
      await createItem({ projectId: p.project.id, parentId: p.item.id, title: 'p child' }),
      await createItem({ projectId: d.project.id, parentId: d.item.id, title: 'd child' }),
    ];
    // Q, outside the subtree, on a workflow of its own.
    const q = await projectWithItem('Q');
    await createColumn(q.board.id, q.workphase.id, q.workphase.id);
    const readQ = async () => ({
      project: await getProject(q.project.id),
      workflow: (await request(app).get(`/api/workflows/${q.workflow.id}`)).body,
      board: await readBoard(q.board.id),
      item: (await request(app).get(`/api/items/${q.item.id}`)).body,
    });
    const qBefore = await readQ();

    const res = await request(app).delete(`/api/projects/${p.project.id}`);
    expect(res.status).toBe(204);

    for (const project of [p.project, c, d.project]) {
      expect((await request(app).get(`/api/projects/${project.id}`)).status, project.name).toBe(404);
    }
    for (const owner of [p, d]) {
      expect((await request(app).get(`/api/workflows/${owner.workflow.id}`)).status).toBe(404);
      expect((await request(app).get(`/api/boards/${owner.board.id}`)).status).toBe(404);
      expect(db.select().from(columns).where(eq(columns.boardId, owner.board.id)).all()).toHaveLength(0);
      expect(db.select().from(workphases).where(eq(workphases.id, owner.workphase.id)).all()).toHaveLength(0);
    }
    for (const item of [p.item, itemC, d.item, ...children]) {
      expect((await request(app).get(`/api/items/${item.id}`)).status, item.title).toBe(404);
    }

    // Q, its workflow, its board and its item read as they did.
    expect(await readQ()).toEqual(qBefore);
  });

  it('cascades through a nested project tree, workflow, workphase, items, and related records', async () => {
    const parent = await createProject();
    const child = await createProject({ parentId: parent.id });
    const workflow = await createWorkflow(parent.id);
    const workphase = await createWorkphase(workflow.id);
    const item = await createItem({ projectId: parent.id, workphaseId: workphase.id });
    await request(app).post(`/api/items/${item.id}/comments`).send({ content: 'a comment' });

    const [{ id: boardId }] = await boardsOf(workflow.id);
    const column = await createColumn(boardId, workphase.id, workphase.id);

    // Seed directly (these tables have no POST route) to exercise the ON DELETE
    // CASCADE that removes an item's dependent rows when the project's items go.
    const label = { id: randomUUID(), name: 'bug', color: '#f00', createdAt: Date.now() };
    db.insert(labels).values(label).run();
    db.insert(itemLabels).values({ itemId: item.id, labelId: label.id }).run();
    db.insert(attachments)
      .values({
        id: randomUUID(),
        itemId: item.id,
        type: 'local_file',
        label: 'notes.txt',
        createdAt: Date.now(),
      })
      .run();
    db.insert(notifications)
      .values({
        id: randomUUID(),
        itemId: item.id,
        workflowId: workflow.id,
        message: 'hi',
        type: 'item_in_workphase',
        createdAt: Date.now(),
      })
      .run();
    const thread = { id: randomUUID(), itemId: item.id, createdAt: Date.now() };
    db.insert(chatThreads).values(thread).run();
    db.insert(chatMessages)
      .values({
        id: randomUUID(),
        threadId: thread.id,
        role: 'user',
        content: 'hello',
        createdAt: Date.now(),
      })
      .run();

    const res = await request(app).delete(`/api/projects/${parent.id}`);
    expect(res.status).toBe(204);

    expect((await request(app).get(`/api/projects/${parent.id}`)).status).toBe(404);
    expect((await request(app).get(`/api/projects/${child.id}`)).status).toBe(404);
    expect((await request(app).get(`/api/workflows/${workflow.id}`)).status).toBe(404);
    expect((await request(app).get(`/api/items/${item.id}`)).status).toBe(404);

    // Labels are global — they survive project deletion; only the item's own
    // itemLabels join rows are removed.
    expect(db.select().from(labels).where(eq(labels.id, label.id)).all()).toHaveLength(1);
    expect(db.select().from(itemLabels).where(eq(itemLabels.itemId, item.id)).all()).toHaveLength(0);
    expect(db.select().from(attachments).where(eq(attachments.itemId, item.id)).all()).toHaveLength(0);
    expect(db.select().from(notifications).where(eq(notifications.itemId, item.id)).all()).toHaveLength(0);
    expect(db.select().from(chatThreads).where(eq(chatThreads.itemId, item.id)).all()).toHaveLength(0);
    expect(db.select().from(chatMessages).where(eq(chatMessages.threadId, thread.id)).all()).toHaveLength(0);
    expect(db.select().from(boards).where(eq(boards.id, boardId)).all()).toHaveLength(0);
    expect(db.select().from(columns).where(eq(columns.id, column.id)).all()).toHaveLength(0);
  });

  it('TREE-9.2: an item of another project in a deleted workphase survives, with no workphase', async () => {
    // P owns W, with workphase w1. Its child Q uses W, and holds item q in w1.
    // R is on a workflow of its own.
    const p = await projectWithItem('P');
    const q = await createProject({ name: 'Q', parentId: p.project.id });
    const itemQ = await createItem({ projectId: q.id, workphaseId: p.workphase.id, title: 'q' });
    const r = await templatedWorkflow('quick', { name: 'R' });

    // Q moves under R, so q still holds w1.
    expect((await moveProject(q.id, { parentId: r.project.id })).status).toBe(200);
    expect((await request(app).get(`/api/items/${itemQ.id}`)).body.workphaseId).toBe(p.workphase.id);

    expect((await request(app).delete(`/api/projects/${p.project.id}`)).status).toBe(204);

    const survivor = await request(app).get(`/api/items/${itemQ.id}`);
    expect(survivor.status).toBe(200);
    expect(survivor.body.workphaseId).toBeNull();
    const [boardOfR] = await boardsOf(r.workflow.id);
    expect((await readBoard(boardOfR.id)).unsorted.invalidItems.map(i => i.id)).toEqual([itemQ.id]);
    expect(await placeOf(q.id)).toMatchObject({ parentId: r.project.id });
    expect((await request(app).get(`/api/projects/${r.project.id}`)).status).toBe(200);
  });

  it('TREE-9.3: a delete leaves labels, and the workflow a project outside the subtree uses, alone', async () => {
    // T owns WT. Its children are P, which owns W, and S, which has none and
    // uses WT.
    const t = await templatedWorkflow('quick', { name: 'T' });
    const p = await projectWithItem('P', { parentId: t.project.id });
    const s = await createProject({ name: 'S', parentId: t.project.id });
    const itemS = await createItem({ projectId: s.id, workphaseId: t.workphaseIds[0], title: 's' });
    const label = { id: randomUUID(), name: 'shared', color: '#0f0', createdAt: Date.now() };
    db.insert(labels).values(label).run();
    for (const item of [p.item, itemS]) db.insert(itemLabels).values({ itemId: item.id, labelId: label.id }).run();
    const [boardOfT] = await boardsOf(t.workflow.id);
    expect(itemIdsOn(await readBoard(boardOfT.id))).toEqual(new Set([itemS.id]));

    expect((await request(app).delete(`/api/projects/${p.project.id}`)).status).toBe(204);

    expect(db.select().from(labels).where(eq(labels.id, label.id)).all()).toHaveLength(1);
    expect(db.select().from(itemLabels).where(eq(itemLabels.itemId, itemS.id)).all()).toHaveLength(1);
    expect(itemIdsOn(await readBoard(boardOfT.id))).toEqual(new Set([itemS.id]));
  });
});
