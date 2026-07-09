import { useEffect, useState } from 'react';
import type { Project, Workflow, WorkflowTemplate } from '../types';
import { fetchWorkflowTemplates } from '../api';

interface SetupWorkflowModalProps {
  project: Project;
  allWorkflows: Workflow[];
  allProjects: Project[];
  onClose: () => void;
  onCreate: (data: { projectId: string; name: string; templateId?: string; sourceWorkflowId?: string }) => Promise<void>;
}

export default function SetupWorkflowModal({ project, allWorkflows, allProjects, onClose, onCreate }: SetupWorkflowModalProps) {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWorkflowTemplates().then(setTemplates).catch(() => {});
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div role="dialog" aria-label="Set up a Workflow" className="relative z-10 w-full max-w-md mx-4 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-100">Set up a Workflow</h2>
          <p className="text-xs text-zinc-500 mt-1">Choose how to configure the workflow for <span className="text-zinc-400">{project.name}</span>.</p>
        </div>

        <div className="px-6 py-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {/* Custom */}
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-1">Start fresh</p>
          <button
            disabled={saving}
            onClick={() => submit({})}
            className="w-full text-left px-4 py-3 rounded-lg border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/60 transition-colors disabled:opacity-50"
          >
            <span className="text-sm font-medium text-zinc-200">Custom</span>
            <span className="block text-xs text-zinc-500 mt-0.5">Empty workflow — add your own workphases</span>
          </button>

          {/* Templates */}
          {templates.length > 0 && (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mt-4 mb-1">Use a template</p>
              {templates.map(t => (
                <button
                  key={t.id}
                  disabled={saving}
                  onClick={() => submit({ templateId: t.id })}
                  className="w-full text-left px-4 py-3 rounded-lg border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/60 transition-colors disabled:opacity-50"
                >
                  <span className="text-sm font-medium text-zinc-200 capitalize">{t.name}</span>
                  <span className="block text-xs text-zinc-500 mt-0.5">
                    {t.workphases.map(p => p.name).join(' → ')}
                  </span>
                </button>
              ))}
            </>
          )}

          {/* Copy from */}
          {copyableWorkflows.length > 0 && (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mt-4 mb-1">Copy from a project</p>
              {copyableWorkflows.map(({ workflow, projectName }) => (
                <button
                  key={workflow.id}
                  disabled={saving}
                  onClick={() => submit({ sourceWorkflowId: workflow.id })}
                  className="w-full text-left px-4 py-3 rounded-lg border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/60 transition-colors disabled:opacity-50"
                >
                  <span className="text-sm font-medium text-zinc-200">{projectName}</span>
                  <span className="block text-xs text-zinc-500 mt-0.5">Copy workphase structure</span>
                </button>
              ))}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
