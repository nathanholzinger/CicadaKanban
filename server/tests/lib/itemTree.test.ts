import { describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '../../src/db/index.js';
import { items } from '../../src/db/schema.js';
import { assertValidReparent, walkItemDescendants } from '../../src/lib/itemTree.js';
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

// Regression coverage for audit Finding #11. Every case here would hang
// forever (not merely time out — a synchronous infinite loop blocks the
// whole process) without the visited-set guard, so these are as much a
// smoke test that the suite itself completes as they are assertions.
describe('cycle guards (Finding #11)', () => {
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
});
