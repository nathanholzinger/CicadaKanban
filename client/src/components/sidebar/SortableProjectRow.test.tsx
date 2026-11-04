import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import type { ComponentProps } from 'react';
import { makeProject } from '../../test/projectFixture';
import { GHOST_ROW, TIER_CLASS } from '../dragChrome';
import { SortableProjectRow } from './SortableProjectRow';

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
          isDescendantOfActive={false}
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
      for (const cls of classesOf(TIER_CLASS[tier])) expect(box.classList).toContain(cls);
    },
  );

  it('draws a "parent" row at full strength, still carrying the tier', () => {
    const box = renderRow({ tier: 'parent' });
    expect(box).toHaveAttribute('data-drop-tier', 'parent');
    expect(box.className).not.toContain('drag-tier');
  });

  it('draws the dragged row at the ghost’s strength, and it has no tier', () => {
    const box = renderRow({ isActive: true });
    expect(box).not.toHaveAttribute('data-drop-tier');
    for (const cls of classesOf(GHOST_ROW)) expect(box.classList).toContain(cls);
  });

  it('keeps a descendant of the dragged project from taking a drop, at its tier', () => {
    const box = renderRow({ isDescendantOfActive: true, tier: 'neither' });
    expect(box.classList).toContain('pointer-events-none');
    for (const cls of classesOf(TIER_CLASS.neither)) expect(box.classList).toContain(cls);
  });

  it('lets a row that is not a descendant take a drop, whatever its tier', () => {
    const box = renderRow({ tier: 'neither' });
    expect(box.classList).not.toContain('pointer-events-none');
  });

  it('draws the drop line outside the box the tier dims, so the line keeps its own strength', () => {
    const box = renderRow({ tier: 'neither', indicatorSide: 'before' });
    const line = document.querySelector('[data-drop-line]')!;
    expect(line).not.toBeNull();
    expect(box.contains(line)).toBe(false);
  });
});
