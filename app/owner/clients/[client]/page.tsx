import Link from "next/link";
import { requireOwner } from "@/lib/owner/access";
import { getClient, visibleVenues } from "@/lib/owner/clients";
import { listTools } from "@/lib/owner/tools";
import { listMembers } from "@/lib/crm/query";
import { localDate } from "@/lib/crm/time";
import { invoiceState, formatMinor } from "@/lib/crm/money";
import type { Contact } from "@/lib/crm/types";
import { BusinessForm } from "@/components/crm/business-form";
import { ContactForm } from "@/components/crm/contact-form";
import { ActivityForm } from "@/components/crm/activity-form";
import { Timeline } from "@/components/crm/timeline";
import { ClientForm } from "../client-form";
import { ClientToolForm } from "../client-tools";
import { BillingForm } from "../billing-form";
export default async function ClientDetail({
  params,
}: {
  params: Promise<{ client: string }>;
}) {
  const { client: id } = await params;
  const { context } = await requireOwner();
  const [data, members, venues, tools] = await Promise.all([
    getClient(context, id),
    listMembers(context),
    visibleVenues(context),
    listTools(context),
  ]);
  const today = localDate(new Date().toISOString(), context.timezone);
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
        ← Clients
      </Link>
      <div className="owner-page-head owner-section">
        <div>
          <p className="owner-eyebrow">Client account</p>
          <h1>{data.business.name}</h1>
          <span className="owner-badge">{data.client.status}</span>
        </div>
        {data.business.origin === "outreach" ? (
          <Link
            className="owner-button owner-button-secondary"
            href={"/owner/outreach/" + data.business.id}
          >
            View outreach record
          </Link>
        ) : null}
      </div>
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
          <section className="owner-panel owner-section">
            <div className="owner-panel-head">
              <h2>Contacts</h2>
            </div>
            <div className="owner-panel-body">
              {data.contacts.map((c) => (
                <details className="owner-contact" key={c.id}>
                  <summary>
                    {c.name || c.email || c.phone || "Contact"}{" "}
                    {c.is_primary ? "· Primary" : ""}
                  </summary>
                  <ContactForm contact={c} business={data.business.id} />
                </details>
              ))}
              <details className="owner-contact">
                <summary>Add contact</summary>
                <ContactForm contact={newContact} business={data.business.id} />
              </details>
            </div>
          </section>
          <section className="owner-panel owner-section">
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
        </div>
        <div>
          <section className="owner-panel">
            <div className="owner-panel-head">
              <h2>Subscribed tools</h2>
            </div>
            <div className="owner-panel-body">
              <p className="owner-privacy-note">
                These records track agreed tools and terms. Access is configured
                separately.
              </p>
              {data.tools.map((t) => (
                <details className="owner-contact" key={t.id}>
                  <summary>
                    {t.tool?.name ?? "Tool"} · {t.status}{" "}
                    <small>
                      {t.amount_minor === null
                        ? "Fee not entered"
                        : formatMinor(t.amount_minor, t.currency) +
                          " / " +
                          t.cadence.replace("_", "-")}
                    </small>
                  </summary>
                  <ClientToolForm record={{ ...t }} tools={tools} />
                </details>
              ))}
              {!data.tools.length ? (
                <p className="owner-muted owner-small">
                  No tool subscriptions entered.
                </p>
              ) : null}
              <details className="owner-contact">
                <summary>Add subscribed tool</summary>
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
          <section className="owner-panel owner-section">
            <div className="owner-panel-head">
              <h2>Manual billing</h2>
            </div>
            <div className="owner-panel-body">
              <p className="owner-privacy-note">
                Record invoices and payments manually. No charges or reminders
                are sent.
              </p>
              {data.billing.map((b) => (
                <details className="owner-contact" key={b.id}>
                  <summary>
                    {b.reference}{" "}
                    <span className="owner-badge">
                      {invoiceState(b, today)}
                    </span>{" "}
                    <small>
                      {formatMinor(b.amount_minor - b.paid_minor, b.currency)}{" "}
                      outstanding
                    </small>
                  </summary>
                  <BillingForm record={{ ...b }} />
                </details>
              ))}
              {!data.billing.length ? (
                <p className="owner-muted owner-small">
                  No billing records entered.
                </p>
              ) : null}
              <details className="owner-contact">
                <summary>Add billing record</summary>
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
              <p className="owner-muted owner-small">
                Showing the latest 100 billing records.
              </p>
            </div>
          </section>
          <section className="owner-panel owner-section">
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
      </div>
    </>
  );
}
