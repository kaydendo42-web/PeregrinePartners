import type { BusinessQuery, Member } from "@/lib/crm/types";
import { stages, stageLabels } from "@/lib/crm/types";
export function Filters({
  query,
  members,
}: {
  query: BusinessQuery;
  members: Member[];
}) {
  return (
    <form
      key={JSON.stringify(query)}
      className="owner-filters"
      action="/owner/outreach"
    >
      <input type="hidden" name="view" value={query.view} />
      {query.stopped ? <input type="hidden" name="stopped" value="1" /> : null}
      <label className="owner-field owner-filter-search">
        Search businesses
        <input name="q" defaultValue={query.q} placeholder="Business name" />
      </label>
      <label className="owner-field">
        Stage
        <select name="stage" defaultValue={query.stage ?? ""}>
          <option value="">All stages</option>
          {stages.map((s) => (
            <option key={s} value={s}>
              {stageLabels[s]}
            </option>
          ))}
        </select>
      </label>
      <label className="owner-field">
        Owner
        <select name="owner" defaultValue={query.owner ?? ""}>
          <option value="">All owners</option>
          <option value="unassigned">Unassigned</option>
          {members.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              {m.display_name}
            </option>
          ))}
        </select>
      </label>
      <label className="owner-field">
        Sort
        <select name="sort" defaultValue={query.sort}>
          <option value="updated_at">Recently updated</option>
          <option value="name">Business name</option>
          <option value="source_row">Original import order</option>
          <option value="last_contact">Last contact</option>
          <option value="next_follow_up">Next follow-up</option>
        </select>
      </label>
      <details className="owner-more-filters">
        <summary>More filters</summary>
        <div className="owner-form-grid">
          {(["location", "industry", "tag", "batch"] as const).map((key) => (
            <label className="owner-field" key={key}>
              {key === "batch"
                ? "Import batch ID"
                : key.charAt(0).toUpperCase() + key.slice(1)}
              <input name={key} defaultValue={query[key] ?? ""} />
            </label>
          ))}
          <label className="owner-field">
            Priority
            <select name="priority" defaultValue={query.priority ?? ""}>
              <option value="">All priorities</option>
              {["low", "normal", "high"].map((p) => (
                <option value={p} key={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="owner-check">
            <input
              type="checkbox"
              name="incomplete"
              value="1"
              defaultChecked={query.incomplete}
            />
            Incomplete contact
          </label>
          <label className="owner-check">
            <input
              type="checkbox"
              name="due"
              value="1"
              defaultChecked={query.due}
            />
            Follow-ups due now
          </label>
        </div>
      </details>
      <button className="owner-button owner-button-secondary">
        Apply filters
      </button>
    </form>
  );
}
