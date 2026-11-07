"use client";

import { useEffect, useRef, useState } from "react";
import type { ButtonHTMLAttributes, MouseEvent } from "react";
import { buttonStyles } from "@/components/ui";

/**
 * Two-step destructive-action button: first click arms it ("Confirm delete?"),
 * second click submits. Always renders a single type="submit" element — the
 * unarmed click calls preventDefault() instead of swapping the element, so a
 * retargeted click event can never submit on the first press. Disarms on
 * mouse-leave or after 4s. No window.confirm — dialogs block automation and
 * feel heavy on mobile.
 *
 * Visuals come from the design system's buttonStyles() (secondary → danger).
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

  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (!armed) {
      e.preventDefault();
      setArmed(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setArmed(false), 4000);
    }
  };

  return (
    <button
      type="submit"
      onClick={onClick}
      onMouseLeave={() => setArmed(false)}
      className={`${
        armed
          ? "inline-flex items-center justify-center rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-white hover:bg-destructive/90"
          : buttonStyles("secondary")
      } !h-auto ${className}`}
      {...props}
    >
      {armed ? confirmLabel : children}
    </button>
  );
}
