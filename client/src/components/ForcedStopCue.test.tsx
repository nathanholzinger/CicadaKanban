import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ForcedStopCue from './ForcedStopCue';
import { STOP_WORDING, type ForcedStop } from './workflow/forcedStop';

const stopOf = (cause: ForcedStop['cause'], point: ForcedStop['point'] = { x: 300, y: 200 }): ForcedStop => ({
  cause,
  point,
  itemId: 'x',
});

describe('ForcedStopCue', () => {
  it('keeps an empty status element while no drag has been stopped, for assistive tech to announce into', () => {
    render(<ForcedStopCue stop={null} look="banner" cueMs={5000} />);

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it.each(['write-failed', 'refresh'] as const)('says why in the status element when the cause is %s', cause => {
    render(<ForcedStopCue stop={stopOf(cause)} look="banner" cueMs={5000} />);

    expect(screen.getByRole('status')).toHaveTextContent(STOP_WORDING[cause]);
  });

  it('words the two causes differently', () => {
    expect(STOP_WORDING['write-failed']).not.toBe(STOP_WORDING.refresh);
  });

  it('draws a banner, or a note at the pointer', () => {
    const { rerender } = render(<ForcedStopCue stop={stopOf('refresh')} look="banner" cueMs={5000} />);
    expect(screen.getByText(STOP_WORDING.refresh)).toHaveAttribute('data-forced-stop-look', 'banner');

    rerender(<ForcedStopCue stop={stopOf('refresh')} look="note" cueMs={5000} />);
    const note = screen.getByText(STOP_WORDING.refresh);
    expect(note).toHaveAttribute('data-forced-stop-look', 'note');
    expect(note).toHaveStyle({ left: '300px', top: '184px' });
  });

  it('falls back to the banner when there is no pointer to put a note at', () => {
    render(<ForcedStopCue stop={stopOf('refresh', null)} look="note" cueMs={5000} />);

    expect(screen.getByText(STOP_WORDING.refresh)).toHaveAttribute('data-forced-stop-look', 'banner');
  });
});
