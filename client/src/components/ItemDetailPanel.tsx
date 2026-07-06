import { useEffect, useRef, useState } from 'react';
import type { Item, ItemDetail, ItemType } from '../types';
import { fetchItem, updateItem, deleteItem } from '../api';
import { PILL_DEPTH, typePillClass, typePillStyle, depthLabel, formatTime } from './item-detail/pillUtils';
import { LabelsSection } from './item-detail/LabelsSection';
import { AgentSection } from './item-detail/AgentSection';
import { AttachmentsSection } from './item-detail/AttachmentsSection';
import { ChildrenSection } from './item-detail/ChildrenSection';
import { ActivityLog } from './item-detail/ActivityLog';

interface ItemDetailPanelProps {
  itemId: string | null;
  childDefaultColumnId?: string | null;
  itemTypes: ItemType[];
  onClose: () => void;
  onUpdate: (item: Item) => void;
  onDelete: (id: string) => void;
  onNavigate: (id: string) => void;
  onChildCreated: (item: Item) => void;
}

export default function ItemDetailPanel({ itemId, childDefaultColumnId, itemTypes, onClose, onUpdate, onDelete, onNavigate, onChildCreated }: ItemDetailPanelProps) {
  const [detail, setDetail] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!itemId) return;
    setLoading(true);
    setEditingTitle(false);
    setEditingDesc(false);
    setConfirmDelete(false);
    fetchItem(itemId)
      .then(d => {
        setDetail(d);
        setTitleDraft(d.title);
        setDescDraft(d.description ?? '');
      })
      .catch(err => console.error('Failed to load item:', err))
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
      const updated = await updateItem(detail.id, { title: titleDraft.trim() });
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
      const updated = await updateItem(detail.id, { description: newDesc ?? undefined });
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
      await deleteItem(detail.id);
      onDelete(detail.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete item:', err);
      setSaving(false);
      setConfirmDelete(false);
    }
  }

  // Called by AgentSection when the item's agent/assigneeType fields change.
  function handleItemUpdated(updated: Item) {
    setDetail(prev => prev ? { ...prev, ...updated } : prev);
    onUpdate(updated);
  }

  // Called by ChildrenSection after a child is created.
  function handleChildCreated(child: Item) {
    setDetail(prev => prev ? { ...prev, children: [...prev.children, child] } : prev);
    onChildCreated(child);
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
                    className="w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm font-semibold text-zinc-100 focus:outline-none focus:border-blue-500/60"
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
                <p className="text-[11px] text-zinc-500 mt-0.5">Updated {formatTime(detail.updatedAt)}</p>
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
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Description</p>
                {editingDesc ? (
                  <textarea
                    ref={descTextareaRef}
                    value={descDraft}
                    onChange={e => setDescDraft(e.target.value)}
                    onBlur={saveDesc}
                    rows={5}
                    className="w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none focus:border-blue-500/60"
                    placeholder="Add a description…"
                  />
                ) : (
                  <div
                    onClick={() => { setDescDraft(detail.description ?? ''); setEditingDesc(true); }}
                    className={`min-h-[72px] rounded px-3 py-2 cursor-text border border-transparent hover:border-zinc-700 hover:bg-zinc-800/50 text-sm leading-relaxed transition-colors ${detail.description ? 'text-zinc-300' : 'text-zinc-600'}`}
                  >
                    {detail.description || 'Click to add a description…'}
                  </div>
                )}
              </div>

              <LabelsSection itemId={detail.id} projectId={detail.projectId} />
              <AgentSection item={detail} onUpdate={handleItemUpdated} />
              <AttachmentsSection itemId={detail.id} />
              <ChildrenSection
                item={detail}
                childDefaultColumnId={childDefaultColumnId}
                itemTypes={itemTypes}
                onNavigate={onNavigate}
                onChildCreated={handleChildCreated}
              />
              <ActivityLog activity={detail.activity} />
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-zinc-800">
              {confirmDelete ? (
                <div className="flex items-center gap-3">
                  <p className="text-xs text-zinc-400 flex-1">Delete this item and all its children?</p>
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
                  Delete item
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
