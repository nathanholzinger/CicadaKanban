import { useEffect, useRef, useState } from 'react';
import type { Workflow } from './types';
import type { Notification, Project } from './types';
import { fetchWorkflows, createWorkflow, fetchNotifications, markNotificationRead, markAllNotificationsRead, fetchProjects, createProject, updateProject, deleteProject } from './api';
import CreateProjectModal from './components/CreateProjectModal';
import ProjectPage from './components/ProjectPage';
import ProjectSidebar from './components/ProjectSidebar';
import AgentsModal from './components/AgentsModal';

function getAncestors(project: Project, projects: Project[]): Project[] {
  const map = new Map(projects.map(p => [p.id, p]));
  const ancestors: Project[] = [];
  let current: Project | undefined = project;
  while (current?.parentId) {
    const parent = map.get(current.parentId);
    if (!parent) break;
    ancestors.unshift(parent);
    current = parent;
  }
  return ancestors;
}

export default function App() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAgentsModal, setShowAgentsModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    () => localStorage.getItem('activeProjectId'),
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

  useEffect(() => {
    function load() {
      fetchNotifications().then(setNotifications).catch(() => {});
    }
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!showNotifications) return;
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showNotifications]);

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setNotifications([]);
    setShowNotifications(false);
  }

  async function handleDismissNotification(id: string) {
    await markNotificationRead(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  function formatTime(ts: number) {
    return new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  async function handleCreateWorkflow(data: { projectId: string; name: string; templateId?: string; sourceWorkflowId?: string }) {
    const created = await createWorkflow(data);
    setWorkflows(prev => [...prev, created]);
  }

  function handleOpenCreateProject(parentId?: string) {
    setCreateProjectParentId(parentId);
    setShowCreateProjectModal(true);
  }

  async function handleCreateProject(name: string, description: string) {
    const project = await createProject({
      name,
      description: description || undefined,
      parentId: createProjectParentId,
    });
    setProjects(prev => [...prev, project]);
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

  async function handleUpdateProject(id: string, data: { name?: string; description?: string | null; parentId?: string | null }) {
    const updated = await updateProject(id, data);
    setProjects(prev => prev.map(p => p.id === id ? updated : p));
  }

  async function handleDeleteProject(id: string) {
    await deleteProject(id);
    setSelectedProjectId(prev => (prev === id ? null : prev));
    fetchProjects().then(setProjects).catch(() => {});
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
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-zinc-900 text-zinc-100 flex flex-col">
      {/* Top nav bar */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-sm font-bold tracking-widest uppercase text-zinc-400">
              Kanban
            </h1>

            <button
              onClick={() => setShowAgentsModal(true)}
              className="
                px-3 py-1.5 rounded-lg text-sm font-medium
                bg-zinc-800 border border-zinc-700 text-zinc-300
                hover:text-zinc-100 hover:border-zinc-600
                transition-colors
              "
            >
              Agents
            </button>
          </div>

          {/* Notifications */}
          <div ref={notifRef} className="relative flex items-center gap-3">
            <button
              onClick={() => setShowNotifications(prev => !prev)}
              className="
                relative w-8 h-8 rounded-lg
                bg-zinc-800 border border-zinc-700
                flex items-center justify-center
                text-zinc-400 hover:text-zinc-200 hover:border-zinc-600
                transition-colors
              "
              title="Notifications"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 14.5c.83 0 1.5-.67 1.5-1.5h-3c0 .83.67 1.5 1.5 1.5z" />
                <path d="M12 10V7a4 4 0 0 0-8 0v3l-1.5 2h11L12 10z" />
              </svg>
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute top-10 right-0 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                  <span className="text-xs font-semibold text-zinc-300">Notifications</span>
                  {notifications.length > 0 && (
                    <button onClick={handleMarkAllRead} className="text-[11px] text-zinc-500 hover:text-blue-400 transition-colors">
                      Mark all read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-xs text-zinc-600 text-center">No new notifications</p>
                ) : (
                  <ul className="max-h-72 overflow-y-auto divide-y divide-zinc-800">
                    {notifications.map(n => (
                      <li key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-800/50">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-zinc-300 leading-snug">{n.message}</p>
                          <p className="text-[11px] text-zinc-600 mt-0.5">{formatTime(n.createdAt)}</p>
                        </div>
                        <button
                          onClick={() => handleDismissNotification(n.id)}
                          className="shrink-0 text-zinc-600 hover:text-zinc-300 mt-0.5"
                          title="Dismiss"
                        >
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" d="M4 4l8 8M12 4l-8 8" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Body: sidebar + main */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <ProjectSidebar
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={handleSelectProject}
          onCreateProject={handleOpenCreateProject}
          onDeleteProject={handleDeleteProject}
        />

        <main className="flex-1 overflow-hidden flex flex-col px-6 py-6">
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
            <div className="flex items-center justify-center h-64">
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

      {showAgentsModal && (
        <AgentsModal onClose={() => setShowAgentsModal(false)} />
      )}
    </div>
  );
}
