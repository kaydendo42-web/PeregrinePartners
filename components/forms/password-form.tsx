"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "../ui/button";
import { AuthProgress } from "./auth-progress";
import { signInPassword as copy } from "@/lib/content";
import { setPassword, type PasswordState } from "@/app/sign-in/actions";

/**
 * New password, typed twice. The hidden email field is there for password
 * managers, so the saved entry carries the right account name.
 */
export function PasswordForm({
  project,
  next,
  email,
}: {
  project: "booking" | "internal";
  next: string;
  email?: string;
}) {
  const [state, action, pending] = useActionState<PasswordState, FormData>(
    setPassword,
    {},
  );

  return (
    <form action={action}>
      <fieldset
        disabled={pending}
        className="flex flex-col items-start gap-[24px] transition-opacity duration-300"
        style={{ opacity: pending ? 0.55 : 1 }}
      >
        <input type="hidden" name="project" value={project} />
        <input type="hidden" name="next" value={next} />
        <input
          type="email"
          name="username"
          autoComplete="username"
          value={email ?? ""}
          readOnly
          hidden
        />

        <Field id="password-new" label={copy.label}>
          <input
            id="password-new"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className={inputClass}
            style={inputStyle}
          />
        </Field>
        <Field id="password-again" label={copy.again}>
          <input
            id="password-again"
            name="again"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className={inputClass}
            style={inputStyle}
          />
        </Field>

        {state.error ? (
          <p className="t-body" style={{ color: "#f2a7a7" }} role="alert">
            {state.error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-[20px]">
          <Button type="submit" variant="light" gap={30}>
            {pending ? copy.saving : copy.submit}
          </Button>
          {pending ? null : (
            <Link href={next} className={linkClass}>
              {copy.skip}
            </Link>
          )}
        </div>
      </fieldset>
      {pending ? (
        <div className="mt-[28px]">
          <AuthProgress text={copy.saving} />
        </div>
      ) : null}
    </form>
  );
}

const linkClass =
  "t-label text-white/60 underline underline-offset-[4px] transition-colors duration-300 hover:text-white";

const inputClass =
  "w-full bg-transparent pb-[12px] text-white outline-none placeholder:text-white/25";

const inputStyle = {
  fontSize: 18,
  lineHeight: "26px",
  borderBottom: "1px solid var(--paper-20)",
};

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={id} className="flex w-full flex-col gap-[10px]">
      <span
        className="t-mono-xs font-mono uppercase"
        style={{ color: "var(--paper-40)" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
