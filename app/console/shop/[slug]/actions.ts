"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { shopBySlug, shopDay, shopServices, shopSession } from "@/lib/shop/data";
import { normalisePhone, planBlock, planBooking } from "@/lib/shop/booking";
import { dayBounds } from "@/lib/shop/day";
import { parseHoursForm } from "@/lib/shop/hours";
import { parseTimeOff } from "@/lib/shop/timeoff";
import type { ShopBookingStatus } from "@/lib/shop/types";

const OWNER_STATUSES: ShopBookingStatus[] = ["confirmed", "cancelled", "completed", "no_show"];

/** Mark an appointment done, a no-show, cancelled, or back to booked. */
export async function setStatus(slug: string, id: string, status: ShopBookingStatus, back: string) {
  if (!OWNER_STATUSES.includes(status)) return;
  const shop = await shopBySlug(slug);
  const { db } = await shopSession();
  const now = new Date().toISOString();
  const { error } = await db
    .from("bookings")
    .update({ status, updated_at: now, cancelled_at: status === "cancelled" ? now : null })
    .eq("tenant_id", shop.id)
    .eq("id", id);
  if (error?.code === "23P01") {
    redirect(`${back}?problem=${encodeURIComponent("That time has been booked since. Move one of them first.")}`);
  }
  if (error) throw new Error(`Could not update the appointment: ${error.message}`);
  revalidatePath(`/console/shop/${slug}`, "layout");
  redirect(back);
}

// --- new appointment / block time ------------------------------------------------

export type FormState = { error?: string; saved?: boolean; warning?: string };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const field = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

/** The owner books a client in. Checked here, then held by the database's no-overlap rule. */
export async function createAppointment(slug: string, _: FormState, form: FormData): Promise<FormState> {
  const shop = await shopBySlug(slug);
  const { db } = await shopSession();

  const date = field(form, "date");
  const time = field(form, "time");
  const name = field(form, "name").slice(0, 80);
  const phone = normalisePhone(field(form, "phone"));
  const email = field(form, "email").toLowerCase().slice(0, 254) || null;
  const notes = field(form, "notes").slice(0, 500) || null;
  if (!DATE.test(date)) return { error: "Pick a date." };
  if (!name) return { error: "Add the client's name." };
  if (!phone) return { error: "Add a mobile number we can text, like 0412 345 678." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "That email doesn't look right." };

  const services = await shopServices(shop.id);
  const service = services.find((s) => s.id === field(form, "service"));
  if (!service) return { error: "Pick a service." };

  const { from, to } = dayBounds(date, shop.timezone);
  const day = await shopDay(shop.id, from, to);
  const plan = planBooking({ service, date, time, tz: shop.timezone, bufferMinutes: shop.bufferMinutes }, day.bookings, day.blocks);
  if (!plan.ok) return { error: plan.error };

  const customer = await db
    .from("customers")
    .upsert({ tenant_id: shop.id, name, phone, ...(email ? { email } : {}), source: "owner" }, { onConflict: "tenant_id,phone" })
    .select("id")
    .single();
  if (customer.error) return { error: "Couldn't save the client. Try again." };

  const { data: created, error } = await db
    .from("bookings")
    .insert({
      tenant_id: shop.id,
      service_id: service.id,
      customer_id: customer.data.id,
      starts_at: plan.startsAt,
      ends_at: plan.endsAt,
      blocked_until: plan.blockedUntil,
      status: "confirmed",
      price_cents_snapshot: service.priceCents,
      notes,
      source: "owner",
    })
    .select("id")
    .single();
  if (error?.code === "23P01") return { error: "That time is taken." };
  if (error || !created) return { error: "Couldn't save the appointment. Try again." };

  revalidatePath(`/console/shop/${slug}`, "layout");
  redirect(`/console/shop/${slug}?date=${date}`);
}

