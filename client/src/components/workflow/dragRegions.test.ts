import { describe, it, expect, afterEach } from 'vitest';
import {
  CARD_LIST_REGION_SELECTOR,
  cardRegionKey,
  childRegionAt,
  columnRegionKey,
  containsPoint,
  descendantsCardIdOf,
  descendantsRegionKey,
  hasDetachedElements,
  hasNewRegionElements,
  isCardList,
  measureRegions,
  parseRegionKey,
  regionElements,
  resolveDragStructure,
  subrowContainerId,
  subrowRegionKey,
  type CardListRegion,
} from './dragRegions';
import { descendantsRegion, rect, region, column } from '../../test/dragFixtures';

describe('subrowContainerId', () => {
  it('encodes column and workphase into the droppable id', () => {
    expect(subrowContainerId('col-2', 'qa')).toBe('subrow::col-2::qa');
  });
});

// Two columns 100 wide with a 20px gap; column B is expanded into two
// sub-rows stacked with a 30px label gap between them.
const colA = region('column:a', rect(0, 0, 100, 400));
const subB1 = region('subrow:b:w1', rect(120, 0, 100, 150));
const subB2 = region('subrow:b:w2', rect(120, 180, 100, 150));
const regions = [colA, subB1, subB2];

// Story 4.1 Phase 0: `childRegionAt(regions, point, null)` is Board's own
// lookup — every column/sub-row's `parentRegionKey` is null — replacing
// the old, separate `nonCardRegionAt`. `cardRegionAt` (a locked
// column/sub-row's own Cards, `parentKey` set) is the same function; see
// the `resolveDragStructure / measureRegions` describe block below for a
// Card-kind region.
describe('parseRegionKey', () => {
  it.each([
    [columnRegionKey('c1'), { kind: 'column', id: 'c1' }],
    [subrowRegionKey('c1', 'w1'), { kind: 'subrow', id: 'c1', workphaseId: 'w1' }],
    [cardRegionKey('i1'), { kind: 'card', id: 'i1' }],
    [descendantsRegionKey('i1'), { kind: 'descendants', id: 'i1' }],
  ])('reads back %s', (key, parsed) => {
    expect(parseRegionKey(key)).toEqual(parsed);
  });

  it.each(['', 'column:', 'subrow:c1', 'card:i1:extra', 'board:x', 'nonsense'])('is null for %j', key => {
    expect(parseRegionKey(key)).toBeNull();
  });

  it("descendantsCardIdOf names a section's own Card, and nothing for any other key", () => {
    expect(descendantsCardIdOf(descendantsRegionKey('i1'))).toBe('i1');
    expect(descendantsCardIdOf(cardRegionKey('i1'))).toBeNull();
    expect(descendantsCardIdOf(null)).toBeNull();
  });
});

describe('childRegionAt (Board layer: parentKey null)', () => {
  it('hits the region containing the point', () => {
    expect(childRegionAt(regions, { x: 50, y: 200 }, null)).toBe(colA);
    expect(childRegionAt(regions, { x: 150, y: 100 }, null)).toBe(subB1);
    expect(childRegionAt(regions, { x: 150, y: 200 }, null)).toBe(subB2);
  });

  it("is null between columns (a gap is nobody's region)", () => {
    expect(childRegionAt(regions, { x: 110, y: 200 }, null)).toBeNull();
  });

  it('is a bounded box (reconciliation #20): above or below it is nowhere, not the column', () => {
    expect(childRegionAt(regions, { x: 50, y: -40 }, null)).toBeNull();
    expect(childRegionAt(regions, { x: 50, y: 900 }, null)).toBeNull();
  });

  it('is null in the gap between two sub-rows (DRAG-1.6: sub-rows are distinct contexts, and the gap belongs to neither)', () => {
    expect(childRegionAt(regions, { x: 150, y: 160 }, null)).toBeNull();
    expect(childRegionAt(regions, { x: 150, y: 179 }, null)).toBeNull();
    expect(childRegionAt(regions, { x: 150, y: 180 }, null)).toBe(subB2);
  });
});

