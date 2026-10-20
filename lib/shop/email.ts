/**
 * Emails a shop's client when the barber books them in or cancels from the
 * console. Online bookings are emailed by the shop's own booking site; this
 * covers the ones made here. Sent through Resend; with no key, nothing is sent
 * and nothing fails.
 */

export type ShopAppointmentEmail = {
  shopName: string;
  clientName: string;
  serviceName: string;
  startsAt: string;
  tz: string;
  address: string;
  contact: string;
};

export type Email = { subject: string; text: string; html: string };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** 'Tue 20 Oct, 10:00 am' in the shop's zone. */
function when(iso: string, tz: string): string {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat("en-AU", { timeZone: tz, weekday: "short", day: "numeric", month: "short" }).format(d);
  const time = new Intl.DateTimeFormat("en-AU", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true })
    .format(d)
    .replace(/\s?([ap])\.?m\.?/i, " $1m")
    .toLowerCase();
  return `${day.replace(",", "")}, ${time}`;
}

export function shopEmail(kind: "booked" | "cancelled", a: ShopAppointmentEmail): Email {
  const at = when(a.startsAt, a.tz);
  const subject =
    kind === "booked" ? `Your ${a.serviceName} at ${a.shopName} is booked for ${at}` : `Your ${a.serviceName} at ${a.shopName} on ${at} is cancelled`;
  const lines =
    kind === "booked"
      ? [`You're booked in, ${a.clientName}.`, `${a.serviceName} at ${a.shopName}, ${at}.`, a.address, a.contact]
      : [`Your appointment is cancelled, ${a.clientName}.`, `${a.serviceName} at ${a.shopName}, ${at}.`, a.contact];
  const [first, ...rest] = lines;
  const html =
    `<div style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#141e28;max-width:520px">` +
    `<p style="margin:0 0 16px;font-size:22px;font-weight:600;letter-spacing:-0.02em">${esc(first)}</p>` +
    rest.map((l) => `<p style="margin:0 0 12px">${esc(l)}</p>`).join("") +
    `</div>`;
  return { subject, text: lines.join("\n\n"), html };
}

export async function sendShopEmail(
  to: string | null,
  msg: Email,
  env: Record<string, string | undefined> = process.env,
  fetcher: typeof fetch = fetch,
): Promise<"sent" | "skipped" | "failed"> {
  const key = env.RESEND_API_KEY;
  const from = env.SHOP_FROM_EMAIL;
  if (!key || !from || !to) return "skipped";
  try {
    const res = await fetcher("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject: msg.subject, text: msg.text, html: msg.html }),
    });
    return res.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}
