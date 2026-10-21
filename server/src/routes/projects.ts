import { Router } from 'express';
import { db, type Tx } from '../db/index.js';
import { projects, workflows } from '../db/schema.js';
import { eq, asc, isNull, and, not, type SQL } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getByIdOrNotFound } from '../lib/getOrNotFound.js';
import { parentRefusal, PROJECT_DEPTH_CAP } from '../lib/itemTree.js';
import { deleteProjectById } from '../lib/projectCascade.js';
import {
  anchorRefusal,
  resolveAppendPosition,
  resolvePositionByAnchorAndSide,
  withReindexDisclosure,
  type AnchorRefusal,
  type ReindexedPosition,
} from '../lib/positionResolver.js';

const router = Router();

// A project's position-comparison scope: its siblings — same parentId, or
// every root project when parentId is null (wiki project-tree §4). Simpler than
// `itemPositionScope.ts::positionScopeFor` since projects have no
// attach/workphase dimension, just one flat "children of X" bucket per parent.
function projectPositionScope(parentId: string | null, excludeId?: string): SQL {
  const base: SQL = parentId ? eq(projects.parentId, parentId) : isNull(projects.parentId);
  return excludeId ? and(base, not(eq(projects.id, excludeId)))! : base;
}

// A project's name is a string with something in it: no name, an empty one or
// one of only spaces is no name (wiki project-tree §8).
function isValidName(name: unknown): name is string {
  return typeof name === 'string' && name.trim() !== '';
}

// Why `parentId` is no legal parent for the project, or null when it is: the
// shape, then the rules items follow too, over the project cap (wiki project-tree §3).
// `moving` is the project being given the parent, or null for a create.
function parentError(moving: { id: string; parentId: string | null } | null, parentId: string | null): string | null {
  if (parentId !== null && typeof parentId !== 'string') return 'parentId must be a string or null';
  return parentRefusal('project', moving, parentId);
}

// The position a write gives a project in the sibling group it ends with: after
// the sibling `prevId` names, before the one `nextId` names, or, naming none,
// after the group's true last, never trusting that the group is empty. One
// resolution for a create, a move and an edit that changes the parent, so they
// can't disagree (wiki project-tree §7, wiki positioning §4). Siblings a reindex
// renumbers are pushed to `reindexed`.
function resolveProjectPosition(
  tx: Tx,
  projectId: string | null,
  parentId: string | null,
  neighbor: { prevId?: string | null; nextId?: string | null },
  reindexed: ReindexedPosition[],
): number {
  const scope = projectPositionScope(parentId, projectId ?? undefined);
  if (neighbor.prevId) return resolvePositionByAnchorAndSide(projects, scope, tx, 'after', neighbor.prevId, reindexed);
  if (neighbor.nextId) return resolvePositionByAnchorAndSide(projects, scope, tx, 'before', neighbor.nextId, reindexed);
  return resolveAppendPosition(projects, scope, tx, reindexed);
}

// A write's response: the fresh project, with the reindex it triggered when one fired
// (wiki positioning §7).
function projectResponse(id: string, reindexed: ReindexedPosition[]) {
  const project = db.select().from(projects).where(eq(projects.id, id)).get()!;
  return withReindexDisclosure(project, reindexed);
}

// The 400's message for each way the neighbor a move names can fail, given the field that
// carried it.
const ANCHOR_ERRORS: Record<AnchorRefusal, (field: string) => string> = {
  self: field => `${field} names the project itself: name a sibling to place it next to`,
  missing: field => `${field} does not reference an existing project`,
  'outside-scope': field => `${field} is not a sibling in the target scope`,
  'no-position': field => `${field} has no position to anchor against`,
};

// Lists projects by position, then createdAt. SQLite sorts a missing position
// first, the same order as counting it as 0 (wiki project-tree §4).
router.get('/', (_req, res) => {
  const allProjects = db.select().from(projects).orderBy(asc(projects.position), asc(projects.createdAt)).all();
  res.json(allProjects);
});

// The depth cap the sidebar offers tab states against, so the UI and the API
// enforce one value (wiki hierarchy-placement §6).
router.get('/depth-cap', (_req, res) => {
  res.json({ projectDepthCap: PROJECT_DEPTH_CAP });
});

// Get a single project with its workflows
router.get('/:id', (req, res) => {
  const project = getByIdOrNotFound(projects, req.params.id, res, 'Project not found');
  if (!project) return;
  const projectWorkflows = db.select().from(workflows).where(eq(workflows.projectId, req.params.id)).all();
  res.json({ ...project, workflows: projectWorkflows });
});

// Create a project, top-level or under `parentId`, after its siblings' true last
// (wiki project-tree §5).
router.post('/', (req, res) => {
  const { name, description, parentId } = req.body;
  // A project always has a name (wiki project-tree §8).
  if (!isValidName(name)) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  const resolvedParentId = parentId || null;
  const createError = parentError(null, resolvedParentId);
  if (createError) {
    res.status(400).json({ error: createError });
    return;
  }
  const now = Date.now();
  const id = randomUUID();
  const reindexed: ReindexedPosition[] = [];

  // Wrapped in a transaction: resolving the position can trigger a reindex of
  // the whole scope, which writes one row at a time — without an enclosing
  // transaction each of those writes would auto-commit individually.
  db.transaction(tx => {
    const position = resolveProjectPosition(tx, null, resolvedParentId, {}, reindexed);
    tx.insert(projects)
      .values({
        id,
        parentId: resolvedParentId,
        name,
        description: description || null,
        position,
        createdAt: now,
        updatedAt: now,
      })
      .run();
  });

  res.status(201).json(projectResponse(id, reindexed));
});

