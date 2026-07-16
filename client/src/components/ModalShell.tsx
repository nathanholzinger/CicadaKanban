import { useEffect, type ReactNode } from 'react';

interface ModalShellProps {
  onClose: () => void;
  ariaLabel: string;
  title: ReactNode;
  subtitle?: ReactNode;
  maxWidth: string; // Tailwind max-width class, e.g. 'max-w-sm'
  maxHeight?: string; // e.g. 'max-h-[80vh]' — only needed when children manage their own flex-1 scroll region
  showCloseButton?: boolean;
  footer?: ReactNode;
  children: ReactNode;
}

// Shared chrome for centered modal dialogs: backdrop (click-to-close),
// dialog frame, header (title/subtitle + optional close button), and an
// optional footer bar. Body content is passed as `children` — modals whose
// body+footer need native <form> submit semantics (Enter-to-submit) wrap
// their own <form> around body+footer inside `children` rather than using
// the `footer` prop.
export default function ModalShell({
  onClose, ariaLabel, title, subtitle, maxWidth, maxHeight, showCloseButton, footer, children,
}: ModalShellProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div
        role="dialog"
        aria-label={ariaLabel}
        className={`relative z-10 w-full ${maxWidth} mx-4 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden flex flex-col ${maxHeight ?? ''}`}
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 border-b border-zinc-800 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
            {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 text-zinc-500 hover:text-zinc-200 p-1 rounded hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {children}

        {footer && <div className="px-6 py-4 border-t border-zinc-800 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
