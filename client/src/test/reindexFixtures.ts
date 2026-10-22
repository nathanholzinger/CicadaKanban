import { makeItem } from './itemFixture';

// The worked example of wiki positioning §7: X is written after A, and the reindex it
// triggers renumbers A, C and E too. A caller that learned only X=2 would sort X last;
// with the pairs applied first the rendered order is A, X, C, E.
export const workedList = () => [
  makeItem('A', { position: 1.0 }),
  makeItem('C', { position: 1.5 }),
  makeItem('E', { position: 1.75 }),
  makeItem('X', { position: 9 }),
];

export const workedResponse = {
  ...makeItem('X', { position: 2 }),
  reindexed: [
    { id: 'A', position: 1 },
    { id: 'X', position: 2 },
    { id: 'C', position: 3 },
    { id: 'E', position: 4 },
  ],
};
