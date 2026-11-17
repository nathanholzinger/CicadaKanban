import { expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { center, hoverTo, paintedBoxOf, paintedTextRows, type Point } from './dragGesture';
import { INDENT_WIDTH } from '../../client/src/components/sidebar/projectTreeUtils';
import type { ProjectSidebarPage } from '../pages/ProjectSidebarPage';
import { fetchProjects } from './seed';

// Aims the live sidebar drag at a row, `tabs` indents right of where the pointer picked the project
// up (negative for left). Where the dragged project is top-level, `tabs` is the depth aimed at. The
// ghost takes the slot of the row the carried copy is nearest, so this puts the ghost where `row`
// is: below it when `row` was below the ghost, above it when `row` was above. The dragged project's
// own row is `aimAtOwnRow`'s, since the carried copy repeats its name.
export async function aim(page: Page, from: Point, row: Locator, tabs: number) {
  const target = await center(row);
  await hoverTo(page, { x: from.x + tabs * INDENT_WIDTH, y: target.y });
}

// The same aimed at the dragged project's own row, where the pointer picked it up: the ghost is in
// its own gap, and `tabs` picks a depth of that gap.
export async function aimAtOwnRow(page: Page, from: Point, tabs: number) {
  await hoverTo(page, { x: from.x + tabs * INDENT_WIDTH, y: from.y });
}

// The two rows the ghost sits between, as painted: the nearest row above it and the nearest below,
// null at either end of the list. `rows` are the names of the other rows the sidebar draws, which
// the caller knows (a collapsed project's children and the dragged project's own branch are not
// among them). The rows slide to the ghost over a moment, so a spec polls this.
export async function ghostSlot(
  sidebar: ProjectSidebarPage,
  rows: readonly string[],
): Promise<[above: string | null, below: string | null]> {
  const ghost = await paintedBoxOf(sidebar.ghost);
  let above: { name: string; y: number } | null = null;
  let below: { name: string; y: number } | null = null;
  for (const name of rows) {
    const { y } = await paintedBoxOf(sidebar.row(name));
    if (y < ghost.y) {
      if (!above || y > above.y) above = { name, y };
    } else if (!below || y < below.y) {
      below = { name, y };
    }
  }
  return [above?.name ?? null, below?.name ?? null];
}

// Reads every rendered project name from the sidebar, sorted by painted row position.
// It does not filter to an expected list, so an unexpected or unsuppressed row fails the caller.
export async function drawnProjectNames(sidebar: ProjectSidebarPage): Promise<string[]> {
  const names = sidebar.locator.locator('button.text-left');
  return (await paintedTextRows(names)).sort((a, b) => a.y - b.y).map(row => row.text);
}

// Reads screen geometry: the line covers the ghost's top edge and begins in its name's column.
// The expected relationship comes from the case, not from production indent/placement arithmetic.
export async function expectProjectLine(sidebar: ProjectSidebarPage, name = 'X') {
  await expect(sidebar.dropLine).toHaveCount(1);
  await expect(sidebar.ghost.locator('[data-drop-line]')).toHaveCount(1);
  await expect
    .poll(
      async () => {
        const line = await paintedBoxOf(sidebar.dropLine);
        const ghost = await paintedBoxOf(sidebar.ghost);
        return line.y <= ghost.y && line.y + line.height >= ghost.y;
      },
      { message: 'the drop line crosses the ghost top edge' },
    )
    .toBe(true);
  const line = await paintedBoxOf(sidebar.dropLine);
  const label = await paintedBoxOf(sidebar.ghost.getByRole('button', { name, exact: true }));
  expect(line.x, 'line starts in the ghost name column').toBeCloseTo(label.x, 1);
}

// Reads app-provided ghost depth/invalid attributes and the actual painted neighbors/line.
export async function expectProjectGhost(
  sidebar: ProjectSidebarPage,
  rows: readonly string[],
  slot: [string | null, string | null],
  depth: number,
  { name = 'X', invalid = false }: { name?: string; invalid?: boolean } = {},
) {
  await expect(sidebar.ghost).toHaveAttribute('data-drag-ghost', String(depth));
  await expect.poll(() => ghostSlot(sidebar, rows)).toEqual(slot);
  await expectProjectLine(sidebar, name);
  if (invalid) await expect(sidebar.dropLine).toHaveAttribute('data-drop-invalid', 'true');
  else await expect(sidebar.dropLine).not.toHaveAttribute('data-drop-invalid', 'true');
}

// Reads saved API rows. Expected parent links and sibling order are supplied by the case's fixture.
export async function expectSavedProjectTree(
  request: APIRequestContext,
  ids: Record<string, string>,
  tree: ReadonlyArray<readonly [name: string, parent: string | null]>,
) {
  const saved = await fetchProjects(request);
  expect(saved.map(row => row.id).sort()).toEqual(tree.map(([name]) => ids[name]).sort());
  const lastPosition = new Map<string | null, number>();
  for (const [name, parent] of tree) {
    const row = saved.find(candidate => candidate.id === ids[name]);
    expect(row, `saved project ${name}`).toBeDefined();
    expect(row!.name).toBe(name);
    expect(row!.parentId, `${name}'s saved parent`).toBe(parent === null ? null : ids[parent]);
    expect(row!.position).not.toBeNull();
    if (lastPosition.has(parent)) expect(row!.position!).toBeGreaterThan(lastPosition.get(parent)!);
    lastPosition.set(parent, row!.position!);
  }
  return saved;
}
