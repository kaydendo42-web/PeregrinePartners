"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { Button } from "../ui/button";
import { signIn } from "@/lib/content";

/**
 * Sign in.
 *
 * The answer is deliberately the same for every address, including ones that
 * have never been near an account. Saying "no account found" would let anyone
 * type a rival's email address and learn whether that venue is a customer of
 * ours — which is a disclosure we have no right to make about a business that
 * trusted us with its books.
 *
 * There is nothing to send yet, so nothing is sent. The message is honest
 * about being a holding pattern rather than pretending a link is in flight.
 */
export function SignInForm() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
  }

  if (sent) {
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
        <Link
          href={signIn.alt.href}
          className="t-label text-white/60 underline underline-offset-[4px] transition-colors duration-300 hover:text-white"
        >
          {signIn.alt.label}
        </Link>
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col items-start gap-[24px]">
      <label htmlFor="signin-email" className="flex w-full flex-col gap-[10px]">
        <span
          className="t-mono-xs font-mono uppercase"
          style={{ color: "var(--paper-40)" }}
        >
          Email address
        </span>
        <input
          id="signin-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourbusiness.com.au"
          className="w-full bg-transparent pb-[12px] text-white outline-none placeholder:text-white/25"
          style={{ fontSize: 18, lineHeight: "26px", borderBottom: "1px solid var(--paper-20)" }}
        />
      </label>

      <div className="flex flex-wrap items-center gap-[20px]">
        <Button type="submit" variant="light" gap={30}>
          {signIn.submit}
        </Button>
        <Link
          href={signIn.alt.href}
          className="t-label text-white/60 underline underline-offset-[4px] transition-colors duration-300 hover:text-white"
        >
          {signIn.alt.label}
        </Link>
      </div>
    </form>
  );
}
