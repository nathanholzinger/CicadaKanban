// Self-contained: poll, dropdown, mark-read/mark-all. No props.

import { useEffect, useRef, useState } from 'react';
import type { Notification } from '../types';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../api/notifications';
import { XIcon } from './icons';
import { formatTime, BTN_ADD_TRIGGER } from './item-detail/pillUtils';

const POLL_INTERVAL_MS = 15000;

// Fully self-contained notifications feature — polls independently, owns its
// own dropdown open/close state, and depends on no app state (project
// selection, workflow inheritance, etc.).
export default function NotificationsBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function load() {
      fetchNotifications()
        .then(setNotifications)
        .catch(() => {});
    }
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!showNotifications) return;
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showNotifications]);

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      setNotifications([]);
      setShowNotifications(false);
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
      throw err;
    }
  }

  async function handleDismissNotification(id: string) {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
      throw err;
    }
  }

  return (
    <div ref={notifRef} className="relative flex items-center gap-3">
      <button
        onClick={() => setShowNotifications(prev => !prev)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
        title="Notifications"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 14.5c.83 0 1.5-.67 1.5-1.5h-3c0 .83.67 1.5 1.5 1.5z" />
          <path d="M12 10V7a4 4 0 0 0-8 0v3l-1.5 2h11L12 10z" />
        </svg>
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute top-10 right-0 z-50 w-80 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <span className="text-xs font-semibold text-zinc-300">Notifications</span>
            {notifications.length > 0 && (
              <button onClick={handleMarkAllRead} className={BTN_ADD_TRIGGER}>
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-zinc-600">No new notifications</p>
          ) : (
            <ul className="max-h-72 divide-y divide-zinc-800 overflow-y-auto">
              {notifications.map(n => (
                <li key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-800/50">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-snug text-zinc-300">{n.message}</p>
                    <p className="mt-0.5 text-[11px] text-zinc-600">{formatTime(n.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => handleDismissNotification(n.id)}
                    className="mt-0.5 shrink-0 text-zinc-600 hover:text-zinc-300"
                    title="Dismiss"
                  >
                    <XIcon strokeWidth={2} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
