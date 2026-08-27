/**
 * Waitlist intake.
 *
 * Runs server-side so the Telegram bot token and mail API key stay off the
 * page. Calling Telegram straight from the browser would publish the token to
 * anyone who opened devtools and let them post as the bot.
 *
 * Configure either or both (Vercel → Project → Settings → Environment
 * Variables), or with `vercel env add`:
 *
 *   TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID   → instant message on your phone
 *   RESEND_API_KEY + WAITLIST_TO            → email, optionally WAITLIST_FROM
 *
 * With neither set the endpoint answers 501 with `fallback: true`, and the
 * form opens a pre-filled email instead. A lead is never silently dropped —
 * which is the only requirement that actually matters here, because the cost
 * of losing one at this stage is a quarter of the customer base.
 */

const LIMITS = {
  name: 80,
  business: 120,
  trade: 80,
  suburb: 80,
  phone: 40,
  email: 120,
  detail: 1200,
};

const clean = (v: unknown, max: number) =>
  typeof v === "string"
    ? v
        // Strip control characters so nothing can inject line breaks into the
        // Telegram message or the mail headers.
        .replace(/[\u0000-\u001F\u007F]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max)
    : "";

/** Deliberately permissive: catch typos, do not adjudicate RFC 5322. */
const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

type Lead = {
  name: string;
  business: string;
  trade: string;
  suburb: string;
  phone: string;
  email: string;
  departments: string[];
  detail: string;
};

const summary = (lead: Lead) =>
  `Name:     ${lead.name}\n` +
  `Business: ${lead.business}\n` +
  `Trade:    ${lead.trade}\n` +
  `Suburb:   ${lead.suburb}\n` +
  `Phone:    ${lead.phone}\n` +
  `Email:    ${lead.email}\n` +
  `Departments: ${lead.departments.join(", ") || "none"}\n` +
  (lead.detail ? `\nNotes:\n${lead.detail}\n` : "");

async function notifyTelegram(lead: Lead) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  // Plain text, no parse_mode: submitted values cannot be read as markup.
  const text =
    `New waitlist request\n\n` +
    summary(lead) +
    `\nTime:     ${new Date().toLocaleString("en-AU", { timeZone: "Australia/Melbourne" })}`;

  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  });
  if (!r.ok) throw new Error(`telegram ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return true;
}

async function notifyEmail(lead: Lead) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.WAITLIST_TO;
  if (!key || !to) return false;

  const esc = (s: string) =>
    s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c] as string);

  const row = (k: string, v: string) => `<b>${k}:</b> ${esc(v)}<br>`;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: process.env.WAITLIST_FROM || "Peregrine Partners <onboarding@resend.dev>",
      to: [to],
      reply_to: lead.email || undefined,
      subject: `Waitlist: ${lead.business || lead.name}`,
      html:
        `<h2>New waitlist request</h2><p>` +
        row("Name", lead.name) +
        row("Business", lead.business) +
        row("Trade", lead.trade) +
        row("Suburb", lead.suburb) +
        row("Phone", lead.phone) +
        row("Email", lead.email) +
        row("Departments", lead.departments.join(", ") || "none") +
        `</p>` +
        (lead.detail ? `<p>${esc(lead.detail)}</p>` : ""),
    }),
  });
  if (!r.ok) throw new Error(`resend ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return true;
}

export async function POST(request: Request) {
  let body: Record<string, unknown> | null = null;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = null;
  }
  if (!body || typeof body !== "object") {
    return Response.json({ error: "That didn't come through. Please try again." }, { status: 400 });
  }

  // Honeypot: hidden to people, irresistible to bots. Accept and discard.
  if (clean(body.website, 200)) return Response.json({ ok: true });

  const lead: Lead = {
    name: clean(body.name, LIMITS.name),
    business: clean(body.business, LIMITS.business),
    trade: clean(body.trade, LIMITS.trade),
    suburb: clean(body.suburb, LIMITS.suburb),
    phone: clean(body.phone, LIMITS.phone),
    email: clean(body.email, LIMITS.email),
    departments: Array.isArray(body.departments)
      ? body.departments.map((d) => clean(d, 60)).filter(Boolean).slice(0, 12)
      : [],
    detail: clean(body.detail, LIMITS.detail),
  };

  /* Phone is the field that matters for this audience, so either a phone
     number or an email will do. Insisting on both costs completions for no
     gain when one of the three of us rings them back either way. */
  const fields: Record<string, string> = {};
  if (!lead.name) fields.name = "Please tell us your name.";
  if (!lead.business) fields.business = "Which business is this for?";
  if (!lead.phone && !lead.email) {
    fields.phone = "A phone number or an email, whichever you prefer.";
  } else if (lead.email && !looksLikeEmail(lead.email)) {
    fields.email = "That email address looks off.";
  }
  if (Object.keys(fields).length) {
    return Response.json({ error: "Check the fields below.", fields }, { status: 400 });
  }

  const results = await Promise.allSettled([notifyTelegram(lead), notifyEmail(lead)]);
  const delivered = results.some((r) => r.status === "fulfilled" && r.value === true);
  const failures = results.filter((r) => r.status === "rejected");

  for (const f of failures) console.error("waitlist delivery failed:", f.reason);

  if (delivered) return Response.json({ ok: true });

  if (failures.length) {
    // Configured but broken, so say so rather than pretending it worked.
    console.error("waitlist: all configured channels failed", lead);
    return Response.json({ error: "We couldn't record that just now." }, { status: 502 });
  }

  // Nothing configured yet. The client falls back to a pre-filled email.
  console.warn("waitlist: no delivery channel configured", lead);
  return Response.json({ error: "No delivery channel configured.", fallback: true }, { status: 501 });
}
