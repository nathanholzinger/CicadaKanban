import { Fragment, useEffect, useRef, useState } from 'react';
import type { Project, Workflow } from '../types';
import BoardView from './BoardView';
import SetupWorkflowModal from './SetupWorkflowModal';
import { getDescendantIds } from '../lib/hierarchy';

interface EffectiveWorkflow {
  workflow: Workflow;
  isInherited: boolean;
  ownerProject: Project;
}

interface ProjectPageProps {
  project: Project;
  ancestors: Project[];
  subprojects: Project[];
  allProjects: Project[];
  allWorkflows: Workflow[];
  effectiveWorkflow: EffectiveWorkflow | null;
  onSelectProject: (id: string) => void;
  onUpdate: (id: string, data: { name?: string; description?: string | null; parentId?: string | null }) => Promise<void>;
  onCreateSubproject: (parentId: string) => void;
  onDeleteSubproject: (id: string) => Promise<void>;
  onCreateWorkflow: (data: { projectId: string; name: string; templateId?: string; sourceWorkflowId?: string }) => Promise<void>;
}

function buildParentOptions(allProjects: Project[], currentId: string): Array<{ value: string; label: string }> {
  const map = new Map<string, { project: Project; children: string[] }>();
  for (const p of allProjects) map.set(p.id, { project: p, children: [] });
  const roots: string[] = [];
  for (const p of allProjects) {
    if (p.parentId && map.has(p.parentId)) map.get(p.parentId)!.children.push(p.id);
    else roots.push(p.id);
  }

  const excluded = getDescendantIds(currentId, allProjects);
  excluded.add(currentId);

  const options: Array<{ value: string; label: string }> = [{ value: '', label: 'Root' }];
  function traverse(id: string, depth: number) {
    if (excluded.has(id)) return;
    const entry = map.get(id);
    if (!entry) return;
    options.push({ value: id, label: '·'.repeat(depth) + (depth > 0 ? ' ' : '') + entry.project.name });
    entry.children.forEach(c => traverse(c, depth + 1));
  }
  roots.forEach(r => traverse(r, 0));
  return options;
}

