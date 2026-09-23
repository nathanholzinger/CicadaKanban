// rect/region test fixtures for drag geometry (Rect, CardListRegion, DropColumn).

import type {
  CardListRegion,
  CardRegion,
  DescendantsRegion,
  DropColumn,
  Rect,
} from '../components/workflow/dragRegions';
import { cardRegionKey, descendantsRegionKey } from '../components/workflow/dragRegions';
import type { Placement } from '../components/workflow/itemListOps';

// Shared geometry fixtures for the Epic 3.5 drag tests (regions, the pop
// machine, band resolution) — one place for the rect/region shape, same
// reasoning as itemFixture.ts.

export function rect(left: number, top: number, width: number, height: number): Rect {
  return { left, top, width, height, right: left + width, bottom: top + height };
}

// A card-list (column/sub-row) region keyed the way the board keys them
// (`kind` inferred from the key's own prefix, so no existing call site has
// to name it); the workphase facts default to one covered workphase named
// after the key. `contentRect` defaults to the same rect (no clipping — the
// common case a geometry-only test wants); `cardCount` defaults to 2, the
// "normal" band shape, so a fixture that doesn't care about Story 8's
// single-band/one-card exceptions doesn't have to spell it out;
// `parentRegionKey` is always null — Board is every card list's parent.
// `cardRegion`/`descendantsRegion` below cover the other two kinds — see
// dragRegions.test.ts's own DOM-built cases where the structural
// resolution itself (not just the region shape) is what's under test.
export function region(key: string, r: Rect, overrides: Partial<CardListRegion> = {}): CardListRegion {
  return {
    key,
    kind: key.startsWith('subrow:') ? 'subrow' : 'column',
    containerId: key,
    rect: r,
    contentRect: r,
    columnId: key.split(':')[1],
    coveredWorkphaseIds: ['wp-' + key],
    targetWorkphaseId: 'wp-' + key,
    isTerminal: false,
    cardCount: 2,
    parentRegionKey: null,
    ...overrides,
  };
}

// A Card region — `attachToCardId` defaults to `cardId` (the ordinary
// case: the region attaches into the same Card its key names); override it
// for a fixture that deliberately wants the two to differ. `parentRegionKey`
// defaults to the same `region()` fixture's own key convention (a card
// list) since that's what every existing call site passed by hand (audit
// epic-3-5-story-5 #12 — this and `descendantsRegion` below discharge the
// Story 10/Story 4 #3 fixture deferral early, since Story 5 needed both).
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

// A Card's Descendants region — `parentRegionKey` defaults to that same
// Card's own `card:<cardId>` key (§1.1: always one layer up), overridable
// for a fixture that wants to name a differently-keyed parent directly.
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

// The two `origin` shapes every Story 5 fixture needs (Story 4.1 Phase 3's
// "where the drag genuinely started"): a Free Card's own workphase, or a
// Stub's own real parent. Both always at `slot: 'existing'` — the only slot
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
// `isTerminal`), for a differently-shaped board fixture. Shared by
// boardDndUtils.test.ts and dragRegions.test.ts, which each built this
// independently (audit epic-3-5-story-3-reconciled #8).
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
