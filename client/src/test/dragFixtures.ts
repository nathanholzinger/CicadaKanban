// Test fixtures for drag geometry, shared by the drag tests (regions, the pop machine,
// band resolution, placement): the `Rect`, the three region kinds, the two `origin`
// shapes, a board's columns, and the DOM elements a region is read from. One place for
// each shape, so a new field lands in one fixture rather than in every test.

import type { CardListRegion, CardRegion, DescendantsRegion, Rect } from '../components/workflow/dragRegions';
import type { DropColumn } from '../components/workflow/dragStructure';
import {
  cardRegionKey,
  descendantsRegionKey,
  dragRegionProps,
  parseRegionKey,
} from '../components/workflow/dragRegions';
import type { Placement } from '../components/workflow/itemListOps';

export function rect(left: number, top: number, width: number, height: number): Rect {
  return { left, top, width, height, right: left + width, bottom: top + height };
}

// A card-list (column/sub-row) region keyed the way the board keys them
// (`kind` inferred from the key's own prefix, so no existing call site has
// to name it); the workphase facts default to one covered workphase named
// after the key. `contentRect` defaults to the same rect (no clipping — the
// common case a geometry-only test wants); `cardCount` defaults to 2, the
// "normal" band shape, so a fixture that doesn't care about the
// single-band/one-card exceptions doesn't have to spell it out;
// `parentRegionKey` is always null — Board is every card list's parent.
export function region(key: string, r: Rect, overrides: Partial<CardListRegion> = {}): CardListRegion {
  const parsed = parseRegionKey(key);
  return {
    key,
    kind: parsed?.kind === 'subrow' ? 'subrow' : 'column',
    containerId: key,
    rect: r,
    contentRect: r,
    columnId: parsed?.id ?? key,
    coveredWorkphaseIds: ['wp-' + key],
    targetWorkphaseId: 'wp-' + key,
    isTerminal: false,
    cardCount: 2,
    parentRegionKey: null,
    ...overrides,
  };
}

// A Card region: it attaches into the Card its key names, so `attachToCardId` is
// `cardId`. `parentRegionKey` is the key of the card list the Card sits in, in the
// `region()` fixture's own key convention.
export function cardRegion(
  cardId: string,
  r: Rect,
  parentRegionKey: string,
  overrides: Partial<CardRegion> = {},
): CardRegion {
  return {
    key: cardRegionKey(cardId),
    rect: r,
    contentRect: r,
    kind: 'card',
    attachToCardId: cardId,
    parentRegionKey,
    ...overrides,
  };
}

// A Card's Descendants region; its `parentRegionKey` is that same Card's own
// `card:<cardId>` key, always one layer up.
export function descendantsRegion(
  cardId: string,
  r: Rect,
  overrides: Partial<DescendantsRegion> = {},
): DescendantsRegion {
  return {
    key: descendantsRegionKey(cardId),
    rect: r,
    contentRect: r,
    kind: 'descendants',
    cardId,
    parentRegionKey: cardRegionKey(cardId),
    ...overrides,
  };
}

// The two `origin` shapes, where the drag genuinely started: a Free Card's
// own workphase, or a Stub's own real parent. Both always at `slot: 'existing'` — the only slot
// an `origin` is ever built with (a placement can name any slot; an origin
// never has to, since it's read, never assigned to render a live position).
export function freeOrigin(workphaseId: string): Placement {
  return { workphaseId, slot: 'existing' };
}

export function stubOrigin(parentId: string): Placement {
  return { parentId, slot: 'existing' };
}

// A merged column covering the given workphases — override any field,
// including `subRows` (for an expanded column, or per-row facts like
// `isTerminal`), for a differently-shaped board fixture.
export function column(id: string, workphaseIds: string[], overrides: Partial<DropColumn> = {}): DropColumn {
  return {
    id,
    broken: false,
    displayMode: 'merged',
    entryWorkphaseId: workphaseIds[0],
    subRows: workphaseIds.map(w => ({ workphase: { id: w } })),
    ...overrides,
  };
}

// Makes `el` report `r` as its measured rect; jsdom lays nothing out.
export function mockRect(el: HTMLElement, r: Rect): void {
  Object.defineProperty(el, 'getBoundingClientRect', { value: () => ({ ...r, x: r.left, y: r.top }) });
}

// A DOM element registered as a drag region the way a board registers one
// (`dragRegionProps`), for the tests that read the live DOM. `r`, when given, is
// the rect it measures; `children` nest inside it.
export function regionEl(key: string, r?: Rect, ...children: HTMLElement[]): HTMLElement {
  const el = document.createElement('div');
  for (const [name, value] of Object.entries(dragRegionProps(key))) el.setAttribute(name, value);
  if (r) mockRect(el, r);
  el.append(...children);
  return el;
}
