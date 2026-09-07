import { describe, it, expect } from 'vitest';
import { eq, isNull } from 'drizzle-orm';
import { db } from '../../src/db/index.js';
import { items, projects } from '../../src/db/schema.js';
import {
  resolvePositionByAnchorAndSide,
  resolveAppendPosition,
} from '../../src/lib/positionResolver.js';
import { coarsestFit } from '../../src/lib/coarsestFit.js';
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

function setProjectPosition(id: string, position: number | null) {
  db.update(projects).set({ position }).where(eq(projects.id, id)).run();
}

function getProjectPosition(id: string): number | null {
  return db.select({ position: projects.position }).from(projects).where(eq(projects.id, id)).get()!.position;
}

async function seedRootProjects(count: number) {
  const created = [];
  for (let i = 0; i < count; i++) {
    created.push(await createProject({ name: `Project ${i}` }));
  }
  return created;
}

// Root-scope predicate for these tests — same shape as projects.ts's
// projectPositionScope(null), duplicated here (not imported) since it's a
// one-line route-owned helper, not part of the lib's public surface.
const rootScope = isNull(projects.parentId);

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
  it('breaks exact ties by createdAt, oldest first', async () => {
    const { phase, items: created } = await seedPhaseWithItems(4);
    setPosition(created[0].id, 5.0);
    setPosition(created[1].id, 1.0 + 1e-13);
    setPosition(created[2].id, 1.0);
    setPosition(created[3].id, 5.0);

    db.transaction((tx) =>
      resolvePositionByAnchorAndSide(items, eq(items.workphaseId, phase.id), tx, 'after', created[2].id)
    );

    expect(getPosition(created[2].id)).toBe(1);
    expect(getPosition(created[1].id)).toBe(2);
    expect(getPosition(created[0].id)).toBe(3);
    expect(getPosition(created[3].id)).toBe(4);
  });
});

describe('resolveAnchorPosition', () => {
  it('coarsest-fits between the anchor and its true next neighbor', async () => {
    const { phase, items: created } = await seedPhaseWithItems(2);
    setPosition(created[0].id, 1.5);
    setPosition(created[1].id, 2.0);

    const result = db.transaction((tx) =>
      resolvePositionByAnchorAndSide(items, eq(items.workphaseId, phase.id), tx, 'after', created[0].id)
    );
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
    const result = db.transaction((tx) =>
      resolvePositionByAnchorAndSide(items, eq(items.workphaseId, phase.id), tx, 'before', created[2].id)
    );
    expect(result).toBeGreaterThan(2.8);
    expect(result).toBeLessThan(3.0);
  });

  it('appends past the anchor when it is the true last item', async () => {
    const { phase, items: created } = await seedPhaseWithItems(1);
    setPosition(created[0].id, 5.3);

    const result = db.transaction((tx) =>
      resolvePositionByAnchorAndSide(items, eq(items.workphaseId, phase.id), tx, 'after', created[0].id)
    );
    expect(result).toBe(6);
  });

  it('coarsest fit between the anchor and 0.0 when it is the before the first item (thus becomeing the new first item)', async () => {
    const { phase, items: created } = await seedPhaseWithItems(1);
    setPosition(created[0].id, 5.3);

    const result = db.transaction((tx) =>
      resolvePositionByAnchorAndSide(items, eq(items.workphaseId, phase.id), tx, 'before', created[0].id)
    );
    expect(result).toBe(3);
  });

  it('reindexes the scope and retries when the gap is too tight for any precision', async () => {
    const { phase, items: created } = await seedPhaseWithItems(2);
    setPosition(created[0].id, 1.0);
    setPosition(created[1].id, 1.0 + 1e-13); // unresolvable gap at any decimal depth

    const result = db.transaction((tx) =>
      resolvePositionByAnchorAndSide(items, eq(items.workphaseId, phase.id), tx, 'after', created[0].id)
    );

    // The scope was reindexed to clean sequential integers first (order
    // preserved: created[0] was still numerically first).
    expect(getPosition(created[0].id)).toBe(1);
    expect(getPosition(created[1].id)).toBe(2);
    // With that done, "after created[0]" now has a real bounding neighbor
    // again (created[1] at 2), so the retry resolves a normal coarsest-fit
    // insert between them rather than an append.
    expect(result).toBe(1.5);
  });

  it('throws for an anchor with no position (a done item, per Part 6) (TC-2.8)', async () => {
    const { items: created } = await seedPhaseWithItems(1);
    setPosition(created[0].id, null);

    expect(() =>
      db.transaction((tx) => resolvePositionByAnchorAndSide(items, eq(items.workphaseId, 'anything'), tx, 'after', created[0].id))
    ).toThrow();
  });

  it('appends as last when no anchorId is given, side "after"', async () => {
    const { phase, items: created } = await seedPhaseWithItems(1);
    setPosition(created[0].id, 5.3);

    const result = db.transaction((tx) =>
      resolvePositionByAnchorAndSide(items, eq(items.workphaseId, phase.id), tx, 'after')
    );
    expect(result).toBe(6);
  });

  it('prepends as first when no anchorId is given, side "before"', async () => {
    const { phase, items: created } = await seedPhaseWithItems(1);
    setPosition(created[0].id, 5.3);

    const result = db.transaction((tx) =>
      resolvePositionByAnchorAndSide(items, eq(items.workphaseId, phase.id), tx, 'before')
    );
    expect(result).toBe(3);
  });

  it('returns 1.0 when no anchorId is given, side "before", on a genuinely empty scope', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const phase = await createWorkphase(workflow.id);

    const result = db.transaction((tx) =>
      resolvePositionByAnchorAndSide(items, eq(items.workphaseId, phase.id), tx, 'before')
    );
    expect(result).toBe(1.0);
  });
});

