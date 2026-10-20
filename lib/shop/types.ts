/** A barber shop on the vbarbers schema, as the console sees it. Times are ISO; money is cents. */

export type Shop = {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  slotMinutes: number;
  bufferMinutes: number;
  minNoticeMinutes: number;
  maxAdvanceDays: number;
  guestChangeCutoffHours: number;
};

export type ShopService = { id: string; name: string; durationMin: number; priceCents: number; active: boolean; sort: number };

export type ShopBookingStatus = "confirmed" | "cancelled" | "completed" | "no_show";

export type ShopBooking = {
  id: string;
  serviceId: string;
  serviceName: string;
  startsAt: string;
  endsAt: string;
  blockedUntil: string;
  status: ShopBookingStatus;
  priceCents: number;
  notes: string | null;
  source: "web" | "owner";
  customer: { id: string; name: string; phone: string; email: string | null };
};

export type ShopBlock = { id: string; startsAt: string; endsAt: string; reason: string | null };

/** Index 0 is Sunday; null is closed. */
export type WeeklyHours = ([string, string] | null)[];

export type DayOverride = { id: string; date: string; closed: boolean; open: string | null; close: string | null; note: string | null };
