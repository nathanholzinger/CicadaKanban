import { useState } from 'react';
import type { Project } from '../types';

interface ProjectNode extends Project {
  children: ProjectNode[];
}

function buildTree(projects: Project[]): ProjectNode[] {
  const map = new Map<string, ProjectNode>();
  const roots: ProjectNode[] = [];
  for (const p of projects) map.set(p.id, { ...p, children: [] });
  for (const p of projects) {
    const node = map.get(p.id)!;
    if (p.parentId) {
      const parent = map.get(p.parentId);
      if (parent) parent.children.push(node);
      else roots.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

interface TreeNodeProps {
  node: ProjectNode;
  depth: number;
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateSubproject: (parentId: string) => void;
  onDelete: (id: string) => Promise<void>;
}

function TreeNode({ node, depth, selectedProjectId, onSelectProject, onCreateSubproject, onDelete }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedProjectId === node.id;

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      await onDelete(node.id);
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div>
      <div
        className={`group flex items-center gap-1 rounded-lg select-none transition-colors ${
          deleting
            ? 'bg-red-950/60'
            : isSelected
            ? 'bg-zinc-700/60'
            : 'hover:bg-zinc-800/50'
        }`}
        style={{ padding: `6px 12px 6px ${12 + depth * 14}px` }}
      >
        {/* Expand/collapse chevron */}
        <button
          onClick={() => setExpanded(e => !e)}
          title={expanded ? 'Collapse' : 'Expand'}
          className={`w-4 h-4 shrink-0 flex items-center justify-center text-zinc-600 hover:text-zinc-400 transition-colors ${!hasChildren ? 'invisible' : ''}`}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d={expanded ? 'M2 3.5l3 3 3-3' : 'M3.5 2l3 3-3 3'} />
          </svg>
        </button>

        {/* Project name — clicking selects the project */}
        <span
          onClick={() => !deleting && onSelectProject(node.id)}
          className={`flex-1 text-sm truncate min-w-0 transition-colors cursor-pointer ${
            deleting ? 'text-red-400' : isSelected ? 'text-zinc-100' : 'text-zinc-300 hover:text-zinc-100'
          }`}
        >
          {node.name}
        </span>

        {/* Inline delete confirm / deleting indicator */}
        {deleting ? (
          <span className="text-xs text-red-500/70 shrink-0 ml-1">Deleting…</span>
        ) : confirmDelete ? (
          <div className="flex items-center gap-1 shrink-0 ml-1">
            <span className="text-xs text-zinc-500">Delete?</span>
            <button
              onClick={handleConfirmDelete}
              className="text-xs text-red-400 hover:text-red-300 px-1 py-0.5 rounded hover:bg-zinc-700 transition-colors"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs text-zinc-500 hover:text-zinc-300 px-1 py-0.5 rounded hover:bg-zinc-700 transition-colors"
            >
              No
            </button>
          </div>
        ) : (
          <div className="hidden group-hover:flex items-center gap-0.5 shrink-0 ml-1">
            <button
              onClick={() => onCreateSubproject(node.id)}
              className="w-5 h-5 rounded flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
              title="Add subproject"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M5.5 1.5v8M1.5 5.5h8" />
              </svg>
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-5 h-5 rounded flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-zinc-700 transition-colors"
              title="Delete project"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1.5 2.5h8M3.5 2.5V1.5h4v1M4.5 4.5v3M6.5 4.5v3M2.5 2.5l.6 6h5l.6-6" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedProjectId={selectedProjectId}
              onSelectProject={onSelectProject}
              onCreateSubproject={onCreateSubproject}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ProjectSidebarProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: (parentId?: string) => void;
  onDeleteProject: (id: string) => Promise<void>;
}

export default function ProjectSidebar({ projects, selectedProjectId, onSelectProject, onCreateProject, onDeleteProject }: ProjectSidebarProps) {
  const tree = buildTree(projects);

  return (
    <aside className="w-60 shrink-0 border-r border-zinc-800 flex flex-col overflow-y-auto">
      <div className="px-3 pt-4 pb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Projects</span>
        <button
          onClick={() => onCreateProject(undefined)}
          className="w-5 h-5 rounded flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
          title="New project"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M5.5 1.5v8M1.5 5.5h8" />
          </svg>
        </button>
      </div>

      {tree.length === 0 ? (
        <p className="px-4 py-3 text-xs text-zinc-600">No projects yet.</p>
      ) : (
        <div className="pb-4">
          {tree.map(node => (
            <TreeNode
              key={node.id}
              node={node}
              depth={0}
              selectedProjectId={selectedProjectId}
              onSelectProject={onSelectProject}
              onCreateSubproject={onCreateProject}
              onDelete={onDeleteProject}
            />
          ))}
        </div>
      )}
    </aside>
  );
}
