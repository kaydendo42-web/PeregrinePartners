import { floor, requireUser, venueBySlug } from "@/lib/console/data";
import { NotificationsForm } from "./notifications";

/**
 * What Peregrine knows about the venue. Notifications are the venue's to
 * change; the rest Peregrine changes on request.
 */
export default async function SettingsPage({ params }: { params: Promise<{ venue: string }> }) {
  const { venue: slug } = await params;
  const venue = await venueBySlug(slug);
  const { client, user } = await requireUser();
  const [{ sections, tables }, members] = await Promise.all([
    floor(venue.id),
    client ? client.from("venue_members").select("user_id, role").eq("venue_id", venue.id) : { data: [{}] },
  ]);
  const seats = tables.reduce((n, t) => n + t.seats, 0);

  return (
    <div className="console-page console-settings">
      <section>
        <h2 className="console-h2">Notifications</h2>
        <NotificationsForm slug={slug} on={venue.notify_bookings ?? true} email={venue.notify_email ?? null} />
      </section>
      <section>
        <h2 className="console-h2">Venue</h2>
        <dl className="console-dl">
          <dt>Name</dt>
          <dd>{venue.name}</dd>
          <dt>Phone</dt>
          <dd>{venue.phone ?? "—"}</dd>
          <dt>Time zone</dt>
          <dd>{venue.timezone}</dd>
          <dt>Website</dt>
          <dd>{venue.website_url ? <a href={venue.website_url}>{venue.website_url}</a> : "—"}</dd>
          <dt>Booking page</dt>
          <dd>{venue.booking_url ? <a href={venue.booking_url}>{venue.booking_url}</a> : "—"}</dd>
        </dl>
      </section>
      <section>
        <h2 className="console-h2">Floor</h2>
        <p className="console-muted">
          {tables.length} tables, {seats} seats, in {sections.map((s) => s.name).join(", ")}.
        </p>
      </section>
      <section>
        <h2 className="console-h2">People</h2>
        <p className="console-muted">
          {(members.data ?? []).length} {(members.data ?? []).length === 1 ? "person has" : "people have"} access.
          You are signed in as {user.email}.
        </p>
      </section>
      <p className="console-muted">To change your venue details, floor or who has access, get in touch with Peregrine Office.</p>
    </div>
  );
}
