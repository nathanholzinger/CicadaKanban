import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import KanbanCard from './KanbanCard';
import { HierarchyModalContext } from './workflow/HierarchyModalContext';
import { DragSessionContext, type DescendantsProjection, type DragSession } from './workflow/DragSessionContext';
import { classifyDragTargets } from './workflow/dragClassification';
import { DRAG_CARD_ATTR, DRAG_REGION_ATTR, descendantsRegionKey } from './workflow/dragRegions';
import { startPopSession } from './workflow/popSession';
import { freeOrigin, makeDragSession, stubOrigin } from '../test/dragFixtures';
import { makeItem } from '../test/itemFixture';
import { SHORT_CARD_HEIGHT_PX, descendantsIndentPx } from './cardMetrics';

const CARD = makeItem('p');
const CHILD = makeItem('c', { parentId: 'p', position: 1 });
const CARRIED = makeItem('x');
const attachedChildren = (parentId: string) => (parentId === 'p' ? [CHILD] : []);

// The drag of the Free Card X, locked at P's Descendants layer.
function lockedAtP(): DragSession {
  return makeDragSession({
    activeItem: CARRIED,
    classification: classifyDragTargets('x', [CARD, CHILD, CARRIED], 12),
    pop: startPopSession(descendantsRegionKey('p')),
  });
}

type CardProps = Partial<Parameters<typeof KanbanCard>[0]>;
type CardContext = { session?: DragSession | null; modalCardId?: string | null };

function cardFrame(props: CardProps, { session = null, modalCardId = null }: CardContext = {}) {
  return (
    <DndContext>
      <DragSessionContext value={session}>
        <HierarchyModalContext value={{ openCardId: modalCardId, open: () => {}, close: () => {} }}>
          <KanbanCard item={CARD} {...props} />
        </HierarchyModalContext>
      </DragSessionContext>
    </DndContext>
  );
}

function renderCard(props: CardProps = {}, context: CardContext = {}) {
  return render(cardFrame(props, context));
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

  // The zoom clears the column's shuffle in the render that mounts the section's rows, and dnd-kit
  // measures each row once, as it mounts: a Card still sliding back then leaves every row's
  // measured rect off by what is left of the slide, for the rest of the drag.
  it('does not slide: its sortable transition is off, so its rows are measured where it rests', () => {
    const idle = renderCard();
    expect(idle.getByRole('article', { name: CARD.title })).not.toHaveStyle({ transition: 'none' });
    idle.unmount();

    const locked = renderCard({}, { session: lockedAtP() });
    expect(locked.getByRole('article', { name: CARD.title })).toHaveStyle({ transition: 'none' });
  });
});

// A pickup takes its branch with it, whether the item is a Stub or a Free Card: P's section holds A, D
// (the one carried, with D1 under it and D1a under that) and C. D1 and D1a leave the section while the
// session holds them. A Free Card's drag has D previewed in the section as a Stub, so its row is drawn
// and its children are not.
describe('a Card whose section holds the branch of a carried item', () => {
  const D = makeItem('d', { parentId: 'p', position: 2 });
  const ROWS = [
    makeItem('a', { parentId: 'p', position: 1 }),
    D,
    makeItem('d1', { parentId: 'd' }),
    makeItem('d1a', { parentId: 'd1' }),
    makeItem('c', { parentId: 'p', position: 3 }),
  ];
  const BRANCH = { ids: new Set(['d1', 'd1a']), children: 1, descendants: 2 };
  const childrenOf = (parentId: string) => ROWS.filter(i => i.parentId === parentId);
  const carrying = (kind: 'stub' | 'free') =>
    makeDragSession({
      activeItem: D,
      classification: classifyDragTargets('d', [CARD, ...ROWS], 12),
      pop: startPopSession(descendantsRegionKey('p')),
      origin: kind === 'stub' ? stubOrigin('p') : freeOrigin('todo'),
      containingCardId: kind === 'stub' ? 'p' : null,
      branch: BRANCH,
    });
  const rowIds = (container: HTMLElement) =>
    [...container.querySelectorAll('[data-item-id]')].map(el => el.getAttribute('data-item-id'));

  it.each(['stub', 'free'] as const)(
    'draws none of the branch of a carried %s, and every other row where it was',
    kind => {
      const { container } = renderCard({ childCount: 3, getAttachedChildren: childrenOf }, { session: carrying(kind) });

      expect(rowIds(container)).toEqual(['p', 'a', 'd', 'c']);
    },
  );

  it('draws none of it in the static rows under the hierarchy modal’s backdrop either', () => {
    const { queryByText } = renderCard(
      { childCount: 3, getAttachedChildren: childrenOf },
      { session: carrying('free'), modalCardId: 'p' },
    );

    expect(queryByText('Item c')).toBeInTheDocument();
    expect(queryByText('Item d1')).toBeNull();
    expect(queryByText('Item d1a')).toBeNull();
  });

  it('draws it again once the drag is over', () => {
    const props = { childCount: 3, getAttachedChildren: childrenOf };
    const { container, rerender } = renderCard(props, { session: carrying('free') });
    expect(rowIds(container)).toEqual(['p', 'a', 'd', 'c']);

    rerender(cardFrame(props));

    expect(rowIds(container)).toEqual(['p', 'a', 'd', 'd1', 'd1a', 'c']);
  });
});

