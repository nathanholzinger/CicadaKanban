import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import UnsortedBucket from './UnsortedBucket';
import { makeItem } from '../test/itemFixture';

function bucket(needsAttention: boolean) {
  // An attached item whose own workphaseId has drifted to none.
  const stub = makeItem('x', { parentId: 'a', workphaseId: null });
  return (
    <UnsortedBucket
      uncoveredWorkphases={[]}
      invalidItems={[stub]}
      getWorkphaseItems={() => []}
      needsAttention={needsAttention}
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
    const { container, rerender } = render(bucket(false));
    expect(container).toBeEmptyDOMElement();

    // Flagged for attention, the bucket opens but still lists no Card for it.
    rerender(bucket(true));
    expect(screen.getByRole('group', { name: 'Unsorted' })).toBeInTheDocument();
    expect(screen.queryByText('Item x')).not.toBeInTheDocument();
  });
});
