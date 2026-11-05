// A project move as `App.tsx` wires it: drawn at the release, by the relation it sends, until its own
// answer lands, and gone back if it is refused. The sidebar is a stand-in that lists the tree it is
// given and releases moves, since what is under test is the tree `App.tsx` hands it.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Project } from './types';
import { fetchProjectDepthCap, fetchProjects, moveProject } from './api/projects';
import { fetchWorkflows } from './api/workflows';
import type { ReorderProject } from './components/sidebar/useProjectDragReorder';
import type { PendingMove } from './lib/hierarchy';
import { makeProject } from './test/projectFixture';
import App from './App';

vi.mock('./api/projects');
vi.mock('./api/workflows');
vi.mock('./components/NotificationsBell', () => ({ default: () => null }));
vi.mock('./components/ProjectPage', () => ({ default: () => null }));

// Every tree the stand-in sidebar was given, as its rows in order: `id` at its depth, so a render that
// drew a project at the wrong place is on the record. And the projects of the latest, to read their
// positions: the stand-in lists them with the moves it is given, as the real sidebar does.
const seen = vi.hoisted(() => ({ trees: [] as string[][], projects: [] as Project[] }));
let release: ReorderProject;

vi.mock('./components/ProjectSidebar', async () => {
  const { flattenTree: flatten } = await import('./components/sidebar/projectTreeUtils');
  return {
    default: ({
      projects,
      pendingMoves,
      onReorderProject,
    }: {
      projects: Project[];
      pendingMoves: PendingMove[];
      onReorderProject: ReorderProject;
    }) => {
      release = onReorderProject;
      const rows = flatten(projects, new Set(projects.map(p => p.id)), pendingMoves).map(
        i => `${'-'.repeat(i.depth)}${i.id}`,
      );
      seen.trees.push(rows);
      seen.projects = projects;
      return <ol aria-label="projects">{rows.join(' ')}</ol>;
    },
  };
});

// P, with the children C and D, then Q and R at the top level.
const TREE = [
  makeProject('P', { position: 1 }),
  makeProject('C', { parentId: 'P', position: 1 }),
  makeProject('D', { parentId: 'P', position: 2 }),
  makeProject('Q', { position: 2 }),
  makeProject('R', { position: 3 }),
];
const AT_REST = 'P -C -D Q R';

const tree = () => screen.getByLabelText('projects').textContent;

// A move request held until the test settles it.
function held<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.clearAllMocks();
  seen.trees = [];
  localStorage.clear();
  vi.mocked(fetchProjects).mockResolvedValue(TREE);
  vi.mocked(fetchProjectDepthCap).mockResolvedValue(5);
  vi.mocked(fetchWorkflows).mockResolvedValue([]);
});

async function openApp(atRest = AT_REST) {
  render(<App />);
  await screen.findByLabelText('projects');
  expect(tree()).toBe(atRest);
  return userEvent.setup();
}

