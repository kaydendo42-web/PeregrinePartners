"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { motion } from "motion/react";
import { Button } from "../ui/button";
import { signIn } from "@/lib/content";
import { sendSignInLink, signInWithPassword, type SignInState } from "@/app/sign-in/actions";

/**
 * Console sign-in. Email and password by default, because that is how the
 * booking system a venue is leaving signs them in; a one-time link for anyone
 * who would rather not keep a password.
 *
 * Neither path says whether an address is known. A form that tells "no such
 * account" apart from "wrong password" would let anyone type a rival's email
 * address and learn whether that venue is a customer of ours.
 */
export function SignInForm({ next, linkExpired }: { next?: string; linkExpired?: boolean }) {
  const [mode, setMode] = useState<"password" | "link">("password");
  const [pwState, pwAction, pwPending] = useActionState<SignInState, FormData>(signInWithPassword, {});
  const [linkState, linkAction, linkPending] = useActionState<SignInState, FormData>(sendSignInLink, {});

  const pending = mode === "password" ? pwPending : linkPending;
  const state = mode === "password" ? pwState : linkState;

  if (mode === "link" && linkState.sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-start gap-[24px]"
      >
        <p className="t-body text-white" role="status">
          {signIn.done}
        </p>
        <button type="button" className={linkClass} onClick={() => setMode("password")}>
          Use my password instead
        </button>
      </motion.div>
    );
  }

  return (
    <form action={mode === "password" ? pwAction : linkAction}>
      <fieldset disabled={pending} className="flex flex-col items-start gap-[24px]">
        <input type="hidden" name="next" value={next ?? "/console"} />

        {linkExpired ? (
          <p className="t-body text-white/80" role="status">
            That link has expired. Sign in below, or ask for a new one.
          </p>
        ) : null}

        <Field id="signin-email" label="Email address">
          <input
            id="signin-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@yourvenue.com.au"
            className={inputClass}
            style={inputStyle}
          />
        </Field>

        {mode === "password" ? (
          <Field id="signin-password" label="Password">
            <input
              id="signin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={inputClass}
              style={inputStyle}
            />
          </Field>
        ) : null}

        {state.error ? (
          <p className="t-body" style={{ color: "#f2a7a7" }} role="alert">
            {state.error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-[20px]">
          <Button type="submit" variant="light" gap={30}>
            {pending
              ? mode === "password"
                ? signIn.signingIn
                : signIn.sending
              : mode === "password"
                ? signIn.submit
                : signIn.submitLink}
          </Button>
          <button
            type="button"
            className={linkClass}
            onClick={() => setMode(mode === "password" ? "link" : "password")}
          >
            {mode === "password" ? "Email me a link instead" : "Use my password"}
          </button>
        </div>

        <Link href={signIn.alt.href} className={linkClass}>
          {signIn.alt.label}
        </Link>
      </fieldset>
    </form>
  );
}

const linkClass =
  "t-label text-white/60 underline underline-offset-[4px] transition-colors duration-300 hover:text-white";

const inputClass = "w-full bg-transparent pb-[12px] text-white outline-none placeholder:text-white/25";

const inputStyle = { fontSize: 18, lineHeight: "26px", borderBottom: "1px solid var(--paper-20)" };

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <label htmlFor={id} className="flex w-full flex-col gap-[10px]">
      <span className="t-mono-xs font-mono uppercase" style={{ color: "var(--paper-40)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}