// Story 6 Phase D: a `descendants` region is now a real zoom-in candidate
// from its own Card's context — Story 5, decision 3 had excluded it (no
// within-action existed for it yet). The pop-out chain
// (contextRegion.parentRegionKey, read directly by popSession.ts, never
// through this function) is unaffected either way.
describe("childRegionAt finds a Card's own Descendants section (Story 6 Phase D)", () => {
  it('returns it while hovering squarely inside it', () => {
    const P = 'card-p';
    const descendantsP = descendantsRegion(P, rect(0, 0, 100, 200));
    expect(childRegionAt([descendantsP], { x: 50, y: 100 }, cardRegionKey(P))).toBe(descendantsP);
  });
});

describe('containsPoint', () => {
  const r = rect(100, 100, 50, 50); // 100..150 both axes
  it('is inclusive of every edge, and false just outside one', () => {
    expect(containsPoint(r, { x: 100, y: 100 })).toBe(true);
    expect(containsPoint(r, { x: 150, y: 150 })).toBe(true);
    expect(containsPoint(r, { x: 99, y: 120 })).toBe(false);
    expect(containsPoint(r, { x: 120, y: 151 })).toBe(false);
  });
});

// Story 4.1 Phase 2 split `measureDragRegions` into a structural resolve
// (which elements exist, their kind/parent chain/scroll ancestor/column
// facts — everything that survives a layer change) and a scoped
// measurement (live rects and card count, for exactly the region matching
// `scope` plus its own children). Every case below runs both steps, the
// same way `useBoardDnd.ts` does.
describe('resolveDragStructure / measureRegions', () => {
  function mockRect(el: HTMLElement, r: ReturnType<typeof rect>) {
    Object.defineProperty(el, 'getBoundingClientRect', { value: () => ({ ...r, x: r.left, y: r.top }) });
  }

  // A sub-row's `[data-drag-region]` element sits inside its column's
  // `overflow-y-auto` scroll box (dragRegions.ts::findVerticalScrollAncestor
  // finds it by computed style, not by class name).
  function buildScrolledSubrow(subrowRectValue: ReturnType<typeof rect>, boxRectValue: ReturnType<typeof rect>) {
    const box = document.createElement('div');
    box.style.overflowY = 'auto';
    mockRect(box, boxRectValue);
    const subrowEl = document.createElement('div');
    subrowEl.setAttribute('data-drag-region', 'subrow:col-1:w1');
    mockRect(subrowEl, subrowRectValue);
    box.appendChild(subrowEl);
    document.body.appendChild(box);
    return box;
  }

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it("clips a sub-row's region to its column's visible scroll box", () => {
    buildScrolledSubrow(rect(0, 150, 300, 150), rect(0, 0, 300, 200)); // sub-row y 150..300, box y 0..200
    const structure = resolveDragStructure(document, [column('col-1', ['w1'], { displayMode: 'expanded' })]);
    const regions = measureRegions(structure, null); // Board scope: every column/sub-row
    expect(regions).toHaveLength(1);
    expect(regions[0].rect).toMatchObject({ top: 150, bottom: 200, height: 50 });
  });

  it('a sub-row scrolled fully out of view registers no region at all', () => {
    buildScrolledSubrow(rect(0, 400, 300, 150), rect(0, 0, 300, 200)); // sub-row y 400..550, box y 0..200
    const structure = resolveDragStructure(document, [column('col-1', ['w1'], { displayMode: 'expanded' })]);
    expect(measureRegions(structure, null)).toEqual([]);
  });

  // Story 4.1 Phase 0's one region-shape case per kind — column/sub-row
  // shape is already exercised throughout this file via the `region()`
  // fixture; this is the only place a `kind: 'card'` region is built.
  function buildCardInColumn(
    columnId: string,
    columnRectValue: ReturnType<typeof rect>,
    cardId: string,
    cardRectValue: ReturnType<typeof rect>,
  ) {
    const columnEl = document.createElement('div');
    columnEl.setAttribute('data-drag-region', `column:${columnId}`);
    mockRect(columnEl, columnRectValue);
    const cardEl = document.createElement('div');
    cardEl.setAttribute('data-drag-region', `card:${cardId}`);
    mockRect(cardEl, cardRectValue);
    columnEl.appendChild(cardEl);
    document.body.appendChild(columnEl);
  }

  it("registers a valid card as its own kind:'card' region, parented to the column that contains it — reachable by scoping to that column", () => {
    buildCardInColumn('col-1', rect(0, 0, 100, 400), 'item-1', rect(5, 10, 90, 50));
    const structure = resolveDragStructure(document, [column('col-1', ['w1'])], id => id === 'item-1');
    const regions = measureRegions(structure, 'column:col-1'); // the column itself, plus its own children
    expect(regions).toHaveLength(2);
    const card = regions.find(r => r.kind === 'card');
    expect(card).toMatchObject({
      key: 'card:item-1',
      kind: 'card',
      attachToCardId: 'item-1',
      parentRegionKey: 'column:col-1',
    });
  });

  it('an id isValidCard rejects resolves no region at all — same as an unresolvable column key', () => {
    buildCardInColumn('col-1', rect(0, 0, 100, 400), 'item-1', rect(5, 10, 90, 50));
    const structure = resolveDragStructure(document, [column('col-1', ['w1'])], () => false);
    const regions = measureRegions(structure, 'column:col-1');
    expect(regions.find(r => r.kind === 'card')).toBeUndefined();
  });

  // The point of the split (F5): a locked column never reads another
  // column's Cards, and Board never reads a Card at all — `measureRegions`
  // enforces this by construction (the scope filter), not by the caller
  // remembering to throw the rest away.
  it('scopes to exactly the context region and its own children — never a sibling column, never a foreign card', () => {
    buildCardInColumn('col-1', rect(0, 0, 100, 400), 'item-1', rect(5, 10, 90, 50));
    buildCardInColumn('col-2', rect(120, 0, 100, 400), 'item-2', rect(125, 10, 90, 50));
    const structure = resolveDragStructure(document, [column('col-1', ['w1']), column('col-2', ['w2'])], () => true);

    const scopedToCol1 = measureRegions(structure, 'column:col-1');
    expect(scopedToCol1.map(r => r.key).sort()).toEqual(['card:item-1', 'column:col-1']);

    const board = measureRegions(structure, null);
    expect(board.map(r => r.key).sort()).toEqual(['column:col-1', 'column:col-2']);
  });

  it('hasDetachedElements: false while every cached element is in the document, true once one is replaced', () => {
    buildCardInColumn('col-1', rect(0, 0, 100, 400), 'item-1', rect(5, 10, 90, 50));
    const structure = resolveDragStructure(document, [column('col-1', ['w1'])], () => true);
    expect(hasDetachedElements(structure)).toBe(false);

    const cardEl = document.querySelector('[data-drag-region="card:item-1"]')!;
    cardEl.replaceWith(cardEl.cloneNode());
    expect(hasDetachedElements(structure)).toBe(true);
    expect(hasDetachedElements(resolveDragStructure(document, [column('col-1', ['w1'])], () => true))).toBe(false);
  });

  // `pastColumnEnd` (tests/helpers/dragGesture.ts) aims at a column's last
  // card-list region; a Card's Descendants section sits after the column's
  // own element in document order.
  it('CARD_LIST_REGION_SELECTOR finds the column/sub-row regions, never a Card or a section nested in one', () => {
    buildCardInColumn('col-1', rect(0, 0, 100, 400), 'item-1', rect(5, 10, 90, 50));
    const section = document.createElement('div');
    section.setAttribute('data-drag-region', descendantsRegionKey('item-1'));
    document.querySelector(`[data-drag-region="${cardRegionKey('item-1')}"]`)!.appendChild(section);
    const found = [...document.querySelectorAll(CARD_LIST_REGION_SELECTOR)].map(el =>
      el.getAttribute('data-drag-region'),
    );
    expect(found).toEqual([columnRegionKey('col-1')]);
  });

  it('hasNewRegionElements: false for every element seen at resolve (one that resolved to nothing included), true once one mounts', () => {
    buildCardInColumn('col-1', rect(0, 0, 100, 400), 'item-1', rect(5, 10, 90, 50));
    const seen = new Set(regionElements(document));
    const structure = resolveDragStructure(document, [column('col-1', ['w1'])], () => false);
    expect(structure.some(s => s.kind === 'card')).toBe(false); // an invalid Card: seen, never resolved
    expect(hasNewRegionElements(document, seen)).toBe(false);

    const section = document.createElement('div');
    section.setAttribute('data-drag-region', descendantsRegionKey('item-1'));
    document.querySelector(`[data-drag-region="${cardRegionKey('item-1')}"]`)!.appendChild(section);
    expect(hasNewRegionElements(document, seen)).toBe(true);
    expect(hasNewRegionElements(document, new Set(regionElements(document)))).toBe(false);
  });

  // Story 4.1 Phase 4 (F6) — a merged column's `boundsRect` is its own outer
  // body (BoardColumn.tsx's `overflow-y-auto` wrapper — the same element
  // already resolved as the scroll ancestor for clipping), never the
  // content-sized region `rect` stays. A short column with room below its
  // last card is exactly the case that used to strand the exit clock.
  it("a merged column's boundsRect is its own outer body, taller than the content-sized region", () => {
    const box = document.createElement('div');
    box.style.overflowY = 'auto';
    mockRect(box, rect(0, 0, 300, 400)); // the outer body — y 0..400
    const columnEl = document.createElement('div');
    columnEl.setAttribute('data-drag-region', 'column:col-1');
    mockRect(columnEl, rect(0, 0, 300, 120)); // the content-sized region — y 0..120
    box.appendChild(columnEl);
    document.body.appendChild(box);

    const structure = resolveDragStructure(document, [column('col-1', ['w1'])]);
    const [region] = measureRegions(structure, null) as [CardListRegion];
    expect(region.rect).toMatchObject({ top: 0, bottom: 120 });
    expect(region.boundsRect).toMatchObject({ top: 0, bottom: 400 });
  });

  it("a sub-row's boundsRect is undefined — its own rect already is its full bound, nothing to add", () => {
    buildScrolledSubrow(rect(0, 0, 300, 150), rect(0, 0, 300, 200));
    const structure = resolveDragStructure(document, [column('col-1', ['w1'], { displayMode: 'expanded' })]);
    const [region] = measureRegions(structure, null) as [CardListRegion];
    expect(region.kind).toBe('subrow');
    expect(region.boundsRect).toBeUndefined();
  });

  it('a measured region carries no DOM handles — structural facts plus geometry, nothing else', () => {
    buildScrolledSubrow(rect(0, 0, 300, 150), rect(0, 0, 300, 200));
    const structure = resolveDragStructure(document, [column('col-1', ['w1'], { displayMode: 'expanded' })]);
    const [region] = measureRegions(structure, null);
    expect(region).not.toHaveProperty('dom');
    expect(region).not.toHaveProperty('element');
  });

  // Story 5, decisions 2/3 — a `descendants:<cardId>` element only ever
  // resolves for the drag's own `originCardId`; every other Card's section
  // (even one that would otherwise be a perfectly valid element) resolves
  // to nothing, which is what keeps it from ever becoming a zoom-in
  // candidate this story (childRegionAt's own guard covers the case where
  // it's the *origin's* own section, reached from the Card layer).
  function buildCardWithDescendants(
    columnId: string,
    cardId: string,
    cardRectValue: ReturnType<typeof rect>,
    descendantsRectValue: ReturnType<typeof rect>,
  ) {
    const columnEl = document.createElement('div');
    columnEl.setAttribute('data-drag-region', `column:${columnId}`);
    mockRect(columnEl, rect(0, 0, 300, 400));
    const cardEl = document.createElement('div');
    cardEl.setAttribute('data-drag-region', `card:${cardId}`);
    mockRect(cardEl, cardRectValue);
    const descendantsEl = document.createElement('div');
    descendantsEl.setAttribute('data-drag-region', `descendants:${cardId}`);
    mockRect(descendantsEl, descendantsRectValue);
    cardEl.appendChild(descendantsEl);
    columnEl.appendChild(cardEl);
    document.body.appendChild(columnEl);
  }

  it("resolves the origin's own Descendants section, parented to its Card", () => {
    buildCardWithDescendants('col-1', 'card-p', rect(0, 0, 100, 200), rect(0, 40, 100, 100));
    const structure = resolveDragStructure(
      document,
      [column('col-1', ['w1'])],
      id => id === 'card-p',
      'card-p', // originCardId
    );
    const regions = measureRegions(structure, cardRegionKey('card-p'));
    const descendants = regions.find(r => r.kind === 'descendants');
    expect(descendants).toMatchObject({
      key: descendantsRegionKey('card-p'),
      kind: 'descendants',
      cardId: 'card-p',
      parentRegionKey: cardRegionKey('card-p'),
    });
  });

  // Story 6 Phase D: a *different* Card's own section now resolves too,
  // gated on `isValidCard` exactly like a `card:` region already is — the
  // Story 5 restriction (origin-only) is gone.
  it("resolves a different Card's section too, when isValidCard says yes", () => {
    buildCardWithDescendants('col-1', 'card-q', rect(0, 0, 100, 200), rect(0, 40, 100, 100));
    const structure = resolveDragStructure(
      document,
      [column('col-1', ['w1'])],
      () => true,
      'card-p', // originCardId — a *different* card than the one with the section
    );
    const regions = measureRegions(structure, cardRegionKey('card-q'));
    expect(regions.find(r => r.kind === 'descendants')).toMatchObject({
      key: descendantsRegionKey('card-q'),
      cardId: 'card-q',
    });
  });

  it("resolves nothing for a different Card's section when isValidCard says no", () => {
    buildCardWithDescendants('col-1', 'card-q', rect(0, 0, 100, 200), rect(0, 40, 100, 100));
    const structure = resolveDragStructure(
      document,
      [column('col-1', ['w1'])],
      () => false,
      'card-p', // originCardId — a *different* card than the one with the section
    );
    const regions = measureRegions(structure, cardRegionKey('card-q'));
    expect(regions.find(r => r.kind === 'descendants')).toBeUndefined();
  });

  // Decision 2: the origin's own `card:` element resolves regardless of
  // `isValidCard` — a Stub must be able to pop back out to its own Card
  // even when that Card wouldn't be offered as a *target* for it.
  it("resolves the origin's own card: region even when isValidCard rejects it", () => {
    buildCardWithDescendants('col-1', 'card-p', rect(0, 0, 100, 200), rect(0, 40, 100, 100));
    const structure = resolveDragStructure(
      document,
      [column('col-1', ['w1'])],
      () => false, // every card is an invalid target for this drag
      'card-p',
    );
    const regions = measureRegions(structure, 'column:col-1');
    expect(regions.find(r => r.key === cardRegionKey('card-p'))).toBeDefined();
  });
});

describe('isCardList', () => {
  it('is true for a merged column and a sub-row, false for a Card (audit epic-3-5-story-4 #8)', () => {
    expect(isCardList(region('column:col-1', rect(0, 0, 100, 100)))).toBe(true);
    expect(isCardList(region('subrow:col-1:w1', rect(0, 0, 100, 100)))).toBe(true);
    const r = rect(0, 0, 100, 40);
    const card = {
      key: 'card:item-1',
      kind: 'card',
      rect: r,
      contentRect: r,
      attachToCardId: 'item-1',
      parentRegionKey: 'column:col-1',
    } as const;
    expect(isCardList(card)).toBe(false);
  });
});
