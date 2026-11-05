import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Item } from '../types';
import UnsortedBucket from './UnsortedBucket';
import { getUnknownStatusItemsFrom, hasUnknownStatusItem } from './workflow/itemListOps';
import { makeItem } from '../test/itemFixture';

// The bucket for a board whose workflow has one workphase, `w1`, that a column covers: what `BoardView`
// hands it from the live items.
function bucket(items: Item[]) {
  return (
    <UnsortedBucket
      uncoveredWorkphases={[]}
      unknownStatusItems={getUnknownStatusItemsFrom(items, ['w1'])}
      getWorkphaseItems={() => []}
      needsAttention={hasUnknownStatusItem(items, ['w1'])}
      itemTypes={[]}
      childCounts={{}}
      getAttachedChildren={() => []}
      defaultExpanded={false}
      onCardClick={() => {}}
    />
  );
}

describe('ATT-9.3: an attached item shows with its parent, whatever its own workphaseId says', () => {
  it('is not listed in Unsorted', () => {
    // An attached item whose own workphaseId has drifted to none, under a parent that is filed.
    const parent = makeItem('a', { workphaseId: 'w1' });
    const stub = makeItem('x', { parentId: 'a', workphaseId: null });
    const { container, rerender } = render(bucket([parent]));
    expect(container).toBeEmptyDOMElement();

    // Flagged for attention, the bucket opens but still lists no Card for it.
    rerender(bucket([parent, stub]));
    expect(screen.getByRole('group', { name: 'Unsorted' })).toBeInTheDocument();
    expect(screen.queryByText('Item x')).not.toBeInTheDocument();
  });
});

describe('Unknown status, read from the live items', () => {
  it('lists an item of no status with its title as it is now, counts it, and flags the bucket', () => {
    const { rerender } = render(bucket([makeItem('u', { workphaseId: null, title: 'Before' })]));
    expect(screen.getByText('Unknown status')).toBeInTheDocument();
    expect(screen.getByText('Before')).toBeInTheDocument();
    expect(screen.getByText('needs attention')).toBeInTheDocument();

    rerender(bucket([makeItem('u', { workphaseId: null, title: 'After' })]));
    expect(screen.getByText('After')).toBeInTheDocument();
    expect(screen.queryByText('Before')).not.toBeInTheDocument();
  });

  it('closes when its only item is deleted or given a status', () => {
    const { container, rerender } = render(bucket([makeItem('u', { workphaseId: null })]));
    expect(screen.getByRole('group', { name: 'Unsorted' })).toBeInTheDocument();

    rerender(bucket([makeItem('u', { workphaseId: 'w1' })]));
    expect(container).toBeEmptyDOMElement();

    rerender(bucket([makeItem('u', { workphaseId: null })]));
    rerender(bucket([]));
    expect(container).toBeEmptyDOMElement();
  });
});
