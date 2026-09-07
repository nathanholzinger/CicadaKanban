import { Fragment, useEffect, useRef, useState } from 'react';
import type { Project, Workflow } from '../types';
import type { CreateWorkflowInput } from '../api/workflows';
import type { UpdateProjectInput } from '../api/projects';
import BoardView from './BoardView';
import SetupWorkflowModal from './SetupWorkflowModal';
import ConfirmDeleteInline from './ConfirmDeleteInline';
import { buildParentOptions } from '../lib/hierarchy';
import { TrashIcon, PlusIcon, ICON_BUTTON_SM } from './icons';

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
  onUpdate: (id: string, data: UpdateProjectInput) => Promise<void>;
  onCreateSubproject: (parentId: string) => void;
  onDeleteSubproject: (id: string) => Promise<void>;
  onCreateWorkflow: (data: CreateWorkflowInput) => Promise<void>;
}

function tabButtonClass(active: boolean): string {
  const base = 'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px';
  if (active) return `${base} text-zinc-100 border-blue-500`;
  return `${base} text-zinc-500 hover:text-zinc-300 border-transparent`;
}

export default function ProjectPage({
  project,
  ancestors,
  subprojects,
  allProjects,
  allWorkflows,
  effectiveWorkflow,
  onSelectProject,
  onUpdate,
  onCreateSubproject,
  onDeleteSubproject,
  onCreateWorkflow,
}: ProjectPageProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'board'>('overview');
  const [showSetupModal, setShowSetupModal] = useState(false);

  const [editingField, setEditingField] = useState<'name' | 'description' | null>(null);
  const [nameValue, setNameValue] = useState(project.name);
  const [descValue, setDescValue] = useState(project.description ?? '');
  const cancelRef = useRef(false);
  const [savingParent, setSavingParent] = useState(false);

  // Intentionally scoped to project.id only: this resets the edit buffers/tab
  // state when navigating to a *different* project, not on every edit to the
  // current project's name/description (which would fight the user mid-edit).
  useEffect(() => {
    setNameValue(project.name);
    setDescValue(project.description ?? '');
    setEditingField(null);
    setSavingParent(false);
    setActiveTab('overview');
    setShowSetupModal(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (cancelRef.current) {
      cancelRef.current = false;
      return;
    }
    handleSave(field);
  }

  function handleKeyDown(e: React.KeyboardEvent, field: 'name' | 'description') {
    if (e.key === 'Escape') {
      cancel();
      return;
    }
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
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <p className="text-sm text-zinc-500">No workflow defined yet.</p>
          <button
            onClick={() => setShowSetupModal(true)}
            className="rounded-lg border border-blue-500/30 px-4 py-2 text-sm font-medium text-blue-400 transition-colors hover:border-blue-400/50 hover:text-blue-300"
          >
            Set up a Workflow →
          </button>
        </div>
      );
    }

    if (effectiveWorkflow.isInherited) {
      return (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="mb-5 flex shrink-0 items-center gap-2 rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3 py-2 text-xs text-zinc-500">
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M8 2v10M4 8l4 4 4-4" />
            </svg>
            Inherited from{' '}
            <button
              onClick={() => onSelectProject(effectiveWorkflow.ownerProject.id)}
              className="text-zinc-400 underline underline-offset-2 transition-colors hover:text-zinc-200"
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

    return <BoardView workflowId={effectiveWorkflow.workflow.id} projectId={project.id} />;
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Breadcrumb */}
      {ancestors.length > 0 && (
        <nav className="mb-4 flex items-center gap-1.5 text-xs text-zinc-500">
          {ancestors.map(a => (
            <Fragment key={a.id}>
              <button onClick={() => onSelectProject(a.id)} className="transition-colors hover:text-zinc-300">
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
          className="mb-1 w-full border-b border-zinc-600 bg-transparent text-2xl font-semibold text-zinc-100 focus:border-blue-500/60 focus:outline-none"
        />
      ) : (
        // Keyed on project.id: without it, this instance's internal
        // confirming/deleting state would survive a navigation to a
        // different project (nothing else resets it — a real, latent bug
        // uncovered while extracting this, now fixed by construction).
        <ConfirmDeleteInline
          key={project.id}
          trigger={confirm => (
            <div className="group mb-1 flex items-center gap-2">
              <h1
                onClick={() => setEditingField('name')}
                className="cursor-text text-2xl font-semibold text-zinc-100 transition-colors hover:text-zinc-200"
              >
                {project.name}
              </h1>
              <button
                onClick={confirm}
                className="flex h-7 w-7 items-center justify-center rounded text-zinc-600 opacity-0 transition-all group-hover:opacity-100 hover:bg-zinc-800 hover:text-red-400"
                title="Delete project"
              >
                <TrashIcon size={13} />
              </button>
            </div>
          )}
          prompt={
            <>
              <span className="text-2xl font-semibold text-zinc-100">{project.name}</span>
              <span className="text-sm text-zinc-400">Delete this project?</span>
            </>
          }
          onDelete={() => onDeleteSubproject(project.id)}
          className="mb-1 flex items-center gap-3"
          deletingClassName="mb-1 text-2xl font-semibold text-red-400"
        />
      )}

      {/* Tabs */}
      <div className="mt-4 mb-0 flex gap-0 border-b border-zinc-800">
        {tabs.map(tab =>
          tab.disabled ? (
            <span key={tab.id} className="cursor-not-allowed px-4 py-2.5 text-sm font-medium text-zinc-700 select-none">
              {tab.label}
            </span>
          ) : (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'board')}
              className={tabButtonClass(activeTab === tab.id)}
            >
              {tab.label}
            </button>
          ),
        )}
      </div>

      {/* Tab content */}
      {activeTab === 'board' ? (
        <div className="flex min-h-0 flex-1 flex-col pt-6">{renderBoard()}</div>
      ) : (
        <div className="max-w-2xl overflow-y-auto pt-5">
          {/* Description */}
          {editingField === 'description' ? (
            <textarea
              autoFocus
              value={descValue}
              onChange={e => setDescValue(e.target.value)}
              onBlur={() => handleBlur('description')}
              onKeyDown={e => handleKeyDown(e, 'description')}
              rows={3}
              className="mb-6 w-full resize-none border-b border-zinc-600 bg-transparent text-sm text-zinc-400 focus:border-blue-500/60 focus:outline-none"
            />
          ) : project.description ? (
            <p
              onClick={() => setEditingField('description')}
              className="mb-6 cursor-text text-sm whitespace-pre-wrap text-zinc-400 transition-colors hover:text-zinc-300"
            >
              {project.description}
            </p>
          ) : (
            <button
              onClick={() => setEditingField('description')}
              className="mb-6 block text-sm text-zinc-600 transition-colors hover:text-zinc-400"
            >
              Add description
            </button>
          )}

          {/* Parent project */}
          <div className="mt-4 mb-6 flex items-center gap-3">
            <span className="w-14 shrink-0 text-xs font-semibold tracking-widest text-zinc-600 uppercase">Parent</span>
            <select
              value={project.parentId ?? ''}
              disabled={savingParent}
              onChange={async e => {
                const newParentId = e.target.value || null;
                setSavingParent(true);
                try {
                  await onUpdate(project.id, { parentId: newParentId });
                } finally {
                  setSavingParent(false);
                }
              }}
              className="cursor-pointer rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-400 transition-opacity focus:border-zinc-600 focus:outline-none disabled:opacity-50"
            >
              {buildParentOptions(allProjects, project.id, p => p.name, 'Root', true).map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Subprojects */}
          <section className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">Subprojects</h2>
              <button
                onClick={() => onCreateSubproject(project.id)}
                className={ICON_BUTTON_SM}
                title="Add subproject"
              >
                <PlusIcon />
              </button>
            </div>
            <ul className="space-y-1">
              {subprojects.map(child => (
                <li key={child.id} className="group flex items-center gap-1">
                  <ConfirmDeleteInline
                    trigger={confirm => (
                      <>
                        <button
                          onClick={() => onSelectProject(child.id)}
                          className="flex-1 rounded-lg px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                        >
                          {child.name}
                          {child.description && <span className="ml-2 text-xs text-zinc-600">{child.description}</span>}
                        </button>
                        <button
                          onClick={confirm}
                          className="flex h-6 w-6 items-center justify-center rounded text-zinc-600 opacity-0 transition-all group-hover:opacity-100 hover:bg-zinc-800 hover:text-red-400"
                          title="Delete subproject"
                        >
                          <TrashIcon />
                        </button>
                      </>
                    )}
                    prompt={<span className="flex-1 text-zinc-400">Delete "{child.name}"?</span>}
                    onDelete={() => onDeleteSubproject(child.id)}
                    className="flex flex-1 items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-sm"
                    deletingClassName="flex-1 rounded-lg bg-red-950/60 px-3 py-2 text-sm text-red-400"
                  />
                </li>
              ))}
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
          onCreate={async data => {
            await onCreateWorkflow(data);
            setShowSetupModal(false);
          }}
        />
      )}
    </div>
  );
}
