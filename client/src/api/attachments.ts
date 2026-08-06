import type { Attachment } from '../types';
import { API } from './shared';

export async function fetchAttachments(itemId: string): Promise<Attachment[]> {
  const res = await fetch(`${API}/attachments/item/${itemId}`);
  if (!res.ok) throw new Error('Failed to fetch attachments');
  return res.json();
}

export async function createAttachment(
  itemId: string,
  data: {
    type: string;
    label: string;
    externalUrl?: string;
    filePath?: string;
  },
): Promise<Attachment> {
  const res = await fetch(`${API}/attachments/item/${itemId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create attachment');
  return res.json();
}

export async function deleteAttachment(id: string): Promise<void> {
  const res = await fetch(`${API}/attachments/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete attachment');
}
