import { describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '../../src/db/index.js';
import { items } from '../../src/db/schema.js';
import {
  coarsestFit,
  reindexScope,
  resolveAnchorPosition,
  resolveAppendPosition,
  classifyPositionScope,
} from '../../src/lib/positionResolver.js';
import { createProject, createWorkflow, createWorkphase, createItem } from '../fixtures.js';

function setPosition(id: string, position: number | null) {
  db.update(items).set({ position }).where(eq(items.id, id)).run();
}

function getPosition(id: string): number | null {
  return db.select({ position: items.position }).from(items).where(eq(items.id, id)).get()!.position;
}

async function seedPhaseWithItems(count: number) {
  const project = await createProject();
  const workflow = await createWorkflow(project.id);
  const phase = await createWorkphase(workflow.id);
  const created = [];
  for (let i = 0; i < count; i++) {
    created.push(await createItem({ projectId: project.id, workphaseId: phase.id, title: `Item ${i}` }));
  }
  return { project, workflow, phase, items: created };
}

describe('coarsestFit', () => {
  it('takes the exact midpoint when it already fits at 0 decimals', () => {
    expect(coarsestFit(1, 3)).toBe(2);
  });

  it('rounds to the coarsest precision that still fits strictly between the neighbors', () => {
    expect(coarsestFit(1.5, 2.0)).toBe(1.8);
    expect(coarsestFit(1.5, 1.8)).toBe(1.7);
  });

  it('falls to deeper precision once the gap no longer has room at 1 decimal', () => {
    expect(coarsestFit(1.8, 1.9)).toBe(1.85);
  });

  it('self-corrects when a rounded candidate would collide with a boundary', () => {
    expect(coarsestFit(1.0, 1.1)).toBe(1.05);
    expect(coarsestFit(2.899, 2.9)).toBe(2.8995);
  });

  it('can return a value that is coarser than its inputs', () => {
    expect(coarsestFit(4.87, 6.00456)).toBe(5);
  });

  it('returns null once the gap is exhausted even at max precision', () => {
    expect(coarsestFit(1.0, 1.0 + 1e-13)).toBeNull();
  });
});

describe('reindexScope', () => {
  it('reassigns clean sequential positions while preserving relative order', async () => {
    const { phase, items: created } = await seedPhaseWithItems(4);
    setPosition(created[0].id, 5.001);
    setPosition(created[1].id, 5.002);
    setPosition(created[2].id, 5.003);
    setPosition(created[3].id, 5.0);

    reindexScope(eq(items.workphaseId, phase.id));

    expect(getPosition(created[0].id)).toBe(2);
    expect(getPosition(created[1].id)).toBe(3);
    expect(getPosition(created[2].id)).toBe(4);
    expect(getPosition(created[3].id)).toBe(1);
  });

  it('breaks exact ties by createdAt, oldest first', async () => {
    const { phase, items: created } = await seedPhaseWithItems(2);
    setPosition(created[0].id, 1.0);
    setPosition(created[1].id, 1.0);

    reindexScope(eq(items.workphaseId, phase.id));

    expect(getPosition(created[0].id)).toBe(1);
    expect(getPosition(created[1].id)).toBe(2);
  });
});

describe('resolveAnchorPosition', () => {
  it('coarsest-fits between the anchor and its true next neighbor', async () => {
    const { phase, items: created } = await seedPhaseWithItems(2);
    setPosition(created[0].id, 1.5);
    setPosition(created[1].id, 2.0);

    const result = resolveAnchorPosition(created[0].id, 'after', eq(items.workphaseId, phase.id));
    expect(result).toBe(1.8);
  });

  it('finds the true neighbor even when it is not the literal next row created', async () => {
    // Regression for the narrow-view leapfrog bug: the true bounding
    // neighbor must be found by querying real data, not assumed from
    // creation order or a caller-supplied guess.
    const { phase, items: created } = await seedPhaseWithItems(3);
    setPosition(created[0].id, 1.0);
    setPosition(created[1].id, 2.8);
    setPosition(created[2].id, 3.0);

    // Anchor to item C (created[2]) with side 'before' — the true previous
    // neighbor is item B (2.8), not item A (1.0).
    const result = resolveAnchorPosition(created[2].id, 'before', eq(items.workphaseId, phase.id));
    expect(result).toBeGreaterThan(2.8);
    expect(result).toBeLessThan(3.0);
  });

  it('appends past the anchor when it is the true last item', async () => {
    const { phase, items: created } = await seedPhaseWithItems(1);
    setPosition(created[0].id, 5.3);

    const result = resolveAnchorPosition(created[0].id, 'after', eq(items.workphaseId, phase.id));
    expect(result).toBe(6);
  });

  it('coarsest fit between the anchor and 0.0 when it is the before the first item (thus becomeing the new first item)', async () => {
    const { phase, items: created } = await seedPhaseWithItems(1);
    setPosition(created[0].id, 5.3);

    const result = resolveAnchorPosition(created[0].id, 'before', eq(items.workphaseId, phase.id));
    expect(result).toBe(3);
  });

  it('reindexes the scope and retries when the gap is too tight for any precision', async () => {
    const { phase, items: created } = await seedPhaseWithItems(2);
    setPosition(created[0].id, 1.0);
    setPosition(created[1].id, 1.0 + 1e-13); // unresolvable gap at any decimal depth

    const result = resolveAnchorPosition(created[0].id, 'after', eq(items.workphaseId, phase.id));

    // The scope was reindexed to clean sequential integers first (order
    // preserved: created[0] was still numerically first).
    expect(getPosition(created[0].id)).toBe(1);
    expect(getPosition(created[1].id)).toBe(2);
    // With that done, "after created[0]" now has a real bounding neighbor
    // again (created[1] at 2), so the retry resolves a normal coarsest-fit
    // insert between them rather than an append.
    expect(result).toBe(1.5);
  });

  it('throws for an anchor with no position (a done item, per Part 6)', async () => {
    const { items: created } = await seedPhaseWithItems(1);
    setPosition(created[0].id, null);

    expect(() => resolveAnchorPosition(created[0].id, 'after', eq(items.workphaseId, 'anything'))).toThrow();
  });
});

describe('resolveAppendPosition', () => {
  it('returns 1.0 for a genuinely empty scope', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const phase = await createWorkphase(workflow.id);

    const result = resolveAppendPosition(eq(items.workphaseId, phase.id));
    expect(result).toBe(1.0);
  });

  it('appends past the true last item in a non-empty scope', async () => {
    const { phase, items: created } = await seedPhaseWithItems(1);
    setPosition(created[0].id, 7.2);

    const result = resolveAppendPosition(eq(items.workphaseId, phase.id));
    expect(result).toBe(8);
  });

  it('reindexes before appending once the magnitude threshold is crossed', async () => {
    const { phase, items: created } = await seedPhaseWithItems(1);
    // Scope has 1 item, so the threshold is max(1000, 1 + 100) = 1000.
    setPosition(created[0].id, 1200);

    const result = resolveAppendPosition(eq(items.workphaseId, phase.id));
    // After the reindex, the sole item becomes position 1, so the append
    // resolves to a small number again instead of continuing from 1200.
    expect(result).toBeLessThan(10);
  });

  it('does not reindex when a large position is proportionate to a large item count', async () => {
    const { project, phase, items: created } = await seedPhaseWithItems(3);
    setPosition(created[0].id, 1);
    setPosition(created[1].id, 2);

    // Bulk-insert filler items sharing the same project/workphase so the
    // scope genuinely holds ~1050 items — threshold becomes
    // max(1000, 1050 + 100) = 1150.
    const now = Date.now();
    const filler = Array.from({ length: 1047 }, (_, i) => ({
      id: `filler-${i}`,
      projectId: project.id,
      workphaseId: phase.id,
      title: `Filler ${i}`,
      position: i + 3,
      isAttached: 0,
      createdAt: now,
      updatedAt: now,
    }));
    db.insert(items).values(filler).run();
    setPosition(created[2].id, 1100); // proportionate: 1100 < 1150

    const beforeA = getPosition(created[0].id);
    const beforeB = getPosition(created[1].id);
    const result = resolveAppendPosition(eq(items.workphaseId, phase.id));

    // No reindex fired: earlier items are untouched, and the result is a
    // plain append-past-the-anchor value, not a small reindexed one.
    expect(getPosition(created[0].id)).toBe(beforeA);
    expect(getPosition(created[1].id)).toBe(beforeB);
    expect(result).toBe(1101);
  });
});

