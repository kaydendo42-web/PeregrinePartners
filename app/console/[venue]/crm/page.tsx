import Link from "next/link";
import {
  requireClientVenue,
  guestProfiles,
  guestTasks,
  bookingReport,
} from "@/lib/client-crm/data";
import { reportPeriod } from "@/lib/booking/report";
import { text } from "@/lib/crm/validation";
import { displayTime, localDate } from "@/lib/crm/time";
import { BookingReportView } from "@/components/owner/booking-report";
import { GuestTaskControls } from "@/components/crm/guest-entry-form";
export default async function GuestCrm({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<{
    q?: string;
    page?: string;
    tab?: string;
    state?: string;
    days?: string;
  }>;
}) {
  const [{ venue: slug }, p] = await Promise.all([params, searchParams]);
  const { venue } = await requireClientVenue(slug);
  const base = `/console/${slug}/crm`;
  const tab = p.tab === "tasks" ? "tasks" : "customers";
  const state =
    p.state === "done" || p.state === "cancelled" ? p.state : "open";
  const page =
    /^\d{1,5}$/.test(p.page ?? "") && Number(p.page) > 0 ? Number(p.page) : 1;
  const q = text(p.q ?? "", 300);
  const days = reportPeriod(p.days);
  const [profiles, tasks, report] = await Promise.all([
    tab === "customers" ? guestProfiles(slug, q, page) : null,
    tab === "tasks" ? guestTasks(slug, state, page) : null,
    tab === "customers" ? bookingReport(venue.id, days) : null,
  ]);
  const total = profiles?.total ?? tasks?.total ?? 0;
  const today = localDate(new Date().toISOString(), venue.timezone);
  return (
    <>
      <div className="owner-page-head">
        <div>
          <p className="owner-eyebrow">{venue.name}</p>
          <h1>Customer CRM</h1>
          <p className="owner-muted">
            Know your customers and keep track of the next conversation.
          </p>
        </div>
        <Link
          className="owner-button owner-button-secondary"
          href={`/console/${slug}/list`}
        >
          Booking diary →
        </Link>
      </div>
      <nav className="dash-tabs" aria-label="Customer CRM sections">
        <Link
          href={base}
          aria-current={tab === "customers" ? "page" : undefined}
        >
          Customers
        </Link>
        <Link
          href={base + "?tab=tasks"}
          aria-current={tab === "tasks" ? "page" : undefined}
        >
          Follow-ups
        </Link>
      </nav>
      {tab === "customers" && report ? (
        <>
          <form className="dash-period dash-period-right">
            <label htmlFor="guest-period">Booking period</label>
            <select id="guest-period" name="days" defaultValue={days}>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <button className="owner-button owner-button-secondary">
              Apply
            </button>
          </form>
          <BookingReportView report={report} compact />
        </>
      ) : null}
      <section className="owner-panel owner-section">
        <div className="owner-panel-head">
          <h2>
            {tab === "customers" ? "Customer profiles" : "Customer follow-ups"}
          </h2>
          <span className="owner-muted owner-small">
            {total} {tab === "customers" ? "profiles" : "tasks"}
          </span>
        </div>
        {tab === "customers" ? (
          <>
            <form className="owner-filters">
              <input type="hidden" name="days" value={days} />
              <label className="owner-field owner-filter-search">
                Search customers
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Name, email or phone"
                  maxLength={300}
                />
              </label>
              <button className="owner-button owner-button-secondary">
                Search
              </button>
            </form>
            {profiles?.rows.length ? (
              <div className="owner-table-scroll">
                <table className="owner-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Contact</th>
                      <th>Booking records</th>
                      <th>No-shows / cancellations</th>
                      <th>Latest booking</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.rows.map((c) => (
                      <tr key={c.booking_id}>
                        <td>
                          <Link
                            href={base + "/" + encodeURIComponent(c.booking_id)}
                            className="dash-client-name"
                          >
                            <span className="dash-client-avatar">
                              {c.name.slice(0, 1)}
                            </span>
                            {c.name}
                          </Link>
                        </td>
                        <td>{c.email ?? c.phone ?? "No contact details"}</td>
                        <td>{c.bookings}</td>
                        <td>
                          {c.no_shows} / {c.cancellations}
                        </td>
                        <td>{displayTime(c.last_booking, venue.timezone)}</td>
                        <td>
                          <Link
                            className="owner-link"
                            href={base + "/" + encodeURIComponent(c.booking_id)}
                          >
                            Open profile →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="owner-empty">
                <h3>
                  {q
                    ? "No matching customers"
                    : "Customers appear as bookings arrive"}
                </h3>
                <p>Open a customer profile to add notes and follow-up tasks.</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="owner-panel-body dash-task-filters">
              {["open", "done", "cancelled"].map((s) => (
                <Link
                  className="owner-badge"
                  aria-current={state === s ? "page" : undefined}
                  href={base + "?tab=tasks&state=" + s}
                  key={s}
                >
                  {s === "done"
                    ? "Completed"
                    : s === "open"
                      ? "Open"
                      : "Cancelled"}
                </Link>
              ))}
            </div>
            {tasks?.rows.length ? (
              <ul className="dash-guest-entries">
                {tasks.rows.map((t) => (
                  <li key={t.id}>
                    <div>
                      <Link
                        className="owner-link"
                        href={base + "/" + encodeURIComponent(t.booking_id)}
                      >
                        {t.booking.guest_name}
                      </Link>
                      <p>{t.body}</p>
                      <span
                        className="owner-badge"
                        data-stage={
                          t.state === "open" && t.due_on! < today
                            ? "lost"
                            : undefined
                        }
                      >
                        {t.due_on! < today && t.state === "open"
                          ? "Overdue · "
                          : "Due "}
                        {t.due_on}
                      </span>
                    </div>
                    <GuestTaskControls slug={slug} task={t} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="owner-empty">
                <h3>No {state} follow-ups</h3>
                <p>Add a dated follow-up from a customer profile.</p>
                <Link
                  className="owner-button owner-button-secondary"
                  href={base}
                >
                  Browse customers
                </Link>
              </div>
            )}
          </>
        )}
        <div className="owner-pagination">
          <span>
            {total} results · Page {page}
          </span>
          <div className="owner-actions">
            {page > 1 ? (
              <Link
                href={
                  "?" +
                  new URLSearchParams({
                    tab,
                    state,
                    q,
                    days: String(days),
                    page: String(page - 1),
                  })
                }
              >
                ← Previous
              </Link>
            ) : null}
            {page * 50 < total ? (
              <Link
                href={
                  "?" +
                  new URLSearchParams({
                    tab,
                    state,
                    q,
                    days: String(days),
                    page: String(page + 1),
                  })
                }
              >
                Next →
              </Link>
            ) : null}
          </div>
        </div>
      </section>
      <p className="owner-privacy-note">
        Profiles group bookings with the same email, or phone when email is
        absent. Bookings without contact details stay separate.
      </p>
    </>
  );
}
