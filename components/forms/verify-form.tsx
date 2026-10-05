"use client";

import { useActionState } from "react";
import { Button } from "../ui/button";
import { signInVerify } from "@/lib/content";
import { verifyCode, type VerifyState } from "@/app/sign-in/actions";

/**
 * The code box for two-step sign-in, used both when setting up an
 * authenticator app and on every sign-in after. Styled to match SignInForm.
 */
export function VerifyForm({ factorId, next }: { factorId: string; next: string }) {
  const [state, action, pending] = useActionState<VerifyState, FormData>(verifyCode, {});

  return (
    <form action={action}>
      <fieldset disabled={pending} className="flex flex-col items-start gap-[24px]">
        <input type="hidden" name="factor" value={factorId} />
        <input type="hidden" name="next" value={next} />

        <label htmlFor="verify-code" className="flex w-full flex-col gap-[10px]">
          <span className="t-mono-xs font-mono uppercase" style={{ color: "var(--paper-40)" }}>
            {signInVerify.label}
          </span>
          <input
            id="verify-code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]{6,7}"
            maxLength={7}
            required
            autoFocus
            placeholder="123 456"
            className="w-full bg-transparent pb-[12px] text-white outline-none placeholder:text-white/25"
            style={{ fontSize: 26, lineHeight: "32px", letterSpacing: "0.2em", borderBottom: "1px solid var(--paper-20)" }}
          />
        </label>

        {state.error ? (
          <p className="t-body" style={{ color: "#f2a7a7" }} role="alert">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" variant="light" gap={30}>
          {pending ? signInVerify.checking : signInVerify.submit}
        </Button>
      </fieldset>
    </form>
  );
}
