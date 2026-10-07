import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { supabase, supabaseEnv } from "@/lib/supabase/server";
import { demoBookings, demoCustomers, demoFloor, demoOn, demoPlan, demoVenue } from "./demo";

/**
 * Everything the console reads, through the signed-in member's client. Row-level
 * security decides what comes back; these functions only shape it.
 */

export type Venue = {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  website_url: string | null;
  booking_url: string | null;
  phone: string | null;
  /** Email the venue when a guest books online. Guests' confirmations go regardless. */
  notify_bookings?: boolean;
  /** Where that email goes; null means the website's own inbox. */
  notify_email?: string | null;
  /** The room around the tables; absent until the venue's plan is seeded. */
  plan?: FloorPlan | null;
};

type Point = [number, number];

/** A venue's room, in venue metres (x across, y up), as its seed writes it. */
export type FloorPlan = {
  width: number;
  depth: number;
  zones: { id: string; name: string; open: boolean; outline: Point[]; label: Point }[];
  walls: { kind: "wall" | "parapet" | "glass"; from: Point; to: Point }[];
  fixtures: { kind: "room" | "bathroom" | "counter" | "bench" | "planter"; label: string; x: number; y: number; w: number; d: number }[];
  stairs?: { x0: number; x1: number; y0: number; y1: number; treads: number };
  trees?: { x: number; y: number; r: number }[];
};

export type Section = { id: string; name: string; sort: number; indoor: boolean };

export type VenueTable = {
  id: string;
  label: string;
  section_id: string;
  seats: number;
  /** Fewest it's offered for online, and Jenny's priority (Resos's numbers). */
  seats_min?: number;
  priority?: number;
  shape: "rect" | "round" | "diamond";
  x: number;
  y: number;
  w: number;
  d: number;
  rot: number;
};

/** Tables Jenny pushes together for bigger groups, e.g. Courtyard 2 + 3 + 4. */
export type Combination = { id: string; table_ids: string[]; seats_min: number; seats_max: number; priority: number };

export type BookingStatus = "confirmed" | "seated" | "cancelled" | "no_show";

export type Booking = {
  id: string;
  /** The first table held; kept in step with table_ids by the database. */
  table_id: string | null;
  /** Every table held: one, several (joined), or none yet. */
  table_ids?: string[];
  starts_at: string;
  ends_at: string;
  duration_min: number;
  party_size: number;
  guest_name: string;
  phone: string;
  email: string;
  /** What the guest wrote when booking. */
  notes: string | null;
  /** The venue's own notes; never shown to the guest. */
  staff_notes?: string | null;
  status: BookingStatus;
  source: string;
};

export type Customer = {
  key: string;
  name: string;
  email: string | null;
  phone: string | null;
  visits: number;
  no_shows: number;
  cancellations: number;
  first_visit: string;
  last_visit: string;
};

/** The signed-in user, or off to sign in. */
export async function requireUser() {
  // Never a build-time answer: who is signed in is a per-request question.
  await connection();
  if (demoOn()) return { client: null, user: { email: "demo@peregrinepartners.space" } } as never;
  // A deployment without Supabase has no console; the sign-in page says so.
  if (!supabaseEnv()) redirect("/sign-in");
  const client = await supabase();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/sign-in");
  return { client, user };
}

export async function myVenues(): Promise<Venue[]> {
  if (demoOn()) return [demoVenue];
  const { client } = await requireUser();
  const { data, error } = await client.from("venues").select("*").order("name");
  // A failed query must not pass for "not added to a venue yet".
  if (error) throw new Error(`Could not load venues: ${error.message}`);
  return (data ?? []) as Venue[];
}

/** A venue by slug — or a 404, which is also what a non-member sees. */
export async function venueBySlug(slug: string): Promise<Venue> {
  if (demoOn()) {
    if (slug !== demoVenue.slug) notFound();
    return { ...demoVenue, plan: demoPlan() };
  }
  const { client } = await requireUser();
  const { data } = await client.from("venues").select("*").eq("slug", slug).maybeSingle();
  if (!data) notFound();
  return data as Venue;
}

/** The tables a booking holds, whether it predates table_ids or not. */
export function heldTables(b: Pick<Booking, "table_id" | "table_ids">): string[] {
  if (b.table_ids?.length) return b.table_ids;
  return b.table_id ? [b.table_id] : [];
}

export async function floor(venueId: string) {
  if (demoOn()) return demoFloor();
  const client = await supabase();
  const [sections, tables, combos] = await Promise.all([
    client.from("sections").select("id,name,sort,indoor").eq("venue_id", venueId).order("sort"),
    client
      .from("venue_tables")
      .select("id,label,section_id,seats,seats_min,priority,shape,x,y,w,d,rot")
      .eq("venue_id", venueId)
      .eq("active", true),
    client.from("table_combinations").select("id,table_ids,seats_min,seats_max,priority").eq("venue_id", venueId),
  ]);
  const byNumber = (a: VenueTable, b: VenueTable) =>
    a.label.localeCompare(b.label, "en", { numeric: true });
  return {
    sections: (sections.data ?? []) as Section[],
    tables: ((tables.data ?? []) as VenueTable[])
      .map((t) => ({ ...t, x: Number(t.x), y: Number(t.y), w: Number(t.w), d: Number(t.d) }))
      .sort(byNumber),
    combinations: (combos.data ?? []) as Combination[],
  };
}

const BOOKING_COLUMNS =
  "id,table_id,table_ids,starts_at,ends_at,duration_min,party_size,guest_name,phone,email,notes,staff_notes,status,source";

/** One booking at the venue, or null. */
export async function bookingById(venueId: string, id: string): Promise<Booking | null> {
  if (demoOn()) return demoBookings().find((b) => b.id === id) ?? null;
  const client = await supabase();
  const { data } = await client.from("bookings").select(BOOKING_COLUMNS).eq("venue_id", venueId).eq("id", id).maybeSingle();
  return (data as Booking | null) ?? null;
}

export async function bookingsBetween(venueId: string, from: Date, to: Date): Promise<Booking[]> {
  if (demoOn()) {
    return demoBookings().filter((b) => b.starts_at >= from.toISOString() && b.starts_at < to.toISOString());
  }
  const client = await supabase();
  const { data } = await client
    .from("bookings")
    .select(BOOKING_COLUMNS)
    .eq("venue_id", venueId)
    .gte("starts_at", from.toISOString())
    .lt("starts_at", to.toISOString())
    .order("starts_at");
  return (data ?? []) as Booking[];
}

export async function customers(venueId: string, query?: string): Promise<Customer[]> {
  if (demoOn()) return demoCustomers(query);
  const client = await supabase();
  let q = client
    .from("customer_summary")
    .select("key,name,email,phone,visits,no_shows,cancellations,first_visit,last_visit")
    .eq("venue_id", venueId)
    .order("last_visit", { ascending: false })
    .limit(500);
  if (query) {
    const like = `%${query.replace(/[%_,()]/g, "")}%`;
    q = q.or(`name.ilike.${like},email.ilike.${like},phone.ilike.${like}`);
  }
  const { data } = await q;
  return (data ?? []) as Customer[];
}

/** Bookings that hold a table: the ones that count as covers. */
export const live = (b: Booking) => b.status === "confirmed" || b.status === "seated";
