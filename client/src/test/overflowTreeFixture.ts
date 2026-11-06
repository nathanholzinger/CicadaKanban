// The overflow tree: a Card's descendants section cut off by the levels it shows, built once for the
// suites that read it (the section's rows and entries, and the Descendants projection). Card P holds A
// (then Q, which holds R and T) and B. R holds R1 (which holds R1a) and R2, and has a Free child F. T has
// only a Free child G. Drawn with three levels, R's children are hidden behind an overflow row of two;
// T, whose only child is Free, has none.
//
//   A (0)
//     Q (1)
//       R (2)              R's children are hidden when three levels show
//         R1 (3)
//           R1a (4)
//         R2 (3)
//       T (2)              T has only a Free child, G
//   B (0)
//
// A suite adds what it needs to the list, such as a Free Card from outside the section.

import type { Item } from '../types';
import { makeItem } from './itemFixture';

export function overflowTree(): Item[] {
  return [
    makeItem('P'),
    makeItem('A', { parentId: 'P', position: 1 }),
    makeItem('B', { parentId: 'P', position: 2 }),
    makeItem('Q', { parentId: 'A' }),
    makeItem('R', { parentId: 'Q', position: 1 }),
    makeItem('T', { parentId: 'Q', position: 2 }),
    makeItem('R1', { parentId: 'R', position: 1 }),
    makeItem('R2', { parentId: 'R', position: 2 }),
    makeItem('R1a', { parentId: 'R1' }),
    makeItem('F', { parentId: 'R', isAttached: 0 }),
    makeItem('G', { parentId: 'T', isAttached: 0 }),
  ];
}
