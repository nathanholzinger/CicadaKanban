import { describe, it, expect } from 'vitest';
import { render, renderHook } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import type { ReactNode } from 'react';
import { useItemRow } from './dragChrome';
import { DragGhost } from './sidebar/SortableProjectRow';
import { DRAG_OVERLAY_ATTR } from './workflow/dragRegions';

// The E2E helper's "drag finished" wait counts the carried copy down to none, so a
// copy that doesn't carry the attribute it counts would let the wait pass at once.
describe('the carried copy carries DRAG_OVERLAY_ATTR', () => {
  it("on the board: the DragOverlay's copy does, and a row in a list does not", () => {
    const wrapper = ({ children }: { children: ReactNode }) => <DndContext>{children}</DndContext>;
    const overlay = renderHook(() => useItemRow('x', 'card', { isOverlay: true }), { wrapper });
    const row = renderHook(() => useItemRow('x', 'card'), { wrapper });

    expect(overlay.result.current.dataAttrs[DRAG_OVERLAY_ATTR]).toBe('true');
    expect(row.result.current.dataAttrs[DRAG_OVERLAY_ATTR]).toBeUndefined();
  });

  it("in the sidebar: the project's ghost does", () => {
    const { container } = render(<DragGhost name="Project" />);

    expect(container.querySelector(`[${DRAG_OVERLAY_ATTR}]`)).not.toBeNull();
  });
});
