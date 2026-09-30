import Link from "next/link";
import { bookingsBetween, live, venueBySlug, floor } from "@/lib/console/data";
import { addDays, dateKeyOf, dayRange, timeLabel, todayKey } from "@/lib/console/time";

/** Resos's dashboard, same shape: today, the next seven days, the shortcuts. */
export default async function Dashboard({ params }: { params: Promise<{ venue: string }> }) {
  const { venue: slug } = await params;
  const venue = await venueBySlug(slug);
  const tz = venue.timezone;
  const today = todayKey(tz);
  const [from] = dayRange(today, tz);
  const [, weekEnd] = dayRange(addDays(today, 6), tz);

  const [week, { tables }] = await Promise.all([bookingsBetween(venue.id, from, weekEnd), floor(venue.id)]);
  const held = week.filter(live);
  const todays = held.filter((b) => dateKeyOf(new Date(b.starts_at), tz) === today);
  const guests = (list: typeof held) => list.reduce((n, b) => n + b.party_size, 0);
  // A Server Component renders once per request, so reading the clock here is safe.
  const now = Date.now(); // eslint-disable-line react-hooks/purity
  const upcoming = todays.filter((b) => new Date(b.ends_at).getTime() > now).slice(0, 6);
  const label = (id: string | null) => tables.find((t) => t.id === id)?.label ?? "—";

  return (
    <div className="console-page">
      <h2 className="console-h2">Bookings</h2>
      <div className="console-stats">
        <Link className="console-stat" href={`/console/${slug}/list?date=${today}`}>
          <span className="console-stat__label">Today</span>
          <span className="console-stat__pair">
            <span>
              <b>{todays.length}</b> bookings
            </span>
            <span>
              <b>{guests(todays)}</b> guests
            </span>
          </span>
        </Link>
        <Link className="console-stat" href={`/console/${slug}/calendar`}>
          <span className="console-stat__label">Next 7 days</span>
          <span className="console-stat__pair">
            <span>
              <b>{held.length}</b> bookings
            </span>
            <span>
              <b>{guests(held)}</b> guests
            </span>
          </span>
        </Link>
      </div>

      <div className="console-split">
        <section>
          <h2 className="console-h2">Up next today</h2>
          {upcoming.length ? (
            <ul className="console-upnext">
              {upcoming.map((b) => (
                <li key={b.id}>
                  <span className="console-upnext__time">{timeLabel(b.starts_at, tz)}</span>
                  <span>{b.guest_name}</span>
                  <span className="console-muted">
                    {b.party_size} · table {label(b.table_id)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="console-muted">Nothing else booked today.</p>
          )}
        </section>

        <section>
          <h2 className="console-h2">Shortcuts</h2>
          <div className="console-shortcuts">
            <Link className="console-btn" href={`/console/${slug}/list?date=${today}`}>
              Bookings today
            </Link>
            <Link className="console-btn" href={`/console/${slug}/calendar`}>
              Bookings this month
            </Link>
            {venue.booking_url ? (
              <a className="console-btn" href={venue.booking_url} target="_blank" rel="noreferrer">
                Show booking page
              </a>
            ) : null}
            <Link className="console-btn" href={`/console/${slug}/new`}>
              New booking
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
