import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import type { Column, ColumnDisplayMode } from '../types';
import { makeItem } from '../test/itemFixture';
import { makeDragSession } from '../test/dragFixtures';
import BoardColumn from './BoardColumn';
import { DragSessionContext, type DragSession } from './workflow/DragSessionContext';
import { columnRegionKey, descendantsRegionKey, DRAG_REGION_ATTR, subrowRegionKey } from './workflow/dragRegions';
import { startPopSession } from './workflow/popSession';

const CARD = makeItem('p', { workphaseId: 'merged-phase' });
const CARRIED = makeItem('x');

function makeColumn(id: string, workphaseIds: string[], displayMode: ColumnDisplayMode): Column {
  return {
    id,
    boardId: 'board',
    name: id,
    displayName: id,
    startWorkphaseId: workphaseIds[0],
    endWorkphaseId: workphaseIds.at(-1)!,
    displayMode,
    position: 1,
    createdAt: 0,
    broken: false,
    entryWorkphaseId: workphaseIds[0],
    subRows: workphaseIds.map((id, index) => ({
      workphase: {
        id,
        name: id,
        workflowId: 'workflow',
        position: index + 1,
        triggersNotification: 0,
        isTerminal: 0,
        createdAt: 0,
      },
      items: [],
    })),
  };
}

const COLUMNS = [
  makeColumn('merged', ['merged-phase'], 'merged'),
  makeColumn('expanded', ['first-phase', 'second-phase'], 'expanded'),
];
const MERGED = columnRegionKey('merged');
const FIRST = subrowRegionKey('expanded', 'first-phase');
const SECOND = subrowRegionKey('expanded', 'second-phase');

function sessionAt(contextKey: string | null): DragSession {
  return makeDragSession({ activeItem: CARRIED, pop: startPopSession(contextKey) });
}

function frame(session: DragSession | null, columns = COLUMNS, items = [CARD]) {
  return (
    <DndContext>
      <DragSessionContext value={session}>
        <SortableContext items={columns.map(column => column.id)}>
          {columns.map(column => (
            <BoardColumn
              key={column.id}
              column={column}
              getWorkphaseItems={id => items.filter(item => item.workphaseId === id)}
              getMergedColumnItems={ids => items.filter(item => ids.includes(item.workphaseId!))}
              childCounts={{}}
              getAttachedChildren={() => []}
              defaultExpanded={false}
              itemTypes={[]}
              onCreateItem={() => {}}
              onCardClick={() => {}}
            />
          ))}
        </SortableContext>
      </DragSessionContext>
    </DndContext>
  );
}

const activeContexts = (container: HTMLElement) => [...container.querySelectorAll('[data-active-context="true"]')];
const region = (container: HTMLElement, key: string) => container.querySelector(`[${DRAG_REGION_ATTR}="${key}"]`);

describe('the rendered active drag context', () => {
  it('DRAG-1.26: marks only the merged list region when it is locked', () => {
    const { container, rerender } = render(frame(null));
    expect(activeContexts(container)).toEqual([]);

    rerender(frame(sessionAt(MERGED)));

    expect(region(container, MERGED)).toHaveAttribute('data-active-context', 'true');
    expect(activeContexts(container)).toEqual([region(container, MERGED)]);
  });

  it('DRAG-1.26: transfers the mark between exact expanded sub-rows without marking their outer column', () => {
    const { container, rerender, getByRole } = render(frame(sessionAt(FIRST)));

    for (const key of [FIRST, SECOND]) {
      rerender(frame(sessionAt(key)));
      expect(region(container, key)).toHaveAttribute('data-active-context', 'true');
      expect(activeContexts(container)).toEqual([region(container, key)]);
      expect(getByRole('group', { name: 'expanded' })).not.toHaveAttribute('data-active-context');
    }
  });

  it('DRAG-1.26: transfers the sole mark between list and Card, and clears it at Board or drag end', () => {
    const { container, rerender, getByRole } = render(frame(sessionAt(MERGED)));
    expect(activeContexts(container)).toEqual([region(container, MERGED)]);

    rerender(frame(sessionAt(descendantsRegionKey(CARD.id))));
    expect(activeContexts(container)).toEqual([getByRole('article', { name: CARD.title })]);
    expect(region(container, MERGED)).not.toHaveAttribute('data-active-context');

    rerender(frame(sessionAt(MERGED)));
    expect(activeContexts(container)).toEqual([region(container, MERGED)]);
    expect(getByRole('article', { name: CARD.title })).not.toHaveAttribute('data-active-context');

    rerender(frame(sessionAt(null)));
    expect(activeContexts(container)).toEqual([]);

    rerender(frame(sessionAt(SECOND)));
    expect(activeContexts(container)).toEqual([region(container, SECOND)]);
    rerender(frame(null));
    expect(activeContexts(container)).toEqual([]);
  });
});

describe('the board-layer band label source', () => {
  const active = { ...makeColumn('active', ['active-phase'], 'merged'), displayName: 'Working display' };
  const doneBase = makeColumn('done', ['done-phase'], 'merged');
  const done: Column = {
    ...doneBase,
    displayName: 'Finished display',
    subRows: [
      {
        workphase: { ...doneBase.subRows[0].workphase, name: 'Done', isTerminal: 1 },
        items: [],
      },
    ],
  };
  const completed = makeItem('d', { workphaseId: 'done-phase', completedAt: 1, position: null });

  it.each(['merged', 'expanded'] as const)(
    'DRAG-3.18: a populated done region names its workphase rather than the column override (%s)',
    displayMode => {
      const { getByText, queryByText } = render(frame(sessionAt(null), [{ ...done, displayMode }], [completed]));

      expect(getByText('Move to Done', { exact: true })).toBeInTheDocument();
      expect(queryByText('Move to Finished display', { exact: true })).not.toBeInTheDocument();
    },
  );

  it('DRAG-3.18: an empty active region names the region and populated active regions keep Top and Bottom', () => {
    const { getByText, queryByText, rerender } = render(frame(sessionAt(null), [active], []));
    expect(getByText('Move to Working display', { exact: true })).toBeInTheDocument();
    expect(queryByText('Move to active-phase', { exact: true })).not.toBeInTheDocument();

    rerender(frame(sessionAt(null), [active], [makeItem('a', { workphaseId: 'active-phase' })]));
    expect(getByText('Move Top', { exact: true })).toBeInTheDocument();
    expect(getByText('Move Bottom', { exact: true })).toBeInTheDocument();
    expect(queryByText('Move to Working display', { exact: true })).not.toBeInTheDocument();
  });

  it('DRAG-3.18: the done label gives way to the incoming ghost', () => {
    const { getByText, queryByText, container, rerender } = render(frame(sessionAt(null), [done], [completed]));
    expect(getByText('Move to Done', { exact: true })).toBeInTheDocument();

    rerender(frame(sessionAt(null), [done], [completed, makeItem(CARRIED.id, { workphaseId: 'done-phase' })]));
    expect(container.querySelector('[data-item-id="x"]')).not.toBeNull();
    expect(queryByText('Move to Done', { exact: true })).not.toBeInTheDocument();
    expect(queryByText('Move to Finished display', { exact: true })).not.toBeInTheDocument();
  });
});
