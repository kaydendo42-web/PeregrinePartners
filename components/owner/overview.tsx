import Link from "next/link";
import { BRAND_NAME } from "@/lib/brand";
import type { Overview } from "@/lib/owner/overview";
import { stages, stageLabels } from "@/lib/crm/types";
import { displayTime } from "@/lib/crm/time";
import { formatMinor } from "@/lib/crm/money";
import { Timeline } from "@/components/crm/timeline";
import { BookingReportView } from "./booking-report";
import { DashboardIcon } from "./icon";
export function OverviewView({
  data,
  timezone,
  days = 30,
}: {
  data: Overview;
  timezone: string;
  days?: number;
}) {
  const total = stages.reduce((sum, s) => sum + (data.stages[s] ?? 0), 0);
  const account = data.accounts?.find((a) => a.report);
  return (
    <>
      <div className="owner-page-head">
        <div>
          <p className="owner-eyebrow">{BRAND_NAME} · Agency</p>
          <h1>Agency dashboard</h1>
          <p className="owner-muted">
            Your clients, pipeline and priorities in one place.
          </p>
        </div>
        <div className="owner-actions">
          <Link
            className="owner-button owner-button-secondary"
            href="/owner/clients#add-client"
          >
            + Add client
          </Link>
          <Link className="owner-button" href="/owner/outreach/import">
            Import businesses
          </Link>
        </div>
      </div>
      <div className="dash-tab-line">
        <span className="dash-tab-active">Business overview</span>
        <form className="dash-period">
          <label htmlFor="agency-period">Booking period</label>
          <select name="days" id="agency-period" defaultValue={days}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <button className="owner-button owner-button-secondary">Apply</button>
        </form>
      </div>
      <div className="owner-grid dash-metrics">
        {[
          {
            label: "Active clients",
            value: data.clients,
            caption: "Client accounts",
            href: "/owner/clients",
            icon: "clients",
          },
          {
            label: "Outreach businesses",
            value: data.prospects,
            caption: "Across your sales pipeline",
            href: "/owner/outreach",
            icon: "pipeline",
          },
          {
            label: "Follow-ups due",
            value: data.due,
            caption: "Open tasks needing attention",
            href: "/owner/follow-ups?period=overdue",
            icon: "tasks",
          },
          {
            label: "Replies received",
            value: data.replies,
            caption: "Businesses in Replied",
            href: "/owner/outreach?stage=replied",
            icon: "replies",
          },
        ].map((c) => (
          <Link className="owner-panel owner-stat" href={c.href} key={c.label}>
            <span
              className="dash-stat-icon"
              data-icon={c.icon}
              aria-hidden="true"
            >
              <DashboardIcon kind={c.icon} />
            </span>
            <p className="owner-stat-label">{c.label}</p>
            <p className="owner-stat-value">
              {c.value.toLocaleString("en-AU")}
            </p>
            <p className="owner-stat-caption">
              {c.caption}
              <span aria-hidden="true">→</span>
            </p>
          </Link>
        ))}
      </div>
      <div className="dash-primary-grid">
        <section className="owner-panel">
          <div className="owner-panel-head">
            <div>
              <h2>Outreach pipeline</h2>
              <p className="owner-muted owner-small">
                {total.toLocaleString("en-AU")} businesses · current stages
              </p>
            </div>
            <Link className="owner-link" href="/owner/outreach?view=board">
              View board →
            </Link>
          </div>
          <div className="dash-pipeline-bars">
            {stages.map((s, i) => (
              <Link href={"/owner/outreach?stage=" + s} key={s}>
                <span
                  className="dash-stage-dot"
                  style={{ background: `var(--stage-${i})` }}
                />{" "}
                <span>{stageLabels[s]}</span>
                <div>
                  <i
                    style={{
                      width: `${((data.stages[s] ?? 0) / Math.max(total, 1)) * 100}%`,
                      background: `var(--stage-${i})`,
                    }}
                  />
                </div>
                <strong>{data.stages[s] ?? 0}</strong>
              </Link>
            ))}
          </div>
          <div className="owner-panel-foot">
            <span>{data.unassigned} unassigned</span>
            <Link href="/owner/outreach?owner=unassigned">Assign owners →</Link>
          </div>
        </section>
        <section className="owner-panel">
          <div className="owner-panel-head">
            <h2>Needs attention</h2>
            <Link className="owner-link" href="/owner/follow-ups">
              All tasks →
            </Link>
          </div>
          <div className="dash-attention">
            <Link href="/owner/follow-ups?period=overdue">
              <span className="dash-attention-icon">
                <DashboardIcon kind="tasks" />
              </span>
              <div>
                <strong>Follow-ups due</strong>
                <p>Keep your next conversations moving.</p>
              </div>
              <b>{data.due}</b>
            </Link>
            <Link href="/owner/outreach?stage=replied">
              <span className="dash-attention-icon">
                <DashboardIcon kind="replies" />
              </span>
              <div>
                <strong>Replies to review</strong>
                <p>Move a conversation to its next stage.</p>
              </div>
              <b>{data.replies}</b>
            </Link>
            <Link href="/owner/outreach?owner=unassigned">
              <span className="dash-attention-icon">
                <DashboardIcon kind="clients" />
              </span>
              <div>
                <strong>Unassigned businesses</strong>
                <p>Give each prospect a point of contact.</p>
              </div>
              <b>{data.unassigned}</b>
            </Link>
          </div>
          <div className="dash-quick-start">
            <strong>
              {data.prospects > 0 ? "Start your outreach" : "Grow your pipeline"}
            </strong>
            <p>
              {data.prospects > 0
                ? "Work through your Top 100, assign an owner and record each conversation."
                : "Import your ranked list, then work through Top 100."}
            </p>
            <Link
              className="owner-button owner-button-secondary"
              href={
                data.prospects > 0
                  ? "/owner/outreach?tag=top-100&sort=source_row"
                  : "/owner/outreach/import"
              }
            >
              {data.prospects > 0 ? "Open Top 100 →" : "Import businesses →"}
            </Link>
          </div>
        </section>
      </div>
      <section className="owner-panel owner-section">
        <div className="owner-panel-head">
          <div>
            <h2>Client accounts</h2>
            <p className="owner-muted owner-small">
              Recently updated accounts · bookings in the selected period
            </p>
          </div>
          <Link className="owner-link" href="/owner/clients">
            All clients →
          </Link>
        </div>
        {data.accounts?.length ? (
          <div className="owner-table-scroll">
            <table className="owner-table dash-client-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Account</th>
                  <th>Bookings</th>
                  <th>Booked guests</th>
                  <th>Reporting access</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.accounts.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <Link
                        href={"/owner/clients/" + a.id}
                        className="dash-client-name"
                      >
                        <span className="dash-client-avatar">
                          {a.name.slice(0, 1)}
                        </span>
                        {a.name}
                      </Link>
                    </td>
                    <td>
                      <span
                        className="owner-badge"
                        data-stage={a.status === "active" ? "won" : undefined}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td>{a.report?.bookings ?? "—"}</td>
                    <td>{a.report?.guests ?? "—"}</td>
                    <td>
                      <span
                        className="dash-connection"
                        data-connected={Boolean(a.report)}
                      >
                        {a.report ? "Bookings available" : "No booking report"}
                      </span>
                    </td>
                    <td>
                      <Link
                        className="owner-link"
                        href={"/owner/clients/" + a.id}
                      >
                        Open dashboard →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="owner-empty owner-empty-compact">
            <h3>Add your first client account</h3>
            <p>
              Client performance appears here once its booking venue is linked.
            </p>
            <Link
              className="owner-button owner-button-secondary"
              href="/owner/clients#add-client"
            >
              Add client
            </Link>
          </div>
        )}
      </section>
      {account?.report ? (
        <BookingReportView
          report={account.report}
          compact
          actions={
            <Link className="owner-link" href={"/owner/clients/" + account.id}>
              {account.name} →
            </Link>
          }
        />
      ) : null}
      <div className="owner-columns">
        <div>
          <section className="owner-panel">
            <div className="owner-panel-head">
              <h2>Upcoming follow-ups</h2>
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
                  <h3>No follow-ups scheduled</h3>
                  <p>Add a next step after a conversation.</p>
                  <Link className="owner-link" href="/owner/outreach">
                    Open outreach →
                  </Link>
                </div>
              )}
            </div>
          </section>
          <section className="owner-panel owner-section">
            <div className="owner-panel-head">
              <h2>Team activity</h2>
            </div>
            <div className="owner-panel-body">
              <Timeline activities={data.activity} timezone={timezone} />
            </div>
          </section>
        </div>
        <div>
          <section className="owner-panel">
            <div className="owner-panel-head">
              <h2>Client services</h2>
              <Link className="owner-link" href="/owner/tools">
                Manage →
              </Link>
            </div>
            <div className="owner-panel-body">
              <ul className="owner-tool-list">
                {data.tools.map((t) => (
                  <li key={t.id}>
                    <span>{t.name}</span>
                    <strong>{t.clients}</strong>
                    <span className="owner-muted">active subscriptions</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
          <section className="owner-panel owner-section">
            <div className="owner-panel-head">
              <h2>Outstanding billing</h2>
              <span className="owner-badge">Manual records</span>
            </div>
            <div className="owner-panel-body">
              {Object.entries(data.balances).map(([currency, minor]) => (
                <div className="owner-balance" key={currency}>
                  <span>{currency} · Outstanding</span>
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
                  Add agreed invoices in a client’s billing tab to track
                  balances.
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
