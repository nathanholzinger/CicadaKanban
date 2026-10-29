import { describe, it, expect, afterEach } from 'vitest';
import {
  CARD_LIST_REGION_SELECTOR,
  DRAG_PARENT_CARD_ATTR,
  DRAG_REGION_ATTR,
  childRegionAt,
  columnRegionKey,
  containsPoint,
  descendantsCardIdOf,
  descendantsRegionKey,
  dragRegionProps,
  isCardList,
  isModalList,
  parseRegionKey,
  subrowContainerId,
  subrowRegionKey,
} from './dragRegions';
import { descendantsRegion, rect, region, regionEl } from '../../test/dragFixtures';

describe('dragRegionProps', () => {
  it('registers an element under its key, and names its Card only when it is given one', () => {
    expect(dragRegionProps('descendants:p')).toEqual({ [DRAG_REGION_ATTR]: 'descendants:p' });
    expect(dragRegionProps('descendants:p', 'p')).toEqual({
      [DRAG_REGION_ATTR]: 'descendants:p',
      [DRAG_PARENT_CARD_ATTR]: 'p',
    });
  });
});

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

describe('parseRegionKey', () => {
  it.each([
    [columnRegionKey('c1'), { kind: 'column', id: 'c1' }],
    [subrowRegionKey('c1', 'w1'), { kind: 'subrow', id: 'c1', workphaseId: 'w1' }],
    [descendantsRegionKey('i1'), { kind: 'descendants', id: 'i1' }],
  ])('reads back %s', (key, parsed) => {
    expect(parseRegionKey(key)).toEqual(parsed);
  });

  // 'card:i1' was a region key before the Card stopped being a layer of its own.
  it.each(['', 'column:', 'subrow:c1', 'card:i1', 'descendants:i1:extra', 'board:x', 'nonsense'])(
    'is null for %j',
    key => {
      expect(parseRegionKey(key)).toBeNull();
    },
  );

  it("descendantsCardIdOf names a layer's own Card, and nothing for any other key", () => {
    expect(descendantsCardIdOf(descendantsRegionKey('i1'))).toBe('i1');
    expect(descendantsCardIdOf(columnRegionKey('i1'))).toBeNull();
    expect(descendantsCardIdOf(null)).toBeNull();
  });
});

// `childRegionAt(regions, point, null)` is Board's lookup, since every
// column/sub-row's `parentRegionKey` is null. A locked column/sub-row's own
// Cards aren't found here: they come from the named relation,
// `popSession.ts::namedCardCandidate`.
describe('childRegionAt (Board layer: parentKey null)', () => {
  it('hits the region containing the point', () => {
    expect(childRegionAt(regions, { x: 50, y: 200 }, null)).toBe(colA);
    expect(childRegionAt(regions, { x: 150, y: 100 }, null)).toBe(subB1);
    expect(childRegionAt(regions, { x: 150, y: 200 }, null)).toBe(subB2);
  });

  it("is null between columns (a gap is nobody's region)", () => {
    expect(childRegionAt(regions, { x: 110, y: 200 }, null)).toBeNull();
  });

  it('is a bounded box: above or below it is nowhere, not the column', () => {
    expect(childRegionAt(regions, { x: 50, y: -40 }, null)).toBeNull();
    expect(childRegionAt(regions, { x: 50, y: 900 }, null)).toBeNull();
  });

  it('DRAG-1.6: is null in the gap between two sub-rows (sub-rows are distinct contexts, and the gap belongs to neither)', () => {
    expect(childRegionAt(regions, { x: 150, y: 160 }, null)).toBeNull();
    expect(childRegionAt(regions, { x: 150, y: 179 }, null)).toBeNull();
    expect(childRegionAt(regions, { x: 150, y: 180 }, null)).toBe(subB2);
  });
});

describe("a Card's Descendants region is never found as Board's child", () => {
  it('finds the column under a Card, not the Card: the Card is reached by the named relation only', () => {
    const column = region('column:a', rect(0, 0, 100, 400));
    const card = descendantsRegion('card-p', rect(10, 10, 80, 100), column.key);
    expect(childRegionAt([column, card], { x: 50, y: 50 }, null)).toBe(column);
    expect(childRegionAt([card], { x: 50, y: 50 }, null)).toBeNull();
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

describe('isCardList', () => {
  it("is true for a merged column and a sub-row, false for a Card's Descendants region", () => {
    expect(isCardList(region(columnRegionKey('col-1'), rect(0, 0, 100, 100)))).toBe(true);
    expect(isCardList(region(subrowRegionKey('col-1', 'w1'), rect(0, 0, 100, 100)))).toBe(true);
    expect(isCardList(descendantsRegion('item-1', rect(0, 0, 100, 40), columnRegionKey('col-1')))).toBe(false);
  });
});

describe('isModalList', () => {
  it("is true for a Descendants region with a bounds box (the modal's list), false for a Card's own box", () => {
    const parent = columnRegionKey('col-1');
    expect(
      isModalList(descendantsRegion('p', rect(0, 100, 200, 300), parent, { boundsRect: rect(0, 0, 200, 400) })),
    ).toBe(true);
    expect(isModalList(descendantsRegion('p', rect(0, 0, 100, 200), parent))).toBe(false);
  });

  it('is false for a card list, which has a bounds box of its own', () => {
    expect(
      isModalList(region(columnRegionKey('col-1'), rect(0, 0, 100, 100), { boundsRect: rect(0, 0, 100, 400) })),
    ).toBe(false);
  });
});

// Also read by `dragGesture.ts::pastColumnEnd`, which aims at a column's last card-list
// region; a Card's Descendants region sits after the column's own element in document
// order.
describe('CARD_LIST_REGION_SELECTOR', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it("finds the column/sub-row regions, never a Card's Descendants region nested in one", () => {
    const card = regionEl(descendantsRegionKey('item-1'));
    document.body.append(regionEl(columnRegionKey('col-1'), undefined, card));
    const found = [...document.querySelectorAll(CARD_LIST_REGION_SELECTOR)].map(el =>
      el.getAttribute(DRAG_REGION_ATTR),
    );
    expect(found).toEqual([columnRegionKey('col-1')]);
  });
});
