import { localDate } from "../crm/time.ts";
export type BookingReport = {
  from: string;
  to: string;
  timezone: string;
  checked_at: string;
  bookings: number;
  guests: number;
  cancelled: number;
  no_shows: number;
  upcoming: number;
  last_booking_update: string | null;
  series: { day: string; bookings: number; guests: number }[];
  sources: { source: string; bookings: number }[];
};
export function reportPeriod(value: unknown): 7 | 30 | 90 {
  return value === "7" || value === 7
    ? 7
    : value === "90" || value === 90
      ? 90
      : 30;
}
export function reportRange(instant: string, timezone: string, days: number) {
  const to = localDate(instant, timezone);
  const from = new Date(Date.parse(to + "T00:00:00Z") - (days - 1) * 86400000)
    .toISOString()
    .slice(0, 10);
  return { from, to };
}
