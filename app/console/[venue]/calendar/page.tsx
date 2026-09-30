import Link from "next/link";
import { bookingsBetween, live, venueBySlug } from "@/lib/console/data";
import { addDays, dateKeyOf, todayKey, zoned } from "@/lib/console/time";

/** A month at a glance: bookings and guests per day, each day a way into its list. */
export default async function CalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const [{ venue: slug }, { month: asked }] = await Promise.all([params, searchParams]);
  const venue = await venueBySlug(slug);
  const tz = venue.timezone;
  const today = todayKey(tz);
  const month = asked && /^\d{4}-\d{2}$/.test(asked) ? asked : today.slice(0, 7);

  const first = `${month}-01`;
  const [y, m] = month.split("-").map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const nextMonth = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 7);
  const prevMonth = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 7);

  const bookings = (
    await bookingsBetween(venue.id, zoned(first, "00:00", tz), zoned(`${nextMonth}-01`, "00:00", tz))
  ).filter(live);
  const perDay = new Map<string, { bookings: number; guests: number }>();
  for (const b of bookings) {
    const key = dateKeyOf(new Date(b.starts_at), tz);
    const d = perDay.get(key) ?? { bookings: 0, guests: 0 };
    d.bookings++;
    d.guests += b.party_size;
    perDay.set(key, d);
  }

  // Weeks start on Monday, as they do on an Australian wall calendar.
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => addDays(first, i))];
  const title = new Intl.DateTimeFormat("en-AU", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, 1)),
  );

  return (
    <div className="console-page">
      <div className="console-daybar">
        <Link className="console-btn console-btn--sm" href={`?month=${prevMonth}`} aria-label="Previous month">
          ←
        </Link>
        <h2 className="console-daybar__label">{title}</h2>
        <Link className="console-btn console-btn--sm" href={`?month=${nextMonth}`} aria-label="Next month">
          →
        </Link>
      </div>
      <div className="console-cal">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <span key={d} className="console-cal__dow">
            {d}
          </span>
        ))}
        {cells.map((key, i) =>
          key ? (
            <Link
              key={key}
              href={`/console/${slug}/list?date=${key}`}
              className={`console-cal__day${key === today ? " is-today" : ""}${key < today ? " is-past" : ""}`}
            >
              <span className="console-cal__num">{Number(key.slice(8))}</span>
              {perDay.get(key) ? (
                <span className="console-cal__counts">
                  {perDay.get(key)!.bookings} bk · {perDay.get(key)!.guests} gst
                </span>
              ) : null}
            </Link>
          ) : (
            <span key={`pad-${i}`} className="console-cal__pad" />
          ),
        )}
      </div>
    </div>
  );
}
