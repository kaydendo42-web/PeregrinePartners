import { zonedTime } from "./day.ts";
import type { ShopBlock, ShopBooking, ShopService } from "./types.ts";

/**
 * The owner's own bookings and blocks, checked before the write. The owner may
 * book any quarter hour, in or out of hours (Booksy lets the shop override its
 * own schedule); what they can't do is double-book or book into blocked time.
 * The database's exclusion constraint is still the final word on overlaps.
 */

const QUARTER = /^([01]\d|2[0-3]):(00|15|30|45)$/;
const overlaps = (s1: number, e1: number, s2: number, e2: number) => s1 < e2 && s2 < e1;

export type Planned = { ok: true; startsAt: string; endsAt: string; blockedUntil: string } | { ok: false; error: string };

export function planBooking(
  input: { service: ShopService; date: string; time: string; tz: string; bufferMinutes: number },
  existing: ShopBooking[],
  blocks: ShopBlock[],
): Planned {
  if (!QUARTER.test(input.time)) return { ok: false, error: "Pick a time on the quarter hour." };
  const start = zonedTime(input.date, input.time, input.tz).getTime();
  const end = start + input.service.durationMin * 60_000;
  const held = end + input.bufferMinutes * 60_000;

  const taken = existing.some(
    (b) => b.status === "confirmed" && overlaps(start, held, Date.parse(b.startsAt), Date.parse(b.blockedUntil)),
  );
  if (taken) return { ok: false, error: "That time is taken." };
  if (blocks.some((k) => overlaps(start, end, Date.parse(k.startsAt), Date.parse(k.endsAt)))) {
    return { ok: false, error: "That's in blocked time." };
  }
  return {
    ok: true,
    startsAt: new Date(start).toISOString(),
    endsAt: new Date(end).toISOString(),
    blockedUntil: new Date(held).toISOString(),
  };
}

export function planBlock(
  input: { date: string; from: string; to: string; tz: string },
  existing: ShopBooking[],
): { ok: true; startsAt: string; endsAt: string } | { ok: false; error: string } {
  if (!QUARTER.test(input.from) || !QUARTER.test(input.to)) return { ok: false, error: "Pick times on the quarter hour." };
  const start = zonedTime(input.date, input.from, input.tz).getTime();
  const end = zonedTime(input.date, input.to, input.tz).getTime();
  if (end <= start) return { ok: false, error: "End after you start." };
  const clash = existing.some(
    (b) => b.status === "confirmed" && overlaps(start, end, Date.parse(b.startsAt), Date.parse(b.blockedUntil)),
  );
  if (clash) return { ok: false, error: "There's an appointment in that time." };
  return { ok: true, startsAt: new Date(start).toISOString(), endsAt: new Date(end).toISOString() };
}

/** E.164, Australian numbers assumed without a country code. The same rules as the V Barbers booking page. */
export function normalisePhone(raw: string): string | null {
  const s = String(raw ?? "").trim();
  if (!/^[+\d\s().-]+$/.test(s)) return null;
  const digits = s.replace(/\D/g, "");
  let e164: string;
  if (s.startsWith("+")) e164 = `+${digits}`;
  else if (digits.startsWith("61") && digits.length === 11) e164 = `+${digits}`;
  else if (digits.startsWith("0") && digits.length === 10) e164 = `+61${digits.slice(1)}`;
  else return null;
  if (e164.startsWith("+61")) return /^\+61[2-478]\d{8}$/.test(e164) ? e164 : null;
  return /^\+[1-9]\d{7,14}$/.test(e164) ? e164 : null;
}
