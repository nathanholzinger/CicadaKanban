import type { ReactNode } from 'react';
import { SECTION_LABEL, BTN_ADD_TRIGGER, BTN_PRIMARY, BTN_CANCEL } from './pillUtils';

interface DetailSectionProps {
  /** The section's title, e.g. "Children" or "Children (3)" — a ReactNode so
   *  a caller can embed a dynamic count. */
  label: ReactNode;
  /** Shows a small "+ Add"-style trigger next to the label when given.
   *  Callers pass `undefined` (rather than omitting the prop) while their
   *  own add-form is open, so the trigger and the form are never both
   *  visible at once. Omit entirely for a label-only section (ParentSection,
   *  AgentSection). */
  onAdd?: () => void;
  /** Trigger text — default '+ Add'. */
  addLabel?: string;
  children: ReactNode;
}

// The section header row (label + conditional "+ Add" toggle) was written
// out identically across ChildrenSection/LabelsSection/AttachmentsSection,
// with ParentSection/AgentSection using the label-only half (audit Finding
// #28). `children` is the section's own body — item list, empty state,
// error message, add-form — none of which follows a common enough shape to
// pull in here too.
export function DetailSection({ label, onAdd, addLabel = '+ Add', children }: DetailSectionProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className={SECTION_LABEL}>{label}</p>
        {onAdd && (
          <button onClick={onAdd} className={BTN_ADD_TRIGGER}>
            {addLabel}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

interface FormActionsProps {
  /** Submit button text — default 'Add'. */
  submitLabel?: string;
  onCancel: () => void;
  disabled?: boolean;
}

// The add-form footer (BTN_PRIMARY/BTN_CANCEL pair) was duplicated
// identically 3 times alongside DetailSection above (audit Finding #28).
// Rendered as siblings rather than wrapped in a container of its own, since
// a caller's footer row sometimes also holds a <select> before these two
// buttons (ChildrenSection, AttachmentsSection) and sometimes doesn't
// (LabelsSection) — the wrapping `<div className="flex ... gap-2">` stays
// the caller's to write.
export function FormActions({ submitLabel = 'Add', onCancel, disabled }: FormActionsProps) {
  return (
    <>
      <button type="submit" disabled={disabled} className={`${BTN_PRIMARY} disabled:opacity-50`}>
        {submitLabel}
      </button>
      <button type="button" onClick={onCancel} className={BTN_CANCEL}>
        Cancel
      </button>
    </>
  );
}
