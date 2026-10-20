import type { ShopBlock, ShopBooking } from "./types.ts";

/**
 * The shop calendar's day, in the shop's own wall clock. Pure, so the layout
 * maths (and the daylight-saving days) are tested without a browser.
 */

const parts = (d: Date, tz: string) => {
  const f = new Intl.DateTimeFormat("en-AU", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => Number(f.find((p) => p.type === t)?.value);
  return { y: get("year"), m: get("month"), d: get("day"), h: get("hour"), min: get("minute") };
};

/** Minutes the zone is ahead of UTC at instant `t`. */
function offsetAt(t: number, tz: string): number {
  const p = parts(new Date(t), tz);
  return (Date.UTC(p.y, p.m - 1, p.d, p.h, p.min) - Math.floor(t / 60_000) * 60_000) / 60_000;
}

/** The instant a wall-clock time happens in the zone. */
export function zonedTime(date: string, hhmm: string, tz: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = hhmm.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, h, min);
  // Two passes settle the offset either side of a clock change.
  const first = guess - offsetAt(guess, tz) * 60_000;
  return new Date(guess - offsetAt(first, tz) * 60_000);
}

/** Midnight to the next midnight; 23 or 25 hours on clock-change days. */
export function dayBounds(date: string, tz: string): { from: Date; to: Date } {
  const [y, m, d] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
  return { from: zonedTime(date, "00:00", tz), to: zonedTime(next, "00:00", tz) };
}

/** 'YYYY-MM-DD' of an instant in the zone. */
export function zonedDate(t: Date, tz: string): string {
  const p = parts(t, tz);
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

/** Minutes past local midnight. */
export function zonedMinutes(t: Date | string, tz: string): number {
  const p = parts(typeof t === "string" ? new Date(t) : t, tz);
  return p.h * 60 + p.min;
}

export const clock = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export type DayItem = {
  id: string;
  kind: "booking" | "block";
  /** Minutes from the top of the timeline. */
  top: number;
  height: number;
  label: string;
  sub: string;
  status?: ShopBooking["status"];
};

export function layoutDay(
  bookings: ShopBooking[],
  blocks: ShopBlock[],
  hours: [string, string] | null,
  tz: string,
): { startMin: number; endMin: number; items: (DayItem & { startMin: number; endMin: number })[] } {
  const spans = [
    ...bookings.map((b) => ({
      id: b.id,
      kind: "booking" as const,
      s: zonedMinutes(b.startsAt, tz),
      e: zonedMinutes(b.endsAt, tz) || 24 * 60,
      label: `${clock(zonedMinutes(b.startsAt, tz))} ${b.customer.name}`,
      sub: b.serviceName,
      status: b.status,
    })),
    ...blocks.map((k) => ({
      id: k.id,
      kind: "block" as const,
      s: zonedMinutes(k.startsAt, tz),
      e: zonedMinutes(k.endsAt, tz) || 24 * 60,
      label: k.reason || "Blocked",
      sub: "",
      status: undefined,
    })),
  ].sort((a, b) => a.s - b.s);

  let start = hours ? toMin(hours[0]) : null;
  let end = hours ? toMin(hours[1]) : null;
  for (const x of spans) {
    start = start === null ? x.s : Math.min(start, x.s);
    end = end === null ? x.e : Math.max(end, x.e);
  }
  const startMin = start === null ? 8 * 60 : Math.floor(start / 60) * 60;
  const endMin = end === null ? 20 * 60 : Math.ceil(end / 60) * 60;

  return {
    startMin,
    endMin,
    items: spans.map((x) => ({
      id: x.id,
      kind: x.kind,
      top: x.s - startMin,
      height: x.e - x.s,
      label: x.label,
      sub: x.sub,
      ...(x.status ? { status: x.status } : {}),
      startMin: x.s,
      endMin: x.e,
    })),
  };
}
