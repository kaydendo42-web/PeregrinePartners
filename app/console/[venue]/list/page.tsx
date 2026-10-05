import { bookingsBetween, floor, heldTables, live, venueBySlug, type Booking } from "@/lib/console/data";
import { dayLabel, dayRange, isDateKey, timeLabel, todayKey } from "@/lib/console/time";
import { setStatus } from "../actions";
import { DayBar, StatusChip } from "../ui";
import { StatusButton } from "../status-button";
import { TablePicker, type Joined } from "./table-picker";

const SOURCE: Record<string, string> = {
  website: "Website",
  console: "Console",
  phone: "Phone",
  walk_in: "Walk-in",
  resos: "Resos",
};

/** One day's bookings, in time order, with the four things you do to a booking. */
export default async function ListPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<{ date?: string; problem?: string }>;
}) {
  const [{ venue: slug }, { date: asked, problem }] = await Promise.all([params, searchParams]);
  const venue = await venueBySlug(slug);
  const tz = venue.timezone;
  const date = isDateKey(asked) ? asked : todayKey(tz);
  const [from, to] = dayRange(date, tz);
  const [bookings, { tables, sections, combinations }] = await Promise.all([
    bookingsBetween(venue.id, from, to),
    floor(venue.id),
  ]);

  const table = (id: string | null) => tables.find((t) => t.id === id);
  const section = (id?: string) => sections.find((s) => s.id === id)?.name ?? "";
  const held = bookings.filter(live);
  const base = `/console/${slug}/list`;
  const groups = sections.map((s) => ({
    name: s.name,
    tables: tables.filter((t) => t.section_id === s.id).map((t) => ({ id: t.id, label: t.label, seats: t.seats })),
  }));
  const labelOf = (id: string) => tables.find((t) => t.id === id)?.label ?? id;
  const joined: Joined[] = combinations.map((c) => ({
    value: c.table_ids.join(","),
    label: c.table_ids.map(labelOf).join(" + "),
    min: c.seats_min,
    max: c.seats_max,
  }));
  const unassigned = held.filter((b) => !heldTables(b).length).length;

  return (
    <div className="console-page">
      <DayBar base={base} date={date} />
      {problem ? <p className="console-problem">{problem}</p> : null}
      {unassigned ? (
        <p className="console-problem">
          {unassigned === 1 ? "1 booking has" : `${unassigned} bookings have`} no table yet. Until {unassigned === 1 ? "it has" : "they have"} one,
          the website will offer that table to other guests.
        </p>
      ) : null}
      <p className="console-muted console-summary">
        {held.length} {held.length === 1 ? "booking" : "bookings"} · {held.reduce((n, b) => n + b.party_size, 0)} guests
      </p>

      {bookings.length ? (
        <table className="console-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Guest</th>
              <th>Party</th>
              <th>Table</th>
              <th>Contact</th>
              <th>Notes</th>
              <th>Status</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => {
              const ids = heldTables(b);
              const t = ids.length === 1 ? table(ids[0]) : undefined;
              return (
                <tr key={b.id} id={b.id} className={live(b) ? "" : "is-released"}>
                  <td data-label="Time" className="console-strong">
                    {timeLabel(b.starts_at, tz)}
                  </td>
                  <td data-label="Guest">
                    {b.guest_name}
                    <span className="console-ref">
                      {b.id} · {SOURCE[b.source] ?? b.source}
                    </span>
                  </td>
                  <td data-label="Party">{b.party_size}</td>
                  <td data-label="Table">
                    {live(b) ? (
                      <TablePicker
                        slug={slug}
                        bookingId={b.id}
                        current={ids.length ? ids.join(",") : null}
                        party={b.party_size}
                        groups={groups}
                        joined={joined}
                      />
                    ) : ids.length > 1 ? (
                      ids.map(labelOf).join(" + ")
                    ) : t ? (
                      `${t.label} · ${section(t.section_id)}`
                    ) : (
                      <span className="console-muted">No table</span>
                    )}
                  </td>
                  <td data-label="Contact">
                    {b.phone ? <a href={`tel:${b.phone.replace(/\s/g, "")}`}>{b.phone}</a> : null}
                    {b.email ? <span className="console-ref">{b.email}</span> : null}
                  </td>
                  <td data-label="Notes" className="console-notes">
                    {b.notes}
                  </td>
                  <td data-label="Status">
                    <StatusChip status={b.status} />
                  </td>
                  <td className="console-actions">
                    <Actions slug={slug} booking={b} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="console-empty">No bookings on {dayLabel(date)}.</p>
      )}
    </div>
  );
}

function Actions({ slug, booking: b }: { slug: string; booking: Booking }) {
  const act = (status: Booking["status"]) => setStatus.bind(null, slug, b.id, status);
  if (b.status === "confirmed") {
    return (
      <>
        <form action={act("seated")}>
          <StatusButton label="Seat" primary />
        </form>
        <form action={act("no_show")}>
          <StatusButton label="No-show" confirm="No-show?" />
        </form>
        <form action={act("cancelled")}>
          <StatusButton label="Cancel" confirm="Cancel?" />
        </form>
      </>
    );
  }
  if (b.status === "seated") {
    return (
      <form action={act("confirmed")}>
        <StatusButton label="Unseat" />
      </form>
    );
  }
  return (
    <form action={act("confirmed")}>
      <StatusButton label="Reinstate" />
    </form>
  );
}
