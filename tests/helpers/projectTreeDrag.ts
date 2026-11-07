import type { Locator, Page } from '@playwright/test';
import { center, hoverTo, paintedBoxOf, type Point } from './dragGesture';
import { INDENT_WIDTH } from '../../client/src/components/sidebar/projectTreeUtils';
import type { ProjectSidebarPage } from '../pages/ProjectSidebarPage';

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
