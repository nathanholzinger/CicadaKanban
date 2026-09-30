// Shared "title + type select + Add/Cancel, Escape to dismiss" form
// (used by BoardColumn and ChildrenSection).

import { useState } from 'react';
import type { ItemType } from '../types';
import { INPUT_LG_RING, SELECT_BASE, escapeToCancel } from './item-detail/pillUtils';
import { FormActions } from './item-detail/DetailSection';

interface InlineItemFormProps {
  itemTypes: ItemType[];
  /** Type selected on open — BoardColumn defaults to the first available
   *  type (a board card always needs one to render its pill); ChildrenSection
   *  defaults to blank, since "No Type" is a real, selectable option there. */
  initialType?: string;
  /** Whether a blank "No Type" option is offered — see `initialType` above.
   *  Default true. */
  includeNoTypeOption?: boolean;
  noTypeLabel?: string;
  placeholder?: string;
  submitLabel?: string;
  /** Return (or resolve to) true to clear the draft and fire `onDone`; false
   *  to leave the form open with the draft intact so the user can retry
   *  (e.g. after a failed create). */
  onSubmit: (title: string, type: string | null) => boolean | Promise<boolean>;
  /** Called after a successful submit — typically hides the form. */
  onDone: () => void;
  onCancel: () => void;
}

// Lives outside item-detail/ since BoardColumn isn't an item-detail
// section.
export default function InlineItemForm({
  itemTypes,
  initialType = '',
  includeNoTypeOption = true,
  noTypeLabel = 'No Type',
  placeholder = 'Item title...',
  submitLabel = 'Add',
  onSubmit,
  onDone,
  onCancel,
}: InlineItemFormProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState(initialType);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const succeeded = await onSubmit(title.trim(), type || null);
      if (succeeded) onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder={placeholder}
        className={`w-full ${INPUT_LG_RING}`}
        onKeyDown={escapeToCancel(onCancel)}
      />
      <div className="flex items-center gap-2">
        <select value={type} onChange={e => setType(e.target.value)} className={SELECT_BASE}>
          {includeNoTypeOption && <option value="">{noTypeLabel}</option>}
          {itemTypes.map(t => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <FormActions submitLabel={submitLabel} onCancel={onCancel} disabled={submitting} />
      </div>
    </form>
  );
}
