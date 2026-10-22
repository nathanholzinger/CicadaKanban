// Slide-in item detail panel — composes item-detail/* sections.

import { useEffect, useRef, useState } from 'react';
import type { Item, ItemDetail, ItemType } from '../types';
import { fetchItem, updateItem, deleteItem, type ItemWriteResponse } from '../api/items';
import {
  PILL_DEPTH,
  typePillClass,
  typePillStyle,
  depthLabel,
  formatTime,
  SECTION_LABEL,
} from './item-detail/pillUtils';
import { LabelsSection } from './item-detail/LabelsSection';
import { AgentSection } from './item-detail/AgentSection';
import { AttachmentsSection } from './item-detail/AttachmentsSection';
import { ParentSection } from './item-detail/ParentSection';
import { ChildrenSection } from './item-detail/ChildrenSection';
import { ActivityLog } from './item-detail/ActivityLog';
import { XIcon } from './icons';

const BACKDROP_BASE = 'fixed inset-0 z-40 bg-black/40 transition-opacity duration-200';
const PANEL_BASE =
  'fixed top-0 right-0 z-50 flex h-full w-[420px] max-w-full flex-col border-l border-zinc-700 bg-zinc-900 transition-transform duration-200 ease-out';
const DESCRIPTION_DISPLAY_BASE =
  'min-h-[72px] cursor-text rounded border border-transparent px-3 py-2 text-sm leading-relaxed transition-colors hover:border-zinc-700 hover:bg-zinc-800/50 focus:outline-none focus-visible:border-zinc-600';

interface ItemDetailPanelProps {
  itemId: string | null;
  items: Item[];
  itemTypes: ItemType[];
  onClose: () => void;
  // Receive the raw write response so a disclosed reindex reaches the board
  // (`itemWriteReconciliation.ts::completeItemWrite` folds it in).
  onUpdate: (item: ItemWriteResponse) => void;
  onDelete: (id: string) => void;
  onNavigate: (id: string) => void;
  onChildCreated: (item: ItemWriteResponse) => void;
}

