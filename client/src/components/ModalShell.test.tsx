import { describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import ModalShell from './ModalShell';

const shell = (onClose: () => void) => (
  <ModalShell onClose={onClose} ariaLabel="A modal" title="A modal" maxWidth="max-w-sm">
    body
  </ModalShell>
);
// A real keypress, outside `act`: what a listener does during it is all that flushes React.
const pressEscape = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

describe('a modal’s Escape', () => {
  it('closes the modal, and no other key does', () => {
    const onClose = vi.fn();
    render(shell(onClose));

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(onClose).not.toHaveBeenCalled();

    pressEscape();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes it when a listener added to the document before its own re-renders it during the keypress', () => {
    const closed: string[] = [];
    let duringKeypress = () => {};
    const earlier = () => duringKeypress();
    document.addEventListener('keydown', earlier);
    try {
      const { rerender } = render(shell(() => closed.push('as first rendered')));
      duringKeypress = () => act(() => rerender(shell(() => closed.push('as rendered during the keypress'))));

      pressEscape();

      expect(closed).toEqual(['as rendered during the keypress']);
    } finally {
      document.removeEventListener('keydown', earlier);
    }
  });

  it('stops listening once the modal is gone', () => {
    const onClose = vi.fn();
    render(shell(onClose)).unmount();

    pressEscape();

    expect(onClose).not.toHaveBeenCalled();
  });
});
