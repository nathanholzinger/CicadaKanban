import type { Locator, Page } from '@playwright/test';
import { bottomQuarter, hoverTo, topQuarter, type Point } from './dragGesture';
import { INDENT_WIDTH } from '../../client/src/components/sidebar/projectTreeUtils';

// Every request the page sends from now on that isn't a GET, as `METHOD url`, for a
// spec that asserts a gesture wrote nothing.
export function watchWrites(page: Page): string[] {
  const writes: string[] = [];
  page.on('request', req => {
    if (req.method() !== 'GET') writes.push(`${req.method()} ${req.url()}`);
  });
  return writes;
}

// Aims the live sidebar drag at the top or bottom of a row, `tabs` indents right
// of where the pointer picked the project up (negative for left). Where the
// dragged project is top-level, `tabs` is the depth aimed at.
export async function aim(page: Page, from: Point, row: Locator, side: 'before' | 'after', tabs: number) {
  const target = side === 'before' ? await topQuarter(row) : await bottomQuarter(row);
  await hoverTo(page, { x: from.x + tabs * INDENT_WIDTH, y: target.y });
}
