import type { Notification } from '../types';
import { apiJson, apiVoid } from './shared';

export function fetchNotifications(): Promise<Notification[]> {
  return apiJson('/notifications', undefined, 'Failed to fetch notifications');
}

export function markNotificationRead(id: string): Promise<void> {
  return apiVoid(`/notifications/${id}/read`, { method: 'PATCH' }, 'Failed to mark notification read');
}

export function markAllNotificationsRead(): Promise<void> {
  return apiVoid('/notifications/read-all', { method: 'PATCH' }, 'Failed to mark all notifications read');
}
