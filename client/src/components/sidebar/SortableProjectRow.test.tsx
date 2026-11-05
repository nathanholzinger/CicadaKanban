import { describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import type { ComponentProps } from 'react';
import { makeProject } from '../../test/projectFixture';
import { GHOST_ROW, tierClass } from '../dragChrome';
import { DRAG_OVERLAY_ATTR } from '../workflow/dragRegions';
import { DragGhost, SortableProjectRow } from './SortableProjectRow';
import {
  ROW_CHEVRON_WIDTH_CLASS,
  ROW_GAP_CLASS,
  ROW_HANDLE_WIDTH_CLASS,
  projectNameIndentPx,
  projectRowIndentPx,
} from './projectTreeUtils';

function renderRow(props: Partial<ComponentProps<typeof SortableProjectRow>> = {}) {
  render(
    <DndContext>
      <SortableContext items={['P']}>
        <SortableProjectRow
          item={{
            id: 'P',
            depth: 0,
            parentId: null,
            project: makeProject('P'),
            hasChildren: false,
            collapsed: false,
          }}
          selectedProjectId={null}
          isActive={false}
          tier={null}
          indicatorSide={null}
          indicatorDepth={0}
          indicatorInvalid={false}
          expandedIds={new Set()}
          onToggleExpand={vi.fn()}
          onSelectProject={vi.fn()}
          onCreateSubproject={vi.fn()}
          onDelete={vi.fn()}
          {...props}
        />
      </SortableContext>
    </DndContext>,
  );
  // The box the tier draws: the row's content, which holds the name.
  return screen.getByText('P').parentElement!;
}

const classesOf = (classes: string) => classes.split(' ').filter(Boolean);

describe('SortableProjectRow, drawn by its tier', () => {
  it('draws no strength and carries no tier outside a drag', () => {
    const box = renderRow();
    expect(box).not.toHaveAttribute('data-drop-tier');
    expect(box.className).not.toContain('drag-tier');
  });

  it.each(['anchor', 'neither'] as const)(
    'draws a "%s" row in the board’s class for it, and carries the tier',
    tier => {
      const box = renderRow({ tier });
      expect(box).toHaveAttribute('data-drop-tier', tier);
      for (const cls of classesOf(tierClass(tier))) expect(box.classList).toContain(cls);
    },
  );

  it('draws a "parent" row at full strength, still carrying the tier', () => {
    const box = renderRow({ tier: 'parent' });
    expect(box).toHaveAttribute('data-drop-tier', 'parent');
    expect(box.className).not.toContain('drag-tier');
  });

  it('TREE-2.1, TREE-2.8: draws the dragged row at the ghost’s strength, and it has no tier', () => {
    const box = renderRow({ isActive: true });
    expect(box).not.toHaveAttribute('data-drop-tier');
    for (const cls of classesOf(GHOST_ROW)) expect(box.classList).toContain(cls);
  });

  it('lets a row take a drop, whatever its tier', () => {
    const box = renderRow({ tier: 'neither' });
    expect(box.classList).not.toContain('pointer-events-none');
  });

  it('TREE-2.7: draws the drop line outside the box the tier dims, so the line keeps its own strength', () => {
    const box = renderRow({ tier: 'neither', indicatorSide: 'before' });
    const line = document.querySelector('[data-drop-line]')!;
    expect(line).not.toBeNull();
    expect(box.contains(line)).toBe(false);
  });
});

// The drop line starts where a name at its depth starts, not where the row's padding does: the drag
// handle is hidden through a drag, and so is a leaf's chevron, so the row's own start has nothing at it.
describe('SortableProjectRow, where its drop line starts', () => {
  const lineIn = () => document.querySelector<HTMLElement>('[data-drop-line]')!;

  it('starts at the name’s column for the depth the line shows, whatever the row’s own depth is', () => {
    renderRow({ indicatorSide: 'before', indicatorDepth: 2 });
    expect(lineIn().style.marginLeft).toBe(`${projectNameIndentPx(2)}px`);
    expect(projectNameIndentPx(2)).toBeGreaterThan(projectRowIndentPx(2));
  });

  it('starts the line past the cap at the same column', () => {
    renderRow({ indicatorSide: 'after', indicatorDepth: 3, indicatorInvalid: true });
    expect(lineIn()).toHaveAttribute('data-drop-invalid', 'true');
    expect(lineIn().style.marginLeft).toBe(`${projectNameIndentPx(3)}px`);
  });

  it('puts the name where the line’s column says: the row’s controls are the classes the number adds up', () => {
    const box = renderRow();
    expect(box.classList).toContain(ROW_GAP_CLASS);
    expect(screen.getByLabelText('Drag to reorder').classList).toContain(ROW_HANDLE_WIDTH_CLASS);
    expect(screen.getByLabelText('Expand').classList.contains(ROW_CHEVRON_WIDTH_CLASS)).toBe(true);
    expect(box.style.paddingLeft).toBe(`${projectRowIndentPx(0)}px`);
  });
});

// The carried copy says what the pickup took with it on a second line, hung under its box.
describe('DragGhost, the carried copy', () => {
  const ghost = () => document.querySelector(`[${DRAG_OVERLAY_ATTR}]`)!;

  it('says the branch’s counts on a second line inside the copy, out of its box', () => {
    render(<DragGhost name="Q3 plan" branch={{ children: 2, descendants: 5 }} />);

    const line = screen.getByText('+ 2 children, 5 total descendants').parentElement!;
    expect(line).toHaveAttribute('data-carried-branch');
    // The line is positioned against the copy's own box and takes no pointer, so what dnd-kit
    // measures of the copy stays that one box.
    expect(ghost().contains(line)).toBe(true);
    expect(ghost().classList).toContain('relative');
    expect(line.classList).toContain('absolute');
    expect(line.classList).toContain('pointer-events-none');
  });

  it('says one child as “+ 1 child”', () => {
    render(<DragGhost name="Q3 plan" branch={{ children: 1, descendants: 1 }} />);

    expect(screen.getByText('+ 1 child')).toBeInTheDocument();
  });

  it('has no line without a branch', () => {
    render(<DragGhost name="Q3 plan" />);
    expect(document.querySelector('[data-carried-branch]')).toBeNull();

    cleanup();
    render(<DragGhost name="Q3 plan" branch={null} />);
    expect(document.querySelector('[data-carried-branch]')).toBeNull();
  });
});
