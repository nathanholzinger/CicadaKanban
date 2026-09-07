import { useEffect, useState } from 'react';
import type { Workflow } from './types';
import type { Project } from './types';
import { fetchWorkflows, createWorkflow } from './api/workflows';
import type { CreateWorkflowInput } from './api/workflows';
import { fetchProjects, createProject, updateProject, deleteProject, moveProject } from './api/projects';
import type { UpdateProjectInput } from './api/projects';
import CreateProjectModal from './components/CreateProjectModal';
import ProjectPage from './components/ProjectPage';
import ProjectSidebar from './components/ProjectSidebar';
import AgentsModal from './components/AgentsModal';
import NotificationsBell from './components/NotificationsBell';
import { getAncestors } from './lib/hierarchy';

export default function App() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAgentsModal, setShowAgentsModal] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() =>
    localStorage.getItem('activeProjectId'),
  );
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [createProjectParentId, setCreateProjectParentId] = useState<string | undefined>(undefined);

  useEffect(() => {
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

  function handleOpenCreateProject(parentId?: string) {
    setCreateProjectParentId(parentId);
    setShowCreateProjectModal(true);
  }

  async function handleCreateProject(name: string, description: string) {
    try {
      const project = await createProject({
        name,
        description: description || undefined,
        parentId: createProjectParentId,
      });
      setProjects(prev => [...prev, project]);
    } catch (err) {
      console.error('Failed to create project:', err);
      throw err;
    }
  }

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem('activeProjectId', selectedProjectId);
    } else {
      localStorage.removeItem('activeProjectId');
    }
  }, [selectedProjectId]);

  function handleSelectProject(id: string) {
    setSelectedProjectId(id);
  }

  async function handleUpdateProject(id: string, data: UpdateProjectInput) {
    try {
      const updated = await updateProject(id, data);
      setProjects(prev => prev.map(p => (p.id === id ? updated : p)));
    } catch (err) {
      console.error('Failed to update project:', err);
      throw err;
    }
  }

  async function handleDeleteProject(id: string) {
    try {
      await deleteProject(id);
      setSelectedProjectId(prev => (prev === id ? null : prev));
      fetchProjects()
        .then(setProjects)
        .catch(err => console.error('Failed to refresh projects after delete:', err));
    } catch (err) {
      console.error('Failed to delete project:', err);
      throw err;
    }
  }

  async function handleReorderProject(id: string, parentId: string | null, prevId: string | null, nextId: string | null) {
    try {
      const updated = await moveProject(id, { parentId, prevId, nextId });
      setProjects(prev => prev.map(p => (p.id === id ? updated : p)));
    } catch (err) {
      console.error('Failed to reposition project:', err);
      fetchProjects()
        .then(setProjects)
        .catch(refetchErr => console.error('Failed to refresh projects after failed reorder:', refetchErr));
    }
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId) ?? null;
  const projectSubprojects = projects.filter(p => p.parentId === selectedProjectId);
  const projectAncestors = selectedProject ? getAncestors(selectedProject, projects) : [];

  const effectiveWorkflow = (() => {
    if (!selectedProject) return null;
    const own = workflows.find(w => w.projectId === selectedProject.id);
    if (own) return { workflow: own, isInherited: false, ownerProject: selectedProject };
    const ancestors = getAncestors(selectedProject, projects);
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const inherited = workflows.find(w => w.projectId === ancestors[i].id);
      if (inherited) return { workflow: inherited, isInherited: true, ownerProject: ancestors[i] };
    }
    return null;
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
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={handleSelectProject}
          onCreateProject={handleOpenCreateProject}
          onDeleteProject={handleDeleteProject}
          onReorderProject={handleReorderProject}
        />

        <main className="flex flex-1 flex-col overflow-hidden px-6 py-6">
          {selectedProject ? (
            <ProjectPage
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
