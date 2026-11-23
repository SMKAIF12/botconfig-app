"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

interface Props {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** Use the danger style for destructive confirmations. */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Accessible confirmation dialog (WAI-ARIA APG): focus moves in on open (to the safe button),
 * Tab stays inside, Escape or a click on the backdrop cancels, and focus returns to the opener on close.
 */
export default function ConfirmDialog({ title, children, confirmLabel, cancelLabel = "Cancel", danger, onConfirm, onCancel }: Props) {
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const cancel = useRef(onCancel);
  cancel.current = onCancel;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    box.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        cancel.current();
        return;
      }
      if (e.key !== "Tab" || !box.current) return;
      const items = Array.from(box.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      const active = document.activeElement;
      const outside = !box.current.contains(active);
      if (e.shiftKey && (active === items[0] || outside)) {
        e.preventDefault();
        items[items.length - 1].focus();
      } else if (!e.shiftKey && (active === items[items.length - 1] || outside)) {
        e.preventDefault();
        items[0].focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      opener?.focus?.();
    };
  }, []);

  return (
    <div className="modal" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="box" role="dialog" aria-modal="true" aria-labelledby={id} ref={box}>
        <h3 id={id}>{title}</h3>
        <p>{children}</p>
        <div className="acts">
          <button type="button" className="btn" data-autofocus onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className={`btn ${danger ? "danger" : "primary"}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
