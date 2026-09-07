// Shared inline icons. Introduced for audit finding #28 (X/close and trash paths
// were re-inlined across components). Each renders a currentColor stroke icon in a
// 16×16 viewBox; size defaults to 12 and can be overridden per call site.

interface IconProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function XIcon({ size = 12, strokeWidth = 1.5, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      className={className}
    >
      <path strokeLinecap="round" d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

export function TrashIcon({ size = 12, strokeWidth = 1.5, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" />
    </svg>
  );
}

interface PlusIconProps {
  size?: number;
  className?: string;
}

// Was independently re-typed identically 3 times: ProjectSidebar's "New
// project", ProjectPage's "Add subproject", SortableProjectRow's "Add
// subproject" (audit Finding #29).
export function PlusIcon({ size = 11, className }: PlusIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 11 11"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      className={className}
    >
      <path d="M5.5 1.5v8M1.5 5.5h8" />
    </svg>
  );
}

interface DragHandleIconProps {
  width?: number;
  height?: number;
  cx1?: number;
  cx2?: number;
  cyTop?: number;
  cyMid?: number;
  cyBot?: number;
  r?: number;
  className?: string;
}

// 6-dot drag-handle grid, was hand-typed twice at two different sizes —
// BoardColumn's board columns (the defaults below) and
// SortableProjectRow's sidebar rows (audit Finding #29). The two weren't a
// clean uniform scale of each other, so every position is its own prop
// rather than a single `size` — defaults reproduce BoardColumn's exact
// original values; SortableProjectRow passes its own.
export function DragHandleIcon({
  width = 10,
  height = 14,
  cx1 = 2.5,
  cx2 = 7.5,
  cyTop = 2.5,
  cyMid = 7,
  cyBot = 11.5,
  r = 1.5,
  className,
}: DragHandleIconProps) {
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="currentColor" className={className}>
      <circle cx={cx1} cy={cyTop} r={r} />
      <circle cx={cx2} cy={cyTop} r={r} />
      <circle cx={cx1} cy={cyMid} r={r} />
      <circle cx={cx2} cy={cyMid} r={r} />
      <circle cx={cx1} cy={cyBot} r={r} />
      <circle cx={cx2} cy={cyBot} r={r} />
    </svg>
  );
}

// Small square icon-button chrome — was identical at ProjectSidebar's "New
// project" and ProjectPage's "Add subproject" (audit Finding #29).
export const ICON_BUTTON_SM =
  'flex h-5 w-5 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-200';
