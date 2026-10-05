"use client";

import { useActionState, useCallback, useRef } from "react";
import { signInVerify } from "@/lib/content";
import { verifyCode, type VerifyState } from "@/app/sign-in/actions";
import { AuthProgress } from "./auth-progress";
import { CodeCells } from "./code-cells";

/**
 * The code step of two-step sign-in, for first-time setup and every sign-in
 * after. There is no submit button to find: the sixth digit sends it. A wrong
 * code clears the boxes so the next try starts clean.
 */
export function VerifyForm({ factorId, next }: { factorId: string; next: string }) {
  // Counting tries here, not on the server: each failed try remounts the boxes empty.
  const [state, action, pending] = useActionState<VerifyState & { tries: number }, FormData>(
    async (prev, data) => ({ ...(await verifyCode(prev, data)), tries: prev.tries + 1 }),
    { tries: 0 },
  );
  const form = useRef<HTMLFormElement>(null);

  const submit = useCallback(() => form.current?.requestSubmit(), []);

  return (
    <form ref={form} action={action} className="flex flex-col items-start gap-[20px]">
      <input type="hidden" name="factor" value={factorId} />
      <input type="hidden" name="next" value={next} />

      <fieldset disabled={pending} className="w-full transition-opacity duration-300" style={{ opacity: pending ? 0.5 : 1 }}>
        <legend className="sr-only">{signInVerify.label}</legend>
        <CodeCells key={state.tries} name="code" invalid={Boolean(state.error)} onComplete={submit} />
      </fieldset>

      {pending ? (
        <AuthProgress text={signInVerify.checking} />
      ) : state.error ? (
        <p className="t-body" style={{ color: "#f2a7a7" }} role="alert">
          {state.error}
        </p>
      ) : (
        <p className="t-label text-white/60">{signInVerify.hint}</p>
      )}
    </form>
  );
}