describe('a project move, from its release to its answer', () => {
  it('is drawn at the release, before the answer: the project under its new parent, beside the sibling it names', async () => {
    await openApp();
    const answer = held<Project>();
    vi.mocked(moveProject).mockReturnValueOnce(answer.promise);

    act(() => void release('R', 'P', 'C', null));

    expect(tree()).toBe('P -C -R -D Q');
    expect(moveProject).toHaveBeenCalledExactlyOnceWith('R', { parentId: 'P', prevId: 'C', nextId: null });
    await act(async () => answer.resolve(makeProject('R', { parentId: 'P', position: 1.5 })));
    expect(tree()).toBe('P -C -R -D Q');
  });

  it('takes the project’s branch with it, and puts it last when it names no neighbor', async () => {
    await openApp();
    vi.mocked(moveProject).mockReturnValueOnce(held<Project>().promise);

    act(() => void release('P', 'R', null, null));

    expect(tree()).toBe('Q R -P --C --D');
  });

  it('is replaced by the answer in one update: no render draws the project at the place it left', async () => {
    await openApp();
    const answer = held<Project>();
    vi.mocked(moveProject).mockReturnValueOnce(answer.promise);
    act(() => void release('R', 'P', 'C', null));
    const rendersBefore = seen.trees.length;

    await act(async () => answer.resolve(makeProject('R', { parentId: 'P', position: 1.5 })));

    expect(tree()).toBe('P -C -R -D Q');
    const after = seen.trees.slice(rendersBefore).map(rows => rows.join(' '));
    expect(after.length).toBeGreaterThan(0);
    for (const rows of after) expect(rows).toBe('P -C -R -D Q');
  });

  it('goes back when it is refused, the project at the place it had, and the tree is read again', async () => {
    await openApp();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const answer = held<Project>();
    vi.mocked(moveProject).mockReturnValueOnce(answer.promise);
    act(() => void release('R', 'P', 'C', null));
    expect(tree()).toBe('P -C -R -D Q');
    vi.mocked(fetchProjects).mockClear();

    await act(async () => answer.reject(new Error('refused')));

    expect(tree()).toBe(AT_REST);
    expect(fetchProjects).toHaveBeenCalledTimes(1);
  });

  it('goes back when the read after a refusal fails too: it does not wait for it', async () => {
    await openApp();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const answer = held<Project>();
    vi.mocked(moveProject).mockReturnValueOnce(answer.promise);
    act(() => void release('R', 'P', 'C', null));
    vi.mocked(fetchProjects).mockRejectedValueOnce(new Error('down'));

    await act(async () => answer.reject(new Error('refused')));

    expect(tree()).toBe(AT_REST);
  });

  it('leaves a second move out when the first is answered, and a first when the second is', async () => {
    await openApp();
    const first = held<Project>();
    const second = held<Project>();
    vi.mocked(moveProject).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    act(() => void release('R', 'P', 'C', null));
    act(() => void release('Q', 'P', 'R', null));
    expect(tree()).toBe('P -C -R -Q -D');

    // The first answers: R is where it was drawn, and Q is still out.
    await act(async () => first.resolve(makeProject('R', { parentId: 'P', position: 1.5 })));
    expect(tree()).toBe('P -C -R -Q -D');

    // The second is refused: Q goes back, and R, answered, stays. The read that follows is the server's
    // tree, which has R where its answer put it.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(fetchProjects).mockResolvedValue(
      TREE.map(p => (p.id === 'R' ? { ...p, parentId: 'P', position: 1.5 } : p)),
    );
    await act(async () => second.reject(new Error('refused')));
    expect(tree()).toBe('P -C -R -D Q');
  });

  it('keeps the first move out when the second is answered first', async () => {
    await openApp();
    const first = held<Project>();
    const second = held<Project>();
    vi.mocked(moveProject).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    act(() => void release('R', 'P', 'C', null));
    act(() => void release('Q', 'P', 'R', null));

    await act(async () => second.resolve(makeProject('Q', { parentId: 'P', position: 1.75 })));
    expect(tree()).toBe('P -C -R -Q -D');
  });

  it('draws a project ahead of the first top-level project when it names that one as the neighbor after it', async () => {
    await openApp();
    vi.mocked(moveProject).mockReturnValueOnce(held<Project>().promise);

    act(() => void release('D', null, null, 'P'));

    expect(tree()).toBe('D P -C Q R');
  });
});

describe('the positions of a tree with a move out', () => {
  // P, with the children A and B; X, with the child X1. Each position is its own, so a place by slot is
  // told from a place by position: X's, 30, is past B's, and X1's, 7, is below every one of P's children.
  const SLOT_TREE = [
    makeProject('P', { position: 1 }),
    makeProject('A', { parentId: 'P', position: 10 }),
    makeProject('B', { parentId: 'P', position: 20 }),
    makeProject('X', { position: 30 }),
    makeProject('X1', { parentId: 'X', position: 7 }),
  ];
  const positions = () => Object.fromEntries(seen.projects.map(p => [p.id, p.position]));

  it('TREE-4.12: a drawn move changes order by slot without computing any position', async () => {
    vi.mocked(fetchProjects).mockResolvedValue(SLOT_TREE);
    await openApp('P -A -B X -X1');
    const answer = held<Project>();
    vi.mocked(moveProject).mockReturnValueOnce(answer.promise);

    act(() => void release('X', 'P', 'A', null));

    // X is drawn after A, with X1 under it, by the slot it names. Every position is the server's.
    expect(tree()).toBe('P -A -X --X1 -B');
    expect(positions()).toEqual({ P: 1, A: 10, B: 20, X: 30, X1: 7 });
    expect(moveProject).toHaveBeenCalledExactlyOnceWith('X', { parentId: 'P', prevId: 'A', nextId: null });

    // The answer gives X its position, 15, and nothing else changes, nor does the tree drawn.
    await act(async () => answer.resolve(makeProject('X', { parentId: 'P', position: 15 })));
    expect(tree()).toBe('P -A -X --X1 -B');
    expect(positions()).toEqual({ P: 1, A: 10, B: 20, X: 15, X1: 7 });
  });
});
