import Link from "next/link";
import { requireOwner } from "@/lib/owner/access";
import { getClient, visibleVenues } from "@/lib/owner/clients";
import { listTools } from "@/lib/owner/tools";
import { listMembers } from "@/lib/crm/query";
import { localDate } from "@/lib/crm/time";
import { invoiceState, formatMinor } from "@/lib/crm/money";
import { bookingReport } from "@/lib/client-crm/data";
import { reportPeriod } from "@/lib/booking/report";
import { supabaseEnv } from "@/lib/supabase/server";
import type { Contact } from "@/lib/crm/types";
import { BusinessForm } from "@/components/crm/business-form";
import { ContactForm } from "@/components/crm/contact-form";
import { ActivityForm } from "@/components/crm/activity-form";
import { Timeline } from "@/components/crm/timeline";
import { BookingReportView } from "@/components/owner/booking-report";
import {
  WorkspaceLiveRefresh,
  LiveStatus,
} from "@/components/crm/live-refresh";
import { ClientForm } from "../client-form";
import { ClientToolForm } from "../client-tools";
import { BillingForm } from "../billing-form";
export default async function ClientDetail({
  params,
  searchParams,
}: {
  params: Promise<{ client: string }>;
  searchParams: Promise<{ tab?: string; days?: string }>;
}) {
  const [{ client: id }, p] = await Promise.all([params, searchParams]);
  const { context } = await requireOwner();
  const [data, members, venues, tools] = await Promise.all([
    getClient(context, id),
    listMembers(context),
    visibleVenues(context),
    listTools(context),
  ]);
  const today = localDate(new Date().toISOString(), context.timezone);
  const tab = ["account", "services", "billing", "activity"].includes(
    p.tab ?? "",
  )
    ? p.tab!
    : "dashboard";
  const days = reportPeriod(p.days);
  const venue = venues.find((v) => v.id === data.client.venue_id);
  const report =
    tab === "dashboard" && venue ? await bookingReport(venue.id, days) : null;
  const env = supabaseEnv()!;
  const newContact = {
    ...data.business,
    id: "new",
    business_id: data.business.id,
    version: 1,
    name: "",
    email: null,
    phone: null,
    is_primary: data.contacts.length === 0,
    source_fields: {},
  } as Contact;
  return (
    <>
      <Link className="owner-link" href="/owner/clients">
        ← Client accounts
      </Link>
      <div className="owner-page-head owner-section">
        <div>
          <p className="owner-eyebrow">Client workspace</p>
          <h1>{data.business.name}</h1>
          <div className="owner-actions">
            <span
              className="owner-badge"
              data-stage={data.client.status === "active" ? "won" : undefined}
            >
              {data.client.status}
            </span>
            <span className="owner-muted owner-small">
              {members.find((m) => m.user_id === data.client.relationship_owner)
                ?.display_name ?? "Relationship owner unassigned"}
            </span>
          </div>
        </div>
        <div className="owner-actions">
          {venue ? (
            <Link
              className="owner-button"
              href={"/console/" + venue.slug + "/crm"}
            >
              Open client CRM →
            </Link>
          ) : null}
          {data.business.origin === "outreach" ? (
            <Link
              className="owner-button owner-button-secondary"
              href={"/owner/outreach/" + data.business.id}
            >
              Outreach record
            </Link>
          ) : null}
        </div>
      </div>
      <nav className="dash-tabs" aria-label="Client account sections">
        {[
          ["dashboard", "Dashboard"],
          ["account", "Account & contacts"],
          ["services", "Services"],
          ["billing", "Billing"],
          ["activity", "Activity"],
        ].map(([value, label]) => (
          <Link
            key={value}
            href={"?tab=" + value}
            aria-current={tab === value ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
      {tab === "dashboard" ? (
        venue && report ? (
          <WorkspaceLiveRefresh
            workspaceId={venue.id}
            userId={context.userId}
            url={env.url}
            anonKey={env.key}
            scope="venue"
            destination={"/owner/clients/" + id}
          >
            <div className="dash-tab-line">
              <div className="owner-actions">
                <LiveStatus label="Bookings" />
                <span className="owner-muted owner-small">{venue.name}</span>
              </div>
              <form className="dash-period">
                <input type="hidden" name="tab" value="dashboard" />
                <label htmlFor="client-period">Period</label>
                <select id="client-period" name="days" defaultValue={days}>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
                <button className="owner-button owner-button-secondary">
                  Apply
                </button>
              </form>
            </div>
            <BookingReportView
              report={report}
              actions={
                <Link
                  className="owner-link"
                  href={"/console/" + venue.slug + "/list"}
                >
                  Booking diary →
                </Link>
              }
            />
            <div className="dash-service-grid owner-section">
              <section className="owner-panel owner-panel-body">
                <span className="dash-service-symbol">◫</span>
                <h2>Customer CRM</h2>
                <p className="owner-muted">
                  Customer profiles, booking history, notes and follow-up tasks.
                </p>
                <Link
                  className="owner-button owner-button-secondary"
                  href={"/console/" + venue.slug + "/crm"}
                >
                  Open customer workspace →
                </Link>
              </section>
              <section className="owner-panel owner-panel-body">
                <span className="dash-service-symbol">↗</span>
                <h2>Website, payments & advertising</h2>
                <p className="owner-muted">
                  Reporting for these services needs a data connection.
                </p>
                <Link className="owner-link" href="?tab=services">
                  Review client services →
                </Link>
              </section>
            </div>
          </WorkspaceLiveRefresh>
        ) : (
          <section className="owner-panel owner-empty">
            <h2>
              {data.client.venue_id
                ? "Booking access is unavailable"
                : "Connect this client’s bookings"}
            </h2>
            <p>
              {data.client.venue_id
                ? "Your login needs access to the linked booking venue before its reports can appear."
                : "Choose an existing booking venue in the account tab to see its live data here."}
            </p>
            <Link className="owner-button" href="?tab=account">
              Open account settings
            </Link>
          </section>
        )
      ) : null}
      {tab === "account" ? (
        <div className="owner-columns">
          <div>
            <section className="owner-panel">
              <div className="owner-panel-head">
                <h2>Client relationship</h2>
              </div>
              <div className="owner-panel-body">
                <ClientForm
                  record={{ ...data.client }}
                  members={members}
                  venues={venues}
                />
              </div>
            </section>
            <section className="owner-panel owner-section">
              <div className="owner-panel-head">
                <h2>Business details</h2>
              </div>
              <div className="owner-panel-body">
                <BusinessForm business={data.business} members={members} />
              </div>
            </section>
          </div>
          <section className="owner-panel">
            <div className="owner-panel-head">
              <h2>Contacts</h2>
            </div>
            <div className="owner-panel-body">
              {data.contacts.map((c) => (
                <details className="owner-contact" key={c.id}>
                  <summary>
                    {c.name || c.email || c.phone || "Contact"}
                    {c.is_primary ? " · Primary" : ""}
                  </summary>
                  <ContactForm contact={c} business={data.business.id} />
                </details>
              ))}
              <details className="owner-contact">
                <summary>+ Add contact</summary>
                <ContactForm contact={newContact} business={data.business.id} />
              </details>
            </div>
          </section>
        </div>
      ) : null}
      {tab === "services" ? (
        <section className="owner-panel">
          <div className="owner-panel-head">
            <h2>Subscribed services</h2>
            <span className="owner-badge">Agreed terms</span>
          </div>
          <div className="owner-panel-body">
            <p className="owner-privacy-note">
              Record what the client subscribes to. Reporting connections and
              access are configured separately.
            </p>
            {data.tools.map((t) => (
              <details className="owner-contact" key={t.id}>
                <summary>
                  {t.tool?.name ?? "Tool"} · {t.status} ·{" "}
                  {t.amount_minor === null
                    ? "Fee not entered"
                    : formatMinor(t.amount_minor, t.currency) +
                      " / " +
                      t.cadence.replace("_", "-")}
                </summary>
                <ClientToolForm record={{ ...t }} tools={tools} />
              </details>
            ))}
            {!data.tools.length ? (
              <p className="owner-muted">
                No service subscriptions recorded yet.
              </p>
            ) : null}
            <details className="owner-contact">
              <summary>+ Add subscribed service</summary>
              <ClientToolForm
                record={{
                  id: "new",
                  version: 1,
                  client_id: id,
                  tool_id: "",
                  status: "active",
                  amount_minor: null,
                  currency: "AUD",
                  cadence: "monthly",
                  starts_on: today,
                  ends_on: "",
                }}
                tools={tools}
              />
            </details>
          </div>
        </section>
      ) : null}
      {tab === "billing" ? (
        <section className="owner-panel">
          <div className="owner-panel-head">
            <h2>Billing records</h2>
            <span className="owner-badge">Manual</span>
          </div>
          <div className="owner-panel-body">
            <p className="owner-privacy-note">
              Record invoices and payments manually. No charges or reminders are
              sent.
            </p>
            {data.billing.map((b) => (
              <details className="owner-contact" key={b.id}>
                <summary>
                  {b.reference}{" "}
                  <span className="owner-badge">{invoiceState(b, today)}</span>{" "}
                  · {formatMinor(b.amount_minor - b.paid_minor, b.currency)}{" "}
                  outstanding
                </summary>
                <BillingForm record={{ ...b }} />
              </details>
            ))}
            {!data.billing.length ? (
              <p className="owner-muted">No billing records entered.</p>
            ) : null}
            <details className="owner-contact">
              <summary>+ Add billing record</summary>
              <BillingForm
                record={{
                  id: "new",
                  version: 1,
                  client_id: id,
                  reference: "",
                  currency: "AUD",
                  paid_minor: 0,
                  due_on: today,
                }}
              />
            </details>
            <p className="owner-small owner-muted">
              Showing the latest 100 billing records.
            </p>
          </div>
        </section>
      ) : null}
      {tab === "activity" ? (
        <div className="owner-columns">
          <section className="owner-panel">
            <div className="owner-panel-head">
              <h2>Team activity</h2>
            </div>
            <div className="owner-panel-body">
              <Timeline
                activities={data.activities}
                timezone={context.timezone}
              />
            </div>
          </section>
          <section className="owner-panel">
            <div className="owner-panel-head">
              <h2>Add a note or conversation</h2>
            </div>
            <div className="owner-panel-body">
              <ActivityForm
                business={data.business.id}
                timezone={context.timezone}
                doNotContact={
                  data.business.do_not_contact || data.business.archived
                }
              />
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
