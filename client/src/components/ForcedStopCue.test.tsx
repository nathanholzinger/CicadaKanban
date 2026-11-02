import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ForcedStopCue from './ForcedStopCue';
import { STOP_WORDING, type ForcedStop } from './workflow/forcedStop';

const stopOf = (cause: ForcedStop['cause']): ForcedStop => ({ cause, itemId: 'x' });

describe('ForcedStopCue', () => {
  it('keeps an empty status element while no drag has been stopped, for assistive tech to announce into', () => {
    render(<ForcedStopCue stop={null} cueMs={5000} />);

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it.each(['write-failed', 'refresh'] as const)('says why in the status element when the cause is %s', cause => {
    render(<ForcedStopCue stop={stopOf(cause)} cueMs={5000} />);

    expect(screen.getByRole('status')).toHaveTextContent(STOP_WORDING[cause]);
  });

  it('words the two causes differently', () => {
    expect(STOP_WORDING['write-failed']).not.toBe(STOP_WORDING.refresh);
  });

  it('times its fade to the cue time', () => {
    render(<ForcedStopCue stop={stopOf('refresh')} cueMs={3000} />);

    expect(screen.getByText(STOP_WORDING.refresh)).toHaveStyle({ animationDuration: '3000ms' });
  });
});