// Owns only the open/close slide transition. All per-item state (detail,
// editing drafts, confirm-delete, ...) lives in ItemDetailPanelContent below,
// keyed on itemId — switching to a different item remounts that subtree
// fresh, resetting its state by construction, rather than through an
// effect that resets each piece of state on every itemId change (flagged by
// react-hooks/set-state-in-effect: calling setState directly and
// unconditionally in an effect body forces an extra render/commit pass).
export default function ItemDetailPanel({ itemId, onClose, ...contentProps }: ItemDetailPanelProps) {
  const isOpen = itemId !== null;

  // Keeps rendering the last real item's content while the panel slides
  // closed (itemId goes back to null) — unmounting immediately on close
  // would blank the content mid-transition instead of letting it visibly
  // slide away intact. Adjusted during render rather than in an effect
  // (React's documented pattern for deriving state from a prop change) —
  // a ref would work too, but mutating one during render is itself flagged
  // by the React Compiler's react-hooks/refs rule, for the same reason:
  // it isn't something the render function is supposed to have a
  // side-effect on.
  const [renderedItemId, setRenderedItemId] = useState<string | null>(itemId);
  if (itemId !== null && itemId !== renderedItemId) {
    setRenderedItemId(itemId);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${BACKDROP_BASE} ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`${PANEL_BASE} ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {renderedItemId && (
          <ItemDetailPanelContent key={renderedItemId} itemId={renderedItemId} onClose={onClose} {...contentProps} />
        )}
      </div>
    </>
  );
}

interface ItemDetailPanelContentProps {
  itemId: string;
  items: Item[];
  itemTypes: ItemType[];
  onClose: () => void;
  onUpdate: (item: ItemWriteResponse) => void;
  onDelete: (id: string) => void;
  onNavigate: (id: string) => void;
  onChildCreated: (item: ItemWriteResponse) => void;
}

function ItemDetailPanelContent({
  itemId,
  items,
  itemTypes,
  onClose,
  onUpdate,
  onDelete,
  onNavigate,
  onChildCreated,
}: ItemDetailPanelContentProps) {
  const [detail, setDetail] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Fires once per mount — a new itemId remounts this whole component (see
  // the `key` in ItemDetailPanel above) rather than this effect reacting to
  // a changing prop, so itemId is stable for this component's lifetime.
  useEffect(() => {
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
        if (editingTitle) {
          setEditingTitle(false);
          setTitleDraft(detail?.title ?? '');
          return;
        }
        if (editingDesc) {
          setEditingDesc(false);
          setDescDraft(detail?.description ?? '');
          return;
        }
        if (confirmDelete) {
          setConfirmDelete(false);
          return;
        }
        onClose();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [editingTitle, editingDesc, confirmDelete, detail, onClose]);

  async function saveTitle() {
    if (!detail || titleDraft.trim() === detail.title) {
      setEditingTitle(false);
      return;
    }
    setSaving(true);
    try {
      const updated = await updateItem(detail.id, { title: titleDraft.trim() });
      setDetail(prev => (prev ? { ...prev, title: updated.title, updatedAt: updated.updatedAt } : prev));
      onUpdate(updated);
    } catch (err) {
      console.error('Failed to update title:', err);
    } finally {
      setSaving(false);
      setEditingTitle(false);
    }
  }

  async function saveDesc() {
    if (!detail) {
      setEditingDesc(false);
      return;
    }
    const newDesc = descDraft.trim() || null;
    if (newDesc === detail.description) {
      setEditingDesc(false);
      return;
    }
    setSaving(true);
    try {
      const updated = await updateItem(detail.id, { description: newDesc ?? undefined });
      setDetail(prev => (prev ? { ...prev, description: updated.description, updatedAt: updated.updatedAt } : prev));
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
      setConfirmDelete(false);
    } finally {
      setSaving(false);
    }
  }

  // The three below take the write's whole response and hand it on as it came:
  // its `reindexed` pairs are what the board folds in.

  // Called by AgentSection when the item's agent/assigneeType fields change.
  function handleItemUpdated(updated: ItemWriteResponse) {
    setDetail(prev => (prev ? { ...prev, ...updated } : prev));
    onUpdate(updated);
  }

  // Called by ChildrenSection after a child is created.
  function handleChildCreated(child: ItemWriteResponse) {
    setDetail(prev => (prev ? { ...prev, children: [...prev.children, child] } : prev));
    onChildCreated(child);
  }

  // Called by ChildrenSection when a child's attach state changes.
  function handleChildUpdated(updated: ItemWriteResponse) {
    function replaceChild(c: Item): Item {
      if (c.id === updated.id) return { ...c, ...updated };
      return c;
    }
    setDetail(prev => (prev ? { ...prev, children: prev.children.map(replaceChild) } : prev));
    onUpdate(updated);
  }

  if (loading || !detail) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-zinc-500">{loading ? 'Loading…' : ''}</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-zinc-800 px-5 pt-5 pb-4">
        <div className="mt-0.5 flex shrink-0 items-center gap-1">
          <span className={PILL_DEPTH}>{depthLabel(detail.depth ?? 0)}</span>
          {detail.type && (
            <span className={typePillClass(detail.type, itemTypes)} style={typePillStyle(detail.type, itemTypes)}>
              {itemTypes.find(x => x.id === detail.type)?.name ?? detail.type}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {editingTitle ? (
            <input
              ref={titleInputRef}
              value={titleDraft}
              onChange={e => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => {
                if (e.key === 'Enter') saveTitle();
              }}
              className="w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-sm font-semibold text-zinc-100 focus:border-blue-500/60 focus:outline-none"
            />
          ) : (
            <h2
              onClick={() => {
                setTitleDraft(detail.title);
                setEditingTitle(true);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setTitleDraft(detail.title);
                  setEditingTitle(true);
                }
              }}
              tabIndex={0}
              className="cursor-text text-sm leading-snug font-semibold text-zinc-100 hover:text-white focus:outline-none focus-visible:underline"
              title="Click to edit"
            >
              {detail.title}
            </h2>
          )}
          <p className="mt-0.5 text-[11px] text-zinc-500">Updated {formatTime(detail.updatedAt)}</p>
        </div>

        <button
          onClick={onClose}
          aria-label="Close panel"
          className="shrink-0 rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        >
          <XIcon size={16} strokeWidth={2} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
        {/* Description */}
        <div>
          <p className={`${SECTION_LABEL} mb-1.5`}>Description</p>
          {editingDesc ? (
            <textarea
              ref={descTextareaRef}
              value={descDraft}
              onChange={e => setDescDraft(e.target.value)}
              onBlur={saveDesc}
              rows={5}
              className="w-full resize-none rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500/60 focus:outline-none"
              placeholder="Add a description…"
            />
          ) : (
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                setDescDraft(detail.description ?? '');
                setEditingDesc(true);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setDescDraft(detail.description ?? '');
                  setEditingDesc(true);
                }
              }}
              className={`${DESCRIPTION_DISPLAY_BASE} ${detail.description ? 'text-zinc-300' : 'text-zinc-600'}`}
            >
              {detail.description || 'Click to add a description…'}
            </div>
          )}
        </div>

        <LabelsSection itemId={detail.id} projectId={detail.projectId} />
        <AgentSection item={detail} onUpdate={handleItemUpdated} />
        <AttachmentsSection itemId={detail.id} />
        <ParentSection item={detail} allItems={items} onSelfUpdated={handleItemUpdated} />
        <ChildrenSection
          item={detail}
          itemTypes={itemTypes}
          onNavigate={onNavigate}
          onChildCreated={handleChildCreated}
          onChildUpdated={handleChildUpdated}
        />
        <ActivityLog activity={detail.activity} />
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800 px-5 py-4">
        {confirmDelete ? (
          <div className="flex items-center gap-3">
            <p className="flex-1 text-xs text-zinc-400">Delete this item and all its children?</p>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={saving}
              className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-xs text-zinc-500 transition-colors hover:text-red-400"
          >
            Delete item
          </button>
        )}
      </div>
    </>
  );
}
