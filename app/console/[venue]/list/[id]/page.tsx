import Link from "next/link";
import { notFound } from "next/navigation";
import { bookingById, floor, heldTables, venueBySlug } from "@/lib/console/data";
import { clockOf, dateKeyOf } from "@/lib/console/time";
import { StatusChip } from "../../ui";
import { EditBookingForm } from "./form";

/** One booking, to change its day, time, party size or table, and to leave the venue's own notes on it. */
export default async function EditBookingPage({ params }: { params: Promise<{ venue: string; id: string }> }) {
  const { venue: slug, id } = await params;
  const venue = await venueBySlug(slug);
  const [booking, { sections, tables, combinations }] = await Promise.all([
    bookingById(venue.id, decodeURIComponent(id)),
    floor(venue.id),
  ]);
  if (!booking) notFound();

  const tz = venue.timezone;
  const date = dateKeyOf(new Date(booking.starts_at), tz);
  const labelOf = (t: string) => tables.find((x) => x.id === t)?.label ?? t;

  return (
    <div className="console-page">
      <Link className="console-muted" href={`/console/${slug}/list?date=${date}#${booking.id}`}>
        ← Back to the day
      </Link>
      <h2 className="console-h2">{booking.guest_name}</h2>
      <p className="console-muted console-summary">
        {booking.id} · <StatusChip status={booking.status} />
        {booking.phone ? <> · <a href={`tel:${booking.phone.replace(/\s/g, "")}`}>{booking.phone}</a></> : null}
        {booking.email ? <> · {booking.email}</> : null}
      </p>
      <EditBookingForm
        slug={slug}
        id={booking.id}
        date={date}
        time={clockOf(booking.starts_at, tz)}
        party={booking.party_size}
        table={heldTables(booking).join(",")}
        notes={booking.notes ?? ""}
        staffNotes={booking.staff_notes ?? ""}
        groups={sections.map((s) => ({
          name: s.name,
          tables: tables.filter((t) => t.section_id === s.id).map((t) => ({ id: t.id, label: t.label, seats: t.seats })),
        }))}
        joined={combinations.map((c) => ({
          value: c.table_ids.join(","),
          label: c.table_ids.map(labelOf).join(" + "),
          min: c.seats_min,
          max: c.seats_max,
        }))}
      />
    </div>
  );
}
