import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import TypePill from './TypePill';
import { makeItem } from '../../test/itemFixture';
import type { ItemType } from '../../types';

const STORY: ItemType = { id: 'story', name: 'Story', color: '#3b82f6', createdAt: 0 };

describe('TypePill', () => {
  it('hides for an item with no type or a type that is not in the list', () => {
    const { container, rerender } = render(<TypePill item={makeItem('a')} itemTypes={[STORY]} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<TypePill item={makeItem('a', { type: 'gone' })} itemTypes={[STORY]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('takes the line height it inherits, unless it is asked to fit the line', () => {
    const item = makeItem('a', { type: 'story' });
    const { rerender } = render(<TypePill item={item} itemTypes={[STORY]} />);
    expect(screen.getByText('Story').classList).not.toContain('leading-none');
    rerender(<TypePill item={item} itemTypes={[STORY]} fitsLine />);
    expect(screen.getByText('Story').classList).toContain('leading-none');
  });

  it('keeps every class it has when it fits the line', () => {
    const item = makeItem('a', { type: 'story' });
    const { rerender } = render(<TypePill item={item} itemTypes={[STORY]} />);
    const before = [...screen.getByText('Story').classList];
    rerender(<TypePill item={item} itemTypes={[STORY]} fitsLine />);
    expect([...screen.getByText('Story').classList]).toEqual([...before, 'leading-none']);
  });
});
