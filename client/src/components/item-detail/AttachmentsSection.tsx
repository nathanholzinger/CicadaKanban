import { useEffect, useState } from 'react';
import type { Attachment } from '../../types';
import { fetchAttachments, createAttachment, deleteAttachment } from '../../api/attachments';
import {
  SECTION_LABEL,
  INPUT_BASE,
  SELECT_BASE,
  BTN_PRIMARY,
  BTN_CANCEL,
  BTN_ADD_TRIGGER,
  EMPTY_STATE,
} from './pillUtils';
import { XIcon } from '../icons';

interface AttachmentsSectionProps {
  itemId: string;
}

export function AttachmentsSection({ itemId }: AttachmentsSectionProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [type, setType] = useState<Attachment['type']>('google_doc');
  const [url, setUrl] = useState('');

  useEffect(() => {
    fetchAttachments(itemId)
      .then(setAttachments)
      .catch(() => {});
  }, [itemId]);

  async function handleAdd(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!label.trim()) return;
    const att = await createAttachment(itemId, { type, label: label.trim(), externalUrl: url.trim() || undefined });
    setAttachments(prev => [...prev, att]);
    setLabel('');
    setUrl('');
    setAdding(false);
  }

  async function handleDelete(id: string) {
    await deleteAttachment(id);
    setAttachments(prev => prev.filter(a => a.id !== id));
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className={SECTION_LABEL}>Attachments</p>
        {!adding && (
          <button onClick={() => setAdding(true)} className={BTN_ADD_TRIGGER}>
            + Add
          </button>
        )}
      </div>

      {attachments.length > 0 && (
        <div className="mb-2 space-y-1">
          {attachments.map(att => (
            <div key={att.id} className="group flex items-center gap-2 rounded-lg bg-zinc-800/50 px-2 py-1.5">
              <span className="text-micro shrink-0 text-zinc-500 uppercase">{att.type.replace('_', ' ')}</span>
              {att.externalUrl ? (
                <a
                  href={att.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 truncate text-xs text-blue-400 hover:text-blue-300"
                >
                  {att.label}
                </a>
              ) : (
                <span className="flex-1 truncate text-xs text-zinc-300">{att.label}</span>
              )}
              <button
                onClick={() => handleDelete(att.id)}
                aria-label="Delete attachment"
                className="shrink-0 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
              >
                <XIcon size={10} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <form onSubmit={handleAdd} className="space-y-2">
          <input
            autoFocus
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Label..."
            className={`w-full ${INPUT_BASE}`}
            onKeyDown={e => {
              if (e.key === 'Escape') {
                setAdding(false);
                setLabel('');
                setUrl('');
              }
            }}
          />
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="URL (optional)..."
            className={`w-full ${INPUT_BASE}`}
          />
          <div className="flex items-center gap-2">
            <select value={type} onChange={e => setType(e.target.value as Attachment['type'])} className={SELECT_BASE}>
              <option value="google_doc">Google Doc</option>
              <option value="github_file">GitHub File</option>
              <option value="local_file">Local File</option>
              <option value="export">Export</option>
            </select>
            <button type="submit" className={BTN_PRIMARY}>
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setLabel('');
                setUrl('');
              }}
              className={BTN_CANCEL}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {attachments.length === 0 && !adding && <p className={EMPTY_STATE}>No attachments yet.</p>}
    </div>
  );
}
