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

// The banner, found by the attribute that names its cause.
const banner = (container: HTMLElement) => container.querySelector('[data-forced-stop]');

describe('ForcedStopCue', () => {
  it('draws nothing while no drag has been stopped', () => {
    const { container } = render(<ForcedStopCue stop={null} cueMs={5000} />);

    expect(container).toBeEmptyDOMElement();
  });

  it.each(['write-failed', 'refresh'] as const)('DRAG-6.16: says why when the cause is %s', cause => {
    const other = cause === 'refresh' ? 'write-failed' : 'refresh';
    const { container } = render(<ForcedStopCue stop={stopOf(cause)} cueMs={5000} />);

    // Its own sentence, and never the other cause's.
    expect(banner(container)).toHaveTextContent(SENTENCE[cause]);
    expect(container).not.toHaveTextContent(SENTENCE[other]);
  });

  it('words the two causes differently, each in its own sentence', () => {
    const said = (['write-failed', 'refresh'] as const).map(cause => {
      const { container, unmount } = render(<ForcedStopCue stop={stopOf(cause)} cueMs={5000} />);
      const text = banner(container)?.textContent;
      unmount();
      return text;
    });

    expect(said).toEqual([SENTENCE['write-failed'], SENTENCE.refresh]);
  });

  it.each(['write-failed', 'refresh'] as const)(
    'DRAG-6.26: says the same for a column drag’s stop, which names no item, when the cause is %s',
    cause => {
      const { container } = render(<ForcedStopCue stop={{ cause, itemId: null }} cueMs={5000} />);

      expect(banner(container)).toHaveTextContent(SENTENCE[cause]);
    },
  );

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