export default function ProjectPage({
  project, ancestors, subprojects, allProjects, allWorkflows, effectiveWorkflow,
  onSelectProject, onUpdate, onCreateSubproject, onDeleteSubproject, onCreateWorkflow,
}: ProjectPageProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'board'>('overview');
  const [showSetupModal, setShowSetupModal] = useState(false);

  const [editingField, setEditingField] = useState<'name' | 'description' | null>(null);
  const [nameValue, setNameValue] = useState(project.name);
  const [descValue, setDescValue] = useState(project.description ?? '');
  const cancelRef = useRef(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);
  const [savingParent, setSavingParent] = useState(false);

  useEffect(() => {
    setNameValue(project.name);
    setDescValue(project.description ?? '');
    setEditingField(null);
    setSavingParent(false);
    setActiveTab('overview');
    setShowSetupModal(false);
  }, [project.id]);

  async function handleSave(field: 'name' | 'description') {
    if (field === 'name') {
      const trimmed = nameValue.trim();
      if (trimmed && trimmed !== project.name) {
        await onUpdate(project.id, { name: trimmed });
      } else {
        setNameValue(project.name);
      }
    } else {
      const trimmed = descValue.trim() || null;
      if (trimmed !== project.description) {
        await onUpdate(project.id, { description: trimmed });
      }
    }
    setEditingField(null);
  }

  function cancel() {
    cancelRef.current = true;
    setNameValue(project.name);
    setDescValue(project.description ?? '');
    setEditingField(null);
  }

  function handleBlur(field: 'name' | 'description') {
    if (cancelRef.current) { cancelRef.current = false; return; }
    handleSave(field);
  }

  function handleKeyDown(e: React.KeyboardEvent, field: 'name' | 'description') {
    if (e.key === 'Escape') { cancel(); return; }
    if (e.key === 'Enter' && field === 'name') handleSave(field);
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────

  const tabs = [
    { id: 'overview' as const, label: 'Overview', disabled: false },
    { id: 'inbox' as const, label: 'Inbox', disabled: true },
    { id: 'board' as const, label: 'Board', disabled: false },
  ] as const;

  // ── Board tab content ──────────────────────────────────────────────────────

  function renderBoard() {
    if (!effectiveWorkflow) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <p className="text-zinc-500 text-sm">No workflow defined yet.</p>
          <button
            onClick={() => setShowSetupModal(true)}
            className="px-4 py-2 text-sm font-medium text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-400/50 rounded-lg transition-colors"
          >
            Set up a Workflow →
          </button>
        </div>
      );
    }

    if (effectiveWorkflow.isInherited) {
      return (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-xs text-zinc-500 shrink-0">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M8 2v10M4 8l4 4 4-4" />
            </svg>
            Inherited from{' '}
            <button
              onClick={() => onSelectProject(effectiveWorkflow.ownerProject.id)}
              className="text-zinc-400 hover:text-zinc-200 underline underline-offset-2 transition-colors"
            >
              {effectiveWorkflow.ownerProject.name}
            </button>
            . Workphase and board management is only available from that project.
          </div>
          <BoardView
            workflowId={effectiveWorkflow.workflow.id}
            projectId={project.id}
            filterProjectId={project.id}
            readOnly
          />
        </div>
      );
    }

    return (
      <BoardView
        workflowId={effectiveWorkflow.workflow.id}
        projectId={project.id}
      />
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Breadcrumb */}
      {ancestors.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-zinc-500 mb-4">
          {ancestors.map(a => (
            <Fragment key={a.id}>
              <button onClick={() => onSelectProject(a.id)} className="hover:text-zinc-300 transition-colors">
                {a.name}
              </button>
              <span>/</span>
            </Fragment>
          ))}
          <span className="text-zinc-400">{project.name}</span>
        </nav>
      )}

      {/* Name */}
      {editingField === 'name' ? (
        <input
          autoFocus
          value={nameValue}
          onChange={e => setNameValue(e.target.value)}
          onBlur={() => handleBlur('name')}
          onKeyDown={e => handleKeyDown(e, 'name')}
          className="w-full text-2xl font-semibold text-zinc-100 bg-transparent mb-1 border-b border-zinc-600 focus:outline-none focus:border-blue-500/60"
        />
      ) : deletingProject ? (
        <div className="text-2xl font-semibold text-red-400 mb-1">Deleting…</div>
      ) : confirmDeleteProject ? (
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl font-semibold text-zinc-100">{project.name}</span>
          <span className="text-sm text-zinc-400">Delete this project?</span>
          <button
            onClick={async () => {
              setConfirmDeleteProject(false);
              setDeletingProject(true);
              await onDeleteSubproject(project.id);
            }}
            className="px-2 py-0.5 rounded text-xs font-medium bg-red-900/60 text-red-300 hover:bg-red-800/60 transition-colors"
          >
            Yes
          </button>
          <button
            onClick={() => setConfirmDeleteProject(false)}
            className="px-2 py-0.5 rounded text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            No
          </button>
        </div>
      ) : (
        <div className="group flex items-center gap-2 mb-1">
          <h1
            onClick={() => setEditingField('name')}
            className="text-2xl font-semibold text-zinc-100 cursor-text hover:text-zinc-200 transition-colors"
          >
            {project.name}
          </h1>
          <button
            onClick={() => setConfirmDeleteProject(true)}
            className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition-all"
            title="Delete project"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" />
            </svg>
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 mt-4 mb-0 border-b border-zinc-800">
        {tabs.map(tab => (
          tab.disabled ? (
            <span
              key={tab.id}
              className="px-4 py-2.5 text-sm font-medium text-zinc-700 cursor-not-allowed select-none"
            >
              {tab.label}
            </span>
          ) : (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'board')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'text-zinc-100 border-blue-500'
                  : 'text-zinc-500 hover:text-zinc-300 border-transparent'
              }`}
            >
              {tab.label}
            </button>
          )
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'board' ? (
        <div className="pt-6 flex-1 min-h-0 flex flex-col">
          {renderBoard()}
        </div>
      ) : (
        <div className="pt-5 max-w-2xl overflow-y-auto">
          {/* Description */}
          {editingField === 'description' ? (
            <textarea
              autoFocus
              value={descValue}
              onChange={e => setDescValue(e.target.value)}
              onBlur={() => handleBlur('description')}
              onKeyDown={e => handleKeyDown(e, 'description')}
              rows={3}
              className="w-full text-sm text-zinc-400 bg-transparent mb-6 resize-none border-b border-zinc-600 focus:outline-none focus:border-blue-500/60"
            />
          ) : project.description ? (
            <p
              onClick={() => setEditingField('description')}
              className="text-sm text-zinc-400 mb-6 cursor-text hover:text-zinc-300 transition-colors whitespace-pre-wrap"
            >
              {project.description}
            </p>
          ) : (
            <button
              onClick={() => setEditingField('description')}
              className="text-sm text-zinc-600 hover:text-zinc-400 mb-6 block transition-colors"
            >
              Add description
            </button>
          )}

          {/* Parent project */}
          <div className="flex items-center gap-3 mt-4 mb-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-600 w-14 shrink-0">
              Parent
            </span>
            <select
              value={project.parentId ?? ''}
              disabled={savingParent}
              onChange={async (e) => {
                const newParentId = e.target.value || null;
                setSavingParent(true);
                try {
                  await onUpdate(project.id, { parentId: newParentId });
                } finally {
                  setSavingParent(false);
                }
              }}
              className="text-sm bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-lg px-2 py-1.5 focus:outline-none focus:border-zinc-600 cursor-pointer disabled:opacity-50 transition-opacity"
            >
              {buildParentOptions(allProjects, project.id).map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Subprojects */}
          <section className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Subprojects
              </h2>
              <button
                onClick={() => onCreateSubproject(project.id)}
                className="w-5 h-5 rounded flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
                title="Add subproject"
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M5.5 1.5v8M1.5 5.5h8" />
                </svg>
              </button>
            </div>
            <ul className="space-y-1">
              {subprojects.map(child => {
                const isConfirming = confirmDeleteId === child.id;
                const isDeleting = deletingId === child.id;
                return (
                  <li key={child.id} className="group flex items-center gap-1">
                    {isDeleting ? (
                      <div className="flex-1 px-3 py-2 rounded-lg text-sm bg-red-950/60 text-red-400">
                        Deleting…
                      </div>
                    ) : isConfirming ? (
                      <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-zinc-800">
                        <span className="text-zinc-400 flex-1">Delete "{child.name}"?</span>
                        <button
                          onClick={async () => {
                            setConfirmDeleteId(null);
                            setDeletingId(child.id);
                            await onDeleteSubproject(child.id);
                            setDeletingId(null);
                          }}
                          className="px-2 py-0.5 rounded text-xs font-medium bg-red-900/60 text-red-300 hover:bg-red-800/60 transition-colors"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-0.5 rounded text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => onSelectProject(child.id)}
                          className="flex-1 text-left px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                        >
                          {child.name}
                          {child.description && (
                            <span className="ml-2 text-xs text-zinc-600">{child.description}</span>
                          )}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(child.id)}
                          className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition-all"
                          title="Delete subproject"
                        >
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" />
                          </svg>
                        </button>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}

      {showSetupModal && (
        <SetupWorkflowModal
          project={project}
          allWorkflows={allWorkflows}
          allProjects={allProjects}
          onClose={() => setShowSetupModal(false)}
          onCreate={async (data) => {
            await onCreateWorkflow(data);
            setShowSetupModal(false);
          }}
        />
      )}
    </div>
  );
}
