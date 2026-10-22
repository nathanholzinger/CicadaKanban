// Project detail shell: breadcrumb, name edit-in-place + self-delete, tab bar.

import { Fragment, useRef, useState } from 'react';
import type { Project, Workflow } from '../types';
import type { CreateWorkflowInput } from '../api/workflows';
import type { UpdateProjectInput } from '../api/projects';
import BoardView from './BoardView';
import SetupWorkflowModal from './SetupWorkflowModal';
import ConfirmDeleteInline from './ConfirmDeleteInline';
import { ProjectOverviewTab } from './ProjectOverviewTab';
import { TrashIcon } from './icons';

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

// Tab shell (breadcrumb, name edit/self-delete, tabs) + board-tab wiring.
// The Overview tab's own concerns (description, parent selector,
// subprojects list) live in ProjectOverviewTab.tsx.
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

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(project.name);
  const cancelRef = useRef(false);

  async function handleSaveName() {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== project.name) {
      await onUpdate(project.id, { name: trimmed });
    } else {
      setNameValue(project.name);
    }
    setEditingName(false);
  }

  function cancelNameEdit() {
    cancelRef.current = true;
    setNameValue(project.name);
    setEditingName(false);
  }

  function handleNameBlur() {
    if (cancelRef.current) {
      cancelRef.current = false;
      return;
    }
    handleSaveName();
  }

  function handleNameKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      cancelNameEdit();
      return;
    }
    if (e.key === 'Enter') handleSaveName();
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
      {editingName ? (
        <input
          autoFocus
          value={nameValue}
          onChange={e => setNameValue(e.target.value)}
          onBlur={handleNameBlur}
          onKeyDown={handleNameKeyDown}
          className="mb-1 w-full border-b border-zinc-600 bg-transparent text-2xl font-semibold text-zinc-100 focus:border-blue-500/60 focus:outline-none"
        />
      ) : (
        <ConfirmDeleteInline
          trigger={confirm => (
            <div className="group mb-1 flex items-center gap-2">
              <h1
                onClick={() => setEditingName(true)}
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
        <ProjectOverviewTab
          project={project}
          allProjects={allProjects}
          subprojects={subprojects}
          onSelectProject={onSelectProject}
          onUpdate={onUpdate}
          onCreateSubproject={onCreateSubproject}
          onDeleteSubproject={onDeleteSubproject}
        />
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
