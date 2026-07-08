import type { ActivityLogEntry } from '../../types';
import { formatTime, SECTION_LABEL, EMPTY_STATE } from './pillUtils';

interface ActivityLogProps {
  activity: ActivityLogEntry[];
}

export function ActivityLog({ activity }: ActivityLogProps) {
  return (
    <div>
      <p className={`${SECTION_LABEL} mb-2`}>Activity</p>
      {activity.length === 0 ? (
        <p className={EMPTY_STATE}>No activity yet.</p>
      ) : (
        <div className="space-y-2">
          {[...activity].reverse().map(entry => (
            <div key={entry.id} className="flex gap-2.5">
              <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-600" />
              <div className="min-w-0">
                <p className="text-xs leading-snug text-zinc-300">{entry.content}</p>
                <p className="mt-0.5 text-[11px] text-zinc-600">{formatTime(entry.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
