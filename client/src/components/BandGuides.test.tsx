import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { useEffect } from 'react';
import { DragCarveFrame } from './BandGuides';
import { DragSessionContext, type DragSession } from './workflow/DragSessionContext';
import { startPopSession } from './workflow/popSession';
import { makeDragSession } from '../test/dragFixtures';

// Counts its own mounts: a remount (not a re-render) is what resets a Card's
// own state, such as its hand-set expand/collapse.
function MountCounter({ onMount }: { onMount: () => void }) {
  useEffect(onMount, [onMount]);
  return null;
}

function sessionAt(contextKey: string | null): DragSession {
  return makeDragSession({ pop: startPopSession(contextKey) });
}

describe('DragCarveFrame', () => {
  it('keeps its cards mounted through every layer change of a drag', () => {
    let mounts = 0;
    const onMount = () => {
      mounts++;
    };
    const frame = (session: DragSession | null) => (
      <DragSessionContext.Provider value={session}>
        <DragCarveFrame regionKey="column:c1" items={[{ id: 'a' }, { id: 'b' }]} isTerminal={false} targetLabel="Todo">
          <MountCounter onMount={onMount} />
        </DragCarveFrame>
      </DragSessionContext.Provider>
    );

    const { rerender, container } = render(frame(null));
    rerender(frame(sessionAt('column:c1'))); // locked here: the active-context outline
    rerender(frame(sessionAt(null))); // Board layer: the carve-out zones
    expect(container.querySelector('[data-carve-zone="top"]')).not.toBeNull();
    rerender(frame(sessionAt('column:c2'))); // locked in another column
    rerender(frame(null)); // the drag is over

    expect(mounts).toBe(1);
  });
});
