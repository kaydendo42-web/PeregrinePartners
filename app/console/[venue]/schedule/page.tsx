import { bookingsBetween, floor, live, venueBySlug, heldTables } from "@/lib/console/data";
import { dayRange, isDateKey, minutesOfDay, timeLabel, todayKey } from "@/lib/console/time";
import { DayBar } from "../ui";

/**
 * The day as a timeline: a row per table, grouped by section, a block per
 * booking. Where a gap is, is where a walk-in goes.
 */
export default async function SchedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const [{ venue: slug }, { date: asked }] = await Promise.all([params, searchParams]);
  const venue = await venueBySlug(slug);
  const tz = venue.timezone;
  const date = isDateKey(asked) ? asked : todayKey(tz);
  const [from, to] = dayRange(date, tz);
  const [bookings, { tables, sections }] = await Promise.all([bookingsBetween(venue.id, from, to), floor(venue.id)]);
  const held = bookings.filter(live);

  // Opening hours by default, stretched to fit anything booked outside them.
  const starts = held.map((b) => minutesOfDay(b.starts_at, tz));
  const ends = held.map((b) => minutesOfDay(b.starts_at, tz) + b.duration_min);
  const open = Math.min(7 * 60, ...starts.map((m) => Math.floor(m / 60) * 60));
  const close = Math.max(15 * 60, ...ends.map((m) => Math.ceil(m / 60) * 60));
  const span = close - open;
  const hours = Array.from({ length: span / 60 + 1 }, (_, i) => open + i * 60);
  const pct = (m: number) => `${((m - open) / span) * 100}%`;

  const nowMin = todayKey(tz) === date ? minutesOfDay(new Date(), tz) : null;
  const unassigned = held.filter((b) => !heldTables(b).length);

  return (
    <div className="console-page">
      <DayBar base={`/console/${slug}/schedule`} date={date} view="schedule" />
      <div className="console-schedule" role="table" aria-label="Bookings by table">
        <div className="console-schedule__head" role="row">
          <span className="console-schedule__table" role="columnheader">
            Table
          </span>
          <div className="console-schedule__track" role="columnheader">
            {hours.map((m) => (
              <span key={m} className="console-schedule__hour" style={{ left: pct(m) }}>
                {m / 60 > 12 ? m / 60 - 12 : m / 60}
                {m / 60 >= 12 ? "pm" : "am"}
              </span>
            ))}
          </div>
        </div>
        {sections.map((s) => (
          <div key={s.id} role="rowgroup">
            <p className="console-schedule__section">{s.name}</p>
            {tables
              .filter((t) => t.section_id === s.id)
              .map((t) => (
                <div key={t.id} className="console-schedule__row" role="row">
                  <span className="console-schedule__table" role="rowheader">
                    {t.label} <span className="console-muted">· {t.seats}</span>
                  </span>
                  <div className="console-schedule__track" role="cell">
                    {nowMin !== null && nowMin >= open && nowMin <= close ? (
                      <span className="console-schedule__now" style={{ left: pct(nowMin) }} aria-hidden="true" />
                    ) : null}
                    {held
                      .filter((b) => heldTables(b).includes(t.id))
                      .map((b) => {
                        const m = minutesOfDay(b.starts_at, tz);
                        return (
                          <a
                            key={b.id}
                            href={`/console/${slug}/list?date=${date}#${b.id}`}
                            className={`console-schedule__block console-schedule__block--${b.status}`}
                            style={{ left: pct(m), width: `${(b.duration_min / span) * 100}%` }}
                            title={`${timeLabel(b.starts_at, tz)} ${b.guest_name}, ${b.party_size}`}
                          >
                            <b>{b.party_size}</b> {b.guest_name}
                          </a>
                        );
                      })}
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
      {unassigned.length ? (
        <p className="console-problem">
          {unassigned.length} booking{unassigned.length === 1 ? "" : "s"} without a table today:{" "}
          {unassigned.map((b) => `${timeLabel(b.starts_at, tz)} ${b.guest_name}`).join(", ")}.
        </p>
      ) : null}
    </div>
  );
}