// Update a project, its parent included (wiki project-tree §7). An edit that
// changes the parent gives the project a position after its new siblings' true
// last; one that keeps the parent keeps the position. A body's `position` is
// never read.
router.put('/:id', (req, res) => {
  const project = getByIdOrNotFound(projects, req.params.id, res, 'Project not found');
  if (!project) return;

  const { name, description } = req.body;
  // An edit that leaves the name out keeps it; naming one that isn't a name is
  // refused (wiki project-tree §8).
  if (name !== undefined && !isValidName(name)) {
    res.status(400).json({ error: 'name cannot be empty' });
    return;
  }

  const parentId: string | null = 'parentId' in req.body ? (req.body.parentId ?? null) : project.parentId;
  const parentChanged = parentId !== project.parentId;
  const editError = 'parentId' in req.body ? parentError(project, parentId) : null;
  if (editError) {
    res.status(400).json({ error: editError });
    return;
  }

  const reindexed: ReindexedPosition[] = [];
  db.transaction(tx => {
    const position = parentChanged ? resolveProjectPosition(tx, project.id, parentId, {}, reindexed) : project.position;
    tx.update(projects)
      .set({
        name: name ?? project.name,
        description: description !== undefined ? description : project.description,
        parentId,
        position,
        updatedAt: Date.now(),
      })
      .where(eq(projects.id, req.params.id))
      .run();
  });
  res.json(projectResponse(req.params.id, reindexed));
});

// Move/reorder a project — reposition among siblings and/or reparent, in
// one atomic step (wiki project-tree §6). One project per request, not a batch: a batch's
// per-entry cycle check would run against pre-transaction DB state, so a
// same-request A<->B parent swap could commit a cycle undetected. With a
// single-item endpoint there's no second entry in the same request to
// collude with.
//
// Body: { parentId?, prevId?, nextId? }. `prevId`/`nextId` name the
// project's resulting *predecessor*/*successor* — the project that should
// end up immediately before/after the moved project (not "the project I go
// before/after," which reads ambiguously either direction; prevId/nextId
// describes a position in the sequence). When both are named, `prevId` is
// the neighbor: it alone is checked and used, and `nextId` is ignored. Both
// omitted/null means "no positioning info, append to the true end of the
// resulting scope," never "trust me, the scope is empty": the server always
// re-derives the true current children, since a caller's view of them can be
// stale or narrower than the real group.
router.patch('/:id/move', (req, res) => {
  const project = getByIdOrNotFound(projects, req.params.id, res, 'Project not found');
  if (!project) return;

  const { parentId, prevId, nextId, position } = req.body;

  // A move names a neighbor, never a number (wiki positioning §2).
  if (position !== undefined) {
    res.status(400).json({ error: 'position is not accepted: name a prevId or nextId to place the project instead' });
    return;
  }
  if (parentId !== undefined && parentId !== null && typeof parentId !== 'string') {
    res.status(400).json({ error: 'parentId must be a string or null' });
    return;
  }
  if (prevId !== undefined && prevId !== null && typeof prevId !== 'string') {
    res.status(400).json({ error: 'prevId must be a string or null' });
    return;
  }
  if (nextId !== undefined && nextId !== null && typeof nextId !== 'string') {
    res.status(400).json({ error: 'nextId must be a string or null' });
    return;
  }

  const targetParentId: string | null = 'parentId' in req.body ? (parentId ?? null) : project.parentId;

  const moveError = parentError(project, targetParentId);
  if (moveError) {
    res.status(400).json({ error: moveError });
    return;
  }

  // Checks the neighbor the move names is a real, current sibling in the *resulting*
  // group before its position is trusted for the midpoint math: a stale or false claim is
  // refused rather than silently falling back (wiki positioning §2). Checked here, against
  // plain `db`, before the transaction below opens. Nothing is written before it, so what's
  // checked can't change between this check and the writes that use it, the move's own and
  // a reindex's. Keeping every bail-out outside the transaction matters too: a
  // db.transaction callback in better-sqlite3 only rolls back on throw, so a bail-out
  // inside it, after some other write had already run, would still commit that write.
  const neighbor = prevId ? { id: prevId, field: 'prevId' } : nextId ? { id: nextId, field: 'nextId' } : null;
  if (neighbor) {
    const refusal = anchorRefusal(projects, projectPositionScope(targetParentId, project.id), neighbor.id, project.id);
    if (refusal) {
      res.status(400).json({ error: ANCHOR_ERRORS[refusal](neighbor.field) });
      return;
    }
  }

  const reindexed: ReindexedPosition[] = [];
  db.transaction(tx => {
    tx.update(projects)
      .set({
        parentId: targetParentId,
        position: resolveProjectPosition(tx, project.id, targetParentId, { prevId, nextId }, reindexed),
        updatedAt: Date.now(),
      })
      .where(eq(projects.id, req.params.id))
      .run();
  });

  res.json(projectResponse(req.params.id, reindexed));
});

// Delete a project — recursively cascades through descendants → workflows → workphases → items
router.delete('/:id', (req, res) => {
  const project = getByIdOrNotFound(projects, req.params.id, res, 'Project not found');
  if (!project) return;

  try {
    db.transaction(tx => deleteProjectById(req.params.id, tx));
    res.status(204).send();
  } catch (err) {
    console.error('Failed to delete project:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
