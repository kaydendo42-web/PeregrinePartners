/**
 * The working state between sign-in steps: a hairline that runs while the
 * server checks, with the step in words beside it. Announced to screen readers.
 */
export function AuthProgress({ text }: { text: string }) {
  return (
    <div className="auth-progress" role="status">
      <span className="auth-progress__track" aria-hidden>
        <span className="auth-progress__run" />
      </span>
      <span className="t-mono-xs font-mono uppercase text-white/70">{text}</span>
    </div>
  );
}
