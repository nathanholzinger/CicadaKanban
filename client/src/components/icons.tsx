// Shared inline icons and icon-button chrome, drawn in currentColor.

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

// 6-dot drag-handle grid, at two different sizes — BoardColumn's board
// columns (the defaults below) and SortableProjectRow's sidebar rows, which
// passes its own. The two aren't a uniform scale of each other, so every
// position is its own prop rather than a single `size`.
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

// Small square icon-button chrome.
export const ICON_BUTTON_SM =
  'flex h-5 w-5 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-200';
