// A project move as `App.tsx` wires it: drawn at the release, by the relation it sends, until its own
// answer lands, and gone back if it is refused. The sidebar is a stand-in that lists the tree it is
// given and releases moves, since what is under test is the tree `App.tsx` hands it.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Project } from './types';
import {
  deleteProject,
  fetchProjectDepthCap,
  fetchProjects,
  moveProject,
  updateProject,
  type UpdateProjectInput,
} from './api/projects';
import { fetchWorkflows } from './api/workflows';
import type { ReorderProject } from './components/sidebar/useProjectDragReorder';
import type { PendingMove } from './lib/hierarchy';
import { makeProject } from './test/projectFixture';
import App from './App';

vi.mock('./api/projects');
vi.mock('./api/workflows');
vi.mock('./components/NotificationsBell', () => ({ default: () => null }));
vi.mock('./components/ProjectPage', () => ({
  default: ({ onUpdate }: { onUpdate: UpdateProject }) => {
    update = onUpdate;
    return null;
  },
}));

// Every tree the stand-in sidebar was given, as its rows in order: `id` at its depth, so a render that
// drew a project at the wrong place is on the record. And the projects of the latest, to read their
// positions: the stand-in lists them with the moves it is given, as the real sidebar does.
const seen = vi.hoisted(() => ({ trees: [] as string[][], projects: [] as Project[] }));
let release: ReorderProject;
let remove: (id: string) => Promise<void>;
type UpdateProject = (id: string, data: UpdateProjectInput) => Promise<void>;
let update: UpdateProject;

