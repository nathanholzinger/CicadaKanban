import { describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '../../src/db/index.js';
import { items } from '../../src/db/schema.js';
import {
  ITEM_DEPTH_CAP,
  assertValidReparent,
  assertWithinDepthCap,
  hierarchyDepth,
  subtreeHeight,
  walkItemDescendants,
} from '../../src/lib/itemTree.js';
import { createProject, createItem } from '../fixtures.js';

// Seeds a two-item mutual parentId cycle directly (A.parentId = B,
// B.parentId = A) — bypassing assertValidReparent, which is exactly the
// point: these tests simulate data that's *already* corrupted (a prior bug,
// a migration, direct DB access) to prove the tree-walk functions bound
// themselves instead of trusting the data is acyclic.
async function seedCyclicPair() {
  const project = await createProject();
  const a = await createItem({ projectId: project.id, title: 'A' });
  const b = await createItem({ projectId: project.id, title: 'B' });
  db.update(items).set({ parentId: b.id }).where(eq(items.id, a.id)).run();
  db.update(items).set({ parentId: a.id }).where(eq(items.id, b.id)).run();
  return { a, b };
}

// Every case here would hang forever (not merely time out — a synchronous
// infinite loop blocks the whole process) without the visited-set guard, so
// these are as much a smoke test that the suite itself completes as they
// are assertions.
describe('cycle guards', () => {
  it('assertValidReparent (via isSelfRefDescendant) terminates against a parentId cycle', async () => {
    const { a } = await seedCyclicPair();
    const result = assertValidReparent(items, a.id, 'some-other-id', 'item');
    expect(result).toBeNull();
  });

  it('walkItemDescendants terminates against a parentId cycle, visiting each id once', async () => {
    const { a, b } = await seedCyclicPair();
    const result = walkItemDescendants(a.id, { includeRoot: true });
    expect(new Set(result)).toEqual(new Set([a.id, b.id]));
    expect(result).toHaveLength(2);
  });

  it('hierarchyDepth and subtreeHeight both terminate against a parentId cycle', async () => {
    const { a } = await seedCyclicPair();
    expect(typeof hierarchyDepth(a.id)).toBe('number');
    expect(typeof subtreeHeight(a.id)).toBe('number');
  });
});

// Builds a straight chain root -> ... of `length` items and returns them
// root-first. parentId is written directly rather than through POST so a
// chain taller than the cap can be seeded (POST enforces the cap) —
// these are lib-level tests of the math, not of the write guards.
// Attachment state is irrelevant to depth (hierarchy is the fact, not
// attachment), so a mix is used deliberately.
async function seedChain(projectId: string, length: number) {
  const chain: { id: string }[] = [];
  for (let i = 0; i < length; i++) {
    const item = await createItem({ projectId, title: `L${i + 1}` });
    const parentId = chain[i - 1]?.id;
    if (parentId) {
      db.update(items)
        .set({ parentId, isAttached: i % 2 === 0 ? 1 : 0 })
        .where(eq(items.id, item.id))
        .run();
    }
    chain.push(item);
  }
  return chain;
}

// Every case parameterizes on ITEM_DEPTH_CAP rather than a literal, so the
// value can change without touching these (DRAG-2.10).
describe('depth cap', () => {
  it('ATT-4.6: a root item is at depth 1 and a leaf has height 0', async () => {
    const project = await createProject();
    const root = await createItem({ projectId: project.id, title: 'R' });
    const leaf = await createItem({ projectId: project.id, title: 'L' });
    expect(hierarchyDepth(root.id)).toBe(1);
    expect(subtreeHeight(leaf.id)).toBe(0);
    // 1 + 1 + 0 = 2 <= CAP
    expect(assertWithinDepthCap(root.id, leaf.id)).toBeNull();
  });

  it('subtree height is the deepest resulting leaf, through a detached branch (ATT-4.5)', async () => {
    const project = await createProject();
    const m = await createItem({ projectId: project.id, title: 'M' });
    await createItem({ projectId: project.id, title: 'M1', parentId: m.id, isAttached: true });
    const m2 = await createItem({
      projectId: project.id,
      title: 'M2',
      parentId: m.id,
      isAttached: false,
      workphaseId: null,
    });
    await createItem({ projectId: project.id, title: 'M2a', parentId: m2.id, isAttached: true });
    expect(subtreeHeight(m.id)).toBe(2);
  });

  it('exactly CAP is legal, CAP + 1 is not (ATT-4.4)', async () => {
    const project = await createProject();
    // Target chain of depth D = CAP - 1, and a leaf mover (h = 0):
    // D + 1 + 0 = CAP — legal.
    const targets = await seedChain(project.id, ITEM_DEPTH_CAP - 1);
    const target = targets[targets.length - 1];
    expect(hierarchyDepth(target.id)).toBe(ITEM_DEPTH_CAP - 1);
    const leaf = await createItem({ projectId: project.id, title: 'leaf' });
    expect(assertWithinDepthCap(target.id, leaf.id)).toBeNull();

    // One more level under the mover pushes the deepest leaf to CAP + 1.
    const mover = await createItem({ projectId: project.id, title: 'mover' });
    await createItem({ projectId: project.id, title: 'mover-child', parentId: mover.id });
    expect(assertWithinDepthCap(target.id, mover.id)).toMatch(/exceeds the cap/);

    // ...as does a target one deeper with a leaf mover.
    const deeper = await createItem({ projectId: project.id, title: 'deeper', parentId: target.id });
    expect(assertWithinDepthCap(deeper.id, leaf.id)).toMatch(/exceeds the cap/);
  });

  it('a brand-new item (movingId null) counts as height 0', async () => {
    const project = await createProject();
    const targets = await seedChain(project.id, ITEM_DEPTH_CAP - 1);
    expect(assertWithinDepthCap(targets[targets.length - 1].id, null)).toBeNull();
    const overCap = await createItem({ projectId: project.id, title: 'x', parentId: targets[targets.length - 1].id });
    expect(assertWithinDepthCap(overCap.id, null)).toMatch(/exceeds the cap/);
  });

  it('an already-over-cap subtree is refused for every target, even a root', async () => {
    const project = await createProject();
    // Subtree of height CAP (CAP + 1 items in a chain) — seeded directly,
    // since no write path could have produced it.
    const chain = await seedChain(project.id, ITEM_DEPTH_CAP + 1);
    const mover = chain[0];
    expect(subtreeHeight(mover.id)).toBe(ITEM_DEPTH_CAP);
    const root = await createItem({ projectId: project.id, title: 'root' });
    // 1 + 1 + CAP > CAP — refused with no direction-aware exception.
    expect(assertWithinDepthCap(root.id, mover.id)).toMatch(/exceeds the cap/);
  });
});
