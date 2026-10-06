import Link from "next/link";
import { requireClientVenue, guestProfile } from "@/lib/client-crm/data";
import { displayTime } from "@/lib/crm/time";
import {
  GuestEntryForm,
  GuestTaskControls,
} from "@/components/crm/guest-entry-form";
export default async function CustomerProfile({
  params,
}: {
  params: Promise<{ venue: string; booking: string }>;
}) {
  const { venue: slug, booking } = await params;
  const [{ venue }, data] = await Promise.all([
    requireClientVenue(slug),
    guestProfile(slug, booking),
  ]);
  const base = `/console/${slug}/crm`;
  return (
    <>
      <Link className="owner-link" href={base}>
        ← Customers
      </Link>
      <div className="owner-page-head owner-section">
        <div>
          <p className="owner-eyebrow">Customer profile</p>
          <h1>{data.profile.name}</h1>
          <p className="owner-muted">
            {data.profile.email ?? data.profile.phone ?? "No contact details"} ·{" "}
            {data.booking_count} booking records
          </p>
        </div>
      </div>
      <div className="owner-columns">
        <div>
          <section className="owner-panel">
            <div className="owner-panel-head">
              <h2>Notes & follow-ups</h2>
            </div>
            {data.entries.length ? (
              <ul className="dash-guest-entries">
                {data.entries.map((e) => (
                  <li key={e.id}>
                    <div>
                      <span className="owner-badge">
                        {e.kind === "note"
                          ? "Customer note"
                          : e.state === "done"
                            ? "Completed task"
                            : e.state === "cancelled"
                              ? "Cancelled task"
                              : "Open task"}
                      </span>
                      <p>{e.body}</p>
                      <span className="owner-muted owner-small">
                        {displayTime(e.created_at, venue.timezone)}
                        {e.due_on ? " · Due " + e.due_on : ""}
                      </span>
                    </div>
                    {e.kind === "task" ? (
                      <GuestTaskControls slug={slug} task={e} />
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="owner-empty owner-empty-compact">
                <h3>No customer notes yet</h3>
                <p>Keep useful details and next steps together for the team.</p>
              </div>
            )}
          </section>
          <section className="owner-panel owner-section">
            <div className="owner-panel-head">
              <h2>Booking history</h2>
              <span className="owner-muted owner-small">Latest 100</span>
            </div>
            <div className="owner-table-scroll">
              <table className="owner-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Guests</th>
                    <th>Status</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {data.history.map((b) => (
                    <tr key={b.id}>
                      <td>{displayTime(b.starts_at, venue.timezone)}</td>
                      <td>{b.party_size}</td>
                      <td>
                        <span className="owner-badge">
                          {b.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td>{b.source.replaceAll("_", " ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        <section className="owner-panel">
          <div className="owner-panel-head">
            <h2>Add a note or follow-up</h2>
          </div>
          <div className="owner-panel-body">
            <GuestEntryForm slug={slug} booking={booking} />
          </div>
        </section>
      </div>
      <p className="owner-privacy-note">
        Showing the latest 100 notes and tasks. Booking details remain managed
        in the booking diary.
      </p>
    </>
  );
}
