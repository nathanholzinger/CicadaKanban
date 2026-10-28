import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { app } from '../../src/index.js';
import { db } from '../../src/db/index.js';
import { boards, columns, items, projects, workflows, workphases } from '../../src/db/schema.js';
import { DEFAULT_DEEP_DB_PATH, resolveDeepDbPath } from '../../src/db/deepDbPath.js';
import { seedDeepData } from '../../src/db/deepSeed.js';
import { ITEM_DEPTH_CAP, PROJECT_DEPTH_CAP } from '../../src/lib/itemTree.js';

describe('resolveDeepDbPath', () => {
  it('defaults to the deep database', () => {
    expect(resolveDeepDbPath(undefined)).toBe(DEFAULT_DEEP_DB_PATH);
    expect(resolveDeepDbPath('')).toBe(DEFAULT_DEEP_DB_PATH);
  });

  it('takes a file named deep….db, wherever it is', () => {
    expect(resolveDeepDbPath('./data/deep.db')).toBe('./data/deep.db');
    expect(resolveDeepDbPath('/tmp/some/dir/deep-wide.db')).toBe('/tmp/some/dir/deep-wide.db');
  });

  it('refuses the dev, test and vitest databases, and any other file', () => {
    for (const refused of [
      './data/kanban.db',
      './data/test.db',
      './data/vitest-test.db',
      './deep/kanban.db',
      './data/deep.sqlite',
      './data/shallow.db',
      './data/',
    ]) {
      expect(() => resolveDeepDbPath(refused), refused).toThrow(/deep….db/);
    }
  });
});

describe('seedDeepData', () => {
  // The seed writes rows directly, so no cap holds it. Depths here count a root as 1, where the
  // summary counts it from 0, and an item's from its Free ancestor.
  it('seeds a project chain to the project cap and item chains one level past the item cap', () => {
    const summary = seedDeepData();
    expect(summary.deepestProjectDepth + 1).toBeGreaterThanOrEqual(PROJECT_DEPTH_CAP);
    expect(summary.deepestItemDepth + 1).toBeGreaterThanOrEqual(ITEM_DEPTH_CAP + 1);

    const all = db.select().from(projects).all();
    const depthOf = (id: string | null): number => {
      const project = all.find(p => p.id === id);
      return project ? 1 + depthOf(project.parentId) : 0;
    };
    expect(Math.max(...all.map(p => depthOf(p.id)))).toBe(summary.deepestProjectDepth + 1);
  });

  it('seeds rows as the API would write them: attached items follow their Card, Free ones are ordered across the workflow', () => {
    const { rootProjectId } = seedDeepData();
    const rows = db.select().from(items).all();
    const byId = new Map(rows.map(i => [i.id, i]));
    expect(rows.length).toBeGreaterThan(0);

    for (const item of rows) {
      expect(item.projectId, item.title).toBe(rootProjectId);
      expect(item.position, item.title).not.toBeNull();
      if (item.isAttached === 1) {
        const parent = byId.get(item.parentId!);
        expect(parent, item.title).toBeDefined();
        expect(item.workphaseId, item.title).toBe(parent!.workphaseId);
      } else {
        expect(item.workphaseId, item.title).not.toBeNull();
      }
    }

    // Free items (Cards and Free children) are ordered across every workphase of the workflow, so
    // no two share a position, whichever workphase each is in (wiki item-positioning §2).
    const free = rows.filter(i => i.isAttached === 0);
    const positions = free.map(i => i.position);
    expect(new Set(positions).size).toBe(positions.length);
    expect(new Set(free.map(i => i.workphaseId)).size).toBeGreaterThan(1);
    expect(free.some(i => i.parentId !== null)).toBe(true);
  });

  it('gives the root project a workflow with a board that has a column per workphase', () => {
    const { rootProjectId } = seedDeepData();
    const workflow = db.select().from(workflows).where(eq(workflows.projectId, rootProjectId)).get();
    expect(workflow).toBeDefined();
    const phases = db.select().from(workphases).where(eq(workphases.workflowId, workflow!.id)).all();
    const board = db.select().from(boards).where(eq(boards.workflowId, workflow!.id)).get();
    expect(phases.length).toBeGreaterThan(0);
    // The workphases are the "flow" template's, flags included.
    expect(phases.filter(p => p.isTerminal === 1).map(p => p.name)).toEqual(['Done']);
    expect(phases.find(p => p.name === 'Review')?.triggersNotification).toBe(1);
    expect(board).toBeDefined();
    expect(db.select().from(columns).where(eq(columns.boardId, board!.id)).all()).toHaveLength(phases.length);
  });

  it('is read by the app as it reads any data, the deepest item and project included', async () => {
    const summary = seedDeepData();
    const listed = await request(app).get('/api/workflows');
    expect(listed.status).toBe(200);
    const workflow = listed.body.find((w: { projectId: string }) => w.projectId === summary.rootProjectId);

    const detail = await request(app).get(`/api/workflows/${workflow.id}`);
    expect(detail.status).toBe(200);
    expect(Math.max(...detail.body.items.map((i: { depth: number }) => i.depth))).toBe(summary.deepestItemDepth);

    const projectsRes = await request(app).get('/api/projects');
    expect(projectsRes.status).toBe(200);
    const listedProjects = projectsRes.body as Array<{ id: string; parentId: string | null }>;
    const depthOf = (id: string | null): number => {
      const project = listedProjects.find(p => p.id === id);
      return project ? 1 + depthOf(project.parentId) : 0;
    };
    expect(Math.max(...listedProjects.map(p => depthOf(p.id)))).toBe(summary.deepestProjectDepth + 1);
  });
});
