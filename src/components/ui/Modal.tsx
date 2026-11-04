"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  label?: string;
  className?: string;
  children: ReactNode;
}

function syncScrollLock() {
  const anyOpen = document.querySelector("dialog[open]") !== null;
  document.documentElement.style.overflow = anyOpen ? "hidden" : "";
}

/**
 * Native <dialog> modal: the browser provides the focus trap, Esc to close,
 * an inert background and focus return to the opener.
 */
export function Modal({ open, onClose, labelledBy, label, className = "", children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
    syncScrollLock();
  }, [open]);

  useEffect(
    () => () => {
      ref.current?.close();
      syncScrollLock();
    },
    [],
  );

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      aria-label={label}
      onClose={() => {
        syncScrollLock();
        if (open) onClose();
      }}
      onClick={(e) => {
        // A click on the dialog element itself is a click on the backdrop.
        if (e.target === e.currentTarget) onClose();
      }}
      className={`m-auto overflow-visible border-0 bg-transparent p-0 text-ink backdrop:bg-night/60 backdrop:[animation:fade-in_.25s_ease_both] open:[animation:pop-up_.35s_cubic-bezier(.2,.8,.2,1)_both] ${className}`}
    >
      {open && children}
    </dialog>
  );
}