vi.mock('./components/ProjectSidebar', async () => {
  const { flattenTree: flatten } = await import('./components/sidebar/projectTreeUtils');
  return {
    default: ({
      projects,
      pendingMoves,
      onReorderProject,
      onDeleteProject,
    }: {
      projects: Project[];
      pendingMoves: PendingMove[];
      onReorderProject: ReorderProject;
      onDeleteProject: (id: string) => Promise<void>;
    }) => {
      release = onReorderProject;
      remove = onDeleteProject;
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
  // A held answer queued for a request that was never sent must not reach the next test's.
  for (const api of [fetchProjects, moveProject, updateProject, deleteProject]) vi.mocked(api).mockReset();
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

// A tree from `[id, parentId, position]` rows, for the cases below that open the app on a tree of their own.
const treeOf = (...rows: Array<[id: string, parentId: string | null, position: number]>) =>
  rows.map(([id, parentId, position]) => makeProject(id, { parentId, position }));

describe('TREE-4.8: after a failed write, the sidebar shows the project where it was before the attempt', () => {
  // A, B and X at the top level, and X's move under A is refused.
  const REST = 'A B X';

  async function releaseXUnderA() {
    vi.mocked(fetchProjects).mockResolvedValue(treeOf(['A', null, 1], ['B', null, 2], ['X', null, 3]));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await openApp(REST);
    const answer = held<Project>();
    vi.mocked(moveProject).mockReturnValueOnce(answer.promise);
    act(() => void release('X', 'A', null, null));
    // Drawn under A at the release, before the refusal arrives.
    expect(tree()).toBe('A -X B');
    return answer;
  }

  it('puts X back as soon as the move fails, without waiting for the read of the tree', async () => {
    const answer = await releaseXUnderA();
    vi.mocked(fetchProjects).mockReturnValueOnce(new Promise<Project[]>(() => {}));

    await act(async () => answer.reject(new Error('refused')));

    expect(tree()).toBe(REST);
  });

  it('leaves X restored rather than retaining the refused placement when the read fails too', async () => {
    const answer = await releaseXUnderA();
    vi.mocked(fetchProjects).mockRejectedValueOnce(new Error('down'));

    await act(async () => answer.reject(new Error('refused')));

    expect(tree()).toBe(REST);
  });
});

describe('TREE-4.9: a release draws the move and its branch at once, and success keeps that placement', () => {
  it('draws X between A1 and A2 under A, with X1 beneath it, before the answer, and a success leaves it', async () => {
    vi.mocked(fetchProjects).mockResolvedValue(
      treeOf(['A', null, 1], ['A1', 'A', 1], ['A2', 'A', 2], ['B', null, 2], ['X', null, 3], ['X1', 'X', 1]),
    );
    await openApp('A -A1 -A2 B X -X1');
    const answer = held<Project>();
    vi.mocked(moveProject).mockReturnValueOnce(answer.promise);

    act(() => void release('X', 'A', 'A1', null));

    // After A1 and before A2, the relation the move sends; no X row remains top-level.
    expect(tree()).toBe('A -A1 -X --X1 -A2 B');
    expect(moveProject).toHaveBeenCalledExactlyOnceWith('X', { parentId: 'A', prevId: 'A1', nextId: null });
    const rendersBefore = seen.trees.length;

    await act(async () => answer.resolve(makeProject('X', { parentId: 'A', position: 1.5 })));

    expect(tree()).toBe('A -A1 -X --X1 -A2 B');
    for (const rows of seen.trees.slice(rendersBefore)) expect(rows.join(' ')).toBe('A -A1 -X --X1 -A2 B');
  });
});

describe('TREE-4.10: moves released one after another settle independently by their own answers', () => {
  // P has A, Q has B, and X and Y are top-level leaves. X goes under P after A, then Y under Q after B.
  const REST = 'P -A Q -B X Y';
  const BOTH = 'P -A -X Q -B -Y';
  const FIXTURE = treeOf(['P', null, 1], ['A', 'P', 1], ['Q', null, 2], ['B', 'Q', 1], ['X', null, 3], ['Y', null, 4]);
  const xSaved = () => makeProject('X', { parentId: 'P', position: 1.5 });
  const ySaved = () => makeProject('Y', { parentId: 'Q', position: 1.5 });

  async function releaseBoth() {
    vi.mocked(fetchProjects).mockResolvedValue(FIXTURE);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await openApp(REST);
    const x = held<Project>();
    const y = held<Project>();
    vi.mocked(moveProject).mockReturnValueOnce(x.promise).mockReturnValueOnce(y.promise);
    act(() => void release('X', 'P', 'A', null));
    act(() => void release('Y', 'Q', 'B', null));
    // Both are drawn at once, before either answer.
    expect(tree()).toBe(BOTH);
    return { x, y };
  }

  it.each(['X', 'Y'] as const)(
    'keeps the other move drawn while its answer is out, whichever answers first (%s)',
    async first => {
      const { x, y } = await releaseBoth();
      const [firstMove, secondMove] = first === 'X' ? [x, y] : [y, x];
      const saved = (id: 'X' | 'Y') => (id === 'X' ? xSaved() : ySaved());
      const second = first === 'X' ? 'Y' : 'X';

      await act(async () => firstMove.resolve(saved(first)));
      expect(tree()).toBe(BOTH);

      await act(async () => secondMove.resolve(saved(second)));
      expect(tree()).toBe(BOTH);
    },
  );

  it('puts X back when it fails while Y is unanswered, and Y stays there when it then succeeds', async () => {
    const { x, y } = await releaseBoth();

    await act(async () => x.reject(new Error('refused')));
    expect(tree()).toBe('P -A Q -B -Y X');

    await act(async () => y.resolve(ySaved()));
    expect(tree()).toBe('P -A Q -B -Y X');
  });

  it('keeps Y’s saved placement through X’s rollback and the read that follows it, when Y succeeds first', async () => {
    const { x, y } = await releaseBoth();

    await act(async () => y.resolve(ySaved()));
    expect(tree()).toBe(BOTH);

    // The server has Y where its answer put it, and X where it was.
    vi.mocked(fetchProjects).mockResolvedValue(FIXTURE.map(p => (p.id === 'Y' ? ySaved() : p)));
    await act(async () => x.reject(new Error('refused')));
    expect(tree()).toBe('P -A Q -B -Y X');
  });
});

describe('TREE-2.12: every end of the drag draws the branch again under the project', () => {
  it('draws X and its branch under Q at the release, before the answer, and a success leaves that tree', async () => {
    // X has the children A and B, and A has A1. Q is unrelated.
    vi.mocked(fetchProjects).mockResolvedValue(
      treeOf(['X', null, 1], ['A', 'X', 1], ['A1', 'A', 1], ['B', 'X', 2], ['Q', null, 2]),
    );
    await openApp('X -A --A1 -B Q');
    const answer = held<Project>();
    vi.mocked(moveProject).mockReturnValueOnce(answer.promise);

    act(() => void release('X', 'Q', null, null));

    // The branch is under X throughout the move, with A before B and A1 under A.
    expect(tree()).toBe('Q -X --A ---A1 --B');
    await act(async () => answer.resolve(makeProject('X', { parentId: 'Q', position: 1 })));
    expect(tree()).toBe('Q -X --A ---A1 --B');
  });
});

describe('a project written twice before its first answer: the writes go out one at a time, in the order made', () => {
  // R is top-level. It is moved under P after C, then, before that answer, under Q.
  const underP = () => makeProject('R', { parentId: 'P', position: 1.5 });
  const underQ = () => makeProject('R', { parentId: 'Q', position: 1 });
  const UNDER_Q = 'P -C -D Q -R';

  async function releaseTwice() {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await openApp();
    const first = held<Project>();
    const second = held<Project>();
    vi.mocked(moveProject).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    act(() => void release('R', 'P', 'C', null));
    act(() => void release('R', 'Q', null, null));
    return { first, second };
  }

  it('sends the second move only once the first is answered, and draws R under Q from its release on', async () => {
    const { first, second } = await releaseTwice();

    expect(moveProject).toHaveBeenCalledExactlyOnceWith('R', { parentId: 'P', prevId: 'C', nextId: null });
    expect(tree()).toBe(UNDER_Q);

    await act(async () => first.resolve(underP()));
    expect(moveProject).toHaveBeenCalledTimes(2);
    expect(moveProject).toHaveBeenLastCalledWith('R', { parentId: 'Q', prevId: null, nextId: null });
    expect(tree()).toBe(UNDER_Q);

    await act(async () => second.resolve(underQ()));
    expect(tree()).toBe(UNDER_Q);
    expect(seen.projects.find(p => p.id === 'R')).toMatchObject({ parentId: 'Q', position: 1 });
  });

  it('sends the second move after the first is refused, and ends with R under Q', async () => {
    const { first, second } = await releaseTwice();

    await act(async () => first.reject(new Error('refused')));
    expect(moveProject).toHaveBeenCalledTimes(2);
    expect(tree()).toBe(UNDER_Q);

    await act(async () => second.resolve(underQ()));
    expect(tree()).toBe(UNDER_Q);
    expect(seen.projects.find(p => p.id === 'R')).toMatchObject({ parentId: 'Q', position: 1 });
  });

  it('keeps another project’s move out of the line: it is sent at once', async () => {
    await releaseTwice();
    vi.mocked(moveProject).mockReturnValueOnce(held<Project>().promise);

    act(() => void release('D', null, null, 'P'));

    expect(moveProject).toHaveBeenCalledTimes(2);
    expect(moveProject).toHaveBeenLastCalledWith('D', { parentId: null, prevId: null, nextId: 'P' });
  });

  it('holds an edit of R behind R’s move, and sends it once that is answered', async () => {
    localStorage.setItem('activeProjectId', 'R');
    await openApp();
    const answer = held<Project>();
    vi.mocked(moveProject).mockReturnValueOnce(answer.promise);
    vi.mocked(updateProject).mockResolvedValueOnce(makeProject('R', { parentId: 'P', name: 'Renamed', position: 1.5 }));
    act(() => void release('R', 'P', 'C', null));

    let edited!: Promise<void>;
    act(() => {
      edited = update('R', { name: 'Renamed' });
    });
    expect(updateProject).not.toHaveBeenCalled();

    await act(async () => answer.resolve(underP()));
    await act(async () => edited);

    expect(updateProject).toHaveBeenCalledExactlyOnceWith('R', { name: 'Renamed' });
  });
});

describe('a read of the whole tree after a write: applied only when no write has landed since it started', () => {
  // The server's tree once Q has been moved under P, after D.
  const SERVER = treeOf(['P', null, 1], ['C', 'P', 1], ['D', 'P', 2], ['Q', 'P', 3], ['R', null, 3]);
  const qSaved = () => makeProject('Q', { parentId: 'P', position: 3 });

  it('draws Q where its answer put it when the read that a refused move started lands with the older tree', async () => {
    await openApp();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const r = held<Project>();
    const q = held<Project>();
    vi.mocked(moveProject).mockReturnValueOnce(r.promise).mockReturnValueOnce(q.promise);
    act(() => void release('R', 'P', 'C', null));
    act(() => void release('Q', 'P', 'D', null));
    const read = held<Project[]>();
    vi.mocked(fetchProjects).mockClear();
    vi.mocked(fetchProjects).mockReturnValueOnce(read.promise);

    await act(async () => r.reject(new Error('refused')));
    await act(async () => q.resolve(qSaved()));
    expect(tree()).toBe('P -C -D -Q R');
    vi.mocked(fetchProjects).mockResolvedValue(SERVER);
    await act(async () => read.resolve(TREE));

    // The older tree is dropped, and the tree is read again.
    expect(fetchProjects).toHaveBeenCalledTimes(2);
    expect(tree()).toBe('P -C -D -Q R');
  });

  it('does the same for the read after a delete', async () => {
    await openApp();
    vi.mocked(deleteProject).mockResolvedValueOnce(undefined);
    const read = held<Project[]>();
    vi.mocked(fetchProjects).mockClear();
    vi.mocked(fetchProjects).mockReturnValueOnce(read.promise);
    await act(async () => remove('R'));
    const q = held<Project>();
    vi.mocked(moveProject).mockReturnValueOnce(q.promise);
    act(() => void release('Q', 'P', 'D', null));
    await act(async () => q.resolve(qSaved()));
    vi.mocked(fetchProjects).mockResolvedValue(SERVER.filter(p => p.id !== 'R'));

    await act(async () => read.resolve(TREE));

    expect(fetchProjects).toHaveBeenCalledTimes(2);
    expect(tree()).toBe('P -C -D -Q');
  });

  it('applies a read that no write has overtaken, as before', async () => {
    await openApp();
    vi.mocked(deleteProject).mockResolvedValueOnce(undefined);
    vi.mocked(fetchProjects).mockClear();
    vi.mocked(fetchProjects).mockResolvedValue(TREE.filter(p => p.id !== 'R'));

    await act(async () => remove('R'));

    expect(fetchProjects).toHaveBeenCalledTimes(1);
    expect(tree()).toBe('P -C -D Q');
  });
});

describe('TREE-1.14: a move refused after an earlier edit landed leaves that edit', () => {
  it('returns X to its top-level place with Y still its child, each at its saved position', async () => {
    // X, Y and B are top-level. Y's edit under X was answered after X was picked up, and X is then released as
    // Y's child, which the server refuses as a cycle: Y is X's descendant now. It is not TREE-1.15's refusal,
    // which is a move that the grown height takes past the cap; that needs the real drag.
    vi.mocked(fetchProjects).mockResolvedValue(treeOf(['X', null, 1], ['Y', null, 2], ['B', null, 3]));
    localStorage.setItem('activeProjectId', 'Y');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await openApp('X Y B');
    vi.mocked(updateProject).mockResolvedValueOnce(makeProject('Y', { parentId: 'X', position: 1 }));
    await act(async () => update('Y', { parentId: 'X' }));
    expect(tree()).toBe('X -Y B');

    // The read after the refusal has the saved tree: the edit is not undone.
    vi.mocked(moveProject).mockRejectedValueOnce(new Error('refused'));
    vi.mocked(fetchProjects).mockResolvedValue(treeOf(['X', null, 1], ['Y', 'X', 1], ['B', null, 2]));
    await act(async () => {
      await release('X', 'Y', null, null);
    });

    expect(moveProject).toHaveBeenCalledExactlyOnceWith('X', { parentId: 'Y', prevId: null, nextId: null });
    expect(tree()).toBe('X -Y B');
    expect(Object.fromEntries(seen.projects.map(p => [p.id, [p.parentId, p.position]]))).toEqual({
      X: [null, 1],
      Y: ['X', 1],
      B: [null, 2],
    });
  });
});
