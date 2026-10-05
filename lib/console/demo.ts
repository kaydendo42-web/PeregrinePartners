import { readFileSync } from "node:fs";
import path from "node:path";
import type { Booking, Combination, Customer, Section, Venue, VenueTable } from "./data";
import { addDays, todayKey, zoned } from "./time";

/**
 * Development-only stand-in for Supabase, so the console can be looked at
 * before a database exists. On only when PEREGRINE_CONSOLE_DEMO=1 and never in
 * production. The floor is The Peacock's real one, read from the seed; the
 * bookings are invented, and nothing written is kept.
 */
export function demoOn(): boolean {
  return process.env.PEREGRINE_CONSOLE_DEMO === "1" && process.env.NODE_ENV !== "production";
}

const seed = () => readFileSync(path.join(process.cwd(), "supabase/seed/peacock.sql"), "utf8");

export const demoVenue: Venue = {
  id: "fb19b599-8b90-4576-b84a-1ff0f4eb1f7e",
  slug: "the-peacock",
  name: "The Peacock South Yarra",
  timezone: "Australia/Melbourne",
  website_url: "http://localhost:3000",
  booking_url: "http://localhost:3000/book-a-table",
  phone: "03 8596 2342",
  notify_bookings: false,
  notify_email: null,
};

export function demoFloor(): { sections: Section[]; tables: VenueTable[]; combinations: Combination[] } {
  const sql = seed();
  const sections = [...sql.matchAll(/into public\.sections .*? values \('[^']+', '([^']+)', '([^']+)', (\d+), (true|false)\)/g)].map(
    (m) => ({ id: m[1], name: m[2], sort: Number(m[3]), indoor: m[4] === "true" }),
  );
  const tables = [
    ...sql.matchAll(
      /into public\.venue_tables .*? values \('[^']+', '([^']+)', '([^']+)', '([^']+)', (\d+), (\d+), (\d+), '([^']+)', ([\d.]+), ([\d.]+), ([\d.]+), ([\d.]+), (\d+)\)/g,
    ),
  ]
    .map((m) => ({
      id: m[1],
      label: m[2],
      section_id: m[3],
      seats: Number(m[4]),
      seats_min: Number(m[5]),
      priority: Number(m[6]),
      shape: m[7] as VenueTable["shape"],
      x: Number(m[8]),
      y: Number(m[9]),
      w: Number(m[10]),
      d: Number(m[11]),
      rot: Number(m[12]),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "en", { numeric: true }));
  const combinations = [
    ...sql.matchAll(/into public\.table_combinations .*? values \('[^']+', '([^']+)', array\[([^\]]+)\], (\d+), (\d+), (\d+)\)/g),
  ].map((m) => ({
    id: m[1],
    table_ids: [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1]),
    seats_min: Number(m[3]),
    seats_max: Number(m[4]),
    priority: Number(m[5]),
  }));
  return { sections, tables, combinations };
}

const NAMES = [
  ["Sophie Tran", "0412 555 101"], ["Marcus Lee", "0413 555 102"], ["Olivia Brown", "0414 555 103"],
  ["James Nguyen", "0415 555 104"], ["Chloe Martin", "0416 555 105"], ["Ethan Wilson", "0417 555 106"],
  ["Grace Kelly", "0418 555 107"], ["Noah Patel", "0419 555 108"], ["Ruby Clarke", "0420 555 109"],
  ["Lachlan Smith", "0421 555 110"], ["Mia Chen", "0422 555 111"], ["Harry Jones", "0423 555 112"],
];
const NOTES = [null, null, "Dog on the deck", "Birthday — candle on the hotcakes", null, "High chair", null, "Gluten free"];
const SOURCES = ["website", "website", "website", "phone", "resos", "walk_in"];

/** A believable fortnight: busy weekends, a steady weekday trickle, a few already seated today. */
export function demoBookings(): Booking[] {
  const { tables } = demoFloor();
  const tz = demoVenue.timezone;
  const today = todayKey(tz);
  const out: Booking[] = [];
  let n = 0;
  for (let day = -3; day <= 10; day++) {
    const key = addDays(today, day);
    const weekend = [0, 6].includes(new Date(`${key}T00:00:00Z`).getUTCDay());
    const count = weekend ? 16 : 7;
    for (let i = 0; i < count; i++) {
      n++;
      const table = tables[(((n * 7 + day * 3) % tables.length) + tables.length) % tables.length];
      const slot = (((i * 5 + day) % 14) + 14) % 14; // 7:30 through 14:00 in half-hours
      const minutes = 7 * 60 + 30 + slot * 30;
      const time = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
      const party = Math.min(table.seats, 1 + ((n * 3) % 4) + (table.seats > 4 ? 2 : 0));
      const duration = party >= 5 ? 90 : 75;
      const start = zoned(key, time, tz);
      const clash = out.some(
        (b) => b.table_id === table.id && Math.abs(new Date(b.starts_at).getTime() - start.getTime()) < 90 * 60_000,
      );
      if (clash) continue;
      const [name, phone] = NAMES[n % NAMES.length];
      const past = start.getTime() < Date.now();
      out.push({
        id: `PK-DEMO${String(n).padStart(2, "0")}`,
        table_id: n % 13 === 0 ? null : table.id,
        starts_at: start.toISOString(),
        ends_at: new Date(start.getTime() + (duration + 15) * 60_000).toISOString(),
        duration_min: duration,
        party_size: party,
        guest_name: name,
        phone,
        email: `${name.split(" ")[0].toLowerCase()}@example.com`,
        notes: NOTES[n % NOTES.length],
        status: n % 17 === 0 ? "cancelled" : past && day === 0 ? "seated" : n % 23 === 0 && past ? "no_show" : "confirmed",
        source: SOURCES[n % SOURCES.length],
      });
    }
  }
  return out.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}

export function demoCustomers(query?: string): Customer[] {
  const byKey = new Map<string, Customer>();
  for (const b of demoBookings()) {
    const c = byKey.get(b.email) ?? {
      key: b.email, name: b.guest_name, email: b.email, phone: b.phone, visits: 0, no_shows: 0,
      cancellations: 0, first_visit: b.starts_at, last_visit: b.starts_at,
    };
    if (b.status === "confirmed" || b.status === "seated") c.visits++;
    if (b.status === "no_show") c.no_shows++;
    if (b.status === "cancelled") c.cancellations++;
    if (b.starts_at > c.last_visit) c.last_visit = b.starts_at;
    if (b.starts_at < c.first_visit) c.first_visit = b.starts_at;
    byKey.set(b.email, c);
  }
  const q = query?.toLowerCase();
  return [...byKey.values()]
    .filter((c) => !q || `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(q))
    .sort((a, b) => b.last_visit.localeCompare(a.last_visit));
}