describe('resolveAppendPosition', () => {
  it('returns 1.0 for a genuinely empty scope', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const phase = await createWorkphase(workflow.id);

    const result = db.transaction((tx) => 
      resolveAppendPosition(items, eq(items.workphaseId, phase.id), tx)
    );
    expect(result).toBe(1.0);
  });

  it('treats a scope holding only null-positioned rows the same as a genuinely empty one (regression: getLastPositionInScope missed an isNotNull guard)', async () => {
    // A scope isn't only ever empty or fully-positioned — a done item keeps
    // its row (null position, real completedAt instead, per Part 6) inside
    // the same workflow-wide scope active items compare against. If every
    // row currently matching the scope happens to be one of these (e.g. the
    // whole workflow's non-attached items are done), appending must still
    // start fresh at 1.0, not trip over the null rows it finds.
    const { phase, items: created } = await seedPhaseWithItems(2);
    setPosition(created[0].id, null);
    setPosition(created[1].id, null);

    const result = db.transaction((tx) =>
      resolveAppendPosition(items, eq(items.workphaseId, phase.id), tx)
    );
    expect(result).toBe(1.0);
  });

  it('appends past the true last item in a non-empty scope', async () => {
    const { phase, items: created } = await seedPhaseWithItems(1);
    setPosition(created[0].id, 7.2);

    const result = db.transaction((tx) => 
      resolveAppendPosition(items, eq(items.workphaseId, phase.id), tx)
    );
    expect(result).toBe(8);
  });

  it('reindexes before appending once the magnitude threshold is crossed', async () => {
    const { phase, items: created } = await seedPhaseWithItems(1);
    // Scope has 1 item, so the threshold is max(1000, 1 + 100) = 1000.
    setPosition(created[0].id, 1200);

    const result = db.transaction((tx) => 
      resolveAppendPosition(items, eq(items.workphaseId, phase.id), tx)
    );
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
    const result = db.transaction((tx) => 
      resolveAppendPosition(items, eq(items.workphaseId, phase.id), tx)
    );

    // No reindex fired: earlier items are untouched, and the result is a
    // plain append-past-the-anchor value, not a small reindexed one.
    expect(getPosition(created[0].id)).toBe(beforeA);
    expect(getPosition(created[1].id)).toBe(beforeB);
    expect(result).toBe(1101);
  });
});

// Same resolver, a second table — proves the table-generic generalization
// (projects unification) didn't just happen to keep items working; it
// genuinely serves any table matching PositionedTable. Not a full re-run of
// every items case above, just enough of each function's core contract to
// confirm it holds for a table with a different shape (no isAttached/
// workphaseId, root scope instead of a workphase scope).
describe('positionResolver against the projects table', () => {
  describe('reindexScope', () => {
    it('reassigns clean sequential positions while preserving relative order', async () => {
      const created = await seedRootProjects(4);
      setProjectPosition(created[0].id, 5.001);
      setProjectPosition(created[1].id, 5.001 + 1e-13);
      setProjectPosition(created[2].id, 5.002);
      setProjectPosition(created[3].id, 4.999);

      db.transaction((tx) =>
        resolvePositionByAnchorAndSide(projects, rootScope, tx, 'after', created[0].id)
      );

      expect(getProjectPosition(created[3].id)).toBe(1);
      expect(getProjectPosition(created[0].id)).toBe(2);
      expect(getProjectPosition(created[1].id)).toBe(3);
      expect(getProjectPosition(created[2].id)).toBe(4);
    });
  });

  describe('resolveAnchorPosition', () => {
    it('coarsest-fits between the anchor and its true next neighbor', async () => {
      const created = await seedRootProjects(2);
      setProjectPosition(created[0].id, 1.5);
      setProjectPosition(created[1].id, 2.0);

      const result = db.transaction((tx) =>
        resolvePositionByAnchorAndSide(projects, rootScope, tx, 'after', created[0].id)
      );
      expect(result).toBe(1.8);
    });

    it('throws for an anchor with no position', async () => {
      const created = await seedRootProjects(1);
      setProjectPosition(created[0].id, null);

      expect(() =>
        db.transaction((tx) => resolvePositionByAnchorAndSide(projects, rootScope, tx, 'after', created[0].id))
      ).toThrow();
    });
  });

  describe('resolveAppendPosition', () => {
    it('appends past the true last project in a non-empty scope', async () => {
      const created = await seedRootProjects(1);
      setProjectPosition(created[0].id, 7.2);

      const result = db.transaction((tx) => 
        resolveAppendPosition(projects, rootScope, tx)
      );
      expect(result).toBe(8);
    });

    it('reindexes before appending once the magnitude threshold is crossed (the Date.now()-scale legacy-data self-heal)', async () => {
      const created = await seedRootProjects(1);
      // Scope has 1 project, so the threshold is max(1000, 1 + 100) = 1000.
      // Simulates a pre-migration Date.now()-scale position.
      setProjectPosition(created[0].id, 1_761_234_567_890);

      const result = db.transaction((tx) => resolveAppendPosition(projects, rootScope, tx)
      );
      // After the reindex, the sole project becomes position 1, so the
      // append resolves to a small number again instead of continuing from
      // the huge legacy timestamp.
      expect(result).toBeLessThan(10);
    });
  });
});
