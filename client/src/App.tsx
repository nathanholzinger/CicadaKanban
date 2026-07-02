import { useEffect, useRef, useState } from 'react';
import type { Board, Notification, Project } from './types';
import { fetchBoards, createBoard, fetchNotifications, markNotificationRead, markAllNotificationsRead, fetchProjects, createProject, updateProject, deleteProject } from './api';
import CreateBoardModal from './components/CreateBoardModal';
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
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
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
    const boards = fetchBoards()
      .then(boardData => {
        setBoards(boardData);
        setSelectedBoardId(prev => prev ?? (boardData.length > 0 ? boardData[0].id : null));
      })
      .catch(err => console.error('Failed to load boards:', err));

    const projects = fetchProjects()
      .then(setProjects)
      .catch(err => console.error('Failed to load projects:', err));

    Promise.all([boards, projects]).finally(() => setLoading(false));
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

  async function handleCreateBoard(name: string, description: string, includeDefaultColumns: boolean) {
    const board = await createBoard(name, description || undefined, includeDefaultColumns);
    setBoards(prev => [...prev, board]);
    setSelectedBoardId(board.id);
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

  async function handleUpdateProject(id: string, data: { name?: string; description?: string | null }) {
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
    <div className="min-h-screen bg-zinc-900 text-zinc-100 flex flex-col">
      {/* Top nav bar */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-sm font-bold tracking-widest uppercase text-zinc-400">
              Kanban
            </h1>

            {/* Board selector */}
            {boards.length > 0 && (
              <select
                value={selectedBoardId ?? ''}
                onChange={e => setSelectedBoardId(e.target.value)}
                className="
                  px-3 py-1.5 rounded-lg text-sm
                  bg-zinc-800 border border-zinc-700 text-zinc-200
                  focus:outline-none focus:border-blue-500/50
                  cursor-pointer
                "
              >
                {boards.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}

            <button
              onClick={() => setShowCreateModal(true)}
              className="
                px-3 py-1.5 rounded-lg text-sm font-medium
                bg-zinc-800 border border-zinc-700 text-zinc-300
                hover:text-zinc-100 hover:border-zinc-600
                transition-colors
              "
            >
              + New board
            </button>

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
      <div className="flex flex-1 overflow-hidden">
        <ProjectSidebar
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={handleSelectProject}
          onCreateProject={handleOpenCreateProject}
          onDeleteProject={handleDeleteProject}
        />

        <main className="flex-1 overflow-auto px-6 py-6">
          {selectedProject ? (
            <ProjectPage
              project={selectedProject}
              ancestors={projectAncestors}
              subprojects={projectSubprojects}
              onSelectProject={handleSelectProject}
              onUpdate={handleUpdateProject}
              onCreateSubproject={handleOpenCreateProject}
              onDeleteSubproject={handleDeleteProject}
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

      {showCreateModal && (
        <CreateBoardModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateBoard}
        />
      )}

      {showAgentsModal && (
        <AgentsModal onClose={() => setShowAgentsModal(false)} />
      )}
    </div>
  );
}
