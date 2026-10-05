import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { supabase, supabaseEnv } from "@/lib/supabase/server";
import { demoBookings, demoCustomers, demoFloor, demoOn, demoVenue } from "./demo";

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
};

export type Section = { id: string; name: string; sort: number; indoor: boolean };

export type VenueTable = {
  id: string;
  label: string;
  section_id: string;
  seats: number;
  shape: "rect" | "round" | "diamond";
  x: number;
  y: number;
  w: number;
  d: number;
  rot: number;
};

export type BookingStatus = "confirmed" | "seated" | "cancelled" | "no_show";

export type Booking = {
  id: string;
  table_id: string | null;
  starts_at: string;
  ends_at: string;
  duration_min: number;
  party_size: number;
  guest_name: string;
  phone: string;
  email: string;
  notes: string | null;
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
    return demoVenue;
  }
  const { client } = await requireUser();
  const { data } = await client.from("venues").select("*").eq("slug", slug).maybeSingle();
  if (!data) notFound();
  return data as Venue;
}

export async function floor(venueId: string) {
  if (demoOn()) return demoFloor();
  const client = await supabase();
  const [sections, tables] = await Promise.all([
    client.from("sections").select("id,name,sort,indoor").eq("venue_id", venueId).order("sort"),
    client
      .from("venue_tables")
      .select("id,label,section_id,seats,shape,x,y,w,d,rot")
      .eq("venue_id", venueId)
      .eq("active", true),
  ]);
  const byNumber = (a: VenueTable, b: VenueTable) =>
    a.label.localeCompare(b.label, "en", { numeric: true });
  return {
    sections: (sections.data ?? []) as Section[],
    tables: ((tables.data ?? []) as VenueTable[])
      .map((t) => ({ ...t, x: Number(t.x), y: Number(t.y), w: Number(t.w), d: Number(t.d) }))
      .sort(byNumber),
  };
}

export async function bookingsBetween(venueId: string, from: Date, to: Date): Promise<Booking[]> {
  if (demoOn()) {
    return demoBookings().filter((b) => b.starts_at >= from.toISOString() && b.starts_at < to.toISOString());
  }
  const client = await supabase();
  const { data } = await client
    .from("bookings")
    .select("id,table_id,starts_at,ends_at,duration_min,party_size,guest_name,phone,email,notes,status,source")
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
