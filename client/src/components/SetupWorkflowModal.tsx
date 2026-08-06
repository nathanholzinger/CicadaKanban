import { useEffect, useState } from 'react';
import type { Project, Workflow, WorkflowTemplate } from '../types';
import { fetchWorkflowTemplates } from '../api/workflowTemplates';
import type { CreateWorkflowInput } from '../api/workflows';
import ModalShell from './ModalShell';

interface SetupWorkflowModalProps {
  project: Project;
  allWorkflows: Workflow[];
  allProjects: Project[];
  onClose: () => void;
  onCreate: (data: CreateWorkflowInput) => Promise<void>;
}

export default function SetupWorkflowModal({
  project,
  allWorkflows,
  allProjects,
  onClose,
  onCreate,
}: SetupWorkflowModalProps) {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWorkflowTemplates()
      .then(setTemplates)
      .catch(() => {});
  }, []);

  // Projects that have a workflow (excluding the current project)
  const copyableWorkflows = allWorkflows
    .filter(w => w.projectId && w.projectId !== project.id)
    .map(w => ({
      workflow: w,
      projectName: allProjects.find(p => p.id === w.projectId)?.name ?? 'Unknown project',
    }));

  async function submit(opts: { templateId?: string; sourceWorkflowId?: string }) {
    setSaving(true);
    try {
      await onCreate({ projectId: project.id, name: project.name, ...opts });
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      onClose={onClose}
      ariaLabel="Set up a Workflow"
      title="Set up a Workflow"
      subtitle={
        <>
          Choose how to configure the workflow for <span className="text-zinc-400">{project.name}</span>.
        </>
      }
      maxWidth="max-w-md"
      footer={
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            Cancel
          </button>
        </div>
      }
    >
      <div className="max-h-[60vh] space-y-2 overflow-y-auto px-6 py-4">
        {/* Custom */}
        <p className="mb-1 text-[11px] font-semibold tracking-widest text-zinc-600 uppercase">Start fresh</p>
        <button
          disabled={saving}
          onClick={() => submit({})}
          className="w-full rounded-lg border border-zinc-700 px-4 py-3 text-left transition-colors hover:border-zinc-600 hover:bg-zinc-800/60 disabled:opacity-50"
        >
          <span className="text-sm font-medium text-zinc-200">Custom</span>
          <span className="mt-0.5 block text-xs text-zinc-500">Empty workflow — add your own workphases</span>
        </button>

        {/* Templates */}
        {templates.length > 0 && (
          <>
            <p className="mt-4 mb-1 text-[11px] font-semibold tracking-widest text-zinc-600 uppercase">
              Use a template
            </p>
            {templates.map(t => (
              <button
                key={t.id}
                disabled={saving}
                onClick={() => submit({ templateId: t.id })}
                className="w-full rounded-lg border border-zinc-700 px-4 py-3 text-left transition-colors hover:border-zinc-600 hover:bg-zinc-800/60 disabled:opacity-50"
              >
                <span className="text-sm font-medium text-zinc-200 capitalize">{t.name}</span>
                <span className="mt-0.5 block text-xs text-zinc-500">{t.workphases.map(p => p.name).join(' → ')}</span>
              </button>
            ))}
          </>
        )}

        {/* Copy from */}
        {copyableWorkflows.length > 0 && (
          <>
            <p className="mt-4 mb-1 text-[11px] font-semibold tracking-widest text-zinc-600 uppercase">
              Copy from a project
            </p>
            {copyableWorkflows.map(({ workflow, projectName }) => (
              <button
                key={workflow.id}
                disabled={saving}
                onClick={() => submit({ sourceWorkflowId: workflow.id })}
                className="w-full rounded-lg border border-zinc-700 px-4 py-3 text-left transition-colors hover:border-zinc-600 hover:bg-zinc-800/60 disabled:opacity-50"
              >
                <span className="text-sm font-medium text-zinc-200">{projectName}</span>
                <span className="mt-0.5 block text-xs text-zinc-500">Copy workphase structure</span>
              </button>
            ))}
          </>
        )}
      </div>
    </ModalShell>
  );
}
