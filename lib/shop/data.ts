import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { supabase, supabaseEnv } from "@/lib/supabase/server";
import { SHOP_SCHEMA } from "@/lib/supabase/environment";
import type { ClientRef } from "@/lib/console/client-list";
import type { DayOverride, Shop, ShopBlock, ShopBooking, ShopService, WeeklyHours } from "./types";

/**
 * The shop console's reads, as the signed-in member. Row-level security on
 * vbarbers lets a member see their own shop and nothing else, so a slug that
 * isn't theirs is simply not found.
 */

export async function shopSession() {
  await connection();
  if (!supabaseEnv()) redirect("/sign-in");
  const client = await supabase("booking");
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/sign-in");
  return { client, db: client.schema(SHOP_SCHEMA), user };
}

const SHOP_COLUMNS =
  "id,slug,name,timezone,slot_minutes,buffer_minutes,min_notice_minutes,max_advance_days,guest_change_cutoff_hours";

type ShopRow = {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  slot_minutes: number;
  buffer_minutes: number;
  min_notice_minutes: number;
  max_advance_days: number;
  guest_change_cutoff_hours: number;
};

const toShop = (r: ShopRow): Shop => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  timezone: r.timezone,
  slotMinutes: r.slot_minutes,
  bufferMinutes: r.buffer_minutes,
  minNoticeMinutes: r.min_notice_minutes,
  maxAdvanceDays: r.max_advance_days,
  guestChangeCutoffHours: r.guest_change_cutoff_hours,
});

/** Shops the member belongs to, for the console's front door. */
export async function myShops(): Promise<ClientRef[]> {
  const { db, user } = await shopSession();
  const { data, error } = await db.from("members").select("tenant:tenants(slug,name)").eq("user_id", user.id);
  if (error) throw new Error(`Could not load shops: ${error.message}`);
  return (data ?? []).flatMap((m) => {
    const t = (m as unknown as { tenant: { slug: string; name: string } | null }).tenant;
    return t ? [{ kind: "shop" as const, slug: t.slug, name: t.name, href: `/console/shop/${t.slug}` }] : [];
  });
}

export async function shopBySlug(slug: string): Promise<Shop> {
  const { db } = await shopSession();
  const { data } = await db.from("tenants").select(SHOP_COLUMNS).eq("slug", slug).maybeSingle();
  if (!data) notFound();
  return toShop(data as ShopRow);
}

type BookingRow = {
  id: string;
  service_id: string;
  starts_at: string;
  ends_at: string;
  blocked_until: string;
  status: ShopBooking["status"];
  price_cents_snapshot: number;
  notes: string | null;
  source: ShopBooking["source"];
  service: { name: string } | null;
  customer: { id: string; name: string; phone: string; email: string | null } | null;
};

const BOOKING_COLUMNS =
  "id,service_id,starts_at,ends_at,blocked_until,status,price_cents_snapshot,notes,source,service:services(name),customer:customers(id,name,phone,email)";

const toBooking = (r: BookingRow): ShopBooking => ({
  id: r.id,
  serviceId: r.service_id,
  serviceName: r.service?.name ?? "Appointment",
  startsAt: r.starts_at,
  endsAt: r.ends_at,
  blockedUntil: r.blocked_until,
  status: r.status,
  priceCents: r.price_cents_snapshot,
  notes: r.notes,
  source: r.source,
  customer: r.customer ?? { id: "", name: "Unknown", phone: "", email: null },
});

/** Bookings (not cancelled) and blocks overlapping [from, to). */
export async function shopDay(shopId: string, from: Date, to: Date): Promise<{ bookings: ShopBooking[]; blocks: ShopBlock[] }> {
  const { db } = await shopSession();
  const [b, k] = await Promise.all([
    db
      .from("bookings")
      .select(BOOKING_COLUMNS)
      .eq("tenant_id", shopId)
      .neq("status", "cancelled")
      .lt("starts_at", to.toISOString())
      .gt("ends_at", from.toISOString())
      .order("starts_at"),
    db
      .from("blocks")
      .select("id,starts_at,ends_at,reason")
      .eq("tenant_id", shopId)
      .lt("starts_at", to.toISOString())
      .gt("ends_at", from.toISOString())
      .order("starts_at"),
  ]);
  if (b.error) throw new Error(`Could not load bookings: ${b.error.message}`);
  if (k.error) throw new Error(`Could not load blocks: ${k.error.message}`);
  return {
    bookings: (b.data as unknown as BookingRow[]).map(toBooking),
    blocks: (k.data ?? []).map((r) => ({ id: r.id, startsAt: r.starts_at, endsAt: r.ends_at, reason: r.reason })),
  };
}

export async function shopBooking(shopId: string, id: string): Promise<ShopBooking | null> {
  const { db } = await shopSession();
  const { data } = await db.from("bookings").select(BOOKING_COLUMNS).eq("tenant_id", shopId).eq("id", id).maybeSingle();
  return data ? toBooking(data as unknown as BookingRow) : null;
}

export async function shopServices(shopId: string): Promise<ShopService[]> {
  const { db } = await shopSession();
  const { data, error } = await db
    .from("services")
    .select("id,name,duration_min,price_cents,active,sort")
    .eq("tenant_id", shopId)
    .order("sort");
  if (error) throw new Error(`Could not load services: ${error.message}`);
  return (data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    durationMin: s.duration_min,
    priceCents: s.price_cents,
    active: s.active,
    sort: s.sort,
  }));
}

export async function shopHours(shopId: string): Promise<WeeklyHours> {
  const { db } = await shopSession();
  const { data, error } = await db.from("weekly_hours").select("weekday,open_local,close_local").eq("tenant_id", shopId);
  if (error) throw new Error(`Could not load hours: ${error.message}`);
  const out: WeeklyHours = Array.from({ length: 7 }, () => null);
  for (const h of data ?? []) out[h.weekday] = [String(h.open_local).slice(0, 5), String(h.close_local).slice(0, 5)];
  return out;
}

export async function shopOverrides(shopId: string, fromDate: string): Promise<DayOverride[]> {
  const { db } = await shopSession();
  const { data, error } = await db
    .from("date_overrides")
    .select("id,date,closed,open_local,close_local,note")
    .eq("tenant_id", shopId)
    .gte("date", fromDate)
    .order("date");
  if (error) throw new Error(`Could not load time off: ${error.message}`);
  return (data ?? []).map((o) => ({
    id: o.id,
    date: o.date,
    closed: o.closed,
    open: o.open_local ? String(o.open_local).slice(0, 5) : null,
    close: o.close_local ? String(o.close_local).slice(0, 5) : null,
    note: o.note,
  }));
}
