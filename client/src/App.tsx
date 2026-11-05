// State root: layout, workflow inheritance (a project with no workflow inherits
// from its nearest ancestor that has one).

import { useEffect, useRef, useState } from 'react';
import type { Workflow } from './types';
import type { Project } from './types';
import { fetchWorkflows, createWorkflow } from './api/workflows';
import type { CreateWorkflowInput } from './api/workflows';
import {
  fetchProjects,
  fetchProjectDepthCap,
  createProject,
  updateProject,
  deleteProject,
  moveProject,
} from './api/projects';
import type { UpdateProjectInput } from './api/projects';
import CreateProjectModal from './components/CreateProjectModal';
import ProjectPage from './components/ProjectPage';
import ProjectSidebar from './components/ProjectSidebar';
import { parentPutUnder } from './components/sidebar/projectTreeUtils';
import { useCollapsedProjects } from './components/sidebar/useCollapsedProjects';
import AgentsModal from './components/AgentsModal';
import NotificationsBell from './components/NotificationsBell';
import { browserStorage, readStored, removeStored, writeStored } from './lib/browserStorage';
import { findNearestAncestor, getAncestors, withMoveApplied, type PendingMove } from './lib/hierarchy';
import { applyWriteResponse } from './lib/positionedWrite';

const ACTIVE_PROJECT_STORAGE_KEY = 'activeProjectId';

