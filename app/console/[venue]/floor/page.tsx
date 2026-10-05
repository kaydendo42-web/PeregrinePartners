import { bookingsBetween, floor, live, venueBySlug, type Booking, heldTables } from "@/lib/console/data";
import { dayRange, isDateKey, minutesOfDay, timeLabel, todayKey, zoned } from "@/lib/console/time";
import { DayBar } from "../ui";

/**
 * The room at a moment: every table from the venue's plan, coloured by who has
 * it then. Top-down and flat — this is the working view; the 3D room is the
 * guests' view on the website.
 */
export default async function FloorPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<{ date?: string; time?: string }>;
}) {
  const [{ venue: slug }, q] = await Promise.all([params, searchParams]);
  const venue = await venueBySlug(slug);
  const tz = venue.timezone;
  const today = todayKey(tz);
  const date = isDateKey(q.date) ? q.date : today;
  const nowMin = minutesOfDay(new Date(), tz);
  const fallback =
    date === today
      ? `${String(Math.floor(nowMin / 60)).padStart(2, "0")}:${String(nowMin % 60 - (nowMin % 15)).padStart(2, "0")}`
      : "09:00";
  const time = q.time && /^\d{2}:\d{2}$/.test(q.time) ? q.time : fallback;
  const at = zoned(date, time, tz).getTime();

  const [from, to] = dayRange(date, tz);
  const [bookings, { tables, sections }] = await Promise.all([bookingsBetween(venue.id, from, to), floor(venue.id)]);
  const held = bookings.filter(live);

  /** Who has the table at the moment, else who is next today. */
  const occupant = (id: string) =>
    held.find((b) => heldTables(b).includes(id) && new Date(b.starts_at).getTime() <= at && new Date(b.ends_at).getTime() > at);
  const next = (id: string) =>
    held.find((b) => heldTables(b).includes(id) && new Date(b.starts_at).getTime() > at);

  const pad = 0.6;
  const maxX = Math.max(...tables.map((t) => t.x + t.w)) + pad;
  const maxY = Math.max(...tables.map((t) => t.y + t.w)) + pad;
  const minX = Math.min(...tables.map((t) => t.x - t.w)) - pad;
  const minY = Math.min(...tables.map((t) => t.y - t.w)) - pad;
  // Venue y runs up the plan; SVG y runs down it.
  const sy = (y: number) => maxY - y;

  const state = (b?: Booking) => (!b ? "free" : b.status === "seated" ? "seated" : "booked");

  return (
    <div className="console-page">
      <DayBar base={`/console/${slug}/floor`} date={date} extra={`&time=${time}`} />
      <form className="console-timepick" action={`/console/${slug}/floor`}>
        <input type="hidden" name="date" value={date} />
        <label>
          At <input type="time" name="time" defaultValue={time} step={900} />
        </label>
        <button className="console-btn console-btn--sm">Show</button>
        <span className="console-legend">
          <i className="is-free" /> Free <i className="is-booked" /> Booked <i className="is-seated" /> Seated
        </span>
      </form>

      {tables.length ? (
        <svg
          className="console-floor"
          viewBox={`${minX} ${0} ${maxX - minX} ${maxY - minY}`}
          role="img"
          aria-label={`Floor plan at ${timeLabel(new Date(at), tz)}`}
        >
          {sections.map((s) => {
            const own = tables.filter((t) => t.section_id === s.id);
            if (!own.length) return null;
            const cx = own.reduce((n, t) => n + t.x, 0) / own.length;
            const top = Math.max(...own.map((t) => t.y)) + 0.7;
            return (
              <text key={s.id} x={cx} y={sy(top)} className="console-floor__section" textAnchor="middle">
                {s.name}
              </text>
            );
          })}
          {tables.map((t) => {
            const b = occupant(t.id);
            const n = next(t.id);
            const turned = t.rot % 180 === 90;
            const w = turned ? t.d : t.w;
            const d = turned ? t.w : t.d;
            const cls = `console-floor__table is-${state(b)}`;
            return (
              <g key={t.id}>
                <title>
                  {`Table ${t.label}, seats ${t.seats}. ${
                    b ? `${b.guest_name} (${b.party_size}) until ${timeLabel(b.ends_at, tz)}.` : "Free."
                  }${n ? ` Next: ${timeLabel(n.starts_at, tz)} ${n.guest_name}.` : ""}`}
                </title>
                {t.shape === "round" ? (
                  <circle className={cls} cx={t.x} cy={sy(t.y)} r={t.w / 2} />
                ) : t.shape === "diamond" ? (
                  <rect
                    className={cls}
                    x={t.x - t.w / 2}
                    y={sy(t.y) - t.w / 2}
                    width={t.w}
                    height={t.w}
                    transform={`rotate(45 ${t.x} ${sy(t.y)})`}
                  />
                ) : (
                  <rect className={cls} x={t.x - w / 2} y={sy(t.y) - d / 2} width={w} height={d} />
                )}
                <text x={t.x} y={sy(t.y)} className="console-floor__label" textAnchor="middle" dominantBaseline="central">
                  {t.label}
                </text>
                {b || n ? (
                  <text x={t.x} y={sy(t.y) + Math.max(d, t.w) / 2 + 0.28} className="console-floor__who" textAnchor="middle">
                    {b ? `${b.party_size} · ${b.guest_name.split(" ")[0]}` : `next ${timeLabel(n!.starts_at, tz)}`}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      ) : (
        <p className="console-empty">No floor plan yet for this venue.</p>
      )}
    </div>
  );
}
