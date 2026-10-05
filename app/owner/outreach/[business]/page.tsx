import Link from "next/link";
import { requireOwner } from "@/lib/owner/access";
import { getBusiness, listMembers } from "@/lib/crm/query";
import type { Business, Contact, FollowUp } from "@/lib/crm/types";
import { BusinessForm } from "@/components/crm/business-form";
import { ContactForm } from "@/components/crm/contact-form";
import { ActivityForm } from "@/components/crm/activity-form";
import { Timeline } from "@/components/crm/timeline";
import { FollowUpForm } from "@/components/crm/follow-up-form";
import { ConvertClient } from "@/app/owner/clients/client-form";
export default async function BusinessDetail({
  params,
}: {
  params: Promise<{ business: string }>;
}) {
  const { business: id } = await params;
  const { context } = await requireOwner();
  const members = await listMembers(context);
  const now = new Date().toISOString();
  const audit = {
    id: "new",
    workspace_id: context.workspaceId,
    version: 1,
    created_at: now,
    updated_at: now,
    created_by: context.userId,
    updated_by: context.userId,
  };
  const data =
    id === "new"
      ? {
          business: {
            ...audit,
            origin: "outreach",
            name: "",
            location: "",
            industry: "",
            website: null,
            stage: "new",
            assigned_to: null,
            priority: "normal",
            tags: [],
            do_not_contact: false,
            archived: false,
            source_fields: {},
            import_batch_id: null,
            source_row: null,
            last_contact: null,
            next_follow_up: null,
          } as Business,
          contacts: [],
          activities: [],
          followUps: [],
        }
      : await getBusiness(context, id);
  const newContact = {
    ...audit,
    business_id: id,
    name: "",
    email: null,
    phone: null,
    is_primary: data.contacts.length === 0,
    source_fields: {},
  } as Contact;
  const newFollowUp = {
    ...audit,
    business_id: id,
    assigned_to: context.userId,
    due_at: now,
    instruction: "",
    state: "open",
  } as FollowUp;
  return (
    <>
      <Link className="owner-link" href="/owner/outreach">
        ← Outreach
      </Link>
      <div className="owner-page-head owner-section">
        <div>
          <p className="owner-eyebrow">Business record</p>
          <h1>{id === "new" ? "Add a business" : data.business.name}</h1>
          {data.business.do_not_contact ? (
            <span className="owner-badge owner-badge-danger">
              Do not contact
            </span>
          ) : null}
        </div>
      </div>
      <div className="owner-columns">
        <div>
          <section className="owner-panel">
            <div className="owner-panel-head">
              <h2>Business details</h2>
            </div>
            <div className="owner-panel-body">
              <BusinessForm business={data.business} members={members} />
            </div>
          </section>
          {id !== "new" ? (
            <>
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
                      <ContactForm business={id} contact={c} />
                    </details>
                  ))}
                  <details className="owner-contact">
                    <summary>Add contact</summary>
                    <ContactForm business={id} contact={newContact} />
                  </details>
                </div>
              </section>
              {Object.keys(data.business.source_fields).length ? (
                <section className="owner-panel owner-section">
                  <div className="owner-panel-head">
                    <h2>Original import fields</h2>
                    <span className="owner-muted owner-small">
                      Row {data.business.source_row}
                    </span>
                  </div>
                  <dl className="owner-extras">
                    {Object.entries(data.business.source_fields).map(
                      ([key, value]) => (
                        <div key={key}>
                          <dt>{key}</dt>
                          <dd>{String(value)}</dd>
                        </div>
                      ),
                    )}
                  </dl>
                </section>
              ) : null}
              <section className="owner-panel owner-section">
                <div className="owner-panel-head">
                  <h2>Team activity</h2>
                </div>
                <div className="owner-panel-body">
                  <Timeline
                    activities={data.activities}
                    timezone={context.timezone}
                  />
                  <p className="owner-muted owner-small">
                    Showing the latest 100 entries.
                  </p>
                </div>
              </section>
            </>
          ) : null}
        </div>
        {id !== "new" ? (
          <div>
            {data.business.stage === "won" ? (
              <ConvertClient business={data.business} />
            ) : null}
            <section className="owner-panel">
              <div className="owner-panel-head">
                <h2>Log a conversation or note</h2>
              </div>
              <div className="owner-panel-body">
                <ActivityForm
                  business={id}
                  timezone={context.timezone}
                  doNotContact={
                    data.business.do_not_contact || data.business.archived
                  }
                />
              </div>
            </section>
            <section className="owner-panel owner-section">
              <div className="owner-panel-head">
                <h2>Follow-ups</h2>
              </div>
              <div className="owner-panel-body">
                {data.followUps.map((f) => (
                  <details className="owner-contact" key={f.id}>
                    <summary>
                      {f.instruction}{" "}
                      <span className="owner-badge">{f.state}</span>
                    </summary>
                    <FollowUpForm
                      followUp={f}
                      members={members}
                      timezone={context.timezone}
                      blocked={
                        data.business.do_not_contact || data.business.archived
                      }
                    />
                  </details>
                ))}
                <details
                  className="owner-contact"
                  open={data.followUps.length === 0}
                >
                  <summary>Add follow-up</summary>
                  <FollowUpForm
                    followUp={newFollowUp}
                    members={members}
                    timezone={context.timezone}
                    blocked={
                      data.business.do_not_contact || data.business.archived
                    }
                  />
                </details>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </>
  );
}
