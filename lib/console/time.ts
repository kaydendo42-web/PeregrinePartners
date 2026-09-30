/**
 * Venue-local time. A console runs on a server in UTC and a browser anywhere;
 * a 9am booking belongs to the day it is 9am *at the venue*. Everything here
 * takes the venue's IANA zone and never the machine's.
 */

export type DateKey = string; // YYYY-MM-DD, venue-local

/** Offset of `tz` from UTC at an instant, in minutes (Melbourne: +600 or +660). */
function offsetMinutes(at: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(n("year"), n("month") - 1, n("day"), n("hour"), n("minute"), n("second"));
  return Math.round((asUtc - at.getTime()) / 60_000);
}

/** A wall-clock date and time at the venue → the instant it names. */
export function zoned(date: DateKey, time: string, tz: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm));
  // Two passes settle the offset across a daylight-saving change.
  let at = new Date(guess.getTime() - offsetMinutes(guess, tz) * 60_000);
  at = new Date(guess.getTime() - offsetMinutes(at, tz) * 60_000);
  return at;
}

/** The venue-local day an instant falls on. */
export function dateKeyOf(at: Date, tz: string): DateKey {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
}

export function todayKey(tz: string): DateKey {
  return dateKeyOf(new Date(), tz);
}

export function addDays(key: DateKey, days: number): DateKey {
  const [y, m, d] = key.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return t.toISOString().slice(0, 10);
}

/** [start, end) of a venue-local day, as instants. */
export function dayRange(key: DateKey, tz: string): [Date, Date] {
  return [zoned(key, "00:00", tz), zoned(addDays(key, 1), "00:00", tz)];
}

export function timeLabel(at: Date | string, tz: string): string {
  return new Intl.DateTimeFormat("en-AU", { timeZone: tz, hour: "numeric", minute: "2-digit" })
    .format(new Date(at))
    .replace(/\s/g, "")
    .toLowerCase();
}

/** Minutes since venue-local midnight. */
export function minutesOfDay(at: Date | string, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(at));
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return n("hour") * 60 + n("minute");
}

export function dayLabel(key: DateKey, style: "long" | "short" = "long"): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "UTC",
    weekday: style,
    day: "numeric",
    month: style === "long" ? "long" : "short",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function isDateKey(v: unknown): v is DateKey {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}
