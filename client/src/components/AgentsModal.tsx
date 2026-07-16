import { useEffect, useRef, useState } from 'react';
import type { Agent } from '../types';
import { fetchAgents, createAgent, updateAgent, deleteAgent } from '../api';
import ModalShell from './ModalShell';

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

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
    setConfirmDeleteId(null);
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
      setAgents(prev => prev.map(a => a.id === editingId ? updated : a));
      setEditingId(null);
    } catch {
      setError('Failed to update agent.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setSaving(true);
    setError('');
    try {
      await deleteAgent(id);
      setAgents(prev => prev.filter(a => a.id !== id));
      setConfirmDeleteId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete agent.');
      setConfirmDeleteId(null);
    } finally {
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
          {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
          {!addingNew && editingId === null && (
            <button
              onClick={() => { setAddingNew(true); setEditingId(null); setConfirmDeleteId(null); }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors"
            >
              + New agent
            </button>
          )}
        </>
      }
    >
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {loading ? (
          <p className="text-xs text-zinc-500 py-4 text-center">Loading…</p>
        ) : agents.length === 0 && !addingNew ? (
          <p className="text-xs text-zinc-600 py-4 text-center">No agents yet. Add one below.</p>
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
                <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-zinc-100 truncate">{agent.name}</span>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 ${surfaceBadgeColors[agent.surface] ?? ''}`}>
                        {surfaceLabels[agent.surface] ?? agent.surface}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 font-mono truncate">{agent.claudeProjectId}</p>
                    {agent.repoPath && (
                      <p className="text-[11px] text-zinc-600 truncate mt-0.5">{agent.repoPath}</p>
                    )}
                    {agent.notes && (
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{agent.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {confirmDeleteId === agent.id ? (
                      <>
                        <button
                          onClick={() => handleDelete(agent.id)}
                          disabled={saving}
                          className="text-[10px] text-red-400 hover:text-red-300 px-1.5 py-0.5 rounded bg-red-500/10 disabled:opacity-50"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-[10px] text-zinc-500 hover:text-zinc-300"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(agent)}
                          className="text-[11px] text-zinc-500 hover:text-zinc-200 px-1.5 py-0.5 rounded hover:bg-zinc-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(agent.id)}
                          className="text-zinc-600 hover:text-red-400 p-0.5 rounded transition-colors"
                          title="Delete agent"
                        >
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" d="M4 4l8 8M12 4l-8 8" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
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
            onCancel={() => { setAddingNew(false); setNewForm(emptyForm); }}
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
  form, onChange, onSubmit, onCancel, saving, submitLabel, firstInputRef,
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
    <form onSubmit={onSubmit} className="space-y-3 p-3 rounded-lg bg-zinc-800/60 border border-zinc-700">
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1">Name</label>
          <input
            ref={firstInputRef}
            value={form.name}
            onChange={e => onChange({ ...form, name: e.target.value })}
            placeholder="e.g. Backend agent"
            required
            className="w-full px-3 py-1.5 rounded text-sm bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500/60"
          />
        </div>
        <div className="w-36">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1">Surface</label>
          <select
            value={form.surface}
            onChange={e => onChange({ ...form, surface: e.target.value })}
            className="w-full px-2 py-1.5 rounded text-sm bg-zinc-800 border border-zinc-700 text-zinc-300 focus:outline-none focus:border-blue-500/60"
          >
            <option value="chat">Claude.ai Chat</option>
            <option value="code">Claude Code</option>
            <option value="cowork">Co-work</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1">Project ID</label>
        <input
          value={form.claudeProjectId}
          onChange={e => onChange({ ...form, claudeProjectId: e.target.value })}
          placeholder="UUID from claude.ai project URL"
          required
          className="w-full px-3 py-1.5 rounded text-sm bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500/60 font-mono"
        />
      </div>

      {needsRepo && (
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1">Repo Path</label>
          <input
            value={form.repoPath}
            onChange={e => onChange({ ...form, repoPath: e.target.value })}
            placeholder="e.g. C:\Users\natha\Dev\MyProject"
            className="w-full px-3 py-1.5 rounded text-sm bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500/60 font-mono"
          />
        </div>
      )}

      <div>
        <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1">Notes <span className="normal-case font-normal">(optional)</span></label>
        <textarea
          value={form.notes}
          onChange={e => onChange({ ...form, notes: e.target.value })}
          placeholder="What does this agent do?"
          rows={2}
          className="w-full px-3 py-1.5 rounded text-sm bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500/60 resize-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !form.name.trim() || !form.claudeProjectId.trim()}
          className="px-3 py-1.5 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-2 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
