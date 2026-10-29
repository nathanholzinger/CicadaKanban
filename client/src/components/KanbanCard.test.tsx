import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import KanbanCard from './KanbanCard';
import { HierarchyModalContext } from './workflow/HierarchyModalContext';
import { DragSessionContext, type DragSession } from './workflow/DragSessionContext';
import { classifyDragTargets } from './workflow/dragClassification';
import { DRAG_CARD_ATTR, DRAG_REGION_ATTR, descendantsRegionKey } from './workflow/dragRegions';
import { startPopSession } from './workflow/popSession';
import { freeOrigin } from '../test/dragFixtures';
import { makeItem } from '../test/itemFixture';

const CARD = makeItem('p');
const CHILD = makeItem('c', { parentId: 'p', position: 1 });
const CARRIED = makeItem('x');
const attachedChildren = (parentId: string) => (parentId === 'p' ? [CHILD] : []);

// The drag of the Free Card X, locked at P's Descendants layer.
function lockedAtP(): DragSession {
  return {
    activeItem: CARRIED,
    classification: classifyDragTargets('x', [CARD, CHILD, CARRIED], 12),
    pop: startPopSession(descendantsRegionKey('p')),
    priorPlacement: null,
    origin: freeOrigin('todo'),
    containingCardId: null,
    projection: null,
  };
}

function renderCard(
  props: Partial<Parameters<typeof KanbanCard>[0]> = {},
  { session = null, modalCardId = null }: { session?: DragSession | null; modalCardId?: string | null } = {},
) {
  return render(
    <DndContext>
      <DragSessionContext value={session}>
        <HierarchyModalContext value={{ openCardId: modalCardId, open: () => {}, close: () => {} }}>
          <KanbanCard item={CARD} {...props} />
        </HierarchyModalContext>
      </DragSessionContext>
    </DndContext>,
  );
}

const regionElements = (container: HTMLElement) => [...container.querySelectorAll(`[${DRAG_REGION_ATTR}]`)];

describe("a Card is its Descendants layer's drag region", () => {
  it('a Card with nothing attached carries it too, on its root element', () => {
    const { container } = renderCard();

    const [root, ...rest] = regionElements(container);
    expect(rest).toEqual([]);
    expect(root.getAttribute(DRAG_REGION_ATTR)).toBe(descendantsRegionKey('p'));
    expect(root).toHaveAttribute('role', 'article');
    expect(root.getAttribute(DRAG_CARD_ATTR)).toBe('p');
  });

  it('a Card with children carries it on its root, one element for the key, its section none', () => {
    const { container, getByRole } = renderCard({ childCount: 1, getAttachedChildren: attachedChildren });

    expect(regionElements(container)).toEqual([getByRole('article', { name: CARD.title })]);
    expect(container.querySelector('[data-item-id="c"]')).not.toBeNull();
  });

  it("DRAG-7.10: while the hierarchy modal holds its rows the modal's list carries the key, so the Card keeps only its id", () => {
    const { container, getByRole } = renderCard(
      { childCount: 1, getAttachedChildren: attachedChildren },
      { modalCardId: 'p' },
    );

    expect(regionElements(container)).toEqual([]);
    expect(getByRole('article', { name: CARD.title }).getAttribute(DRAG_CARD_ATTR)).toBe('p');
  });

  it("the DragOverlay's floating copy is no region and names no Card", () => {
    const { container } = renderCard({ isOverlay: true });

    expect(regionElements(container)).toEqual([]);
    expect(container.querySelector(`[${DRAG_CARD_ATTR}]`)).toBeNull();
  });
});

describe('a Card the drag is locked at', () => {
  it('is forced open and marked as the active context, however the user left it', () => {
    const collapsed = { childCount: 1, getAttachedChildren: attachedChildren, defaultExpanded: false };
    const idle = renderCard(collapsed);
    expect(idle.container.querySelector('[data-item-id="c"]')).toBeNull();
    expect(idle.getByRole('article', { name: CARD.title })).not.toHaveAttribute('data-active-context');
    idle.unmount();

    const locked = renderCard(collapsed, { session: lockedAtP() });
    expect(locked.container.querySelector('[data-item-id="c"]')).not.toBeNull();
    expect(locked.getByRole('article', { name: CARD.title })).toHaveAttribute('data-active-context', 'true');
  });

  it("DRAG-4.12: a childless Card draws the carried item's ghost as the one row of its section, once the board previews it there", () => {
    // The board previews the carried item attaching to P, so P's children, as the Card is given
    // them, are the carried item alone.
    const { container } = renderCard(
      { childCount: 1, getAttachedChildren: () => [CARRIED], defaultExpanded: false },
      { session: lockedAtP() },
    );

    expect([...container.querySelectorAll('[data-item-id]')].map(el => el.getAttribute('data-item-id'))).toEqual([
      'p',
      'x',
    ]);
  });

  it("is not marked while the drag is at another Card's layer", () => {
    const session = { ...lockedAtP(), pop: startPopSession(descendantsRegionKey('other')) };
    const { getByRole } = renderCard({}, { session });

    expect(getByRole('article', { name: CARD.title })).not.toHaveAttribute('data-active-context');
  });
});
