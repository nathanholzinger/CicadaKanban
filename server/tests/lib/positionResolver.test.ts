import { describe, it, expect } from 'vitest';
import { and, eq, isNull, not } from 'drizzle-orm';
import { db } from '../../src/db/index.js';
import { items, projects } from '../../src/db/schema.js';
import {
  anchorRefusal,
  resolvePositionByAnchorAndSide,
  resolveAppendPosition,
  withReindexDisclosure,
  type ReindexedPosition,
} from '../../src/lib/positionResolver.js';
import { coarsestFit } from '../../src/lib/coarsestFit.js';
import {
  createProject,
  createWorkflow,
  createWorkphase,
  createItem,
  setItemPosition,
  setProjectPosition,
} from '../fixtures.js';

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

// Root-scope predicate for these tests — same shape as
// `routes/projects.ts::projectPositionScope` with a null parent, duplicated
// here (not imported) since it's a one-line route-owned helper, not part of
// the lib's public surface.
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

describe('reindex', () => {
  it('TC-5.6: breaks exact ties by createdAt, oldest first', async () => {
    const { phase, items: created } = await seedPhaseWithItems(4);
    setItemPosition(created[0].id, 5.0);
    setItemPosition(created[1].id, 1.0 + 1e-13);
    setItemPosition(created[2].id, 1.0);
    setItemPosition(created[3].id, 5.0);
    // The tied pair's creation times run against the order the rows were
    // inserted, so the row order alone would put created[0] first.
    db.update(items).set({ createdAt: 2000 }).where(eq(items.id, created[0].id)).run();
    db.update(items).set({ createdAt: 1000 }).where(eq(items.id, created[3].id)).run();

    db.transaction(tx =>
      resolvePositionByAnchorAndSide(items, eq(items.workphaseId, phase.id), tx, 'after', created[2].id),
    );

    expect(getPosition(created[2].id)).toBe(1);
    expect(getPosition(created[1].id)).toBe(2);
    expect(getPosition(created[3].id)).toBe(3);
    expect(getPosition(created[0].id)).toBe(4);
  });

  // A caller that mixes one fresh number into stale ones computes an
  // ordering that is wrong while looking consistent, so the resolver must
  // report every row it renumbered (TC-5.9).
  describe('disclosure', () => {
    it('reports every renumbered row, in scope order, as bare {id, position} pairs (tight-gap trigger)', async () => {
      const { phase, items: created } = await seedPhaseWithItems(3);
      setItemPosition(created[0].id, 1.0);
      setItemPosition(created[1].id, 1.0 + 1e-13);
      setItemPosition(created[2].id, 5.0);

      const reindexed: ReindexedPosition[] = [];
      db.transaction(tx =>
        resolvePositionByAnchorAndSide(items, eq(items.workphaseId, phase.id), tx, 'after', created[0].id, reindexed),
      );

      expect(reindexed).toEqual([
        { id: created[0].id, position: 1 },
        { id: created[1].id, position: 2 },
        { id: created[2].id, position: 3 },
      ]);
    });

    it('reports the reindex fired by the magnitude threshold on an append', async () => {
      const { phase, items: created } = await seedPhaseWithItems(2);
      setItemPosition(created[0].id, 1100);
      setItemPosition(created[1].id, 1200);

      const reindexed: ReindexedPosition[] = [];
      const result = db.transaction(tx => resolveAppendPosition(items, eq(items.workphaseId, phase.id), tx, reindexed));

      expect(reindexed).toEqual([
        { id: created[0].id, position: 1 },
        { id: created[1].id, position: 2 },
      ]);
      expect(result).toBe(3);
    });

    it('leaves the collector empty when no reindex fired', async () => {
      const { phase, items: created } = await seedPhaseWithItems(2);
      setItemPosition(created[0].id, 1.5);
      setItemPosition(created[1].id, 2.0);

      const reindexed: ReindexedPosition[] = [];
      db.transaction(tx =>
        resolvePositionByAnchorAndSide(items, eq(items.workphaseId, phase.id), tx, 'after', created[0].id, reindexed),
      );
      expect(reindexed).toEqual([]);
    });
  });
});

