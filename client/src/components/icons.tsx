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
