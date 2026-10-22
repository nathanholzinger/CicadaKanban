import { describe, it, expect } from 'vitest';
import { effectiveWorkflowIdForProject } from '../../src/lib/workflowItems.js';
import { createProject, createWorkflow, setProjectParent } from '../fixtures.js';

describe('effectiveWorkflowIdForProject', () => {
  it('returns the workflow a project owns directly', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    expect(effectiveWorkflowIdForProject(project.id)).toBe(workflow.id);
  });

  it('inherits from the nearest ancestor that owns one, stopping at an intermediate owner', async () => {
    const root = await createProject({ name: 'root' });
    const rootWorkflow = await createWorkflow(root.id);
    const mid = await createProject({ name: 'mid', parentId: root.id });
    const leafUnderMid = await createProject({ name: 'leaf', parentId: mid.id });
    expect(effectiveWorkflowIdForProject(leafUnderMid.id)).toBe(rootWorkflow.id);

    // Once `mid` owns its own workflow, its subtree resolves to that one.
    const midWorkflow = await createWorkflow(mid.id);
    expect(effectiveWorkflowIdForProject(leafUnderMid.id)).toBe(midWorkflow.id);
    expect(effectiveWorkflowIdForProject(mid.id)).toBe(midWorkflow.id);
    expect(effectiveWorkflowIdForProject(root.id)).toBe(rootWorkflow.id);
  });

  it('returns null when no project up the chain owns a workflow', async () => {
    const root = await createProject({ name: 'root' });
    const child = await createProject({ name: 'child', parentId: root.id });
    expect(effectiveWorkflowIdForProject(child.id)).toBeNull();
  });

  it('terminates against a parentId cycle in the projects table', async () => {
    const a = await createProject({ name: 'A' });
    const b = await createProject({ name: 'B', parentId: a.id });
    setProjectParent(a.id, b.id);
    expect(effectiveWorkflowIdForProject(a.id)).toBeNull();
  });
});
