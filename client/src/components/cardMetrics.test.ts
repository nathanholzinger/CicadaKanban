import { describe, expect, it } from 'vitest';
import {
  CARD_LIST_GAP_CLASS,
  CARD_LIST_GAP_PX,
  STUB_ROW_BOX_CLASS,
  STUB_ROW_HEIGHT_CLASS,
  STUB_ROW_HEIGHT_PX,
} from './cardMetrics';

// A Tailwind step is a quarter of a rem, which is 4px at the browser's default size.
const stepOf = (px: number) => px / 4;

describe('cardMetrics', () => {
  it("sets the Stub row's height by a class that is the same height as the number the drag math reads", () => {
    expect(STUB_ROW_HEIGHT_CLASS).toBe(`h-${stepOf(STUB_ROW_HEIGHT_PX)}`);
  });

  it('puts that height on the box every Stub-sized row shares, with no vertical padding to add to it', () => {
    const classes = STUB_ROW_BOX_CLASS.split(' ');
    expect(classes).toContain(STUB_ROW_HEIGHT_CLASS);
    expect(classes.filter(c => /^(py|pt|pb|p)-/.test(c))).toEqual([]);
  });

  it("sets the card lists' gap by a class that is the same size as the number the band math reserves", () => {
    expect(CARD_LIST_GAP_CLASS).toBe(`gap-${stepOf(CARD_LIST_GAP_PX)}`);
  });
});
