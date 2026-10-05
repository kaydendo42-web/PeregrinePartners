import Link from "next/link";
import type { Overview } from "@/lib/owner/overview";
import { stages, stageLabels } from "@/lib/crm/types";
import { displayTime, localDate } from "@/lib/crm/time";
import { formatMinor } from "@/lib/crm/money";
import { Timeline } from "@/components/crm/timeline";
export function OverviewView({
  data,
  timezone,
}: {
  data: Overview;
  timezone: string;
}) {
  return (
    <>
      <div className="owner-page-head">
        <div>
          <p className="owner-eyebrow">Peregrine Partners</p>
          <h1>Overview</h1>
          <p className="owner-muted">
            Your clients, outreach and next steps, together.
          </p>
        </div>
        <div className="owner-actions">
          <span className="owner-date">
            {localDate(new Date().toISOString(), timezone)}
          </span>
          <Link className="owner-button" href="/owner/outreach/import">
            Import businesses ↗
          </Link>
        </div>
      </div>
      <div className="owner-grid">
        {[
          {
            label: "Active clients",
            value: data.clients,
            caption: "Client accounts",
            href: "/owner/clients",
          },
          {
            label: "Outreach businesses",
            value: data.prospects,
            caption: "Across your pipeline",
            href: "/owner/outreach",
          },
          {
            label: "Follow-ups due",
            value: data.due,
            caption: "Ready for a next step",
            href: "/owner/follow-ups?period=overdue",
          },
          {
            label: "Replies received",
            value: data.replies,
            caption: "Businesses in Replied",
            href: "/owner/outreach?stage=replied",
          },
        ].map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="owner-panel owner-stat"
          >
            <p className="owner-stat-label">{card.label}</p>
            <p className="owner-stat-value">{card.value}</p>
            <p className="owner-stat-caption">
              {card.caption} <span aria-hidden="true">↗</span>
            </p>
          </Link>
        ))}
      </div>
      <section className="owner-panel owner-section">
        <div className="owner-panel-head">
          <h2>Your outreach pipeline</h2>
          <Link className="owner-link" href="/owner/outreach?view=board">
            Open board →
          </Link>
        </div>
        <div className="owner-pipeline">
          {stages.map((stage, i) => (
            <Link key={stage} href={"/owner/outreach?stage=" + stage}>
              <span
                className="owner-pipeline-step"
                style={{ opacity: 0.4 + i * 0.08 }}
              />
              <strong>{data.stages[stage] ?? 0}</strong>
              <span>{stageLabels[stage]}</span>
            </Link>
          ))}
        </div>
        <div className="owner-panel-foot">
          <span>{data.unassigned} businesses need an owner</span>
          <Link href="/owner/outreach?owner=unassigned">Assign owners →</Link>
        </div>
      </section>
      <div className="owner-columns">
        <div>
          <section className="owner-panel">
            <div className="owner-panel-head">
              <h2>Next follow-ups</h2>
              <Link className="owner-link" href="/owner/follow-ups?period=all">
                View all →
              </Link>
            </div>
            <div className="owner-panel-body">
              {data.followUps.length ? (
                <ul className="owner-work-list">
                  {data.followUps.map((f) => (
                    <li key={f.id}>
                      <div>
                        <Link href={"/owner/outreach/" + f.business_id}>
                          {f.business?.name}
                        </Link>
                        <p>{f.instruction}</p>
                      </div>
                      <time dateTime={f.due_at}>
                        {displayTime(f.due_at, timezone)}
                      </time>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="owner-empty owner-empty-compact">
                  <h3>No next steps yet.</h3>
                  <p>Add a follow-up after your first conversation.</p>
                  <Link className="owner-link" href="/owner/outreach">
                    Open outreach →
                  </Link>
                </div>
              )}
            </div>
          </section>
          <section className="owner-panel owner-section">
            <div className="owner-panel-head">
              <h2>Recent team activity</h2>
            </div>
            <div className="owner-panel-body">
              <Timeline activities={data.activity} timezone={timezone} />
            </div>
          </section>
        </div>
        <div>
          <section className="owner-panel">
            <div className="owner-panel-head">
              <h2>Client tools</h2>
              <Link className="owner-link" href="/owner/tools">
                Catalogue →
              </Link>
            </div>
            <div className="owner-panel-body">
              <ul className="owner-tool-list">
                {data.tools.map((t) => (
                  <li key={t.id}>
                    <span>{t.name}</span>
                    <strong>{t.clients}</strong>
                    <span className="owner-muted">active records</span>
                  </li>
                ))}
              </ul>
              {!data.tools.length ? (
                <p className="owner-muted owner-small">
                  Add a tool to your catalogue to start tracking subscriptions.
                </p>
              ) : null}
            </div>
          </section>
          <section className="owner-panel owner-section">
            <div className="owner-panel-head">
              <h2>Manual billing</h2>
            </div>
            <div className="owner-panel-body">
              <p className="owner-privacy-note">
                Balances from records entered by the team.
              </p>
              {Object.entries(data.balances).map(([currency, minor]) => (
                <div className="owner-balance" key={currency}>
                  <span>Outstanding · {currency}</span>
                  <strong>{formatMinor(minor, currency)}</strong>
                  <small>
                    {data.overdue[currency] && data.overdue[currency] !== "0"
                      ? formatMinor(data.overdue[currency], currency) +
                        " overdue"
                      : "No overdue balance"}
                  </small>
                </div>
              ))}
              {!Object.keys(data.balances).length ? (
                <p className="owner-muted owner-small">
                  No billing records yet.
                </p>
              ) : null}
            </div>
          </section>
          {data.clients === 0 && data.prospects === 0 ? (
            <section className="owner-panel owner-section owner-panel-body">
              <h2>Your workspace starts here.</h2>
              <p className="owner-muted owner-small">
                Import your business list for shared outreach, or add a client
                you already work with.
              </p>
              <Link
                className="owner-button owner-button-secondary"
                href="/owner/clients"
              >
                Add your first client
              </Link>
            </section>
          ) : null}
        </div>
      </div>
    </>
  );
}
