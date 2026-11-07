import { describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import type { ComponentProps } from 'react';
import { makeProject } from '../../test/projectFixture';
import { GHOST_ROW, INVALID_PLACEMENT_CLASS, tierClass } from '../dragChrome';
import { DRAG_OVERLAY_ATTR } from '../workflow/dragRegions';
import { DragGhost, SortableProjectRow } from './SortableProjectRow';
import {
  ROW_CHEVRON_WIDTH_CLASS,
  ROW_CHEVRON_WIDTH_PX,
  ROW_GAP_CLASS,
  ROW_GAP_PX,
  ROW_HANDLE_WIDTH_CLASS,
  ROW_HANDLE_WIDTH_PX,
  projectNameIndentPx,
  projectRowIndentPx,
} from './projectTreeUtils';
import type { GhostState } from './useProjectDragReorder';

// The strategy's transform for the row, when a test sets one: where a row sits in a drag is what the
// sortable context says, which a row alone in a context never gets.
const sortable = vi.hoisted(() => ({
  transform: null as { x: number; y: number; scaleX: number; scaleY: number } | null,
}));
vi.mock('@dnd-kit/sortable', async importOriginal => {
  const actual = await importOriginal<typeof import('@dnd-kit/sortable')>();
  return {
    ...actual,
    useSortable: (args: Parameters<typeof actual.useSortable>[0]) => {
      const result = actual.useSortable(args);
      return sortable.transform ? { ...result, transform: sortable.transform } : result;
    },
  };
});

const GHOST: GhostState = { depth: 0, line: false, invalid: false };

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
          ghost={null}
          tier={null}
          projectDepthCap={null}
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

  it('TREE-2.1: draws the dragged row at the ghost’s strength, and it has no tier', () => {
    const box = renderRow({ ghost: GHOST });
    expect(box).not.toHaveAttribute('data-drop-tier');
    for (const cls of classesOf(GHOST_ROW)) expect(box.classList).toContain(cls);
  });

  it('lets a row take a drop, whatever its tier', () => {
    const box = renderRow({ tier: 'neither' });
    expect(box.classList).not.toContain('pointer-events-none');
  });

  it('TREE-2.7: draws the drop line outside the box the ghost dims, so the line keeps its own strength', () => {
    const box = renderRow({ ghost: { ...GHOST, line: true } });
    const line = document.querySelector('[data-drop-line]')!;
    expect(line).not.toBeNull();
    expect(box.contains(line)).toBe(false);
  });
});

// The dragged project's own row is the ghost: it carries what makes it one, is drawn at the depth it
// would land at, and holds the line on its top edge. No other row does.
describe('SortableProjectRow, the ghost', () => {
  const wrapperOf = (box: HTMLElement) => box.parentElement!;

  it('is marked with the depth it is drawn at, and no other row is', () => {
    renderRow();
    expect(document.querySelector('[data-drag-ghost]')).toBeNull();

    cleanup();
    renderRow({ ghost: { ...GHOST, depth: 2 } });
    expect(document.querySelector('[data-drag-ghost]')).toHaveAttribute('data-drag-ghost', '2');
  });

  it('is marked at depth 0 too, the top level', () => {
    renderRow({ ghost: GHOST });
    expect(document.querySelector('[data-drag-ghost]')).toHaveAttribute('data-drag-ghost', '0');
  });

  it('is drawn at the depth it would land at, whatever its own depth is', () => {
    const box = renderRow({ ghost: { ...GHOST, depth: 3 } });
    expect(box.style.paddingLeft).toBe(`${projectRowIndentPx(3)}px`);
  });

  it('keeps its own depth when it is not the ghost', () => {
    const box = renderRow();
    expect(box.style.paddingLeft).toBe(`${projectRowIndentPx(0)}px`);
  });

  it('takes the strategy’s transform, which moves it to the gap, as every other row does', () => {
    sortable.transform = { x: 0, y: 64, scaleX: 1, scaleY: 1 };
    try {
      const box = renderRow({ ghost: GHOST });
      expect(wrapperOf(box).style.transform).toContain('translate3d(0px, 64px');
    } finally {
      sortable.transform = null;
    }
  });

  it('sits above the rows it slides past, so the row above never covers its line', () => {
    const box = renderRow({ ghost: GHOST });
    expect(wrapperOf(box).classList).toContain('z-10');
    cleanup();
    expect(wrapperOf(renderRow()).classList).not.toContain('z-10');
  });
});

