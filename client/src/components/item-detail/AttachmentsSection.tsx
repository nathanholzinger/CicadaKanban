import { useEffect, useState } from 'react';
import type { Attachment } from '../../types';
import { fetchAttachments, createAttachment, deleteAttachment } from '../../api';

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
    fetchAttachments(itemId).then(setAttachments).catch(() => {});
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
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Attachments</p>
        {!adding && (
          <button onClick={() => setAdding(true)} className="text-[11px] text-zinc-500 hover:text-blue-400 transition-colors">+ Add</button>
        )}
      </div>

      {attachments.length > 0 && (
        <div className="space-y-1 mb-2">
          {attachments.map(att => (
            <div key={att.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-zinc-800/50 group">
              <span className="text-[10px] text-zinc-500 uppercase shrink-0">{att.type.replace('_', ' ')}</span>
              {att.externalUrl ? (
                <a href={att.externalUrl} target="_blank" rel="noreferrer" className="flex-1 text-xs text-blue-400 hover:text-blue-300 truncate">{att.label}</a>
              ) : (
                <span className="flex-1 text-xs text-zinc-300 truncate">{att.label}</span>
              )}
              <button onClick={() => handleDelete(att.id)} className="shrink-0 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M4 4l8 8M12 4l-8 8" /></svg>
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
            className="w-full px-2 py-1 rounded text-xs bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60"
            onKeyDown={e => { if (e.key === 'Escape') { setAdding(false); setLabel(''); setUrl(''); } }}
          />
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="URL (optional)..."
            className="w-full px-2 py-1 rounded text-xs bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60"
          />
          <div className="flex items-center gap-2">
            <select
              value={type}
              onChange={e => setType(e.target.value as Attachment['type'])}
              className="px-2 py-1 rounded text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 focus:outline-none"
            >
              <option value="google_doc">Google Doc</option>
              <option value="github_file">GitHub File</option>
              <option value="local_file">Local File</option>
              <option value="export">Export</option>
            </select>
            <button type="submit" className="px-3 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-500">Add</button>
            <button type="button" onClick={() => { setAdding(false); setLabel(''); setUrl(''); }} className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200">Cancel</button>
          </div>
        </form>
      )}

      {attachments.length === 0 && !adding && (
        <p className="text-xs text-zinc-600">No attachments yet.</p>
      )}
    </div>
  );
}
