import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  DRAG_BOUNDS_ATTR,
  DRAG_CARD_ATTR,
  DRAG_PARENT_CARD_ATTR,
  DRAG_REGION_ATTR,
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

  // A Card's Descendants region built from the DOM, on the Card's root element, so
  // `resolveDragStructure` and `measureRegions` produce the `kind: 'descendants'` shape end
  // to end (`dragFixtures.ts::descendantsRegion` builds one directly where the DOM isn't the
  // subject). The Card holds nothing: a childless Card has the region all the same.
  function buildCardInColumn(columnId: string, columnRect: Rect, cardId: string, cardRect: Rect) {
    document.body.append(
      regionEl(columnRegionKey(columnId), columnRect, regionEl(descendantsRegionKey(cardId), cardRect)),
    );
  }

  it("registers a valid card's Descendants region on its root, parented to the column that contains it — reachable by scoping to that column", () => {
    buildCardInColumn('col-1', rect(0, 0, 100, 400), 'item-1', rect(5, 10, 90, 50));
    const structure = resolveDragStructure(document, [column('col-1', ['w1'])], id => id === 'item-1');
    const regions = measureRegions(structure, columnRegionKey('col-1')); // the column itself, plus its own children
    expect(regions).toHaveLength(2);
    const card = regions.find(r => r.kind === 'descendants');
    expect(card).toMatchObject({
      key: descendantsRegionKey('item-1'),
      kind: 'descendants',
      cardId: 'item-1',
      parentRegionKey: columnRegionKey('col-1'),
      rect: rect(5, 10, 90, 50),
    });
  });

  it('DRAG-1.7, DRAG-1.8: an id isValidCard rejects resolves no region at all — same as an unresolvable column key', () => {
    buildCardInColumn('col-1', rect(0, 0, 100, 400), 'item-1', rect(5, 10, 90, 50));
    const structure = resolveDragStructure(document, [column('col-1', ['w1'])], () => false);
    const regions = measureRegions(structure, columnRegionKey('col-1'));
    expect(regions.find(r => r.kind === 'descendants')).toBeUndefined();
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
    expect(scopedToCol1.map(r => r.key).sort()).toEqual([columnRegionKey('col-1'), descendantsRegionKey('item-1')]);

    const board = measureRegions(structure, null);
    expect(board.map(r => r.key).sort()).toEqual([columnRegionKey('col-1'), columnRegionKey('col-2')]);
  });

  it("a locked Card's layer reads its own region and nothing else: no children to zoom into", () => {
    buildCardInColumn('col-1', rect(0, 0, 100, 400), 'item-1', rect(5, 10, 90, 50));
    buildCardInColumn('col-1', rect(0, 0, 100, 400), 'item-2', rect(5, 70, 90, 50));
    const structure = resolveDragStructure(document, [column('col-1', ['w1'])], () => true);
    const layer = measureRegions(structure, descendantsRegionKey('item-1'));
    expect(layer.map(r => r.key)).toEqual([descendantsRegionKey('item-1')]);
  });

  it('hasDetachedElements: false while every cached element is in the document, true once one is replaced', () => {
    buildCardInColumn('col-1', rect(0, 0, 100, 400), 'item-1', rect(5, 10, 90, 50));
    const structure = resolveDragStructure(document, [column('col-1', ['w1'])], () => true);
    expect(hasDetachedElements(structure)).toBe(false);

    const cardEl = elementOf(descendantsRegionKey('item-1'));
    cardEl.replaceWith(cardEl.cloneNode());
    expect(hasDetachedElements(structure)).toBe(true);
    expect(hasDetachedElements(resolveDragStructure(document, [column('col-1', ['w1'])], () => true))).toBe(false);
  });

  it('hasNewRegionElements: false for every element seen at resolve (one that resolved to nothing included), true once one mounts', () => {
    buildCardInColumn('col-1', rect(0, 0, 100, 400), 'item-1', rect(5, 10, 90, 50));
    const seen = new Set(regionElements(document));
    const structure = resolveDragStructure(document, [column('col-1', ['w1'])], () => false);
    expect(structure.some(s => s.kind === 'descendants')).toBe(false); // an invalid Card: seen, never resolved
    expect(hasNewRegionElements(document, seen)).toBe(false);

    // The hierarchy modal's list mounting is the one a layer change brings.
    document.body.append(regionEl(descendantsRegionKey('item-2')));
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
  // `originCardId`, and for any other Card only when `isValidCard` accepts it.
  it("resolves the origin's own Descendants region, parented to its column", () => {
    buildCardInColumn('col-1', rect(0, 0, 300, 400), 'card-p', rect(0, 0, 100, 200));
    const structure = resolveDragStructure(
      document,
      [column('col-1', ['w1'])],
      id => id === 'card-p',
      'card-p', // originCardId
    );
    const regions = measureRegions(structure, columnRegionKey('col-1'));
    const descendants = regions.find(r => r.kind === 'descendants');
    expect(descendants).toMatchObject({
      key: descendantsRegionKey('card-p'),
      kind: 'descendants',
      cardId: 'card-p',
      parentRegionKey: columnRegionKey('col-1'),
    });
  });

  it("resolves a different Card's region too, when isValidCard says yes", () => {
    buildCardInColumn('col-1', rect(0, 0, 300, 400), 'card-q', rect(0, 0, 100, 200));
    const structure = resolveDragStructure(
      document,
      [column('col-1', ['w1'])],
      () => true,
      'card-p', // originCardId — a *different* card than the one with the region
    );
    const regions = measureRegions(structure, columnRegionKey('col-1'));
    expect(regions.find(r => r.kind === 'descendants')).toMatchObject({
      key: descendantsRegionKey('card-q'),
      cardId: 'card-q',
    });
  });

  it("resolves nothing for a different Card's region when isValidCard says no", () => {
    buildCardInColumn('col-1', rect(0, 0, 300, 400), 'card-q', rect(0, 0, 100, 200));
    const structure = resolveDragStructure(
      document,
      [column('col-1', ['w1'])],
      () => false,
      'card-p', // originCardId — a *different* card than the one with the region
    );
    const regions = measureRegions(structure, columnRegionKey('col-1'));
    expect(regions.find(r => r.kind === 'descendants')).toBeUndefined();
  });

  // The hierarchy modal is drawn apart from its Card, so no walk up the DOM from its list
  // reaches the Card: the element names the Card, and the column is read off the Card's own
  // element, which no longer carries the region.
  function buildCardHeldByModal(cardId: string) {
    const card = document.createElement('div');
    card.setAttribute(DRAG_CARD_ATTR, cardId);
    document.body.append(regionEl(columnRegionKey('col-1'), rect(0, 0, 300, 400), card));
  }

  it('a Descendants element outside its Card in the DOM resolves under the column its Card sits in', () => {
    buildCardHeldByModal('card-p');
    const apart = regionEl(descendantsRegionKey('card-p'), rect(500, 0, 200, 300));
    apart.setAttribute(DRAG_PARENT_CARD_ATTR, 'card-p');
    document.body.append(apart);

    const structure = resolveDragStructure(document, [column('col-1', ['w1'])], () => true, 'card-p');
    const regions = measureRegions(structure, columnRegionKey('col-1'));
    expect(regions.find(r => r.kind === 'descendants')).toMatchObject({
      key: descendantsRegionKey('card-p'),
      cardId: 'card-p',
      parentRegionKey: columnRegionKey('col-1'),
      rect: rect(500, 0, 200, 300),
    });
  });

  it('finds the column of the Card it names, not of another Card', () => {
    buildCardHeldByModal('card-q');
    const apart = regionEl(descendantsRegionKey('card-p'), rect(500, 0, 200, 300));
    apart.setAttribute(DRAG_PARENT_CARD_ATTR, 'card-p');
    document.body.append(apart);

    // No Card element for card-p is drawn, so the list has no column to be parented to.
    const structure = resolveDragStructure(document, [column('col-1', ['w1'])], () => true, 'card-p');
    expect(structure.find(r => r.kind === 'descendants')).toBeUndefined();
  });

  // The modal's list is the region and its dialog the bounds: the header above the list is no
  // region of its own, but a cursor over it is still in the modal.
  it('DRAG-7.10: a Descendants element inside a marked dialog gets that dialog’s box as its boundsRect', () => {
    const key = descendantsRegionKey('card-p');
    const list = regionEl(key, rect(520, 100, 200, 300));
    list.setAttribute(DRAG_PARENT_CARD_ATTR, 'card-p');
    const dialog = document.createElement('div');
    dialog.setAttribute(DRAG_BOUNDS_ATTR, key);
    mockRect(dialog, rect(500, 0, 240, 420));
    dialog.append(list);
    buildCardHeldByModal('card-p');
    document.body.append(dialog);

    const structure = resolveDragStructure(document, [column('col-1', ['w1'])], () => true, 'card-p');
    const section = measureRegions(structure, columnRegionKey('col-1')).find(r => r.kind === 'descendants');
    expect(section).toMatchObject({ rect: rect(520, 100, 200, 300), boundsRect: rect(500, 0, 240, 420) });

    // Gone with the modal: the structure reads as detached, so a sample re-resolves.
    expect(hasDetachedElements(structure)).toBe(false);
    dialog.remove();
    expect(hasDetachedElements(structure)).toBe(true);
  });

  // The bounds elements are read once for the resolve and matched to regions by key: a Card's
  // own region takes none, an element marked for a region that isn't there is ignored, and the
  // first element marked for a key is the one used.
  it('DRAG-7.10: each Descendants region takes the bounds element marked for its own key', () => {
    buildCardInColumn('col-1', rect(0, 0, 300, 400), 'card-q', rect(0, 0, 100, 200));
    const list = regionEl(descendantsRegionKey('card-p'), rect(520, 100, 200, 300));
    list.setAttribute(DRAG_PARENT_CARD_ATTR, 'card-p');
    const dialog = (key: string, r: Rect) => {
      const el = document.createElement('div');
      el.setAttribute(DRAG_BOUNDS_ATTR, key);
      mockRect(el, r);
      return el;
    };
    const first = dialog(descendantsRegionKey('card-p'), rect(500, 0, 240, 420));
    first.append(list);
    buildCardHeldByModal('card-p');
    document.body.append(
      dialog(descendantsRegionKey('nobody'), rect(0, 0, 10, 10)),
      first,
      dialog(descendantsRegionKey('card-p'), rect(900, 0, 50, 50)),
    );

    const structure = resolveDragStructure(document, [column('col-1', ['w1'])], () => true, 'card-p');
    const [card, modalList] = ['card-q', 'card-p'].map(id =>
      measureRegions(structure, columnRegionKey('col-1')).find(r => r.key === descendantsRegionKey(id)),
    );
    expect(card?.boundsRect).toBeUndefined();
    expect(modalList?.boundsRect).toEqual(rect(500, 0, 240, 420));
  });

  it('looks for the bounds elements once per resolve, however many Cards are drawn', () => {
    for (const id of ['a', 'b', 'c'])
      buildCardInColumn(`col-${id}`, rect(0, 0, 300, 400), `card-${id}`, rect(0, 0, 100, 50));
    const queries = [vi.spyOn(document, 'querySelector'), vi.spyOn(document, 'querySelectorAll')];

    resolveDragStructure(
      document,
      ['a', 'b', 'c'].map(id => column(`col-${id}`, ['w1'])),
      () => true,
    );

    const searchedForBounds = queries
      .flatMap(spy => spy.mock.calls.map(([selector]) => String(selector)))
      .filter(s => s.includes(DRAG_BOUNDS_ATTR));
    vi.restoreAllMocks();
    expect(searchedForBounds).toHaveLength(1);
  });

  it("a Card's own region has no boundsRect", () => {
    buildCardInColumn('col-1', rect(0, 0, 300, 400), 'card-p', rect(0, 0, 100, 200));
    const structure = resolveDragStructure(document, [column('col-1', ['w1'])], () => true, 'card-p');
    const section = measureRegions(structure, columnRegionKey('col-1')).find(r => r.kind === 'descendants');
    expect(section).toBeDefined();
    expect(section?.boundsRect).toBeUndefined();
  });

  it('a Descendants element outside any region that names no Card resolves to nothing', () => {
    document.body.append(regionEl(descendantsRegionKey('card-p'), rect(500, 0, 200, 300)));
    const structure = resolveDragStructure(document, [], () => true, 'card-p');
    expect(structure).toEqual([]);
  });

  // The origin's own `descendants:` element resolves regardless of `isValidCard`:
  // a Stub must be able to zoom back into its own Card even when that Card
  // wouldn't be offered as a *target* for it.
  it("resolves the origin's own Descendants region even when isValidCard rejects it", () => {
    buildCardInColumn('col-1', rect(0, 0, 300, 400), 'card-p', rect(0, 0, 100, 200));
    const structure = resolveDragStructure(
      document,
      [column('col-1', ['w1'])],
      () => false, // every card is an invalid target for this drag
      'card-p',
    );
    const regions = measureRegions(structure, columnRegionKey('col-1'));
    expect(regions.find(r => r.key === descendantsRegionKey('card-p'))).toBeDefined();
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
