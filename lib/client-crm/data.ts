import "server-only";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { supabase } from "@/lib/supabase/server";
import { parseUuid } from "@/lib/crm/validation";
import { reportRange } from "@/lib/booking/report";
import type { BookingReport } from "@/lib/booking/report";
import type { Venue, Booking } from "@/lib/console/data";
import type { SupabaseClient } from "@supabase/supabase-js";

async function signedIn() {
  await connection();
  const client = await supabase();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) redirect("/sign-in?next=%2Fconsole");
  const { data: aal, error: aalError } =
    await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aalError || aal?.currentLevel !== "aal2")
    redirect("/sign-in/verify?next=%2Fconsole");
  return { client, user };
}
export async function requireClientVenue(slug: string) {
  const auth = await signedIn();
  const { data: venue, error } = await auth.client
    .from("venues")
    .select("id,name,slug,timezone,website_url,booking_url,phone")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error("Could not load this client workspace.");
  if (!venue) notFound();
  return { ...auth, venue: venue as Venue };
}
export async function bookingReport(
  venueId: string,
  days: number,
): Promise<BookingReport | null> {
  const { client } = await signedIn();
  return readBookingReport(client, venueId, days);
}

/** The caller must supply a verified booking-project member session. */
export async function readBookingReport(
  client: SupabaseClient,
  venueId: string,
  days: number,
): Promise<BookingReport | null> {
  const { data: venue, error } = await client
    .from("venues")
    .select("timezone")
    .eq("id", parseUuid(venueId))
    .maybeSingle();
  if (error) throw new Error("Could not verify booking access.");
  if (!venue) return null;
  const range = reportRange(new Date().toISOString(), venue.timezone, days);
  const result = await client.rpc("booking_dashboard", {
    p_venue: venueId,
    p_from: range.from,
    p_to: range.to,
  });
  if (result.error) throw new Error("Could not load booking reports.");
  return result.data as BookingReport;
}
export type GuestProfile = {
  booking_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  bookings: number;
  no_shows: number;
  cancellations: number;
  first_booking: string;
  last_booking: string;
};
export type GuestEntry = {
  id: string;
  booking_id: string;
  kind: "note" | "task";
  body: string;
  due_on: string | null;
  state: "open" | "done" | "cancelled";
  version: number;
  actor_id: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
};
export async function guestProfiles(slug: string, q: string, page: number) {
  const { client, venue } = await requireClientVenue(slug);
  const { data, error } = await client.rpc("client_crm_customers", {
    p_venue: venue.id,
    p_q: q,
    p_page: page,
  });
  if (error) throw new Error("Could not load customers.");
  return data as { total: number; rows: GuestProfile[] };
}
export async function guestProfile(slug: string, booking: string) {
  const { client, venue } = await requireClientVenue(slug);
  if (!booking || booking.length > 300) notFound();
  const { data, error } = await client.rpc("client_crm_customer", {
    p_venue: venue.id,
    p_booking: booking,
  });
  if (error?.code === "42501") notFound();
  if (error) throw new Error("Could not load this customer.");
  return data as {
    profile: { name: string; email: string | null; phone: string | null };
    booking_count: number;
    history: Pick<
      Booking,
      "id" | "starts_at" | "status" | "source" | "party_size"
    >[];
    entries: GuestEntry[];
  };
}
export async function guestTasks(
  slug: string,
  state: "open" | "done" | "cancelled",
  page: number,
) {
  const { client, venue } = await requireClientVenue(slug);
  const { data, error, count } = await client
    .from("client_crm_entries")
    .select("*,booking:bookings!inner(id,guest_name)", { count: "exact" })
    .eq("venue_id", venue.id)
    .eq("kind", "task")
    .eq("state", state)
    .order("due_on")
    .order("id")
    .range((page - 1) * 50, page * 50 - 1);
  if (error) throw new Error("Could not load customer follow-ups.");
  return {
    total: count ?? 0,
    rows: (data ?? []) as unknown as (GuestEntry & {
      booking: { id: string; guest_name: string };
    })[],
  };
}
