"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

/**
 * A booking action that shows it is working, and asks twice before anything a
 * guest would notice. Cancel and No-show take a second tap within four seconds
 * instead of a dialog: a slip of the thumb on a busy floor should cost nothing.
 */
export function StatusButton({
  label,
  confirm,
  primary = false,
}: {
  label: string;
  /** Wording for the second tap. Without it the first tap acts. */
  confirm?: string;
  primary?: boolean;
}) {
  const { pending } = useFormStatus();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);

  const tone = armed ? " console-btn--alert" : primary ? " console-btn--primary" : "";

  return (
    <button
      className={`console-btn console-btn--sm${tone}`}
      disabled={pending}
      aria-busy={pending || undefined}
      onClick={(e) => {
        if (confirm && !armed) {
          e.preventDefault();
          setArmed(true);
        }
      }}
      onBlur={() => setArmed(false)}
    >
      {pending ? <span className="console-spin" aria-hidden /> : null}
      <span aria-live="polite">{pending ? "Saving" : armed ? confirm : label}</span>
    </button>
  );
}
