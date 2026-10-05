"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser, venueBySlug, type BookingStatus } from "@/lib/console/data";
import { isDateKey, zoned } from "@/lib/console/time";
import { demoOn } from "@/lib/console/demo";

const STATUSES: BookingStatus[] = ["confirmed", "seated", "cancelled", "no_show"];

/**
 * A café sitting, the same numbers the Peacock website books with: 75 minutes,
 * 90 for five or more, and 15 minutes to turn the table. Per-venue settings
 * will replace these when a second venue needs different ones.
 */
const sittingFor = (party: number) => (party >= 5 ? 90 : 75);
const TURNAROUND = 15;

const REF = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const reference = () => `PK-${Array.from({ length: 6 }, () => REF[randomInt(REF.length)]).join("")}`;

/** Seat, cancel, no-show or reinstate. Row-level security decides whether this member may. */
export async function setStatus(slug: string, id: string, status: BookingStatus) {
  if (!STATUSES.includes(status) || demoOn()) return;
  const venue = await venueBySlug(slug);
  const { client } = await requireUser();
  const { error } = await client.from("bookings").update({ status }).eq("id", id).eq("venue_id", venue.id);
  if (error?.code === "23P01") {
    // Reinstating onto a table someone else now holds.
    redirect(`/console/${slug}/list?problem=${encodeURIComponent("That table has been rebooked since. Move one of them first.")}`);
  }
  revalidatePath(`/console/${slug}`, "layout");
}

export type NewBookingState = { error?: string };

/** A booking taken over the phone or at the door. */
export async function createBooking(slug: string, _: NewBookingState, form: FormData): Promise<NewBookingState> {
  if (demoOn()) return { error: "Demo mode: nothing is saved until Supabase is connected." };
  const venue = await venueBySlug(slug);
  const { client } = await requireUser();

  const date = String(form.get("date") ?? "");
  const time = String(form.get("time") ?? "");
  const party = Number(form.get("party"));
  const tableId = String(form.get("table") ?? "") || null;
  const name = String(form.get("name") ?? "").trim();
  const source = String(form.get("source") ?? "phone");

  if (!isDateKey(date) || !/^\d{2}:\d{2}$/.test(time)) return { error: "Choose a date and a time." };
  if (!Number.isInteger(party) || party < 1 || party > 60) return { error: "Party size must be between 1 and 60." };
  if (!name) return { error: "Add a name for the booking." };

  const start = zoned(date, time, venue.timezone);
  const duration = sittingFor(party);
  const end = new Date(start.getTime() + (duration + TURNAROUND) * 60_000);

  if (tableId) {
    const { data: table } = await client
      .from("venue_tables")
      .select("label,seats")
      .eq("venue_id", venue.id)
      .eq("id", tableId)
      .maybeSingle();
    if (!table) return { error: "That table isn't on the floor plan." };
    if (table.seats < party) return { error: `Table ${table.label} seats ${table.seats}.` };
  }

  const { error } = await client.from("bookings").insert({
    id: reference(),
    venue_id: venue.id,
    table_id: tableId,
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
    duration_min: duration,
    party_size: party,
    guest_name: name,
    phone: String(form.get("phone") ?? "").trim(),
    email: String(form.get("email") ?? "").trim(),
    notes: String(form.get("notes") ?? "").trim() || null,
    status: "confirmed",
    source: ["phone", "walk_in", "console"].includes(source) ? source : "console",
  });

  if (error?.code === "23P01") return { error: "That table is already booked for part of that time." };
  if (error) return { error: "That didn't save. Try again." };

  revalidatePath(`/console/${slug}`, "layout");
  redirect(`/console/${slug}/list?date=${date}`);
}

export type NotifyState = { error?: string; saved?: boolean };

/**
 * Booking alerts on or off, and where they go. The website reads these each
 * time a guest books. The database lets an owner or manager change only these
 * two columns, so a staff login gets the error below rather than a change.
 */
export async function saveNotifications(slug: string, _: NotifyState, form: FormData): Promise<NotifyState> {
  if (demoOn()) return { error: "Demo mode: nothing is saved until Supabase is connected." };
  const venue = await venueBySlug(slug);
  const { client } = await requireUser();

  const on = form.get("notify") === "on";
  const email = String(form.get("email") ?? "").trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "That email address doesn't look right." };

  const { data, error } = await client
    .from("venues")
    .update({ notify_bookings: on, notify_email: email || null })
    .eq("id", venue.id)
    .select("id");
  if (error || !data?.length) return { error: "Only the venue's owner or a manager can change this." };

  revalidatePath(`/console/${slug}/settings`);
  return { saved: true };
}

export type TableState = { error?: string };

/**
 * Put a booking on a table, move it, or take it off one. Imported and phone
 * bookings often arrive without a table; until they have one the website
 * treats that table as free. The database refuses a table someone else holds.
 */
export async function setTable(slug: string, id: string, _: TableState, form: FormData): Promise<TableState> {
  if (demoOn()) return { error: "Demo mode: nothing is saved." };
  const venue = await venueBySlug(slug);
  const { client } = await requireUser();
  const tableId = String(form.get("table") ?? "") || null;

  const { data, error } = await client
    .from("bookings")
    .update({ table_id: tableId })
    .eq("id", id)
    .eq("venue_id", venue.id)
    .select("id");
  if (error?.code === "23P01") return { error: "That table is booked for part of this time." };
  if (error || !data?.length) return { error: "That didn't save. Try again." };

  revalidatePath(`/console/${slug}`, "layout");
  return {};
}
