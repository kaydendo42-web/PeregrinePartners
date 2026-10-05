"use client";

import { useState } from "react";

/** The setup key, readable in fours, with a copy button for setting up on the same phone. */
export function CopyKey({ secret }: { secret: string }) {
  const [copied, setCopied] = useState(false);
  const grouped = secret.match(/.{1,4}/g)?.join(" ") ?? secret;
  return (
    <div className="flex w-full flex-col gap-[8px]">
      <code className="font-mono text-[13px] leading-[20px] tracking-[0.08em] text-[color:var(--ink)]" style={{ wordBreak: "break-word" }}>
        {grouped}
      </code>
      <button
        type="button"
        className="t-label self-start text-[color:var(--ink-60)] underline underline-offset-[4px] transition-colors duration-200 hover:text-[color:var(--ink)]"
        onClick={async () => {
          await navigator.clipboard.writeText(secret);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        <span aria-live="polite">{copied ? "Copied" : "Copy key"}</span>
      </button>
    </div>
  );
}
