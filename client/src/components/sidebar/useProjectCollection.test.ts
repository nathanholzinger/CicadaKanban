// The collection's answer handling, over the hook itself: a write's answer that lands after a delete, and
// one that lands after a newer write of another project. The API is held so each test settles the answers in
// the order it names.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { Project } from '../../types';
import { createProject, deleteProject, fetchProjects, moveProject, updateProject } from '../../api/projects';
import { makeProject } from '../../test/projectFixture';
import { useProjectCollection } from './useProjectCollection';

vi.mock('../../api/projects');

function held<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return { promise, resolve };
}

const treeOf = (...rows: Array<[id: string, parentId: string | null, position: number]>) =>
  rows.map(([id, parentId, position]) => makeProject(id, { parentId, position }));

// The hook on a tree, with every list of projects it rendered kept in `seen`.
async function openCollection(tree: Project[]) {
  vi.mocked(fetchProjects).mockResolvedValue(tree);
  const onParentOpened = vi.fn<(id: string) => void>();
  const seen: Project[][] = [];
  const hook = renderHook(() => {
    const collection = useProjectCollection(onParentOpened);
    seen.push(collection.projects);
    return collection;
  });
  await waitFor(() => expect(hook.result.current.loaded).toBe(true));
  const projects = () => hook.result.current.projects;
  const find = (id: string) => projects().find(p => p.id === id);
  const childrenOf = (parentId: string | null) =>
    projects()
      .filter(p => p.parentId === parentId)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map(p => p.id);
  return { hook, seen, projects, find, childrenOf, onParentOpened };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('TREE-9.4: earlier write answers cannot restore a deleted project or place another under it', () => {
  // P with the child C, an unrelated Q, and X, which is unrelated to P until the last scenario moves it in.
  const TREE = () => treeOf(['P', null, 1], ['C', 'P', 1], ['Q', null, 2], ['X', null, 3]);

  // Each scenario sends one write whose answer is held, and names the answer the server gave.
  const scenarios: Array<{
    name: string;
    send: (c: Awaited<ReturnType<typeof openCollection>>['hook']['result']['current']) => void;
    answer: Project;
  }> = [
    {
      name: 'a rename of P',
      send: c => void c.update('P', { name: 'Renamed' }),
      answer: makeProject('P', { name: 'Renamed', position: 1 }),
    },
    {
      name: 'a move of P',
      send: c => void c.reorder('P', 'Q', null, null),
      answer: makeProject('P', { parentId: 'Q', position: 1 }),
    },
    {
      name: 'an edit of C',
      send: c => void c.update('C', { name: 'Renamed' }),
      answer: makeProject('C', { name: 'Renamed', parentId: 'P', position: 1 }),
    },
    {
      name: 'a move of C that leaves it in P’s subtree',
      send: c => void c.reorder('C', 'P', null, null),
      answer: makeProject('C', { parentId: 'P', position: 2 }),
    },
    {
      name: 'a create of N under P',
      send: c => void c.create({ name: 'N', parentId: 'P' }),
      answer: makeProject('N', { parentId: 'P', position: 2 }),
    },
    {
      name: 'a move of the unrelated X under P',
      send: c => void c.reorder('X', 'P', 'C', null),
      answer: makeProject('X', { parentId: 'P', position: 2 }),
    },
    {
      name: 'a move of the unrelated X under C',
      send: c => void c.reorder('X', 'C', null, null),
      answer: makeProject('X', { parentId: 'C', position: 1 }),
    },
  ];
  const sentWrites = () =>
    [createProject, updateProject, moveProject, deleteProject].map(api => vi.mocked(api).mock.calls.length);

  async function deleteP(collection: Awaited<ReturnType<typeof openCollection>>) {
    vi.mocked(deleteProject).mockResolvedValueOnce(undefined);
    vi.mocked(fetchProjects).mockResolvedValue(treeOf(['Q', null, 2], ['X', null, 3]));
    await act(async () => collection.hook.result.current.remove('P'));
    await waitFor(() => expect(collection.projects().map(p => p.id)).toEqual(['Q', 'X']));
  }

  it.each(scenarios)('$name, answered after P is deleted, brings back no row', async ({ send, answer }) => {
    const collection = await openCollection(TREE());
    const reply = held<Project>();
    for (const api of [updateProject, moveProject, createProject]) vi.mocked(api).mockReturnValueOnce(reply.promise);
    act(() => send(collection.hook.result.current));
    await deleteP(collection);
    const writesBefore = sentWrites();

    await act(async () => reply.resolve(answer));

    // P and its subtree are gone, nothing is shown under P, and Q is as it was.
    expect(collection.projects().map(p => p.id)).toEqual(['Q', 'X']);
    expect(collection.projects().some(p => p.parentId === 'P' || p.parentId === 'C')).toBe(false);
    expect(collection.find('Q')).toMatchObject({ parentId: null, position: 2, name: 'Q' });
    // The old answer sends no write of its own.
    expect(sentWrites()).toEqual(writesBefore);
  });

  it.each([
    ['in the order they were sent', ['P', 'C']],
    ['in the other order', ['C', 'P']],
  ] as const)('several such answers land %s: none brings a row back', async (_, order) => {
    const collection = await openCollection(TREE());
    const answers = {
      P: { reply: held<Project>(), written: makeProject('P', { name: 'Renamed', position: 1 }) },
      C: { reply: held<Project>(), written: makeProject('C', { name: 'Renamed', parentId: 'P', position: 1 }) },
    };
    vi.mocked(updateProject).mockReturnValueOnce(answers.P.reply.promise).mockReturnValueOnce(answers.C.reply.promise);
    act(() => void collection.hook.result.current.update('P', { name: 'Renamed' }));
    act(() => void collection.hook.result.current.update('C', { name: 'Renamed' }));
    await deleteP(collection);

    for (const id of order) await act(async () => answers[id].reply.resolve(answers[id].written));

    expect(collection.projects().map(p => p.id)).toEqual(['Q', 'X']);
  });

  it('opens no collapsed parent for the answer of a project created under a deleted one', async () => {
    const collection = await openCollection(TREE());
    const reply = held<Project>();
    vi.mocked(createProject).mockReturnValueOnce(reply.promise);
    act(() => void collection.hook.result.current.create({ name: 'N', parentId: 'P' }));
    await deleteP(collection);

    await act(async () => reply.resolve(makeProject('N', { parentId: 'P', position: 2 })));

    expect(collection.onParentOpened).not.toHaveBeenCalled();
  });
});

describe('TREE-4.13: a late response preserves positions already set by a newer saved write', () => {
  // P with the children X (1500) and Y (1600); Q with the child B (4); and R at the top level.
  const TREE = () =>
    treeOf(['P', null, 1], ['X', 'P', 1500], ['Y', 'P', 1600], ['Q', null, 2], ['B', 'Q', 4], ['R', null, 3]);
  // Saving R as P's last child renumbers P's children; then X is saved as Q's last child.
  const rAnswer = () => ({
    ...makeProject('R', { parentId: 'P', position: 3 }),
    reindexed: [
      { id: 'X', position: 1 },
      { id: 'Y', position: 2 },
      { id: 'R', position: 3 },
    ],
  });
  const xAnswer = () => makeProject('X', { parentId: 'Q', position: 5 });

  async function sendBoth() {
    const collection = await openCollection(TREE());
    const r = held<Project>();
    const x = held<Project>();
    vi.mocked(moveProject).mockReturnValueOnce(r.promise).mockReturnValueOnce(x.promise);
    act(() => void collection.hook.result.current.reorder('R', 'P', 'Y', null));
    act(() => void collection.hook.result.current.reorder('X', 'Q', 'B', null));
    return { ...collection, r, x };
  }

  function expectSettledTree(collection: Awaited<ReturnType<typeof sendBoth>>) {
    expect(collection.find('X')).toMatchObject({ parentId: 'Q', position: 5 });
    expect(collection.childrenOf('Q')).toEqual(['B', 'X']);
    expect(collection.childrenOf('P')).toEqual(['Y', 'R']);
    expect([collection.find('Y')?.position, collection.find('R')?.position]).toEqual([2, 3]);
  }

  it('keeps X under Q at 5 when R’s older answer lands last, and never draws X before B', async () => {
    const collection = await sendBoth();

    await act(async () => collection.x.resolve(xAnswer()));
    expect(collection.childrenOf('Q')).toEqual(['B', 'X']);
    await act(async () => collection.r.resolve(rAnswer()));

    expectSettledTree(collection);
    // No render that had X under Q put it before B.
    for (const projects of collection.seen) {
      const x = projects.find(p => p.id === 'X');
      const b = projects.find(p => p.id === 'B');
      if (x?.parentId === 'Q') expect(x.position ?? 0).toBeGreaterThan(b?.position ?? 0);
    }
  });

  it('ends with the same tree when the answers land in the order they were saved', async () => {
    const collection = await sendBoth();

    await act(async () => collection.r.resolve(rAnswer()));
    await act(async () => collection.x.resolve(xAnswer()));

    expectSettledTree(collection);
  });

  it('keeps a position a newer write set over the older answer’s own position for that row', async () => {
    // X and Y and Z at the top level. X is saved at 5 (the earlier answer); Y's later write reindexes X to 2.
    const collection = await openCollection(treeOf(['X', null, 1], ['Y', null, 998], ['Z', null, 999]));
    const x = held<Project>();
    const y = held<Project>();
    vi.mocked(moveProject).mockReturnValueOnce(x.promise).mockReturnValueOnce(y.promise);
    act(() => void collection.hook.result.current.reorder('X', null, 'Z', null));
    act(() => void collection.hook.result.current.reorder('Y', null, 'Z', null));

    await act(async () =>
      y.resolve({
        ...makeProject('Y', { position: 3 }),
        reindexed: [
          { id: 'X', position: 2 },
          { id: 'Y', position: 3 },
        ],
      } as Project),
    );
    await act(async () => x.resolve(makeProject('X', { position: 5, name: 'Saved' })));

    // X keeps 2; it takes what else its own answer said.
    expect(collection.find('X')).toMatchObject({ position: 2, name: 'Saved' });
  });
});