describe('classifyPositionScope', () => {
  it('classifies an attached child with a parent as attached-siblings', () => {
    expect(classifyPositionScope({ isAttached: true, parentId: 'p1', workphaseId: 'w1' }, false)).toBe('attached-siblings');
  });

  it('classifies an attached child as attached-siblings even under a terminal cascade (TC-6.6)', () => {
    // The attached-siblings branch precedes the terminal check in source
    // order, so an attached child never falls into 'none' just because its
    // (cascaded) workphase turned terminal — its scope stays (parentId,
    // isAttached), per Part 6's "attached children keep their position"
    // exception.
    expect(classifyPositionScope({ isAttached: true, parentId: 'p1', workphaseId: 'w1' }, true)).toBe('attached-siblings');
  });

  it('classifies a null-workphase item as none (unsorted, not currently ordered)', () => {
    expect(classifyPositionScope({ isAttached: false, parentId: null, workphaseId: null }, null)).toBe('none');
  });

  it('classifies a detached/root item in a terminal workphase as none (done, ordered by completedAt)', () => {
    expect(classifyPositionScope({ isAttached: false, parentId: null, workphaseId: 'w1' }, true)).toBe('none');
  });

  it('classifies a detached/root item in a non-terminal workphase as workflow', () => {
    expect(classifyPositionScope({ isAttached: false, parentId: null, workphaseId: 'w1' }, false)).toBe('workflow');
  });

  it('classifies an attached-but-parentless item as workflow, not attached-siblings', () => {
    expect(classifyPositionScope({ isAttached: true, parentId: null, workphaseId: 'w1' }, false)).toBe('workflow');
  });
});
