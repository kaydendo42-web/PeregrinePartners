import Link from "next/link";
import { requireOwner } from "@/lib/owner/access";
import { listTools } from "@/lib/owner/tools";
import { ToolForm } from "./tool-form";
import { AgencyHeading } from "@/components/owner/agency-presentation";
const descriptions: Record<string, string> = {
  bookings: "Booking diaries, floor plans and reports from linked venues.",
  crm: "Customer profiles, booking history, notes and follow-up tasks.",
  website:
    "Track your website service agreements. Traffic reporting needs a connection.",
  payments:
    "Track agreed payment services. Processor reporting needs a connection.",
  advertising:
    "Track advertising services. Campaign reporting needs a connection.",
};
export default async function Tools() {
  const { context, client } = await requireOwner();
  const [tools, summary] = await Promise.all([
    listTools(context),
    client.rpc("crm_overview", { p_workspace: context.workspaceId }),
  ]);
  if (summary.error) throw new Error("Could not load service subscriptions.");
  const usage = summary.data.tools as { id: string; clients: number }[];
  return (
    <>
      <AgencyHeading
        section="tools"
        title="Services & tools"
        description="What you offer, who subscribes and what each tool does."
      >
        <Link
          className="owner-button owner-button-secondary"
          href="/owner/clients"
        >
          Manage client services →
        </Link>
      </AgencyHeading>
      <div className="dash-tool-cards">
        {tools.map((t) => (
          <section
            className="owner-panel dash-tool-card"
            data-tool={t.slug}
            key={t.id}
          >
            <div className="owner-panel-body">
              <span className="dash-service-symbol" aria-hidden="true">
                {t.slug === "bookings" ? "▦" : t.slug === "crm" ? "◫" : "↗"}
              </span>
              <h2>{t.name}</h2>
              <span
                className="owner-badge"
                data-stage={
                  t.availability === "available" && !t.archived
                    ? "won"
                    : undefined
                }
              >
                {t.archived
                  ? "Archived"
                  : t.availability === "available"
                    ? "Available"
                    : "Planned"}
              </span>
              <p>
                {descriptions[t.slug] ??
                  "Track this service and its agreed terms on client accounts."}
              </p>
              <div className="owner-panel-foot">
                <span>Active subscriptions</span>
                <strong>
                  {usage.find((u) => u.id === t.id)?.clients ?? 0}
                </strong>
              </div>
              <details>
                <summary>Edit service</summary>
                <ToolForm record={{ ...t }} />
              </details>
            </div>
          </section>
        ))}
      </div>
      <details
        id="add-tool"
        className="owner-panel owner-section owner-panel-body"
      >
        <summary className="owner-link">+ Add another service</summary>
        <div className="owner-section">
          <ToolForm
            record={{
              id: "new",
              version: 1,
              name: "",
              slug: "",
              availability: "planned",
              archived: false,
            }}
          />
        </div>
      </details>
      <p className="owner-privacy-note">
        Subscription records track agreed services. Each client dashboard shows
        which reports are actually available.
      </p>
    </>
  );
}
