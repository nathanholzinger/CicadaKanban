import type { Notification } from '../types';
import { API } from './shared';

export async function fetchNotifications(): Promise<Notification[]> {
  const res = await fetch(`${API}/notifications`);
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export async function markNotificationRead(id: string): Promise<void> {
  const res = await fetch(`${API}/notifications/${id}/read`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to mark notification read');
}

export async function markAllNotificationsRead(): Promise<void> {
  const res = await fetch(`${API}/notifications/read-all`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to mark all notifications read');
}
