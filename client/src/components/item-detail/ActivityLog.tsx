import type { ActivityLogEntry } from '../../types';
import { formatTime } from './pillUtils';

interface ActivityLogProps {
  activity: ActivityLogEntry[];
}

export function ActivityLog({ activity }: ActivityLogProps) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Activity</p>
      {activity.length === 0 ? (
        <p className="text-xs text-zinc-600">No activity yet.</p>
      ) : (
        <div className="space-y-2">
          {[...activity].reverse().map(entry => (
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
  );
}
