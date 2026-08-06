import { useEffect, useRef, useState } from 'react';
import type { Agent } from '../types';
import { fetchAgents, createAgent, updateAgent, deleteAgent } from '../api/agents';
import ModalShell from './ModalShell';
import ConfirmDeleteButton from './ConfirmDeleteButton';

const surfaceLabels: Record<string, string> = {
  chat: 'Claude.ai Chat',
  code: 'Claude Code',
  cowork: 'Co-work',
};

const surfaceBadgeColors: Record<string, string> = {
  chat: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  code: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  cowork: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

const emptyForm = { name: '', claudeProjectId: '', surface: 'chat', repoPath: '', notes: '' };

interface AgentsModalProps {
  onClose: () => void;
}

export default function AgentsModal({ onClose }: AgentsModalProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [addingNew, setAddingNew] = useState(false);
  const [newForm, setNewForm] = useState(emptyForm);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAgents()
      .then(setAgents)
      .catch(() => setError('Failed to load agents.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (addingNew) firstInputRef.current?.focus();
  }, [addingNew]);

  async function handleCreate(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newForm.name.trim() || !newForm.claudeProjectId.trim()) return;
    setSaving(true);
    setError('');
    try {
      const agent = await createAgent({
        name: newForm.name.trim(),
        claudeProjectId: newForm.claudeProjectId.trim(),
        surface: newForm.surface,
        repoPath: newForm.repoPath.trim() || undefined,
        notes: newForm.notes.trim() || undefined,
      });
      setAgents(prev => [...prev, agent]);
      setNewForm(emptyForm);
      setAddingNew(false);
    } catch {
      setError('Failed to create agent.');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(agent: Agent) {
    setEditingId(agent.id);
    setEditForm({
      name: agent.name,
      claudeProjectId: agent.claudeProjectId,
      surface: agent.surface,
      repoPath: agent.repoPath ?? '',
      notes: agent.notes ?? '',
    });
    setAddingNew(false);
  }

  async function handleUpdate(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingId || !editForm.name.trim() || !editForm.claudeProjectId.trim()) return;
    setSaving(true);
    setError('');
    try {
      const updated = await updateAgent(editingId, {
        name: editForm.name.trim(),
        claudeProjectId: editForm.claudeProjectId.trim(),
        surface: editForm.surface,
        repoPath: editForm.repoPath.trim() || undefined,
        notes: editForm.notes.trim() || undefined,
      });
      setAgents(prev => prev.map(a => (a.id === editingId ? updated : a)));
      setEditingId(null);
    } catch {
      setError('Failed to update agent.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setSaving(true);
    try {
      await deleteAgent(id);
      setAgents(prev => prev.filter(a => a.id !== id));
    } finally {
      // Errors bubble to ConfirmDeleteButton, which reports them via onError → setError.
      setSaving(false);
    }
  }

  return (
    <ModalShell
      onClose={onClose}
      ariaLabel="Agents"
      title="Agents"
      subtitle="Claude projects that can be linked to cards"
      maxWidth="max-w-xl"
      maxHeight="max-h-[80vh]"
      showCloseButton
      footer={
        <>
          {error && <p className="mb-3 text-xs text-red-400">{error}</p>}
          {!addingNew && editingId === null && (
            <button
              onClick={() => {
                setAddingNew(true);
                setEditingId(null);
              }}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
            >
              + New agent
            </button>
          )}
        </>
      }
    >
      <div className="flex-1 space-y-2 overflow-y-auto px-6 py-4">
        {loading ? (
          <p className="py-4 text-center text-xs text-zinc-500">Loading…</p>
        ) : agents.length === 0 && !addingNew ? (
          <p className="py-4 text-center text-xs text-zinc-600">No agents yet. Add one below.</p>
        ) : (
          agents.map(agent => (
            <div key={agent.id}>
              {editingId === agent.id ? (
                <AgentForm
                  form={editForm}
                  onChange={setEditForm}
                  onSubmit={handleUpdate}
                  onCancel={() => setEditingId(null)}
                  saving={saving}
                  submitLabel="Save"
                />
              ) : (
                <div className="flex items-start gap-3 rounded-lg border border-zinc-700/50 bg-zinc-800/50 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-zinc-100">{agent.name}</span>
                      <span
                        className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${surfaceBadgeColors[agent.surface] ?? ''}`}
                      >
                        {surfaceLabels[agent.surface] ?? agent.surface}
                      </span>
                    </div>
                    <p className="truncate font-mono text-[11px] text-zinc-500">{agent.claudeProjectId}</p>
                    {agent.repoPath && <p className="mt-0.5 truncate text-[11px] text-zinc-600">{agent.repoPath}</p>}
                    {agent.notes && <p className="mt-1 text-xs leading-relaxed text-zinc-500">{agent.notes}</p>}
                  </div>
                  <ConfirmDeleteButton
                    onDelete={() => handleDelete(agent.id)}
                    title="Delete agent"
                    errorFallback="Failed to delete agent."
                    disabled={saving}
                    onError={setError}
                    triggerClassName="p-0.5 rounded"
                    beforeTrigger={
                      <button
                        onClick={() => startEdit(agent)}
                        className="rounded px-1.5 py-0.5 text-[11px] text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
                      >
                        Edit
                      </button>
                    }
                  />
                </div>
              )}
            </div>
          ))
        )}

        {addingNew && (
          <AgentForm
            form={newForm}
            onChange={setNewForm}
            onSubmit={handleCreate}
            onCancel={() => {
              setAddingNew(false);
              setNewForm(emptyForm);
            }}
            saving={saving}
            submitLabel="Add agent"
            firstInputRef={firstInputRef}
          />
        )}
      </div>
    </ModalShell>
  );
}

interface FormState {
  name: string;
  claudeProjectId: string;
  surface: string;
  repoPath: string;
  notes: string;
}

function AgentForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  saving,
  submitLabel,
  firstInputRef,
}: {
  form: FormState;
  onChange: (f: FormState) => void;
  onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  saving: boolean;
  submitLabel: string;
  firstInputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const needsRepo = form.surface === 'code' || form.surface === 'cowork';

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-800/60 p-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Name</label>
          <input
            ref={firstInputRef}
            value={form.name}
            onChange={e => onChange({ ...form, name: e.target.value })}
            placeholder="e.g. Backend agent"
            required
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500/60 focus:outline-none"
          />
        </div>
        <div className="w-36">
          <label className="mb-1 block text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Surface</label>
          <select
            value={form.surface}
            onChange={e => onChange({ ...form, surface: e.target.value })}
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-300 focus:border-blue-500/60 focus:outline-none"
          >
            <option value="chat">Claude.ai Chat</option>
            <option value="code">Claude Code</option>
            <option value="cowork">Co-work</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
          Project ID
        </label>
        <input
          value={form.claudeProjectId}
          onChange={e => onChange({ ...form, claudeProjectId: e.target.value })}
          placeholder="UUID from claude.ai project URL"
          required
          className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 font-mono text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500/60 focus:outline-none"
        />
      </div>

      {needsRepo && (
        <div>
          <label className="mb-1 block text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
            Repo Path
          </label>
          <input
            value={form.repoPath}
            onChange={e => onChange({ ...form, repoPath: e.target.value })}
            placeholder="e.g. C:\Users\natha\Dev\MyProject"
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 font-mono text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500/60 focus:outline-none"
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
          Notes <span className="font-normal normal-case">(optional)</span>
        </label>
        <textarea
          value={form.notes}
          onChange={e => onChange({ ...form, notes: e.target.value })}
          placeholder="What does this agent do?"
          rows={2}
          className="w-full resize-none rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500/60 focus:outline-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !form.name.trim() || !form.claudeProjectId.trim()}
          className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
        >
          {submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="px-2 py-1.5 text-xs text-zinc-400 hover:text-zinc-200">
          Cancel
        </button>
      </div>
    </form>
  );
}