export async function createBlock(slug: string, _: FormState, form: FormData): Promise<FormState> {
  const shop = await shopBySlug(slug);
  const { db } = await shopSession();
  const date = field(form, "date");
  if (!DATE.test(date)) return { error: "Pick a date." };
  const { from, to } = dayBounds(date, shop.timezone);
  const day = await shopDay(shop.id, from, to);
  const plan = planBlock({ date, from: field(form, "from"), to: field(form, "to"), tz: shop.timezone }, day.bookings);
  if (!plan.ok) return { error: plan.error };

  const { error } = await db.from("blocks").insert({
    tenant_id: shop.id,
    starts_at: plan.startsAt,
    ends_at: plan.endsAt,
    reason: field(form, "reason").slice(0, 80) || null,
  });
  if (error) return { error: "Couldn't block that time. Try again." };
  revalidatePath(`/console/shop/${slug}`, "layout");
  redirect(`/console/shop/${slug}?date=${date}`);
}

export async function removeBlock(slug: string, id: string, date: string) {
  const shop = await shopBySlug(slug);
  const { db } = await shopSession();
  const { error } = await db.from("blocks").delete().eq("tenant_id", shop.id).eq("id", id);
  if (error) throw new Error(`Could not remove the block: ${error.message}`);
  revalidatePath(`/console/shop/${slug}`, "layout");
  redirect(`/console/shop/${slug}?date=${date}`);
}

// --- working hours ---------------------------------------------------------------

/** All seven days replaced in one database call, so a dropped connection can't leave no hours. */
export async function saveHours(slug: string, _: FormState, form: FormData): Promise<FormState> {
  const parsed = parseHoursForm(form);
  if (!parsed.ok) return { error: parsed.error };
  const shop = await shopBySlug(slug);
  const { db } = await shopSession();
  const { error } = await db.rpc("set_weekly_hours", { t: shop.id, days: parsed.days });
  if (error) return { error: "Couldn't save your hours. Try again." };
  revalidatePath(`/console/shop/${slug}`, "layout");
  return { saved: true };
}

// --- time off -------------------------------------------------------------------

/**
 * Close days or set different hours. Existing appointments in those days stay
 * booked (cancelling is the barber's call, client by client); the reply says
 * how many there are.
 */
export async function addTimeOff(slug: string, _: FormState, form: FormData): Promise<FormState> {
  const parsed = parseTimeOff(form);
  if (!parsed.ok) return { error: parsed.error };
  const shop = await shopBySlug(slug);
  const { db } = await shopSession();

  const rows = parsed.dates.map((date) => ({
    tenant_id: shop.id,
    date,
    closed: parsed.closed,
    open_local: parsed.open,
    close_local: parsed.close,
    note: parsed.note,
  }));
  const { error } = await db.from("date_overrides").upsert(rows, { onConflict: "tenant_id,date" });
  if (error) return { error: "Couldn't save that. Try again." };

  const { from } = dayBounds(parsed.dates[0], shop.timezone);
  const { to } = dayBounds(parsed.dates[parsed.dates.length - 1], shop.timezone);
  const day = await shopDay(shop.id, from, to);
  const booked = day.bookings.filter((b) => b.status === "confirmed").length;

  revalidatePath(`/console/shop/${slug}`, "layout");
  return {
    saved: true,
    ...(booked
      ? {
          warning: `${booked} ${booked === 1 ? "appointment is" : "appointments are"} already booked in ${
            parsed.dates.length === 1 ? "that day" : "those days"
          } and still stand. Contact ${booked === 1 ? "that client" : "those clients"} if you need to move them.`,
        }
      : {}),
  };
}

export async function removeTimeOff(slug: string, id: string) {
  const shop = await shopBySlug(slug);
  const { db } = await shopSession();
  const { error } = await db.from("date_overrides").delete().eq("tenant_id", shop.id).eq("id", id);
  if (error) throw new Error(`Could not remove that: ${error.message}`);
  revalidatePath(`/console/shop/${slug}`, "layout");
}
