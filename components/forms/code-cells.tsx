"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Six boxes for an authenticator code. Underneath is one real input, so paste,
 * the phone's one-time-code autofill and screen readers all behave as they
 * would on a plain field; the boxes only draw it. Six digits submits on its own.
 */
export function CodeCells({
  name,
  invalid = false,
  onComplete,
}: {
  name: string;
  invalid?: boolean;
  onComplete?: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(true);

  useEffect(() => {
    if (value.length === 6) onComplete?.();
  }, [value, onComplete]);

  return (
    <div className="code-cells" data-invalid={invalid || undefined}>
      <input
        ref={ref}
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        required
        autoFocus
        aria-label="Six-digit code"
        aria-invalid={invalid || undefined}
        className="code-cells__input"
      />
      {Array.from({ length: 6 }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="code-cells__cell"
          data-filled={value[i] ? true : undefined}
          data-active={focused && i === Math.min(value.length, 5) ? true : undefined}
        >
          {value[i] ?? ""}
        </span>
      ))}
    </div>
  );
}
