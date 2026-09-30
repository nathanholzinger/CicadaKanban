// Shared inline confirm-delete for a row/heading being replaced outright.

import { useState, type ReactNode } from 'react';

interface ConfirmDeleteInlineProps {
  /** Renders the idle state; call the given function to flip into confirming mode. */
  trigger: (confirm: () => void) => ReactNode;
  /** Shown alongside Yes/No while confirming, e.g. the item's name + "Delete this project?". */
  prompt: ReactNode;
  /** The delete action for this specific id. */
  onDelete: () => Promise<void>;
  /** Wrapper classes for the confirming state — layout varies by call site (bare row vs. padded card). */
  className: string;
  /** Wrapper classes for the "Deleting…" state. */
  deletingClassName: string;
}

// Row/heading-replacement confirm-delete pattern. Distinct from
// ConfirmDeleteButton, which augments a persistent icon rather than
// replacing the whole line it sits on; SortableProjectRow's hover-revealed
// variant is a genuine third shape, deliberately kept apart — fold it in
// only if this component (or ConfirmDeleteButton) grows a matching mode.
export default function ConfirmDeleteInline({
  trigger,
  prompt,
  onDelete,
  className,
  deletingClassName,
}: ConfirmDeleteInlineProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (deleting) return <div className={deletingClassName}>Deleting…</div>;

  if (confirming) {
    return (
      <div className={className}>
        {prompt}
        <button
          onClick={async () => {
            setConfirming(false);
            setDeleting(true);
            await onDelete();
          }}
          className="rounded bg-red-900/60 px-2 py-0.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-800/60"
        >
          Yes
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded px-2 py-0.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300"
        >
          No
        </button>
      </div>
    );
  }

  return <>{trigger(() => setConfirming(true))}</>;
}
