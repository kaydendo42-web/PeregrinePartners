import { customers, venueBySlug } from "@/lib/console/data";
import { dateKeyOf, dayLabel } from "@/lib/console/time";

/** Everyone who has booked, most recent first: visits, no-shows, how to reach them. */
export default async function CustomersPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ venue: slug }, { q }] = await Promise.all([params, searchParams]);
  const venue = await venueBySlug(slug);
  const list = await customers(venue.id, q?.trim() || undefined);
  const day = (iso: string) => dayLabel(dateKeyOf(new Date(iso), venue.timezone), "short");

  return (
    <div className="console-page">
      <form className="console-search" action={`/console/${slug}/customers`}>
        <input type="search" name="q" defaultValue={q} placeholder="Search by name, email or phone" aria-label="Search customers" />
        <button className="console-btn console-btn--sm">Search</button>
      </form>
      {list.length ? (
        <table className="console-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Visits</th>
              <th>No-shows</th>
              <th>Last booking</th>
              <th>First booking</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.key}>
                <td data-label="Name" className="console-strong">
                  {c.name}
                </td>
                <td data-label="Contact">
                  {c.phone ? <a href={`tel:${c.phone.replace(/\s/g, "")}`}>{c.phone}</a> : null}
                  {c.email ? <span className="console-ref">{c.email}</span> : null}
                </td>
                <td data-label="Visits">{c.visits}</td>
                <td data-label="No-shows">{c.no_shows ? <span className="console-chip console-chip--no_show">{c.no_shows}</span> : 0}</td>
                <td data-label="Last booking">{day(c.last_visit)}</td>
                <td data-label="First booking">{day(c.first_visit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="console-empty">{q ? `No one matching "${q}".` : "No customers yet. They appear as bookings come in."}</p>
      )}
    </div>
  );
}
