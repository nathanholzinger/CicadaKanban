import { useEffect, useRef, useState } from 'react';
import type { Agent, Attachment, ItemType, Label, WorkItem, WorkItemDetail } from '../types';
import {
  fetchWorkItem, updateWorkItem, deleteWorkItem, createWorkItem, fetchAgents,
  fetchLabels, fetchWorkItemLabels, createLabel, addLabelToWorkItem, removeLabelFromWorkItem,
  fetchAttachments, createAttachment, deleteAttachment,
} from '../api';

const PILL = 'inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border';
const PILL_NEUTRAL = `${PILL} bg-zinc-500/20 text-zinc-300 border-zinc-500/30`;
const PILL_DEPTH = `${PILL} bg-zinc-500/20 text-zinc-400 border-zinc-500/30`;
const MINI = 'inline-block text-[9px] font-semibold uppercase tracking-wider px-1 py-0.5 rounded border';
const MINI_NEUTRAL = `${MINI} bg-zinc-500/20 text-zinc-300 border-zinc-500/30`;
const MINI_DEPTH = `${MINI} bg-zinc-500/20 text-zinc-400 border-zinc-500/30`;

function depthLabel(depth: number): string {
  return depth === 0 ? 'TOP' : `SUB${depth}`;
}

function typePillStyle(typeId: string | null, itemTypes: ItemType[]): React.CSSProperties | undefined {
  const t = typeId ? itemTypes.find(x => x.id === typeId) : null;
  return t?.color ? { backgroundColor: t.color + '33', borderColor: t.color + '66', color: t.color } : undefined;
}

function typePillClass(typeId: string | null, itemTypes: ItemType[], mini = false): string {
  const base = mini ? MINI : PILL;
  const neutral = mini ? MINI_NEUTRAL : PILL_NEUTRAL;
  const t = typeId ? itemTypes.find(x => x.id === typeId) : null;
  return t?.color ? base : neutral;
}

interface CardDetailPanelProps {
  itemId: string | null;
  childDefaultColumnId?: string | null;
  itemTypes: ItemType[];
  onClose: () => void;
  onUpdate: (item: WorkItem) => void;
  onDelete: (id: string) => void;
  onNavigate: (id: string) => void;
  onChildCreated: (item: WorkItem) => void;
}

