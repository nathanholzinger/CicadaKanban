import { describe, it, expect, afterEach } from 'vitest';
import {
  DRAG_PARENT_REGION_ATTR,
  DRAG_REGION_ATTR,
  cardRegionKey,
  columnRegionKey,
  descendantsRegionKey,
  subrowRegionKey,
  type CardListRegion,
  type Rect,
} from './dragRegions';
import {
  clipToVisible,
  hasDetachedElements,
  hasNewRegionElements,
  measureRegions,
  regionElements,
  resolveDragStructure,
} from './dragStructure';
import { column, mockRect, rect, regionEl } from '../../test/dragFixtures';

// Regions come from two steps: a structural resolve (which elements exist,
// their kind/parent chain/scroll ancestor/column facts — everything that
// survives a layer change) and a scoped measurement (live rects and card
// count, for exactly the region matching `scope` plus its own children).
// Most cases below run both steps; the two `has…` cases need only the first.
describe('resolveDragStructure / measureRegions', () => {
  // A scroll box (`overflow-y: auto`) measuring `r`, around `children`.
  function scrollBoxEl(r: Rect, ...children: HTMLElement[]) {
    const box = document.createElement('div');
    box.style.overflowY = 'auto';
    mockRect(box, r);
    box.append(...children);
    return box;
  }

  const elementOf = (key: string) => document.querySelector(`[${DRAG_REGION_ATTR}="${key}"]`)!;

  // A sub-row's region element sits inside its column's `overflow-y-auto` scroll
  // box (dragStructure.ts::findVerticalScrollAncestor finds it by computed style,
  // not by class name).
  function buildScrolledSubrow(subrowRect: Rect, boxRect: Rect) {
    document.body.append(scrollBoxEl(boxRect, regionEl(subrowRegionKey('col-1', 'w1'), subrowRect)));
  }

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it("DRAG-1.10: clips a sub-row's region to its column's visible scroll box", () => {
    buildScrolledSubrow(rect(0, 150, 300, 150), rect(0, 0, 300, 200)); // sub-row y 150..300, box y 0..200
    const structure = resolveDragStructure(document, [column('col-1', ['w1'], { displayMode: 'expanded' })]);
    const regions = measureRegions(structure, null); // Board scope: every column/sub-row
    expect(regions).toHaveLength(1);
    expect(regions[0].rect).toMatchObject({ top: 150, bottom: 200, height: 50 });
  });

  it('DRAG-1.10: a sub-row scrolled fully out of view registers no region at all', () => {
    buildScrolledSubrow(rect(0, 400, 300, 150), rect(0, 0, 300, 200)); // sub-row y 400..550, box y 0..200
    const structure = resolveDragStructure(document, [column('col-1', ['w1'], { displayMode: 'expanded' })]);
    expect(measureRegions(structure, null)).toEqual([]);
  });

  // A Card's region built from the DOM, so `resolveDragStructure` and
  // `measureRegions` produce the `kind: 'card'` shape end to end
  // (`dragFixtures.ts::cardRegion` builds one directly where the DOM isn't
  // the subject).
  function buildCardInColumn(columnId: string, columnRect: Rect, cardId: string, cardRect: Rect) {
    document.body.append(regionEl(columnRegionKey(columnId), columnRect, regionEl(cardRegionKey(cardId), cardRect)));
  }

  it("registers a valid card as its own kind:'card' region, parented to the column that contains it — reachable by scoping to that column", () => {
    buildCardInColumn('col-1', rect(0, 0, 100, 400), 'item-1', rect(5, 10, 90, 50));
    const structure = resolveDragStructure(document, [column('col-1', ['w1'])], id => id === 'item-1');
    const regions = measureRegions(structure, columnRegionKey('col-1')); // the column itself, plus its own children
    expect(regions).toHaveLength(2);
    const card = regions.find(r => r.kind === 'card');
    expect(card).toMatchObject({
      key: cardRegionKey('item-1'),
      kind: 'card',
      attachToCardId: 'item-1',
      parentRegionKey: columnRegionKey('col-1'),
    });
  });

  it('DRAG-1.7, DRAG-1.8: an id isValidCard rejects resolves no region at all — same as an unresolvable column key', () => {
    buildCardInColumn('col-1', rect(0, 0, 100, 400), 'item-1', rect(5, 10, 90, 50));
    const structure = resolveDragStructure(document, [column('col-1', ['w1'])], () => false);
    const regions = measureRegions(structure, columnRegionKey('col-1'));
    expect(regions.find(r => r.kind === 'card')).toBeUndefined();
  });

  // A locked column never reads another column's Cards, and Board never
  // reads a Card at all — `measureRegions` enforces this by construction
  // (the scope filter), not by the caller remembering to throw the rest
  // away.
  it('scopes to exactly the context region and its own children — never a sibling column, never a foreign card', () => {
    buildCardInColumn('col-1', rect(0, 0, 100, 400), 'item-1', rect(5, 10, 90, 50));
    buildCardInColumn('col-2', rect(120, 0, 100, 400), 'item-2', rect(125, 10, 90, 50));
    const structure = resolveDragStructure(document, [column('col-1', ['w1']), column('col-2', ['w2'])], () => true);

    const scopedToCol1 = measureRegions(structure, columnRegionKey('col-1'));
    expect(scopedToCol1.map(r => r.key).sort()).toEqual([cardRegionKey('item-1'), columnRegionKey('col-1')]);

    const board = measureRegions(structure, null);
    expect(board.map(r => r.key).sort()).toEqual([columnRegionKey('col-1'), columnRegionKey('col-2')]);
  });

  it('hasDetachedElements: false while every cached element is in the document, true once one is replaced', () => {
    buildCardInColumn('col-1', rect(0, 0, 100, 400), 'item-1', rect(5, 10, 90, 50));
    const structure = resolveDragStructure(document, [column('col-1', ['w1'])], () => true);
    expect(hasDetachedElements(structure)).toBe(false);

    const cardEl = elementOf(cardRegionKey('item-1'));
    cardEl.replaceWith(cardEl.cloneNode());
    expect(hasDetachedElements(structure)).toBe(true);
    expect(hasDetachedElements(resolveDragStructure(document, [column('col-1', ['w1'])], () => true))).toBe(false);
  });

  it('hasNewRegionElements: false for every element seen at resolve (one that resolved to nothing included), true once one mounts', () => {
    buildCardInColumn('col-1', rect(0, 0, 100, 400), 'item-1', rect(5, 10, 90, 50));
    const seen = new Set(regionElements(document));
    const structure = resolveDragStructure(document, [column('col-1', ['w1'])], () => false);
    expect(structure.some(s => s.kind === 'card')).toBe(false); // an invalid Card: seen, never resolved
    expect(hasNewRegionElements(document, seen)).toBe(false);

    elementOf(cardRegionKey('item-1')).append(regionEl(descendantsRegionKey('item-1')));
    expect(hasNewRegionElements(document, seen)).toBe(true);
    expect(hasNewRegionElements(document, new Set(regionElements(document)))).toBe(false);
  });

  // A merged column's `boundsRect` is its outer body: the same element it
  // resolves as its scroll ancestor for clipping, never the content-sized
  // region `rect`. A short column with room below its last card is where
  // the two differ.
  it("DRAG-1.25: a merged column's boundsRect is its own outer body, taller than the content-sized region", () => {
    const outerBody = rect(0, 0, 300, 400); // y 0..400
    const contentSized = rect(0, 0, 300, 120); // the region itself — y 0..120
    document.body.append(scrollBoxEl(outerBody, regionEl(columnRegionKey('col-1'), contentSized)));

    const structure = resolveDragStructure(document, [column('col-1', ['w1'])]);
    const [region] = measureRegions(structure, null) as [CardListRegion];
    expect(region.rect).toMatchObject({ top: 0, bottom: 120 });
    expect(region.boundsRect).toMatchObject({ top: 0, bottom: 400 });
  });

  it("DRAG-1.25: a sub-row's boundsRect is undefined — its own rect already is its full bound, nothing to add", () => {
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

  // A `descendants:<cardId>` element resolves for the drag's own
  // `originCardId`, and for any other Card only when `isValidCard` accepts
  // it, the same gate as a `card:` region.
  function buildCardWithDescendants(columnId: string, cardId: string, cardRect: Rect, descendantsRect: Rect) {
    const card = regionEl(cardRegionKey(cardId), cardRect, regionEl(descendantsRegionKey(cardId), descendantsRect));
    document.body.append(regionEl(columnRegionKey(columnId), rect(0, 0, 300, 400), card));
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

  // The hierarchy modal is drawn apart from its Card, so no walk up the DOM from its list
  // reaches the Card: the element names it.
  it('a section element outside its Card in the DOM resolves under the parent it names', () => {
    const card = regionEl(cardRegionKey('card-p'), rect(0, 0, 100, 200));
    document.body.append(regionEl(columnRegionKey('col-1'), rect(0, 0, 300, 400), card));
    const apart = regionEl(descendantsRegionKey('card-p'), rect(500, 0, 200, 300));
    apart.setAttribute(DRAG_PARENT_REGION_ATTR, cardRegionKey('card-p'));
    document.body.append(apart);

    const structure = resolveDragStructure(document, [column('col-1', ['w1'])], () => true, 'card-p');
    const regions = measureRegions(structure, cardRegionKey('card-p'));
    expect(regions.find(r => r.kind === 'descendants')).toMatchObject({
      key: descendantsRegionKey('card-p'),
      cardId: 'card-p',
      parentRegionKey: cardRegionKey('card-p'),
      rect: rect(500, 0, 200, 300),
    });
  });

  it('a section element outside any region that names no parent resolves to nothing', () => {
    document.body.append(regionEl(descendantsRegionKey('card-p'), rect(500, 0, 200, 300)));
    const structure = resolveDragStructure(document, [], () => true, 'card-p');
    expect(structure).toEqual([]);
  });

  // The origin's own `card:` element resolves regardless of `isValidCard`:
  // a Stub must be able to pop back out to its own Card even when that Card
  // wouldn't be offered as a *target* for it.
  it("resolves the origin's own card: region even when isValidCard rejects it", () => {
    buildCardWithDescendants('col-1', 'card-p', rect(0, 0, 100, 200), rect(0, 40, 100, 100));
    const structure = resolveDragStructure(
      document,
      [column('col-1', ['w1'])],
      () => false, // every card is an invalid target for this drag
      'card-p',
    );
    const regions = measureRegions(structure, columnRegionKey('col-1'));
    expect(regions.find(r => r.key === cardRegionKey('card-p'))).toBeDefined();
  });
});

// A real browser's DOMRect exposes its fields as accessor getters on
// `DOMRect.prototype`, not as the instance's own enumerable properties
// (unlike jsdom's, and unlike a plain-object fixture) — so `{ ...domRect }`
// silently drops every field instead of throwing: a sub-row region would
// resolve with `left`/`right`/`width` missing, so no point could ever match
// it. Shared by every test below that needs to prove a Rect-shaped function
// doesn't reintroduce the hazard.
function fakeDomRect(values: Rect): Rect {
  return Object.create({
    get top() {
      return values.top;
    },
    get bottom() {
      return values.bottom;
    },
    get left() {
      return values.left;
    },
    get right() {
      return values.right;
    },
    get width() {
      return values.width;
    },
    get height() {
      return values.height;
    },
  });
}

// A region's rect is read from `getBoundingClientRect`, which a browser answers with a
// DOMRect.
describe('measureRegions over a DOMRect', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('keeps every field of the rect from an element whose getBoundingClientRect returns a DOMRect-shaped object', () => {
    const el = regionEl(columnRegionKey('col-1'));
    const domRect = fakeDomRect(rect(10, 50, 80, 200));
    Object.defineProperty(el, 'getBoundingClientRect', { value: () => domRect });
    document.body.append(el);
    expect({ ...domRect }).toEqual({}); // confirms the shape actually exercises the hazard

    const [region] = measureRegions(resolveDragStructure(document, [column('col-1', ['w1'])]), null);
    const measured = { top: 50, bottom: 250, left: 10, right: 90, width: 80, height: 200 };
    expect(region.rect).toEqual(measured);
    expect(region.contentRect).toEqual(measured);
  });
});

// A sub-row is clipped to its column's visible scroll box, not just bounded
// by its own extent.
describe('DRAG-1.10: clipToVisible', () => {
  const bounds = rect(0, 100, 200, 200); // the scroll ancestor's own visible box, y 100..300

  it('clips the part of the rect outside the visible box, on either edge or both', () => {
    const partlyAbove = rect(0, 50, 200, 100); // y 50..150
    expect(clipToVisible(partlyAbove, bounds)).toEqual({ ...partlyAbove, top: 100, bottom: 150, height: 50 });

    const partlyBelow = rect(0, 250, 200, 100); // y 250..350
    expect(clipToVisible(partlyBelow, bounds)).toEqual({ ...partlyBelow, bottom: 300, height: 50 });

    const taller = rect(0, 50, 200, 300); // y 50..350 — taller than the box on both sides
    expect(clipToVisible(taller, bounds)).toEqual({ ...taller, top: 100, bottom: 300, height: 200 });
  });

  it('is null once none of the rect is left visible', () => {
    expect(clipToVisible(rect(0, 310, 200, 50), bounds)).toBeNull(); // fully below
    expect(clipToVisible(rect(0, 0, 200, 90), bounds)).toBeNull(); // fully above
  });

  it('keeps left/right/width from a DOMRect-shaped object, not just a plain one', () => {
    const domRect = fakeDomRect(rect(10, 50, 80, 200)); // left 10, top 50, width 80, height 200 -> bottom 250
    expect({ ...domRect }).toEqual({}); // confirms the shape actually exercises the hazard
    expect(clipToVisible(domRect, bounds)).toEqual({
      top: 100,
      bottom: 250,
      left: 10,
      right: 90,
      width: 80,
      height: 150,
    });
  });
});
