"use client";

import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../ui/button";
import { StateMark } from "../ui/state-mark";
import { brand, waitlist } from "@/lib/content";

const EASE = [0.22, 1, 0.36, 1] as const;

type Status = "idle" | "sending" | "done" | "error";

/**
 * The waitlist form.
 *
 * Two things it does that a default form would not.
 *
 * The branch picker is the same nine-item index the rest of the site is built
 * on, as toggles — so filling the form is the first time a reader handles the
 * product's actual shape, and what arrives on our end is already a shortlist
 * rather than a paragraph to interpret.
 *
 * And it never loses a lead. If the API answers 501 — nothing configured yet —
 * the submission is turned into a pre-filled email and the mail client opens.
 * The page says so plainly rather than showing a success state over a dropped
 * enquiry.
 */
export function WaitlistForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [branches, setBranches] = useState<string[]>([]);

  const toggle = (b: string) =>
    setBranches((cur) => (cur.includes(b) ? cur.filter((x) => x !== b) : [...cur, b]));

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;

    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      business: String(form.get("business") ?? ""),
      trade: String(form.get("trade") ?? ""),
      suburb: String(form.get("suburb") ?? ""),
      phone: String(form.get("phone") ?? ""),
      email: String(form.get("email") ?? ""),
      detail: String(form.get("detail") ?? ""),
      website: String(form.get("website") ?? ""), // honeypot
      branches,
    };

    setStatus("sending");
    setFields({});
    setMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        fields?: Record<string, string>;
        fallback?: boolean;
      };

      if (res.ok && data.ok) {
        setStatus("done");
        return;
      }

      if (data.fields) {
        setFields(data.fields);
        setMessage(data.error ?? "Check the fields below.");
        setStatus("error");
        return;
      }

      if (data.fallback) {
        // Nothing wired up yet — hand it to their mail client rather than
        // showing a success screen over a lead that went nowhere.
        const body = [
          `Name: ${payload.name}`,
          `Business: ${payload.business}`,
          `Trade: ${payload.trade}`,
          `Suburb: ${payload.suburb}`,
          `Phone: ${payload.phone}`,
          `Email: ${payload.email}`,
          `Branches: ${branches.join(", ") || "none picked"}`,
          "",
          payload.detail,
        ].join("\n");
        window.location.href = `mailto:${brand.email}?subject=${encodeURIComponent(
          `Waitlist: ${payload.business || payload.name}`,
        )}&body=${encodeURIComponent(body)}`;
        setStatus("done");
        return;
      }

      setMessage(data.error ?? waitlist.error);
      setStatus("error");
    } catch {
      setMessage(waitlist.error);
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <motion.div
        className="flex flex-col items-start gap-[18px]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <StateMark state="brief" size="lg" tone="light" />
        <h2 className="t-display max-w-[440px]">{waitlist.done.heading}</h2>
        <p className="t-body max-w-[440px]" style={{ color: "var(--ink-70)" }}>
          {waitlist.done.body}
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex w-full flex-col gap-[26px]">
      {/* Hidden to people, irresistible to bots. */}
      <div className="absolute h-0 w-0 overflow-hidden" aria-hidden>
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid grid-cols-1 gap-[26px] sm:grid-cols-2">
        <Field name="name" label="Your name" autoComplete="name" error={fields.name} required />
        <Field name="business" label="Business name" autoComplete="organization" error={fields.business} required />
        <Field name="trade" label="Trade" placeholder="Cafe, restaurant, studio" />
        <Field name="suburb" label="Suburb" placeholder="South Yarra" />
        <Field name="phone" label="Phone" type="tel" autoComplete="tel" error={fields.phone} />
        <Field name="email" label="Email" type="email" autoComplete="email" error={fields.email} />
      </div>

      <fieldset className="flex flex-col gap-[14px]">
        <legend
          className="font-mono uppercase"
          style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--ink-40)" }}
        >
          {waitlist.branchesLabel}
        </legend>
        <div className="flex flex-wrap gap-[8px]">
          {waitlist.branches.map((b, i) => {
            const on = branches.includes(b);
            return (
              <button
                key={b}
                type="button"
                onClick={() => toggle(b)}
                aria-pressed={on}
                className="flex items-center gap-[8px] transition-colors duration-300"
                style={{
                  borderRadius: 100,
                  padding: "8px 16px 8px 12px",
                  background: on ? "var(--ink)" : "transparent",
                  boxShadow: on ? "none" : "inset 0 0 0 1px var(--ink-20)",
                  color: on ? "#fff" : "var(--ink-60)",
                  fontSize: 13,
                  lineHeight: "18px",
                }}
              >
                <span
                  className="font-mono"
                  style={{ fontSize: 10, opacity: 0.6 }}
                >
                  {String(i + 1).padStart(3, "0")}
                </span>
                {b}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Field name="detail" label="Anything else worth knowing" textarea />

      <AnimatePresence>
        {status === "error" && message ? (
          <motion.p
            key="err"
            role="alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="t-body-sm"
            style={{ color: "var(--ink)" }}
          >
            {message}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <div className="flex flex-wrap items-center gap-[20px]">
        <Button type="submit" gap={30}>
          {status === "sending" ? waitlist.sending : waitlist.submit}
        </Button>
        <p className="t-label" style={{ color: "var(--ink-40)" }}>
          Or call {brand.phone}.
        </p>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
  autoComplete,
  error,
  required,
  textarea,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  required?: boolean;
  textarea?: boolean;
}) {
  const shared = {
    id: name,
    name,
    placeholder,
    autoComplete,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${name}-error` : undefined,
    className:
      "w-full bg-transparent pb-[10px] outline-none placeholder:text-[color:var(--ink-20)]",
    style: {
      fontSize: 16,
      lineHeight: "24px",
      borderBottom: `1px solid ${error ? "var(--ink)" : "var(--ink-20)"}`,
    } as React.CSSProperties,
  };

  return (
    <label htmlFor={name} className={`flex flex-col gap-[8px] ${textarea ? "col-span-full" : ""}`}>
      <span
        className="font-mono uppercase"
        style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--ink-40)" }}
      >
        {label}
        {required ? <span aria-hidden> *</span> : null}
      </span>
      {textarea ? (
        <textarea {...shared} rows={3} />
      ) : (
        <input {...shared} type={type} />
      )}
      {error ? (
        <span id={`${name}-error`} className="t-label" style={{ color: "var(--ink)" }}>
          {error}
        </span>
      ) : null}
    </label>
  );
}
