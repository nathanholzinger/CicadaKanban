// The sidebar's collapsed projects as `App.tsx` wires them: every project is open unless the user
// collapsed it, and a project put under a collapsed one by a create or a parent change opens it, once the
// write has succeeded. A drop's opening is `useProjectDragReorder.ts`'s, which `App.tsx` hands the same
// way to open one.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Project } from './types';
import { createProject, fetchProjectDepthCap, fetchProjects, updateProject } from './api/projects';
import { fetchWorkflows } from './api/workflows';
import { makeProject } from './test/projectFixture';
import App from './App';

vi.mock('./api/projects');
vi.mock('./api/workflows');
vi.mock('./components/NotificationsBell', () => ({ default: () => null }));
// The page's own parent dropdown and subprojects list are not under test: two buttons stand in for the
// writes they make, a rename and a move under P.
vi.mock('./components/ProjectPage', () => ({
  default: ({ project, onUpdate }: { project: Project; onUpdate: (id: string, data: object) => Promise<void> }) => (
    <div>
      <button onClick={() => void onUpdate(project.id, { name: 'Renamed' }).catch(() => {})}>rename</button>
      <button onClick={() => void onUpdate(project.id, { parentId: 'P' }).catch(() => {})}>move under P</button>
    </div>
  ),
}));

// P, with the child C, and Q and R at the top level.
const TREE = [
  makeProject('P', { position: 1 }),
  makeProject('C', { parentId: 'P', position: 1 }),
  makeProject('Q', { position: 2 }),
  makeProject('R', { position: 3 }),
];

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  vi.mocked(fetchProjects).mockResolvedValue(TREE);
  vi.mocked(fetchProjectDepthCap).mockResolvedValue(5);
  vi.mocked(fetchWorkflows).mockResolvedValue([]);
});

afterEach(() => vi.restoreAllMocks());

const NAMES = ['P', 'C', 'Q', 'R'] as const;
// A project's row in the sidebar. A modal under the page can name a project too, so the queries stay in the sidebar.
const sidebar = () => within(screen.getByRole('complementary'));
const row = (name: string) => sidebar().getByText(name, { exact: true }).parentElement!;
const isShown = (name: string) => sidebar().queryByText(name, { exact: true }) !== null;

async function openApp() {
  render(<App />);
  await screen.findByRole('complementary');
  await sidebar().findByText('P', { exact: true });
  return userEvent.setup();
}

async function collapse(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(within(row(name)).getByLabelText('Collapse'));
  expect(within(row(name)).getByLabelText('Expand')).toBeInTheDocument();
}

// Creates a subproject of `parent` through the sidebar's "Add subproject", which the server's answer
// puts under it.
async function createSubproject(user: ReturnType<typeof userEvent.setup>, parent: string, name: string) {
  await user.click(within(row(parent)).getByLabelText('Add subproject'));
  await user.type(await screen.findByPlaceholderText('Subproject name'), name);
  await user.click(screen.getByRole('button', { name: 'Create subproject' }));
}

describe('every project starts open', () => {
  it('draws every project of the tree, a parent’s child included', async () => {
    await openApp();
    for (const name of NAMES) expect(isShown(name)).toBe(true);
  });

  it('draws a project created after the sidebar loaded open, so its first subproject shows', async () => {
    const user = await openApp();
    vi.mocked(createProject).mockResolvedValueOnce(makeProject('N', { position: 4 }));
    await user.click(screen.getByTitle('New project'));
    await user.type(await screen.findByPlaceholderText('Project name'), 'N');
    await user.click(screen.getByRole('button', { name: 'Create project' }));
    await sidebar().findByText('N', { exact: true });

    vi.mocked(createProject).mockResolvedValueOnce(makeProject('N1', { parentId: 'N', position: 1 }));
    await createSubproject(user, 'N', 'N1');

    expect(await sidebar().findByText('N1', { exact: true })).toBeInTheDocument();
  });
});

describe('a create under a collapsed project', () => {
  it('opens it, and shows the new subproject with the rest of its children', async () => {
    const user = await openApp();
    await collapse(user, 'P');
    expect(isShown('C')).toBe(false);

    vi.mocked(createProject).mockResolvedValueOnce(makeProject('C2', { parentId: 'P', position: 2 }));
    await createSubproject(user, 'P', 'C2');

    expect(await sidebar().findByText('C2', { exact: true })).toBeInTheDocument();
    expect(isShown('C')).toBe(true);
    expect(within(row('P')).getByLabelText('Collapse')).toBeInTheDocument();
  });

  it('leaves it collapsed when the create fails', async () => {
    const user = await openApp();
    await collapse(user, 'P');

    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(createProject).mockRejectedValueOnce(new Error('refused'));
    await createSubproject(user, 'P', 'C2');
    await screen.findByText('Failed to create project. Please try again.');

    expect(isShown('C')).toBe(false);
    expect(within(row('P')).getByLabelText('Expand')).toBeInTheDocument();
  });

  it('leaves a project the create is not under as the user left it', async () => {
    const user = await openApp();
    await collapse(user, 'P');

    vi.mocked(createProject).mockResolvedValueOnce(makeProject('Q1', { parentId: 'Q', position: 1 }));
    await createSubproject(user, 'Q', 'Q1');

    expect(await sidebar().findByText('Q1', { exact: true })).toBeInTheDocument();
    expect(isShown('C')).toBe(false);
  });
});

describe('a parent change into a collapsed project', () => {
  it('opens it, once the write has succeeded', async () => {
    const user = await openApp();
    await collapse(user, 'P');
    await user.click(sidebar().getByText('R', { exact: true }));

    vi.mocked(updateProject).mockResolvedValueOnce(makeProject('R', { parentId: 'P', position: 2 }));
    await user.click(screen.getByRole('button', { name: 'move under P' }));

    expect(await sidebar().findByText('C', { exact: true })).toBeInTheDocument();
    expect(within(row('P')).getByLabelText('Collapse')).toBeInTheDocument();
  });

  it('leaves it collapsed when the write fails', async () => {
    const user = await openApp();
    await collapse(user, 'P');
    await user.click(sidebar().getByText('R', { exact: true }));

    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(updateProject).mockRejectedValueOnce(new Error('refused'));
    await user.click(screen.getByRole('button', { name: 'move under P' }));

    await vi.waitFor(() => expect(updateProject).toHaveBeenCalledTimes(1));
    expect(isShown('C')).toBe(false);
    expect(within(row('P')).getByLabelText('Expand')).toBeInTheDocument();
  });

  it('leaves a parent the user collapsed alone through a write that puts no project under it', async () => {
    const user = await openApp();
    await user.click(sidebar().getByText('C', { exact: true }));
    await collapse(user, 'P');
    expect(isShown('C')).toBe(false);

    // C stays under P: a rename, whose answer names the parent it already had.
    vi.mocked(updateProject).mockResolvedValueOnce(makeProject('C', { parentId: 'P', name: 'Renamed', position: 1 }));
    await user.click(screen.getByRole('button', { name: 'rename' }));

    await vi.waitFor(() => expect(updateProject).toHaveBeenCalledTimes(1));
    expect(isShown('Renamed')).toBe(false);
    expect(within(row('P')).getByLabelText('Expand')).toBeInTheDocument();
  });
});
