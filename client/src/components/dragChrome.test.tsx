import { describe, it, expect } from 'vitest';
import { render, renderHook } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import type { ReactNode } from 'react';
import { useItemRow } from './dragChrome';
import { DragGhost } from './sidebar/SortableProjectRow';
import { DragSessionContext, type DragSession } from './workflow/DragSessionContext';
import { classifyDragTargets } from './workflow/dragClassification';
import { DRAG_OVERLAY_ATTR, descendantsRegionKey } from './workflow/dragRegions';
import { startPopSession } from './workflow/popSession';
import { freeOrigin } from '../test/dragFixtures';
import { makeItem } from '../test/itemFixture';
import type { Item } from '../types';

// The E2E helper's "drag finished" wait counts the carried copy down to none, so a
// copy that doesn't carry the attribute it counts would let the wait pass at once.
describe('the carried copy carries DRAG_OVERLAY_ATTR', () => {
  it("on the board: the DragOverlay's copy does, and a row in a list does not", () => {
    const wrapper = ({ children }: { children: ReactNode }) => <DndContext>{children}</DndContext>;
    const overlay = renderHook(() => useItemRow('x', 'card', { isOverlay: true }), { wrapper });
    const row = renderHook(() => useItemRow('x', 'card'), { wrapper });

    expect(overlay.result.current.dataAttrs[DRAG_OVERLAY_ATTR]).toBe('true');
    expect(row.result.current.dataAttrs[DRAG_OVERLAY_ATTR]).toBeUndefined();
  });

  it("in the sidebar: the project's ghost does", () => {
    const { container } = render(<DragGhost name="Project" />);

    expect(container.querySelector(`[${DRAG_OVERLAY_ATTR}]`)).not.toBeNull();
  });
});

// The rows of the carried item's own branch read as part of what is carried (the traveling
// mark), without taking the look of the other two overlays.
describe('the traveling mark', () => {
  const TRAVELING = 'drag-overlay-traveling-opacity';
  const FREE_RING = 'drag-overlay-free';
  const CAPPED_DIM = 'drag-overlay-capped-opacity';

  const attached = (id: string, parentId: string | null): Item =>
    makeItem(id, { parentId, isAttached: 1, position: 1 });
  const free = (id: string, parentId: string | null): Item => makeItem(id, { parentId, isAttached: 0, position: 1 });

  // X carries a Stub (S) with a Stub of its own (S1), and a Free descendant (D). V is anyone else's.
  const ITEMS = [attached('X', null), attached('S', 'X'), attached('S1', 'S'), free('D', 'X'), attached('V', null)];

  function sessionOf(activeId: string, items: Item[], cap = 12): DragSession {
    return {
      activeItem: items.find(i => i.id === activeId)!,
      classification: classifyDragTargets(activeId, items, cap),
      pop: startPopSession(descendantsRegionKey('P')),
      priorPlacement: null,
      origin: freeOrigin('todo'),
      containingCardId: null,
      projection: null,
    };
  }

  function rowIn(session: DragSession | null, id: string, role: 'card' | 'stub' | 'overflow', parentId?: string) {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DndContext>
        <DragSessionContext value={session}>{children}</DragSessionContext>
      </DndContext>
    );
    const { result } = renderHook(() => useItemRow(id, role, { parentId }), { wrapper });
    return result.current;
  }

  it("marks a Stub row of the carried item's branch, at any depth", () => {
    const session = sessionOf('X', ITEMS);
    for (const id of ['S', 'S1']) {
      const row = rowIn(session, id, 'stub', id === 'S' ? 'X' : 'S');
      expect(row.chromeClassName).toContain(TRAVELING);
      expect(row.dataAttrs['data-traveling']).toBe('true');
    }
  });

  it('leaves the dragged row, the rows of anyone else and a row with no drag alone', () => {
    const session = sessionOf('S', ITEMS);

    expect(rowIn(session, 'S', 'stub', 'X').chromeClassName).not.toContain(TRAVELING);
    expect(rowIn(session, 'V', 'card').chromeClassName).not.toContain(TRAVELING);
    const idle = rowIn(null, 'S1', 'stub', 'S');
    expect(idle.chromeClassName).not.toContain(TRAVELING);
    expect(idle.dataAttrs['data-traveling']).toBeUndefined();
  });

  it('leaves a Free descendant its green ring only', () => {
    const row = rowIn(sessionOf('X', ITEMS), 'D', 'card');

    expect(row.chromeClassName).toContain(FREE_RING);
    expect(row.chromeClassName).not.toContain(TRAVELING);
    expect(row.dataAttrs['data-traveling']).toBeUndefined();
  });

  it('leaves a Depth-capped row its dim only', () => {
    // With a cap of 3, a target at depth 3 is one too deep for X, which carries two levels.
    const items = [...ITEMS, attached('T1', null), attached('T2', 'T1'), attached('T3', 'T2')];
    const row = rowIn(sessionOf('X', items, 3), 'T3', 'stub', 'T2');

    expect(row.chromeClassName).toContain(CAPPED_DIM);
    expect(row.chromeClassName).not.toContain(TRAVELING);
  });

  it('marks an overflow row whose owner travels, and no other', () => {
    const session = sessionOf('X', ITEMS);

    // Under the dragged item itself, and under one of its descendants.
    expect(rowIn(session, 'overflow:X', 'overflow', 'X').chromeClassName).toContain(TRAVELING);
    expect(rowIn(session, 'overflow:S', 'overflow', 'S').dataAttrs['data-traveling']).toBe('true');
    expect(rowIn(session, 'overflow:V', 'overflow', 'V').chromeClassName).not.toContain(TRAVELING);
    expect(rowIn(null, 'overflow:S', 'overflow', 'S').chromeClassName).not.toContain(TRAVELING);
  });

  it('never marks the carried copy', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DndContext>
        <DragSessionContext value={sessionOf('X', ITEMS)}>{children}</DragSessionContext>
      </DndContext>
    );
    const { result } = renderHook(() => useItemRow('S', 'stub', { parentId: 'X', isOverlay: true }), { wrapper });

    expect(result.current.chromeClassName).not.toContain(TRAVELING);
  });
});
