import { BTN_CANCEL, INPUT_BASE, SECTION_LABEL } from './item-detail/pillUtils';
import { DEFAULT_DRAG_TUNING, type DragTuning } from './workflow/dragTuning';
import type { DragSession } from './workflow/DragSessionContext';
import { isLocked } from './workflow/popSession';
import type { Inversion } from './workflow/itemListOps';

// Epic 3.5 Story 3 — the dev/test panel docs/wiki/board-drag-interaction
// §3.1 names as a required deliverable: every threshold and band of the
// drag gesture, editable live, because the right values can only be found
// by feel and feel can only be compared by changing one number between two
// attempts without a rebuild. Also shows the machine's state during a drag
// and the §10 inversion tripwire's log.

interface DragTuningPanelProps {
  tuning: DragTuning;
  onChange: (next: DragTuning) => void;
  session: DragSession | null;
  inversions: readonly Inversion[];
  onClose: () => void;
}

type NumericKey = {
  [K in keyof DragTuning]: DragTuning[K] extends number ? K : never;
}[keyof DragTuning];

interface NumericField {
  key: NumericKey;
  label: string;
  step: number;
  min?: number;
  max?: number;
}

const POP_FIELDS: NumericField[] = [
  { key: 'popDelayMs', label: 'Pop-out delay (ms)', step: 50, min: 0 },
  { key: 'popDistancePx', label: 'Pop-out distance (px, 0 = off)', step: 10, min: 0 },
  { key: 'popInDelayMs', label: 'Pop-in delay (ms)', step: 50, min: 0 },
  { key: 'popSnapMs', label: 'Snap to cursor (ms)', step: 25, min: 0 },
];
const COLUMN_FIELDS: NumericField[] = [
  { key: 'columnTopBand', label: 'Column top band', step: 0.05, min: 0, max: 0.5 },
  { key: 'columnBottomBand', label: 'Column bottom band', step: 0.05, min: 0, max: 0.5 },
];
const STUB_FIELDS: NumericField[] = [
  { key: 'stubFirstChildBand', label: 'Stub first-child band', step: 0.05, min: 0, max: 1 },
  { key: 'stubLastChildBand', label: 'Stub last-child band', step: 0.05, min: 0, max: 1 },
  { key: 'stubPopBandStart', label: 'Stub pop band start', step: 0.05, min: 0, max: 1 },
  { key: 'stubPopBandEnd', label: 'Stub pop band end', step: 0.05, min: 0, max: 1 },
];
const OVERLAY_FIELDS: NumericField[] = [
  { key: 'overlayDepthCappedOpacity', label: 'Depth-capped opacity', step: 0.05, min: 0, max: 1 },
];

export default function DragTuningPanel({ tuning, onChange, session, inversions, onClose }: DragTuningPanelProps) {
  const pop = session?.pop ?? null;
  const lastInversion = inversions[inversions.length - 1];

  function setNumber(key: NumericKey, raw: string) {
    const value = Number(raw);
    if (Number.isFinite(value)) onChange({ ...tuning, [key]: value });
  }

  function renderFields(fields: NumericField[]) {
    return fields.map(field => (
      <label key={field.key} className="flex items-center justify-between gap-2 text-[11px] text-zinc-400">
        {field.label}
        <input
          type="number"
          value={tuning[field.key]}
          step={field.step}
          min={field.min}
          max={field.max}
          aria-label={field.label}
          onChange={e => setNumber(field.key, e.target.value)}
          className={`${INPUT_BASE} w-24 text-right`}
        />
      </label>
    ));
  }

  return (
    <section
      aria-label="Drag tuning"
      className="grid gap-4 rounded-lg border border-zinc-700/60 bg-zinc-900/60 p-3 md:grid-cols-4"
    >
      <div className="space-y-1.5">
        <h4 className={SECTION_LABEL}>Pop threshold</h4>
        {renderFields(POP_FIELDS)}
        <h4 className={`${SECTION_LABEL} pt-2`}>Column bands</h4>
        {renderFields(COLUMN_FIELDS)}
      </div>

      <div className="space-y-1.5">
        <h4 className={SECTION_LABEL}>Stub bands (Story 6)</h4>
        {renderFields(STUB_FIELDS)}
      </div>

      <div className="space-y-1.5">
        <h4 className={SECTION_LABEL}>Overlays</h4>
        <label className="flex items-center justify-between gap-2 text-[11px] text-zinc-400">
          Free-descendant ring
          <input
            type="text"
            value={tuning.overlayFreeDescendantColor}
            aria-label="Free-descendant ring color"
            onChange={e => onChange({ ...tuning, overlayFreeDescendantColor: e.target.value })}
            className={`${INPUT_BASE} w-40`}
          />
        </label>
        {renderFields(OVERLAY_FIELDS)}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={() => onChange(DEFAULT_DRAG_TUNING)} className={BTN_CANCEL}>
            Reset to defaults
          </button>
          <button type="button" onClick={onClose} className={BTN_CANCEL}>
            Close
          </button>
        </div>
      </div>

      <div className="space-y-1 font-mono text-[11px] text-zinc-400">
        <h4 className={SECTION_LABEL}>Live</h4>
        <p>state: {pop ? (isLocked(pop) ? 'locked' : 'popped out') : session ? '(stub drag)' : '—'}</p>
        <p>context: {pop?.contextKey ?? '—'}</p>
        <p>hover: {pop?.hover ? `${pop.hover.regionKey} · ${pop.hover.band}` : '—'}</p>
        <p data-inversion-count={inversions.length}>
          inversions: {inversions.length}
          {lastInversion && (
            <span
              className="block text-amber-400/80"
              title={`expected ${lastInversion.expected.join(',')} · got ${lastInversion.actual.join(',')}`}
            >
              last: {lastInversion.itemId}
            </span>
          )}
        </p>
      </div>
    </section>
  );
}