// The carried copy says what its branch holds on a second line, in either form: hung from its box so the
// box the drag measures stays what it is, and, as a Stub, stepping with the box to the depth the ghost
// would land at.
describe('the carried copy of an item with a branch', () => {
  const BRANCH = { children: 2, descendants: 5 };
  const LINE = '+ 2 children, 5 total descendants';
  const overlay = (props: CardProps) => renderCard({ item: CARRIED, isOverlay: true, overlayBranch: BRANCH, ...props });

  it.each(['stub', 'short-card'] as const)('says the branch’s counts in its %s form', form => {
    const { getByText } = overlay({ overlayForm: form });

    expect(getByText(LINE)).toBeInTheDocument();
  });

  it.each(['stub', 'short-card'] as const)('says nothing in its %s form without a branch', form => {
    const { container } = overlay({ overlayForm: form, overlayBranch: null });

    expect(container.querySelector('[data-carried-branch]')).toBeNull();
  });

  it('says nothing on the in-list row, which is no copy', () => {
    const { container } = renderCard({ item: CARRIED, overlayBranch: BRANCH });

    expect(container.querySelector('[data-carried-branch]')).toBeNull();
  });

  it('keeps its shortCard form’s one height, with the line hung outside its flow and its root unclipped', () => {
    const { getByText, getByRole } = overlay({ overlayForm: 'short-card' });

    const root = getByRole('article', { name: CARRIED.title });
    const line = getByText(LINE).parentElement!;
    expect(root).toHaveStyle({ height: `${SHORT_CARD_HEIGHT_PX}px` });
    // The root is the box the drag measures and the one that turns, and clips nothing: the line is
    // its child, out of the flow, so it turns with the copy.
    expect(line.parentElement).toBe(root);
    expect(line).toHaveClass('absolute', 'pointer-events-none');
    expect(root).toHaveClass('rotate-2');
    expect(root).not.toHaveClass('overflow-hidden');
  });

  it('hangs outside the flow of its Stub form’s box, and moves with the box through the depths', () => {
    const projection: DescendantsProjection = {
      gap: 1,
      depth: 2,
      valid: true,
      resolved: { parentId: 'p', anchor: null },
      atOwnSlot: false,
      slotHidden: false,
      overflowBeside: null,
    };
    const { getByText } = overlay({ overlayForm: 'stub', overlayProjection: projection });

    const line = getByText(LINE).parentElement!;
    expect(line).toHaveClass('absolute', 'pointer-events-none');
    // It is a child of the box that indents to the depth, so the two step together.
    expect(line.parentElement).toHaveStyle({ marginLeft: `${descendantsIndentPx(2)}px` });
  });
});
