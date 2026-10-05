import { requireOwner } from "@/lib/owner/access";
import { listTools } from "@/lib/owner/tools";
import { ToolForm } from "./tool-form";
export default async function Tools() {
  const { context } = await requireOwner();
  const tools = await listTools(context);
  return (
    <>
      <div className="owner-page-head">
        <div>
          <p className="owner-eyebrow">The Peregrine toolkit</p>
          <h1>Tools</h1>
          <p className="owner-muted">
            Manage what you offer. Track each client’s tools from their account.
          </p>
        </div>
        <a href="#add-tool" className="owner-button">
          Add tool ↗
        </a>
      </div>
      <section className="owner-panel">
        <div className="owner-panel-head">
          <h2>Tool catalogue</h2>
          <span className="owner-muted owner-small">
            Availability is separate from subscriptions
          </span>
        </div>
        <div className="owner-panel-body">
          {tools.map((t) => (
            <details className="owner-contact" key={t.id}>
              <summary>
                {t.name}{" "}
                <span className="owner-badge">
                  {t.archived ? "Archived" : t.availability}
                </span>
              </summary>
              <ToolForm record={{ ...t }} />
            </details>
          ))}
          {!tools.length ? (
            <p className="owner-muted">Add the first tool you offer.</p>
          ) : null}
        </div>
      </section>
      <section id="add-tool" className="owner-panel owner-section">
        <div className="owner-panel-head">
          <h2>Add a tool</h2>
        </div>
        <div className="owner-panel-body">
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
      </section>
    </>
  );
}
