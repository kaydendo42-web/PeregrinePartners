import { floor, venueBySlug } from "@/lib/console/data";
import { todayKey } from "@/lib/console/time";
import { NewBookingForm } from "./form";

/** A booking taken over the phone or at the door, straight into the same diary the website writes to. */
export default async function NewBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const [{ venue: slug }, { date }] = await Promise.all([params, searchParams]);
  const venue = await venueBySlug(slug);
  const { sections, tables, combinations } = await floor(venue.id);
  const labelOf = (id: string) => tables.find((t) => t.id === id)?.label ?? id;
  return (
    <div className="console-page">
      <h2 className="console-h2">New booking</h2>
      <NewBookingForm
        slug={slug}
        date={date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayKey(venue.timezone)}
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
