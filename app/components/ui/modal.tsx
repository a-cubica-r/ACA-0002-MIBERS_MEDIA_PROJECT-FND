import clsx from "clsx";
import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, footer, className }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);

    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className={clsx(
        "border-line bg-surface text-ink backdrop:bg-ink/40 m-auto max-h-[calc(100dvh-4rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl border p-0 shadow-xl",
        className,
      )}
    >
      <div className="border-line flex items-start justify-between gap-4 border-b px-4 py-3 sm:px-6">
        <h2 id={titleId} className="text-ink text-base font-semibold">
          {title}
        </h2>
        <button
          type="button"
          aria-label="Cerrar"
          onClick={() => dialogRef.current?.close()}
          className="text-ink-muted hover:bg-surface-muted hover:text-ink rounded-lg p-1 transition-colors"
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-5 w-5">
            <path
              d="M5 5l10 10M15 5L5 15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <div className="px-4 py-4 sm:px-6 sm:py-5">{children}</div>
      {footer && (
        <div className="border-line flex flex-col-reverse gap-2 border-t px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
          {footer}
        </div>
      )}
    </dialog>
  );
}
