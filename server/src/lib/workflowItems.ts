import { db, type Tx } from '../db/index.js';
import { items, projects, workflows } from '../db/schema.js';
import { eq } from 'drizzle-orm';

type Workphase = { id: string };
type ItemRow = typeof items.$inferSelect;

// Shared by workflows.ts GET /:id — "every item sitting in one of this
// workflow's workphases," which SQLite has no direct index for (items.workphaseId
// isn't workflow-scoped), so this is a full table scan filtered in JS. Fine at
// this app's single-user data volumes. NOTE: this drops items whose workphase is
// null or outside the workflow — use getBoardScopeItems for the board read path,
// which must surface those as "Unknown status".
export function getWorkflowItems(workflowWorkphases: Workphase[]): ItemRow[] {
  const workphaseIds = new Set(workflowWorkphases.map(w => w.id));
  const allItems = db.select().from(items).all();
  return allItems.filter(i => i.workphaseId && workphaseIds.has(i.workphaseId));
}

// The project ids whose EFFECTIVE workflow is `workflowId`: the workflow's own
// project plus descendant projects that inherit it (i.e. no project between them
// and the owner has its own workflow). Mirrors the client's App.tsx inheritance
// resolution, on the server so the board read path can scope by project.
function getProjectsUsingWorkflow(workflowId: string): Set<string> {
  const workflow = db.select({ projectId: workflows.projectId }).from(workflows).where(eq(workflows.id, workflowId)).get();
  const ownerProjectId = workflow?.projectId ?? null;
  const result = new Set<string>();
  if (!ownerProjectId) return result;

  const allProjects = db.select({ id: projects.id, parentId: projects.parentId }).from(projects).all();
  const childrenByParent = new Map<string, string[]>();
  for (const p of allProjects) {
    if (!p.parentId) continue;
    const list = childrenByParent.get(p.parentId) ?? [];
    list.push(p.id);
    childrenByParent.set(p.parentId, list);
  }
  // A project that owns any workflow of its own breaks inheritance for its subtree.
  const ownsWorkflow = new Set(
    db.select({ projectId: workflows.projectId }).from(workflows).all()
      .map(w => w.projectId)
      .filter((id): id is string => id !== null),
  );

  result.add(ownerProjectId);
  const queue = [ownerProjectId];
  while (queue.length > 0) {
    const parentId = queue.shift()!;
    for (const childId of childrenByParent.get(parentId) ?? []) {
      if (ownsWorkflow.has(childId)) continue; // child uses its own workflow
      if (!result.has(childId)) {
        result.add(childId);
        queue.push(childId);
      }
    }
  }
  return result;
}

// The inverse of getProjectsUsingWorkflow, for one project: the workflow it
// owns, or the nearest ancestor project's. Null if no project up the chain
// owns one. Cycle-guarded like every other parentId walk (audit Finding
// #11). Epic 3.5: lets a cross-project reparent tell whether a subtree
// item's workphase is foreign to its new project (wiki item-positioning
// §7.3), which is what decides whether that item's position is nulled.
export function effectiveWorkflowIdForProject(projectId: string, tx?: Tx): string | null {
  const e = tx ?? db;
  const visited = new Set<string>();
  let current: string | null = projectId;
  while (current && !visited.has(current)) {
    visited.add(current);
    const owned = e.select({ id: workflows.id }).from(workflows).where(eq(workflows.projectId, current)).get();
    if (owned) return owned.id;
    const project = e.select({ parentId: projects.parentId }).from(projects).where(eq(projects.id, current)).get();
    current = project?.parentId ?? null;
  }
  return null;
}

// Every item belonging to the projects whose effective workflow is this one —
// including items whose workphaseId is null or points outside the workflow.
// Those surface as "Unknown status" in the board's unsorted bucket; without this
// project scoping they'd be silently dropped, since a SET-NULL'd item has no link
// back to the workflow once its workphase is gone.
export function getBoardScopeItems(workflowId: string): ItemRow[] {
  const projectIds = getProjectsUsingWorkflow(workflowId);
  if (projectIds.size === 0) return [];
  const allItems = db.select().from(items).all();
  return allItems.filter(i => i.projectId !== null && projectIds.has(i.projectId));
}
