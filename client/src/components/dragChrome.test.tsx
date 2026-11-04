import { describe, it, expect, vi } from 'vitest';
import { render, renderHook } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import type { ReactNode } from 'react';
import { useItemRow } from './dragChrome';
import { DragGhost } from './sidebar/SortableProjectRow';
import { DragSessionContext, PlacementsContext, type DragSession } from './workflow/DragSessionContext';
import type { Placement } from './workflow/itemListOps';
import KanbanCard from './KanbanCard';
import { AttachedChildRow } from './StubRows';
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

// How strongly a row is drawn says what its target can be to the carried item (the tiers). The
// opacity sits on a wrapper around the row's own content, so the drop line and a Card's section of
// Stubs, which have their own strength, are not inside it.
const sortable = vi.hoisted(() => ({ dragging: false }));
vi.mock('@dnd-kit/sortable', async importOriginal => {
  const actual = await importOriginal<typeof import('@dnd-kit/sortable')>();
  return {
    ...actual,
    useSortable: (args: Parameters<typeof actual.useSortable>[0]) => {
      const result = actual.useSortable(args);
      return sortable.dragging ? { ...result, isDragging: true } : result;
    },
  };
});

describe('the drag-target tiers', () => {
  const ANCHOR = 'drag-tier-anchor';
  const NEITHER = 'drag-tier-neither';
  const GHOST = 'drag-tier-ghost';
  const PULSE = 'drag-tier-pending';

  const stub = (id: string, parentId: string | null): Item => makeItem(id, { parentId, isAttached: 1, position: 1 });
  const freeCard = (id: string, parentId: string | null): Item =>
    makeItem(id, { parentId, isAttached: 0, position: 1 });

  // X carries a Stub S with a Stub S1, and a Free descendant D with a Stub DS. V is a Free Card that
  // fits under X. With a cap of 4, X (two levels deep) fits under T1 only: T2, a Stub
  // of T1's, is too deep to take it but is an anchor, and T3 under it is not even that.
  const CAP = 4;
  const ITEMS = [
    stub('X', null),
    stub('S', 'X'),
    stub('S1', 'S'),
    freeCard('D', 'X'),
    stub('DS', 'D'),
    stub('V', null),
    stub('T1', null),
    stub('T2', 'T1'),
    stub('T3', 'T2'),
  ];

  function sessionOf(activeId: string): DragSession {
    return {
      activeItem: ITEMS.find(i => i.id === activeId)!,
      classification: classifyDragTargets(activeId, ITEMS, CAP),
      pop: startPopSession(descendantsRegionKey('P')),
      priorPlacement: null,
      origin: freeOrigin('todo'),
      containingCardId: null,
      projection: null,
    };
  }

  function rowIn(
    session: DragSession | null,
    id: string,
    role: 'card' | 'stub' | 'overflow',
    { parentId, pending = false, dragging = false }: { parentId?: string; pending?: boolean; dragging?: boolean } = {},
  ) {
    const placements = new Map<string, Placement>(pending ? [[id, { parentId: null, slot: 'last' }]] : []);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DndContext>
        <PlacementsContext value={placements}>
          <DragSessionContext value={session}>{children}</DragSessionContext>
        </PlacementsContext>
      </DndContext>
    );
    sortable.dragging = dragging;
    try {
      return renderHook(() => useItemRow(id, role, { parentId }), { wrapper }).result.current;
    } finally {
      sortable.dragging = false;
    }
  }

  it('draws an anchor-only target and a target that is not even an anchor at their own strengths', () => {
    const session = sessionOf('X');

    const anchor = rowIn(session, 'T2', 'stub', { parentId: 'T1' });
    expect(anchor.contentClassName).toContain(ANCHOR);
    expect(anchor.dataAttrs['data-drop-tier']).toBe('anchor');
    const neither = rowIn(session, 'T3', 'stub', { parentId: 'T2' });
    expect(neither.contentClassName).toContain(NEITHER);
    expect(neither.dataAttrs['data-drop-tier']).toBe('neither');
    // A Free descendant is a Card, so an anchor, and its Stub is neither: no ring, no further dim.
    expect(rowIn(session, 'D', 'card').contentClassName).toContain(ANCHOR);
    expect(rowIn(session, 'DS', 'stub', { parentId: 'D' }).contentClassName).toContain(NEITHER);
  });

  it('draws the tier on the content and never on the root', () => {
    const row = rowIn(sessionOf('X'), 'T3', 'stub', { parentId: 'T2' });

    expect(row.chromeClassName).not.toContain(NEITHER);
    expect(row.chromeClassName).not.toContain(ANCHOR);
  });

  it('draws a legal parent, the carried copy and a row with no drag at full strength', () => {
    const session = sessionOf('X');

    for (const id of ['V', 'T1']) {
      const row = rowIn(session, id, 'card');
      expect(row.contentClassName.trim()).toBe('');
      expect(row.dataAttrs['data-drop-tier']).toBe('parent');
    }
    const overlay = renderHook(() => useItemRow('S', 'stub', { parentId: 'X', isOverlay: true }), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <DndContext>
          <DragSessionContext value={session}>{children}</DragSessionContext>
        </DndContext>
      ),
    }).result.current;
    expect(overlay.contentClassName.trim()).toBe('');
    expect(overlay.dataAttrs['data-drop-tier']).toBeUndefined();
    const idle = rowIn(null, 'T3', 'stub', { parentId: 'T2' });
    expect(idle.contentClassName.trim()).toBe('');
    expect(idle.dataAttrs['data-drop-tier']).toBeUndefined();
  });

  it("draws the dragged row at the ghost's own strength on its root, and at no tier", () => {
    const row = rowIn(sessionOf('S'), 'S', 'stub', { parentId: 'X', dragging: true });

    expect(row.chromeClassName).toContain(GHOST);
    expect(row.contentClassName.trim()).toBe('');
    expect(row.dataAttrs['data-drop-tier']).toBeUndefined();
  });

  it('draws an overflow row by its owner: a legal parent in full, anything else as neither', () => {
    const session = sessionOf('X');

    const fits = rowIn(session, 'overflow:V', 'overflow', { parentId: 'V' });
    expect(fits.dataAttrs['data-drop-tier']).toBe('parent');
    expect(fits.contentClassName.trim()).toBe('');
    for (const owner of ['X', 'S', 'D', 'T2']) {
      const row = rowIn(session, `overflow:${owner}`, 'overflow', { parentId: owner });
      expect(row.contentClassName, owner).toContain(NEITHER);
      expect(row.dataAttrs['data-drop-tier'], owner).toBe('neither');
    }
    expect(rowIn(null, 'overflow:S', 'overflow', { parentId: 'S' }).contentClassName.trim()).toBe('');
  });

  it("pulses a pending row's content, which keeps its tier, and not its root", () => {
    const row = rowIn(sessionOf('X'), 'T3', 'stub', { parentId: 'T2', pending: true });

    expect(row.contentClassName).toContain(NEITHER);
    expect(row.contentClassName).toContain(PULSE);
    expect(row.chromeClassName).not.toContain(PULSE);
    expect(row.dataAttrs['data-pending']).toBe('true');
    // At full strength it pulses on its own, from 1.
    const full = rowIn(sessionOf('X'), 'V', 'card', { pending: true });
    expect(full.contentClassName).toContain(PULSE);
    expect(full.contentClassName).not.toContain(NEITHER);
  });

  describe('on the screen', () => {
    const inSession = (ui: ReactNode, session: DragSession) =>
      render(
        <DndContext>
          <DragSessionContext value={session}>{ui}</DragSessionContext>
        </DndContext>,
      );

    it("a Stub row's tier is on a wrapper around its button, and not on the row, which holds the drop line", () => {
      const { container } = inSession(
        <AttachedChildRow item={ITEMS.find(i => i.id === 'T2')!} itemTypes={[]} depth={1} cardId="T1" />,
        sessionOf('X'),
      );

      const root = container.querySelector<HTMLElement>('[data-item-id="T2"]')!;
      const content = root.querySelector('button')!.parentElement!;
      expect(content).not.toBe(root);
      expect(content.className).toContain(ANCHOR);
      expect(root.className).not.toContain(ANCHOR);
    });

    it("a Card's tier is on its own content, and its Stubs are outside it, each at its own tier", () => {
      const children = (parentId: string) => ITEMS.filter(i => i.parentId === parentId && parentId === 'D');
      const { container } = inSession(
        <KanbanCard item={ITEMS.find(i => i.id === 'D')!} childCount={1} getAttachedChildren={children} />,
        sessionOf('X'),
      );

      const root = container.querySelector<HTMLElement>('[data-item-id="D"]')!;
      const tiered = (el: Element) => el.className.toString().includes(ANCHOR);
      const content = [...root.children].find(tiered)!;
      expect(root.className).not.toContain(ANCHOR);
      expect(content).toBeDefined();
      const stubRow = container.querySelector<HTMLElement>('[data-item-id="DS"]')!;
      expect(content.contains(stubRow)).toBe(false);
      // The Stub is neither, and not the Card's anchor strength on top of it.
      expect(stubRow.querySelector('button')!.parentElement!.className).toContain(NEITHER);
      expect(stubRow.closest('[class*="drag-tier-anchor"]')).toBeNull();
    });
  });
});