export default function CardDetailPanel({ itemId, childDefaultColumnId, itemTypes, onClose, onUpdate, onDelete, onNavigate, onChildCreated }: CardDetailPanelProps) {
  const [detail, setDetail] = useState<WorkItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  const [addingChild, setAddingChild] = useState(false);
  const [childTitle, setChildTitle] = useState('');
  const [childType, setChildType] = useState<string>('');

  const [agents, setAgents] = useState<Agent[]>([]);
  const [savingAgent, setSavingAgent] = useState(false);
  const [copied, setCopied] = useState(false);

  const [boardLabels, setBoardLabels] = useState<Label[]>([]);
  const [itemLabelIds, setItemLabelIds] = useState<Set<string>>(new Set());
  const [addingLabel, setAddingLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#6366f1');

  const [itemAttachments, setItemAttachments] = useState<Attachment[]>([]);
  const [addingAttachment, setAddingAttachment] = useState(false);
  const [attachLabel, setAttachLabel] = useState('');
  const [attachType, setAttachType] = useState<'google_doc' | 'github_file' | 'local_file' | 'export'>('google_doc');
  const [attachUrl, setAttachUrl] = useState('');

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!itemId) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true);
    setEditingTitle(false);
    setEditingDesc(false);
    setConfirmDelete(false);
    setAddingChild(false);
    setChildTitle('');
    /* eslint-enable react-hooks/set-state-in-effect */
    Promise.all([fetchWorkItem(itemId), fetchAgents()])
      .then(([d, agentList]) => {
        setDetail(d);
        setTitleDraft(d.title);
        setDescDraft(d.description ?? '');
        setAgents(agentList);
        if (d.boardId) {
          Promise.all([fetchLabels(d.boardId), fetchWorkItemLabels(d.id)]).then(([bl, il]) => {
            setBoardLabels(bl);
            setItemLabelIds(new Set(il.map(l => l.id)));
          }).catch(() => {});
        }
        fetchAttachments(d.id).then(setItemAttachments).catch(() => {});
      })
      .catch(err => console.error('Failed to load work item:', err))
      .finally(() => setLoading(false));
  }, [itemId]);

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus();
  }, [editingTitle]);

  useEffect(() => {
    if (editingDesc) descTextareaRef.current?.focus();
  }, [editingDesc]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (editingTitle) { setEditingTitle(false); setTitleDraft(detail?.title ?? ''); return; }
        if (editingDesc) { setEditingDesc(false); setDescDraft(detail?.description ?? ''); return; }
        if (confirmDelete) { setConfirmDelete(false); return; }
        onClose();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [editingTitle, editingDesc, confirmDelete, detail, onClose]);

  async function saveTitle() {
    if (!detail || titleDraft.trim() === detail.title) { setEditingTitle(false); return; }
    setSaving(true);
    try {
      const updated = await updateWorkItem(detail.id, { title: titleDraft.trim() });
      setDetail(prev => prev ? { ...prev, title: updated.title, updatedAt: updated.updatedAt } : prev);
      onUpdate(updated);
    } catch (err) {
      console.error('Failed to update title:', err);
    } finally {
      setSaving(false);
      setEditingTitle(false);
    }
  }

  async function saveDesc() {
    if (!detail) { setEditingDesc(false); return; }
    const newDesc = descDraft.trim() || null;
    if (newDesc === detail.description) { setEditingDesc(false); return; }
    setSaving(true);
    try {
      const updated = await updateWorkItem(detail.id, { description: newDesc ?? undefined });
      setDetail(prev => prev ? { ...prev, description: updated.description, updatedAt: updated.updatedAt } : prev);
      onUpdate(updated);
    } catch (err) {
      console.error('Failed to update description:', err);
    } finally {
      setSaving(false);
      setEditingDesc(false);
    }
  }

  async function handleDelete() {
    if (!detail) return;
    setSaving(true);
    try {
      await deleteWorkItem(detail.id);
      onDelete(detail.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete work item:', err);
      setSaving(false);
      setConfirmDelete(false);
    }
  }

  async function handleCreateChild(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!detail || !childTitle.trim()) return;
    setSaving(true);
    try {
      const child = await createWorkItem({
        type: childType || null,
        title: childTitle.trim(),
        parentId: detail.id,
        boardId: detail.boardId ?? undefined,
        columnId: childDefaultColumnId ?? detail.columnId ?? undefined,
      });
      setDetail(prev => prev ? { ...prev, children: [...prev.children, child] } : prev);
      onChildCreated(child);
      setChildTitle('');
      setAddingChild(false);
    } catch (err) {
      console.error('Failed to create child:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleAgentChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (!detail) return;
    const agentId = e.target.value || null;
    setSavingAgent(true);
    try {
      const updated = await updateWorkItem(detail.id, {
        agentId,
        assigneeType: agentId ? 'agent' : null,
      });
      setDetail(prev => prev ? { ...prev, agentId: updated.agentId, assigneeType: updated.assigneeType, updatedAt: updated.updatedAt } : prev);
      onUpdate(updated);
    } catch (err) {
      console.error('Failed to update agent assignment:', err);
    } finally {
      setSavingAgent(false);
    }
  }

  async function handleToggleLabel(labelId: string) {
    if (!detail) return;
    if (itemLabelIds.has(labelId)) {
      await removeLabelFromWorkItem(detail.id, labelId);
      setItemLabelIds(prev => { const s = new Set(prev); s.delete(labelId); return s; });
    } else {
      await addLabelToWorkItem(detail.id, labelId);
      setItemLabelIds(prev => new Set([...prev, labelId]));
    }
  }

  async function handleCreateLabel(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!detail || !newLabelName.trim()) return;
    const label = await createLabel({ boardId: detail.boardId ?? undefined, name: newLabelName.trim(), color: newLabelColor });
    setBoardLabels(prev => [...prev, label]);
    await addLabelToWorkItem(detail.id, label.id);
    setItemLabelIds(prev => new Set([...prev, label.id]));
    setNewLabelName('');
    setAddingLabel(false);
  }

  async function handleAddAttachment(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!detail || !attachLabel.trim()) return;
    const att = await createAttachment(detail.id, { type: attachType, label: attachLabel.trim(), externalUrl: attachUrl.trim() || undefined });
    setItemAttachments(prev => [...prev, att]);
    setAttachLabel('');
    setAttachUrl('');
    setAddingAttachment(false);
  }

  async function handleDeleteAttachment(id: string) {
    await deleteAttachment(id);
    setItemAttachments(prev => prev.filter(a => a.id !== id));
  }

  async function handleOpenInClaude(agent: Agent) {
    if (agent.surface === 'code') {
      const parts = [`I have a task I'd like your help with:\n\n**${detail?.title ?? ''}**`];
      if (detail?.description) parts.push(detail.description);
      await navigator.clipboard.writeText(parts.join('\n\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }
    if (detail) {
      const text = `# ${detail.title}${detail.description ? `\n\n${detail.description}` : ''}`;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    window.location.href = `claude://claude.ai/project/${agent.claudeProjectId}`;
  }

  function formatTime(ts: number) {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  }

  const isOpen = itemId !== null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`
        fixed top-0 right-0 z-50 h-full w-[420px] max-w-full
        bg-zinc-900 border-l border-zinc-700
        flex flex-col
        transition-transform duration-200 ease-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {loading || !detail ? (
          <div className="flex items-center justify-center flex-1">
            <p className="text-zinc-500 text-sm">{loading ? 'Loading…' : ''}</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start gap-3 px-5 pt-5 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-1 shrink-0 mt-0.5">
                <span className={PILL_DEPTH}>{depthLabel(detail.depth ?? 0)}</span>
                {detail.type && (
                  <span className={typePillClass(detail.type, itemTypes)} style={typePillStyle(detail.type, itemTypes)}>
                    {itemTypes.find(x => x.id === detail.type)?.name ?? detail.type}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                {editingTitle ? (
                  <input
                    ref={titleInputRef}
                    value={titleDraft}
                    onChange={e => setTitleDraft(e.target.value)}
                    onBlur={saveTitle}
                    onKeyDown={e => { if (e.key === 'Enter') saveTitle(); }}
                    className="
                      w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1
                      text-sm font-semibold text-zinc-100
                      focus:outline-none focus:border-blue-500/60
                    "
                  />
                ) : (
                  <h2
                    onClick={() => { setTitleDraft(detail.title); setEditingTitle(true); }}
                    className="text-sm font-semibold text-zinc-100 cursor-text hover:text-white leading-snug"
                    title="Click to edit"
                  >
                    {detail.title}
                  </h2>
                )}
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Updated {formatTime(detail.updatedAt)}
                </p>
              </div>

              <button
                onClick={onClose}
                className="shrink-0 text-zinc-500 hover:text-zinc-200 transition-colors p-1 rounded hover:bg-zinc-800"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Description */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Description
                </p>
                {editingDesc ? (
                  <textarea
                    ref={descTextareaRef}
                    value={descDraft}
                    onChange={e => setDescDraft(e.target.value)}
                    onBlur={saveDesc}
                    rows={5}
                    className="
                      w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-2
                      text-sm text-zinc-100 placeholder-zinc-500 resize-none
                      focus:outline-none focus:border-blue-500/60
                    "
                    placeholder="Add a description…"
                  />
                ) : (
                  <div
                    onClick={() => { setDescDraft(detail.description ?? ''); setEditingDesc(true); }}
                    className={`
                      min-h-[72px] rounded px-3 py-2 cursor-text
                      border border-transparent hover:border-zinc-700 hover:bg-zinc-800/50
                      text-sm leading-relaxed transition-colors
                      ${detail.description ? 'text-zinc-300' : 'text-zinc-600'}
                    `}
                  >
                    {detail.description || 'Click to add a description…'}
                  </div>
                )}
              </div>

              {/* Labels */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Labels</p>
                  {!addingLabel && (
                    <button onClick={() => setAddingLabel(true)} className="text-[11px] text-zinc-500 hover:text-blue-400 transition-colors">
                      + New
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  {boardLabels.map(label => (
                    <button
                      key={label.id}
                      onClick={() => handleToggleLabel(label.id)}
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition-opacity ${itemLabelIds.has(label.id) ? 'opacity-100' : 'opacity-35 hover:opacity-60'}`}
                      style={{ backgroundColor: label.color + '33', borderColor: label.color + '66', color: label.color }}
                    >
                      {label.name}
                    </button>
                  ))}
                  {boardLabels.length === 0 && !addingLabel && (
                    <p className="text-xs text-zinc-600">No labels yet.</p>
                  )}
                </div>

                {addingLabel && (
                  <form onSubmit={handleCreateLabel} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        value={newLabelName}
                        onChange={e => setNewLabelName(e.target.value)}
                        placeholder="Label name..."
                        className="flex-1 px-2 py-1 rounded text-xs bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60"
                        onKeyDown={e => { if (e.key === 'Escape') { setAddingLabel(false); setNewLabelName(''); } }}
                      />
                      <input type="color" value={newLabelColor} onChange={e => setNewLabelColor(e.target.value)}
                        className="w-8 h-7 rounded cursor-pointer bg-zinc-800 border border-zinc-700 p-0.5" />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="px-3 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-500">Create</button>
                      <button type="button" onClick={() => { setAddingLabel(false); setNewLabelName(''); }} className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200">Cancel</button>
                    </div>
                  </form>
                )}
              </div>

              {/* Agent */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Agent
                </p>
                <select
                  value={detail.agentId ?? ''}
                  onChange={handleAgentChange}
                  disabled={savingAgent}
                  className="w-full px-2 py-1.5 rounded text-sm bg-zinc-800 border border-zinc-700 text-zinc-300 focus:outline-none focus:border-blue-500/60 disabled:opacity-50"
                >
                  <option value="">None</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.surface === 'chat' ? 'Claude.ai' : a.surface === 'code' ? 'Claude Code' : 'Co-work'})
                    </option>
                  ))}
                </select>
                {detail.agentId && (() => {
                  const agent = agents.find(a => a.id === detail.agentId);
                  return agent ? (
                    <button
                      onClick={() => handleOpenInClaude(agent)}
                      className="mt-2 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-500 transition-colors"
                    >
                      {copied ? 'Copied to clipboard!' : agent.surface === 'code' ? 'Copy Story to Clipboard' : 'Open in Claude'}
                      {!copied && (
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4" />
                        </svg>
                      )}
                    </button>
                  ) : null;
                })()}
              </div>

              {/* Attachments */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Attachments</p>
                  {!addingAttachment && (
                    <button onClick={() => setAddingAttachment(true)} className="text-[11px] text-zinc-500 hover:text-blue-400 transition-colors">+ Add</button>
                  )}
                </div>

                {itemAttachments.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {itemAttachments.map(att => (
                      <div key={att.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-zinc-800/50 group">
                        <span className="text-[10px] text-zinc-500 uppercase shrink-0">{att.type.replace('_', ' ')}</span>
                        {att.externalUrl ? (
                          <a href={att.externalUrl} target="_blank" rel="noreferrer" className="flex-1 text-xs text-blue-400 hover:text-blue-300 truncate">{att.label}</a>
                        ) : (
                          <span className="flex-1 text-xs text-zinc-300 truncate">{att.label}</span>
                        )}
                        <button onClick={() => handleDeleteAttachment(att.id)} className="shrink-0 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M4 4l8 8M12 4l-8 8"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {addingAttachment && (
                  <form onSubmit={handleAddAttachment} className="space-y-2">
                    <input autoFocus value={attachLabel} onChange={e => setAttachLabel(e.target.value)} placeholder="Label..."
                      className="w-full px-2 py-1 rounded text-xs bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60"
                      onKeyDown={e => { if (e.key === 'Escape') { setAddingAttachment(false); setAttachLabel(''); setAttachUrl(''); } }} />
                    <input value={attachUrl} onChange={e => setAttachUrl(e.target.value)} placeholder="URL (optional)..."
                      className="w-full px-2 py-1 rounded text-xs bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60" />
                    <div className="flex items-center gap-2">
                      <select value={attachType} onChange={e => setAttachType(e.target.value as typeof attachType)}
                        className="px-2 py-1 rounded text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 focus:outline-none">
                        <option value="google_doc">Google Doc</option>
                        <option value="github_file">GitHub File</option>
                        <option value="local_file">Local File</option>
                        <option value="export">Export</option>
                      </select>
                      <button type="submit" className="px-3 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-500">Add</button>
                      <button type="button" onClick={() => { setAddingAttachment(false); setAttachLabel(''); setAttachUrl(''); }} className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200">Cancel</button>
                    </div>
                  </form>
                )}

                {itemAttachments.length === 0 && !addingAttachment && (
                  <p className="text-xs text-zinc-600">No attachments yet.</p>
                )}
              </div>

              {/* Children */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Children {detail.children.length > 0 && `(${detail.children.length})`}
                  </p>
                  {!addingChild && (
                    <button
                      onClick={() => setAddingChild(true)}
                      className="text-[11px] text-zinc-500 hover:text-blue-400 transition-colors"
                    >
                      + Add
                    </button>
                  )}
                </div>

                {detail.children.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {detail.children.map(child => (
                      <button
                        key={child.id}
                        onClick={() => onNavigate(child.id)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-left"
                      >
                        <span className={MINI_DEPTH}>{depthLabel(child.depth ?? (detail.depth ?? 0) + 1)}</span>
                        {child.type && (
                          <span className={typePillClass(child.type, itemTypes, true)} style={typePillStyle(child.type, itemTypes)}>
                            {itemTypes.find(x => x.id === child.type)?.name ?? child.type}
                          </span>
                        )}
                        <span className="text-xs text-zinc-300 truncate">{child.title}</span>
                      </button>
                    ))}
                  </div>
                )}

                {addingChild && (
                  <form onSubmit={handleCreateChild} className="space-y-2">
                    <input
                      autoFocus
                      value={childTitle}
                      onChange={e => setChildTitle(e.target.value)}
                      placeholder="Child title..."
                      className="w-full px-3 py-2 rounded-lg text-sm bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60"
                      onKeyDown={e => { if (e.key === 'Escape') { setAddingChild(false); setChildTitle(''); } }}
                    />
                    <div className="flex items-center gap-2">
                      <select
                        value={childType}
                        onChange={e => setChildType(e.target.value)}
                        className="px-2 py-1 rounded text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 focus:outline-none"
                      >
                        <option value="">No Type</option>
                        {itemTypes.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      <button type="submit" disabled={saving} className="px-3 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50">
                        Add
                      </button>
                      <button type="button" onClick={() => { setAddingChild(false); setChildTitle(''); }} className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {detail.children.length === 0 && !addingChild && (
                  <p className="text-xs text-zinc-600">No children yet.</p>
                )}
              </div>

              {/* Activity log */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                  Activity
                </p>
                {detail.activity.length === 0 ? (
                  <p className="text-xs text-zinc-600">No activity yet.</p>
                ) : (
                  <div className="space-y-2">
                    {[...detail.activity].reverse().map(entry => (
                      <div key={entry.id} className="flex gap-2.5">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-zinc-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-zinc-300 leading-snug">{entry.content}</p>
                          <p className="text-[11px] text-zinc-600 mt-0.5">{formatTime(entry.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-zinc-800">
              {confirmDelete ? (
                <div className="flex items-center gap-3">
                  <p className="text-xs text-zinc-400 flex-1">Delete this card and all its children?</p>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    className="text-xs font-medium text-white bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                >
                  Delete card
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