// The drop line starts where a name at its depth starts, not where the row's padding does: the drag
// handle is hidden through a drag, and so is a leaf's chevron, so the row's own start has nothing at it.
describe('SortableProjectRow, where its drop line starts', () => {
  const lineIn = () => document.querySelector<HTMLElement>('[data-drop-line]')!;

  it('starts at the name’s column for the depth the line shows, whatever the row’s own depth is', () => {
    renderRow({ ghost: { depth: 2, line: true, invalid: false } });
    expect(lineIn().style.marginLeft).toBe(`${projectNameIndentPx(2)}px`);
    expect(projectNameIndentPx(2)).toBeGreaterThan(projectRowIndentPx(2));
  });

  it('starts the line past the cap at the same column', () => {
    renderRow({ ghost: { depth: 3, line: true, invalid: true } });
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

// The line starts in the column the ghost's name does, at each depth, and each deeper state starts farther right.
describe('TREE-2.13: the line starts at the ghost’s name on its top edge in every gap after the first move', () => {
  const lineIn = () => document.querySelector<HTMLElement>('[data-drop-line]')!;

  it.each([0, 1, 2, 3])('at depth %i, the ghost is drawn there and its line starts at its name', depth => {
    const box = renderRow({ ghost: { depth, line: true, invalid: false } });
    expect(document.querySelector('[data-drag-ghost]')).toHaveAttribute('data-drag-ghost', String(depth));
    // The name's column: the row's padding at the depth, then the handle's and the chevron's room and the gaps.
    expect(box.style.paddingLeft).toBe(`${projectRowIndentPx(depth)}px`);
    expect(lineIn().style.marginLeft).toBe(`${projectNameIndentPx(depth)}px`);
    expect(projectNameIndentPx(depth)).toBe(
      projectRowIndentPx(depth) + ROW_HANDLE_WIDTH_PX + ROW_GAP_PX + ROW_CHEVRON_WIDTH_PX + ROW_GAP_PX,
    );
  });

  it('starts each deeper state farther right', () => {
    const starts = [0, 1, 2, 3].map(depth => {
      cleanup();
      renderRow({ ghost: { depth, line: true, invalid: false } });
      return parseFloat(lineIn().style.marginLeft);
    });
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
    expect(new Set(starts).size).toBe(4);
  });

  it('TREE-1.1, TREE-1.9: draws one line, on the ghost’s top edge and never its bottom, and none while it has no gap yet', () => {
    renderRow({ ghost: { depth: 1, line: true, invalid: false } });
    expect(document.querySelectorAll('[data-drop-line]')).toHaveLength(1);
    expect(lineIn().classList).toContain('-top-px');
    cleanup();
    renderRow({ ghost: { depth: 1, line: false, invalid: false } });
    expect(document.querySelector('[data-drop-line]')).toBeNull();
  });

  it('TREE-1.1, TREE-1.9: keeps the line at full strength while the ghost is dimmed: it sits outside the dimmed box', () => {
    const box = renderRow({ ghost: { depth: 1, line: true, invalid: false } });
    for (const cls of classesOf(GHOST_ROW)) expect(box.classList).toContain(cls);
    expect(box.contains(lineIn())).toBe(false);
    for (const cls of classesOf(GHOST_ROW)) expect(lineIn().classList).not.toContain(cls);
  });
});

// The line rides the ghost's top edge: between the ghost and the row above it, in one place in every gap.
describe('SortableProjectRow, the drop line on the ghost', () => {
  const lineIn = () => document.querySelector<HTMLElement>('[data-drop-line]');

  it('is drawn on the ghost’s top edge, never its bottom', () => {
    renderRow({ ghost: { ...GHOST, line: true } });
    expect(lineIn()!.classList).toContain('-top-px');
    expect(lineIn()!.classList).not.toContain('-bottom-px');
  });

  it('holds the depth it is drawn at', () => {
    renderRow({ ghost: { depth: 2, line: true, invalid: false } });
    expect(lineIn()).toHaveAttribute('data-drop-line', '2');
  });

  it('is not drawn while the ghost has no gap yet, or no row to be placed against', () => {
    renderRow({ ghost: { ...GHOST, line: false } });
    expect(lineIn()).toBeNull();
  });

  it('is not drawn on a row that is not the ghost', () => {
    renderRow();
    expect(lineIn()).toBeNull();
  });

  it('is blue inside the cap, and red past it', () => {
    renderRow({ ghost: { ...GHOST, line: true } });
    expect(lineIn()!.classList).toContain('bg-blue-500');
    expect(lineIn()).not.toHaveAttribute('data-drop-invalid');

    cleanup();
    renderRow({ ghost: { ...GHOST, line: true, invalid: true } });
    expect(lineIn()!.classList).toContain('bg-red-500/70');
    expect(lineIn()!.classList).not.toContain('bg-blue-500');
  });
});

// The carried copy is the project's row at the depth it would land at, held to the list's width by the
// overlay. It says what the pickup took with it on a second line, hung under its box.
describe('DragGhost, the carried copy', () => {
  const ghost = () => document.querySelector<HTMLElement>(`[${DRAG_OVERLAY_ATTR}]`)!;

  it('is laid out as the row at its depth: the row’s padding, and the room of the handle and chevron before the name', () => {
    render(<DragGhost name="Q3 plan" depth={2} />);

    expect(ghost().style.paddingLeft).toBe(`${projectRowIndentPx(2)}px`);
    expect(ghost().classList).toContain(ROW_GAP_CLASS);
    const [handle, chevron, name] = Array.from(ghost().children);
    expect(handle.classList).toContain(ROW_HANDLE_WIDTH_CLASS);
    expect(chevron.classList).toContain(ROW_CHEVRON_WIDTH_CLASS);
    expect(name).toHaveTextContent('Q3 plan');
  });

  it('steps with the depth', () => {
    render(<DragGhost name="Q3 plan" depth={0} />);
    expect(ghost().style.paddingLeft).toBe(`${projectRowIndentPx(0)}px`);
    cleanup();
    render(<DragGhost name="Q3 plan" depth={4} />);
    expect(ghost().style.paddingLeft).toBe(`${projectRowIndentPx(4)}px`);
  });

  it('draws its edge as a ring, which takes no room, so the name is not pushed in', () => {
    render(<DragGhost name="Q3 plan" depth={0} />);
    expect(ghost().classList).toContain('ring-1');
    expect(ghost().classList).not.toContain('border');
  });

  it('takes the board’s invalid outline past the cap, and none inside it', () => {
    render(<DragGhost name="Q3 plan" depth={1} invalid />);
    for (const cls of classesOf(INVALID_PLACEMENT_CLASS)) expect(ghost().classList).toContain(cls);

    cleanup();
    render(<DragGhost name="Q3 plan" depth={1} />);
    for (const cls of classesOf(INVALID_PLACEMENT_CLASS)) expect(ghost().classList).not.toContain(cls);
  });

  it('TREE-2.9, TREE-2.10: says the branch’s counts on a second line inside the copy, out of its box', () => {
    render(<DragGhost name="Q3 plan" depth={0} branch={{ children: 2, descendants: 5 }} />);

    const line = screen.getByText('+ 2 children, 5 total descendants').parentElement!;
    expect(line).toHaveAttribute('data-carried-branch');
    // The line is positioned against the copy's own box and takes no pointer, so what dnd-kit
    // measures of the copy stays that one box.
    expect(ghost().contains(line)).toBe(true);
    expect(ghost().classList).toContain('relative');
    expect(line.classList).toContain('absolute');
    expect(line.classList).toContain('pointer-events-none');
  });

  it('TREE-2.9: says one child as “+ 1 child”', () => {
    render(<DragGhost name="Q3 plan" depth={0} branch={{ children: 1, descendants: 1 }} />);

    expect(screen.getByText('+ 1 child')).toBeInTheDocument();
  });

  it('TREE-2.10: leaves the count line to the carried copy: the ghost in the list has none', () => {
    renderRow({ ghost: { depth: 0, line: true, invalid: false } });
    expect(document.querySelector('[data-carried-branch]')).toBeNull();
    cleanup();
    render(<DragGhost name="Q3 plan" depth={0} branch={{ children: 1, descendants: 1 }} />);
    expect(document.querySelectorAll('[data-carried-branch]')).toHaveLength(1);
  });

  it('TREE-2.9: has no line without a branch', () => {
    render(<DragGhost name="Q3 plan" depth={0} />);
    expect(document.querySelector('[data-carried-branch]')).toBeNull();

    cleanup();
    render(<DragGhost name="Q3 plan" depth={0} branch={null} />);
    expect(document.querySelector('[data-carried-branch]')).toBeNull();
  });
});

describe('TREE-2.9: the count line includes the real subtree, including descendants hidden by collapse', () => {
  // The line's wording for each of the case's trees below the carried project: its children, and the whole branch.
  it.each([
    [1, 1, '+ 1 child'],
    [3, 3, '+ 3 children'],
    [1, 2, '+ 1 child, 2 total descendants'],
    [2, 5, '+ 2 children, 5 total descendants'],
  ] as const)('%i children and %i descendants: the copy says %j', (children, descendants, text) => {
    render(<DragGhost name="Q3 plan" depth={0} branch={{ children, descendants }} />);

    expect(screen.getByText(text).parentElement).toHaveAttribute('data-carried-branch');
    expect(document.querySelectorAll('[data-carried-branch]')).toHaveLength(1);
  });
});

// "Add subproject" stops at the project cap. A row's depth counts a top-level project as 0, so a
// row at depth CAP - 1 is at the cap and takes no child.
describe('SortableProjectRow’s Add subproject at the depth cap', () => {
  const CAP = 4;
  const rowAt = (depth: number) => ({
    id: 'P',
    depth,
    parentId: null,
    project: makeProject('P'),
    hasChildren: false,
    collapsed: false,
  });
  const addButton = () => screen.getByRole('button', { name: 'Add subproject' });

  it('TREE-5.2, TREE-5.4: is offered one level short of the cap, and while the cap is not yet read', () => {
    renderRow({ item: rowAt(CAP - 2), projectDepthCap: CAP });
    expect(addButton()).toBeEnabled();
    expect(addButton()).toHaveAttribute('title', 'Add subproject');
    cleanup();

    renderRow({ item: rowAt(CAP - 1), projectDepthCap: null });
    expect(addButton()).toBeEnabled();
  });

  it('TREE-5.3: shows disabled, saying why, at the cap, and creates nothing', async () => {
    const onCreateSubproject = vi.fn();
    renderRow({ item: rowAt(CAP - 1), projectDepthCap: CAP, onCreateSubproject });

    expect(addButton()).toBeDisabled();
    expect(addButton()).toHaveAttribute('title', `At the depth cap (${CAP} levels)`);
    addButton().click();
    expect(onCreateSubproject).not.toHaveBeenCalled();
  });
});
