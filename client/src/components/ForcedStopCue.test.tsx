import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ForcedStopCue from './ForcedStopCue';
import type { ForcedStop } from './workflow/forcedStop';

const stopOf = (cause: ForcedStop['cause']): ForcedStop => ({ cause, itemId: 'x' });

// The two sentences as the case writes them, spelled out here: a test that read them from the
// component's own constant would follow any change to them.
const SENTENCE: Record<ForcedStop['cause'], string> = {
  'write-failed': 'Your last move didn’t save, so the board reloaded. Nothing moved.',
  refresh: 'The board refreshed, which stopped your drag. Nothing moved.',
};

describe('ForcedStopCue', () => {
  it('DRAG-6.17: keeps an empty status element while no drag has been stopped, for assistive tech to announce into', () => {
    render(<ForcedStopCue stop={null} cueMs={5000} />);

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it.each(['write-failed', 'refresh'] as const)(
    'DRAG-6.16, DRAG-6.17: says why in the status element when the cause is %s',
    cause => {
      const other = cause === 'refresh' ? 'write-failed' : 'refresh';
      render(<ForcedStopCue stop={stopOf(cause)} cueMs={5000} />);

      // Its own sentence, and never the other cause's.
      expect(screen.getByRole('status')).toHaveTextContent(SENTENCE[cause]);
      expect(screen.getByRole('status')).not.toHaveTextContent(SENTENCE[other]);
    },
  );

  it('words the two causes differently, each in its own sentence', () => {
    const said = (['write-failed', 'refresh'] as const).map(cause => {
      const { unmount } = render(<ForcedStopCue stop={stopOf(cause)} cueMs={5000} />);
      const text = screen.getByRole('status').textContent;
      unmount();
      return text;
    });

    expect(said).toEqual([SENTENCE['write-failed'], SENTENCE.refresh]);
  });

  it('DRAG-6.19: times its fade to the cue time', () => {
    render(<ForcedStopCue stop={stopOf('refresh')} cueMs={3000} />);

    expect(screen.getByText(SENTENCE.refresh)).toHaveStyle({ animationDuration: '3000ms' });
  });

  // A stop that replaces a live one is a new banner, so its fade starts over; the same stop
  // redrawn is the one banner.
  it('draws a fresh banner for each stop, and keeps the one it has for a redraw of the same stop', () => {
    const { rerender } = render(<ForcedStopCue stop={stopOf('refresh')} stopKey={1} cueMs={5000} />);
    const first = screen.getByText(SENTENCE.refresh);

    rerender(<ForcedStopCue stop={stopOf('refresh')} stopKey={1} cueMs={5000} />);
    expect(screen.getByText(SENTENCE.refresh)).toBe(first);

    rerender(<ForcedStopCue stop={stopOf('refresh')} stopKey={2} cueMs={5000} />);
    expect(screen.getByText(SENTENCE.refresh)).not.toBe(first);
  });
});