export default function App() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAgentsModal, setShowAgentsModal] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  // The sidebar's moves that are sent and not yet answered, oldest first. Each is drawn at once, laid over
  // `projects` where the sidebar reads them, and leaves with its own answer.
  const [pendingMoves, setPendingMoves] = useState<PendingMove[]>([]);
  // The cap the sidebar offers tab states against; null until the server's is read.
  const [projectDepthCap, setProjectDepthCap] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() =>
    readStored(browserStorage(), ACTIVE_PROJECT_STORAGE_KEY),
  );
  // The sidebar's collapsed projects: here, since a create and a parent change open one too.
  const collapsedProjects = useCollapsedProjects();
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [createProjectParentId, setCreateProjectParentId] = useState<string | undefined>(undefined);
  // Each project's last write still out, so its next one waits for that answer (`writeInTurn`).
  const writeTails = useRef(new Map<string, Promise<void>>());
  // How many project writes' answers have been applied, and which read of the whole tree is the latest
  // (`refreshProjects`).
  const writesApplied = useRef(0);
  const latestRead = useRef(0);

  useEffect(() => {
    fetchProjectDepthCap()
      .then(setProjectDepthCap)
      .catch(err => console.error('Failed to load the project depth cap:', err));

    const workflowsLoad = fetchWorkflows()
      .then(setWorkflows)
      .catch(err => console.error('Failed to load workflows:', err));

    const projects = fetchProjects()
      .then(setProjects)
      .catch(err => console.error('Failed to load projects:', err));

    Promise.all([workflowsLoad, projects]).finally(() => setLoading(false));
  }, []);

  async function handleCreateWorkflow(data: CreateWorkflowInput) {
    try {
      const created = await createWorkflow(data);
      setWorkflows(prev => [...prev, created]);
    } catch (err) {
      console.error('Failed to create workflow:', err);
      throw err;
    }
  }

  // A project's writes go to the server one at a time, in the order they were made: this one is sent when
  // the project's earlier one is answered, whether that succeeded or failed. The server then saves them in
  // that order, and so do the answers apply, so the last answer is the latest write and none is stale.
  // Different projects' writes don't wait for each other.
  function writeInTurn<T>(id: string, write: () => Promise<T>): Promise<T> {
    const earlier = writeTails.current.get(id);
    const run = earlier ? earlier.then(write) : write();
    const tail = run.then(
      () => undefined,
      () => undefined,
    );
    writeTails.current.set(id, tail);
    void tail.then(() => {
      if (writeTails.current.get(id) === tail) writeTails.current.delete(id);
    });
    return run;
  }

  // Reads the whole tree after a write and applies it, unless a write's answer has been applied since the
  // read started: that snapshot is older than a tree the sidebar already shows, so the tree is read again.
  // A read started later supersedes one still out.
  async function refreshProjects(failure: string) {
    const read = ++latestRead.current;
    const applied = writesApplied.current;
    try {
      const fresh = await fetchProjects();
      if (read !== latestRead.current) return;
      if (applied !== writesApplied.current) return refreshProjects(failure);
      setProjects(fresh);
    } catch (err) {
      console.error(failure, err);
    }
  }

  function handleOpenCreateProject(parentId?: string) {
    setCreateProjectParentId(parentId);
    setShowCreateProjectModal(true);
  }

  async function handleCreateProject(name: string, description: string) {
    try {
      const created = await createProject({
        name,
        description: description || undefined,
        parentId: createProjectParentId,
      });
      setProjects(prev => applyWriteResponse(prev, created));
      writesApplied.current++;
      // A subproject opens its parent, so it shows (wiki project-tree §2).
      const parentId = parentPutUnder(undefined, created);
      if (parentId) collapsedProjects.expand(parentId);
    } catch (err) {
      console.error('Failed to create project:', err);
      throw err;
    }
  }

  useEffect(() => {
    const storage = browserStorage();
    if (selectedProjectId) {
      writeStored(storage, ACTIVE_PROJECT_STORAGE_KEY, selectedProjectId);
    } else {
      removeStored(storage, ACTIVE_PROJECT_STORAGE_KEY);
    }
  }, [selectedProjectId]);

  function handleSelectProject(id: string) {
    setSelectedProjectId(id);
  }

  async function handleUpdateProject(id: string, data: UpdateProjectInput) {
    const before = projects.find(p => p.id === id);
    try {
      const updated = await writeInTurn(id, () => updateProject(id, data));
      setProjects(prev => applyWriteResponse(prev, updated));
      writesApplied.current++;
      // A project put under a new parent opens it, as a drop does.
      const parentId = parentPutUnder(before, updated);
      if (parentId) collapsedProjects.expand(parentId);
    } catch (err) {
      console.error('Failed to update project:', err);
      throw err;
    }
  }

  async function handleDeleteProject(id: string) {
    try {
      await deleteProject(id);
      writesApplied.current++;
      setSelectedProjectId(prev => (prev === id ? null : prev));
      void refreshProjects('Failed to refresh projects after delete:');
    } catch (err) {
      console.error('Failed to delete project:', err);
      throw err;
    }
  }

  async function handleReorderProject(
    id: string,
    parentId: string | null,
    prevId: string | null,
    nextId: string | null,
  ) {
    // The move is drawn at the release, by the relation it sends, until its own answer lands: a second
    // move released meanwhile loses neither.
    const pending: PendingMove = { id, parentId, prevId, nextId };
    setPendingMoves(prev => [...prev, pending]);
    const settle = () => setPendingMoves(prev => prev.filter(move => move !== pending));
    try {
      const updated = await writeInTurn(id, () => moveProject(id, { parentId, prevId, nextId }));
      // One update: the answer's positions replace the drawn move, so no frame shows the old place.
      setProjects(prev => applyWriteResponse(prev, updated));
      writesApplied.current++;
      settle();
    } catch (err) {
      // The move goes back with its answer, the project at the place it had before the attempt;
      // the refetch resyncs the tree (wiki project-tree §4).
      console.error('Failed to reposition project:', err);
      settle();
      void refreshProjects('Failed to refresh projects after failed reorder:');
    }
  }

  // What the sidebar draws: every move still out laid over the tree once, as far as a node knows (its
  // parent), with the moves beside it for the one index that sorts siblings. So its rows, the real
  // tree's children and what the next pickup reads (its subtree and tiers) are one tree, and no
  // position is touched. No move out is the same array.
  const sidebarProjects = pendingMoves.reduce((tree, move) => withMoveApplied(tree, move), projects);
  const selectedProject = projects.find(p => p.id === selectedProjectId) ?? null;
  const projectSubprojects = projects.filter(p => p.parentId === selectedProjectId);
  const projectAncestors = selectedProject ? getAncestors(selectedProject, projects) : [];

  // The same rule as `workflowItems.ts::effectiveWorkflowIdForProject`: the
  // project's own workflow, else its nearest ancestor's (wiki project-tree §10).
  const effectiveWorkflow = (() => {
    if (!selectedProject) return null;
    const own = workflows.find(w => w.projectId === selectedProject.id);
    if (own) return { workflow: own, isInherited: false, ownerProject: selectedProject };
    const ownerProject = findNearestAncestor(selectedProject, projects, n => workflows.some(w => w.projectId === n.id));
    if (!ownerProject) return null;
    const inherited = workflows.find(w => w.projectId === ownerProject.id)!;
    return { workflow: inherited, isInherited: true, ownerProject };
  })();

  const createProjectParentName = createProjectParentId
    ? projects.find(p => p.id === createProjectParentId)?.name
    : undefined;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-900 text-zinc-100">
      {/* Top nav bar */}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <h1 className="text-sm font-bold tracking-widest text-zinc-400 uppercase">Kanban</h1>

            <button
              onClick={() => setShowAgentsModal(true)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
            >
              Agents
            </button>
          </div>

          <NotificationsBell />
        </div>
      </header>

      {/* Body: sidebar + main */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <ProjectSidebar
          projects={sidebarProjects}
          pendingMoves={pendingMoves}
          projectDepthCap={projectDepthCap}
          selectedProjectId={selectedProjectId}
          collapsedIds={collapsedProjects.collapsedIds}
          onToggleCollapse={collapsedProjects.toggle}
          onExpandProject={collapsedProjects.expand}
          onSelectProject={handleSelectProject}
          onCreateProject={handleOpenCreateProject}
          onDeleteProject={handleDeleteProject}
          onReorderProject={handleReorderProject}
        />

        <main className="flex flex-1 flex-col overflow-hidden px-6 py-6">
          {selectedProject ? (
            <ProjectPage
              key={selectedProject.id}
              project={selectedProject}
              ancestors={projectAncestors}
              subprojects={projectSubprojects}
              allProjects={projects}
              allWorkflows={workflows}
              effectiveWorkflow={effectiveWorkflow}
              onSelectProject={handleSelectProject}
              onUpdate={handleUpdateProject}
              onCreateSubproject={handleOpenCreateProject}
              onDeleteSubproject={handleDeleteProject}
              onCreateWorkflow={handleCreateWorkflow}
            />
          ) : (
            <div className="flex h-64 items-center justify-center">
              <p className="text-zinc-500">Select a project to get started.</p>
            </div>
          )}
        </main>
      </div>

      {showCreateProjectModal && (
        <CreateProjectModal
          parentName={createProjectParentName}
          onClose={() => setShowCreateProjectModal(false)}
          onCreate={handleCreateProject}
        />
      )}

      {showAgentsModal && <AgentsModal onClose={() => setShowAgentsModal(false)} />}
    </div>
  );
}