describe('resolvePositionByAnchorAndSide', () => {
  it('TC-2.2: coarsest-fits between the anchor and its true next neighbor', async () => {
    const { phase, items: created } = await seedPhaseWithItems(2);
    setItemPosition(created[0].id, 1.5);
    setItemPosition(created[1].id, 2.0);

    const result = db.transaction(tx =>
      resolvePositionByAnchorAndSide(items, eq(items.workphaseId, phase.id), tx, 'after', created[0].id),
    );
    expect(result).toBe(1.8);
  });

  it('TC-2.9: finds the true neighbor even when it is not the literal next row created', async () => {
    // The true bounding neighbor must be found by querying real data, not
    // assumed from creation order or a caller-supplied guess, which a
    // narrow view would leapfrog.
    const { phase, items: created } = await seedPhaseWithItems(3);
    setItemPosition(created[0].id, 1.0);
    setItemPosition(created[1].id, 2.8);
    setItemPosition(created[2].id, 3.0);

    // Anchor to item C (created[2]) with side 'before' — the true previous
    // neighbor is item B (2.8), not item A (1.0).
    const result = db.transaction(tx =>
      resolvePositionByAnchorAndSide(items, eq(items.workphaseId, phase.id), tx, 'before', created[2].id),
    );
    expect(result).toBe(2.9);
  });

  it('TC-2.4: appends past the anchor when it is the true last item', async () => {
    const { phase, items: created } = await seedPhaseWithItems(1);
    setItemPosition(created[0].id, 5.3);

    const result = db.transaction(tx =>
      resolvePositionByAnchorAndSide(items, eq(items.workphaseId, phase.id), tx, 'after', created[0].id),
    );
    expect(result).toBe(6);
  });

  it('coarsest fit between 0.0 and the anchor when it is placed before the first item, which makes it the new first item', async () => {
    const { phase, items: created } = await seedPhaseWithItems(1);
    setItemPosition(created[0].id, 5.3);

    const result = db.transaction(tx =>
      resolvePositionByAnchorAndSide(items, eq(items.workphaseId, phase.id), tx, 'before', created[0].id),
    );
    expect(result).toBe(3);
  });

  it('reindexes the scope and retries when the gap is too tight for any precision', async () => {
    const { phase, items: created } = await seedPhaseWithItems(2);
    setItemPosition(created[0].id, 1.0);
    setItemPosition(created[1].id, 1.0 + 1e-13); // unresolvable gap at any decimal depth

    const result = db.transaction(tx =>
      resolvePositionByAnchorAndSide(items, eq(items.workphaseId, phase.id), tx, 'after', created[0].id),
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

  it('throws for an anchor with no position (a done item)', async () => {
    const { phase, items: created } = await seedPhaseWithItems(1);
    setItemPosition(created[0].id, null);

    expect(() =>
      db.transaction(tx =>
        resolvePositionByAnchorAndSide(items, eq(items.workphaseId, phase.id), tx, 'after', created[0].id),
      ),
    ).toThrow(/does not have a position/);
  });

  it('appends as last when no anchorId is given, side "after"', async () => {
    const { phase, items: created } = await seedPhaseWithItems(1);
    setItemPosition(created[0].id, 5.3);

    const result = db.transaction(tx =>
      resolvePositionByAnchorAndSide(items, eq(items.workphaseId, phase.id), tx, 'after'),
    );
    expect(result).toBe(6);
  });

  it('prepends as first when no anchorId is given, side "before"', async () => {
    const { phase, items: created } = await seedPhaseWithItems(1);
    setItemPosition(created[0].id, 5.3);

    const result = db.transaction(tx =>
      resolvePositionByAnchorAndSide(items, eq(items.workphaseId, phase.id), tx, 'before'),
    );
    expect(result).toBe(3);
  });

  it('returns 1.0 when no anchorId is given, side "before", on a genuinely empty scope', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const phase = await createWorkphase(workflow.id);

    const result = db.transaction(tx =>
      resolvePositionByAnchorAndSide(items, eq(items.workphaseId, phase.id), tx, 'before'),
    );
    expect(result).toBe(1.0);
  });
});

describe('resolveAppendPosition', () => {
  it('TC-2.7: returns 1.0 for a genuinely empty scope', async () => {
    const project = await createProject();
    const workflow = await createWorkflow(project.id);
    const phase = await createWorkphase(workflow.id);

    const result = db.transaction(tx => resolveAppendPosition(items, eq(items.workphaseId, phase.id), tx));
    expect(result).toBe(1.0);
  });

  it('TC-2.7: treats a scope holding only null-positioned rows the same as a genuinely empty one', async () => {
    // A scope isn't only ever empty or fully-positioned — a done item keeps
    // its row (null position, real completedAt instead) inside
    // the same workflow-wide scope active items compare against. If every
    // row currently matching the scope happens to be one of these (e.g. the
    // whole workflow's non-attached items are done), appending must still
    // start fresh at 1.0, not trip over the null rows it finds.
    const { phase, items: created } = await seedPhaseWithItems(2);
    setItemPosition(created[0].id, null);
    setItemPosition(created[1].id, null);

    const result = db.transaction(tx => resolveAppendPosition(items, eq(items.workphaseId, phase.id), tx));
    expect(result).toBe(1.0);
  });

  it('appends past the true last item in a non-empty scope', async () => {
    const { phase, items: created } = await seedPhaseWithItems(1);
    setItemPosition(created[0].id, 7.2);

    const result = db.transaction(tx => resolveAppendPosition(items, eq(items.workphaseId, phase.id), tx));
    expect(result).toBe(8);
  });

  it('reindexes before appending once the magnitude threshold is crossed', async () => {
    const { phase, items: created } = await seedPhaseWithItems(1);
    // Scope has 1 item, so the threshold is max(1000, 1 + 100) = 1000.
    setItemPosition(created[0].id, 1200);

    const result = db.transaction(tx => resolveAppendPosition(items, eq(items.workphaseId, phase.id), tx));
    // After the reindex, the sole item becomes position 1, so the append
    // resolves to a small number again instead of continuing from 1200.
    expect(result).toBeLessThan(10);
  });

  it('TC-5.3: does not reindex when a large position is proportionate to a large item count', async () => {
    const { project, phase, items: created } = await seedPhaseWithItems(3);
    setItemPosition(created[0].id, 1);
    setItemPosition(created[1].id, 2);

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
    setItemPosition(created[2].id, 1100); // proportionate: 1100 < 1150

    const beforeA = getPosition(created[0].id);
    const beforeB = getPosition(created[1].id);
    const result = db.transaction(tx => resolveAppendPosition(items, eq(items.workphaseId, phase.id), tx));

    // No reindex fired: earlier items are untouched, and the result is a
    // plain append-past-the-anchor value, not a small reindexed one.
    expect(getPosition(created[0].id)).toBe(beforeA);
    expect(getPosition(created[1].id)).toBe(beforeB);
    expect(result).toBe(1101);
  });
});

describe('anchorRefusal', () => {
  it('names why an anchor fails, and is null for one the scope holds', async () => {
    const { phase, items: created } = await seedPhaseWithItems(3);
    const [subject, anchor, done] = created;
    setItemPosition(done.id, null);
    const elsewhere = (await seedPhaseWithItems(1)).items[0];
    const scope = and(eq(items.workphaseId, phase.id), not(eq(items.id, subject.id)))!;

    expect(anchorRefusal(items, scope, anchor.id, subject.id)).toBeNull();
    expect(anchorRefusal(items, scope, subject.id, subject.id)).toBe('self');
    expect(anchorRefusal(items, scope, 'no-such-item', subject.id)).toBe('missing');
    expect(anchorRefusal(items, scope, elsewhere.id, subject.id)).toBe('outside-scope');
    expect(anchorRefusal(items, scope, done.id, subject.id)).toBe('no-position');
  });

  it('asks whether the anchor is in the scope before whether it has a position', async () => {
    const { phase, items: created } = await seedPhaseWithItems(1);
    const elsewhere = (await seedPhaseWithItems(1)).items[0];
    setItemPosition(elsewhere.id, null);
    const scope = eq(items.workphaseId, phase.id);

    expect(anchorRefusal(items, scope, elsewhere.id, created[0].id)).toBe('outside-scope');
  });

  it('works over the projects table: only a sibling is in scope', async () => {
    const [subject, sibling, noPosition] = await seedRootProjects(3);
    const child = await createProject({ name: 'Child', parentId: sibling.id });
    setProjectPosition(noPosition.id, null);
    const scope = and(rootScope, not(eq(projects.id, subject.id)))!;

    expect(anchorRefusal(projects, scope, sibling.id, subject.id)).toBeNull();
    expect(anchorRefusal(projects, scope, subject.id, subject.id)).toBe('self');
    expect(anchorRefusal(projects, scope, child.id, subject.id)).toBe('outside-scope');
    expect(anchorRefusal(projects, scope, noPosition.id, subject.id)).toBe('no-position');
  });
});

describe('withReindexDisclosure', () => {
  const row = { id: 'x', position: 2, title: 'X' };

  it('returns the row itself when no reindex fired', () => {
    expect(withReindexDisclosure(row, [])).toBe(row);
  });

  it("appends the row's own {id, position} to the renumbered pairs", () => {
    const body = withReindexDisclosure(row, [{ id: 'a', position: 1 }]);
    expect(body).toEqual({
      ...row,
      reindexed: [
        { id: 'a', position: 1 },
        { id: 'x', position: 2 },
      ],
    });
  });

  it('leaves out the pair of a row with no position, which a reindex never numbered', () => {
    const body = withReindexDisclosure({ ...row, position: null }, [{ id: 'a', position: 1 }]);
    expect(body).toEqual({ ...row, position: null, reindexed: [{ id: 'a', position: 1 }] });
  });
});

// Same resolver, a second table — proves it genuinely serves any table
// matching PositionedTable, not only items. Not a full re-run of
// every items case above, just enough of each function's core contract to
// confirm it holds for a table with a different shape (no isAttached/
// workphaseId, root scope instead of a workphase scope).
describe('positionResolver against the projects table', () => {
  describe('reindex', () => {
    it('reassigns clean sequential positions while preserving relative order', async () => {
      const created = await seedRootProjects(4);
      setProjectPosition(created[0].id, 5.001);
      setProjectPosition(created[1].id, 5.001 + 1e-13);
      setProjectPosition(created[2].id, 5.002);
      setProjectPosition(created[3].id, 4.999);

      db.transaction(tx => resolvePositionByAnchorAndSide(projects, rootScope, tx, 'after', created[0].id));

      expect(getProjectPosition(created[3].id)).toBe(1);
      expect(getProjectPosition(created[0].id)).toBe(2);
      expect(getProjectPosition(created[1].id)).toBe(3);
      expect(getProjectPosition(created[2].id)).toBe(4);
    });
  });

  describe('resolvePositionByAnchorAndSide', () => {
    it('coarsest-fits between the anchor and its true next neighbor', async () => {
      const created = await seedRootProjects(2);
      setProjectPosition(created[0].id, 1.5);
      setProjectPosition(created[1].id, 2.0);

      const result = db.transaction(tx =>
        resolvePositionByAnchorAndSide(projects, rootScope, tx, 'after', created[0].id),
      );
      expect(result).toBe(1.8);
    });

    it('throws for an anchor with no position', async () => {
      const created = await seedRootProjects(1);
      setProjectPosition(created[0].id, null);

      expect(() =>
        db.transaction(tx => resolvePositionByAnchorAndSide(projects, rootScope, tx, 'after', created[0].id)),
      ).toThrow();
    });
  });

  describe('resolveAppendPosition', () => {
    it('appends past the true last project in a non-empty scope', async () => {
      const created = await seedRootProjects(1);
      setProjectPosition(created[0].id, 7.2);

      const result = db.transaction(tx => resolveAppendPosition(projects, rootScope, tx));
      expect(result).toBe(8);
    });

    it('reindexes before appending once the magnitude threshold is crossed, even for a position at the scale of Date.now()', async () => {
      const created = await seedRootProjects(1);
      // Scope has 1 project, so the threshold is max(1000, 1 + 100) = 1000.
      // A position at the scale of Date.now() is far past it.
      setProjectPosition(created[0].id, 1_761_234_567_890);

      const result = db.transaction(tx => resolveAppendPosition(projects, rootScope, tx));
      // After the reindex, the sole project becomes position 1, so the
      // append resolves to a small number again instead of continuing from
      // the huge position.
      expect(result).toBeLessThan(10);
    });
  });
});
