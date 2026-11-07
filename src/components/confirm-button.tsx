"use client";

import { useEffect, useRef, useState } from "react";
import type { ButtonHTMLAttributes } from "react";

/**
 * Two-step destructive-action button: first click arms it ("Confirm delete?"),
 * second click submits the surrounding form. Disarms on blur or after 4s.
 * No window.confirm — dialogs block automation and feel heavy on mobile.
 */
export function ConfirmSubmit({
  children,
  confirmLabel = "Confirm delete?",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { confirmLabel?: string }) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  if (armed) {
    return (
      <button
        type="submit"
        className={`inline-flex items-center justify-center rounded-md bg-[var(--danger)] px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 ${className}`}
        onMouseLeave={() => setArmed(false)}
        {...props}
      >
        {confirmLabel}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-md border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50 ${className}`}
      onClick={() => {
        setArmed(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setArmed(false), 4000);
      }}
      {...props}
    >
      {children}
    </button>
  );
}
