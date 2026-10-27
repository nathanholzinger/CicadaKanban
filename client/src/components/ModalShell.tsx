// Shared modal chrome (backdrop, header, footer, Esc) — all centered modals wrap this.

import { useEffect, type ReactNode, type Ref } from 'react';
import { XIcon } from './icons';

interface ModalShellProps {
  onClose: () => void;
  ariaLabel: string;
  title: ReactNode;
  subtitle?: ReactNode;
  maxWidth: string; // Tailwind max-width class, e.g. 'max-w-sm'
  maxHeight?: string; // e.g. 'max-h-[80vh]' — only needed when children manage their own flex-1 scroll region
  showCloseButton?: boolean;
  footer?: ReactNode;
  /** Places the dialog at these window coordinates instead of centering it. */
  position?: { left: number; top: number };
  /** The dialog element, for a modal that measures itself. */
  dialogRef?: Ref<HTMLDivElement>;
  /** Further attributes for the dialog element. */
  dialogProps?: Record<string, string>;
  children: ReactNode;
}

// Shared chrome for centered modal dialogs: backdrop (click-to-close),
// dialog frame, header (title/subtitle + optional close button), and an
// optional footer bar. Body content is passed as `children` — modals whose
// body+footer need native <form> submit semantics (Enter-to-submit) wrap
// their own <form> around body+footer inside `children` rather than using
// the `footer` prop.
export default function ModalShell({
  onClose,
  ariaLabel,
  title,
  subtitle,
  maxWidth,
  maxHeight,
  showCloseButton,
  footer,
  position,
  dialogRef,
  dialogProps,
  children,
}: ModalShellProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className={`fixed inset-0 z-50 ${position ? '' : 'flex items-center justify-center'}`}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div
        ref={dialogRef}
        role="dialog"
        aria-label={ariaLabel}
        {...dialogProps}
        style={position}
        className={`z-10 ${position ? 'absolute w-[calc(100%-1rem)]' : 'relative mx-4 w-full'} ${maxWidth} flex flex-col overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl ${maxHeight ?? ''}`}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-800 px-6 pt-6 pb-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
            {subtitle && <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>}
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            >
              <XIcon size={16} strokeWidth={2} />
            </button>
          )}
        </div>

        {children}

        {footer && <div className="shrink-0 border-t border-zinc-800 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
