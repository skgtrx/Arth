import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    } else {
      dialog.close();
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) {
      onClose();
    }
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      onClick={handleBackdropClick}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-border-default bg-surface-raised p-0 text-text-primary backdrop:bg-black/60 open:flex open:flex-col"
    >
      {title && (
        <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-overlay hover:text-text-secondary"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}
      <div className="p-4">{children}</div>
    </dialog>,
    document.body,
  );
}
