// Shared icon-trigger confirm-delete (columns, workphases, agents).

import { useState, type ReactNode } from 'react';
import { TrashIcon } from './icons';

// Shared classes for the two-step confirm-delete control.
const DELETE_PILL =
  'text-[10px] text-red-400 hover:text-red-300 px-1.5 py-0.5 rounded bg-red-500/10 disabled:opacity-50';
const CANCEL_PILL = 'text-[10px] text-zinc-500 hover:text-zinc-300';
const TRASH_BASE = 'text-zinc-600 hover:text-red-400 transition-colors';

interface ConfirmDeleteButtonProps {
  /** The delete action. If it rejects, the message is surfaced (inline or via onError). */
  onDelete: () => Promise<void>;
  /** Tooltip on the trash trigger, e.g. "Delete column". */
  title: string;
  /** Shown when onDelete rejects without an Error message. */
  errorFallback?: string;
  /** Disables the confirm Delete action (e.g. while a parent save is in flight). */
  disabled?: boolean;
  /** Extra classes on the trash trigger (padding/shrink vary per call site). */
  triggerClassName?: string;
  /** Class for the inline error <p>. Ignored when onError is given. */
  errorClassName?: string;
  /** If provided, delete errors are reported here instead of rendered inline —
   *  lets a parent place the error in a bespoke slot (e.g. below a column header). */
  onError?: (message: string) => void;
  /** Rendered before the trash icon when not confirming (e.g. a sibling Edit button). */
  beforeTrigger?: ReactNode;
}

export default function ConfirmDeleteButton({
  onDelete,
  title,
  errorFallback = 'Failed to delete.',
  disabled,
  triggerClassName = '',
  errorClassName = 'text-[10px] text-red-400 basis-full',
  onError,
  beforeTrigger,
}: ConfirmDeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  function report(message: string) {
    if (onError) onError(message);
    else setError(message);
  }

  async function handleDelete() {
    report('');
    try {
      await onDelete();
      // On success the target row is typically removed by the parent, unmounting us.
    } catch (err) {
      report(err instanceof Error ? err.message : errorFallback);
      setConfirming(false);
    }
  }

  function cancel() {
    setConfirming(false);
    report('');
  }

  return (
    <>
      <span className="flex shrink-0 items-center gap-1">
        {confirming ? (
          <>
            <button onClick={handleDelete} disabled={disabled} className={DELETE_PILL}>
              Delete
            </button>
            <button onClick={cancel} className={CANCEL_PILL}>
              Cancel
            </button>
          </>
        ) : (
          <>
            {beforeTrigger}
            <button
              onClick={() => setConfirming(true)}
              className={`${TRASH_BASE} ${triggerClassName}`.trim()}
              title={title}
            >
              <TrashIcon />
            </button>
          </>
        )}
      </span>
      {!onError && error && <p className={errorClassName}>{error}</p>}
    </>
  );
}
