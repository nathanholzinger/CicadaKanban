import type { Attachment } from '../types';
import { apiJson, apiVoid } from './shared';

export function fetchAttachments(itemId: string): Promise<Attachment[]> {
  return apiJson(`/attachments/item/${itemId}`, undefined, 'Failed to fetch attachments');
}

export function createAttachment(
  itemId: string,
  data: {
    type: string;
    label: string;
    externalUrl?: string;
    filePath?: string;
  },
): Promise<Attachment> {
  return apiJson(`/attachments/item/${itemId}`, { method: 'POST', body: data }, 'Failed to create attachment');
}

export function deleteAttachment(id: string): Promise<void> {
  return apiVoid(`/attachments/${id}`, { method: 'DELETE' }, 'Failed to delete attachment');
}
