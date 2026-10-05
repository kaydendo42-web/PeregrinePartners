"use client";
import Link from "next/link";
import { useState } from "react";
import { bulkBusinesses } from "@/app/owner/outreach/actions";
import type { Business, Member, BusinessPatch, Stage } from "@/lib/crm/types";
import { stages, stageLabels } from "@/lib/crm/types";
import { displayTime } from "@/lib/crm/time";
import { useMutation, SaveFeedback } from "./draft-state";
import { toggleSelection, selectionChanged } from "@/lib/crm/queues";
import type { SelectedRecord } from "@/lib/crm/queues";
import { leadResearch } from "@/lib/crm/lead-research";
export function BusinessTable({
  rows,
  members,
  timezone,
}: {
  rows: Business[];
  members: Member[];
  timezone: string;
}) {
  const [selected, setSelected] = useState<SelectedRecord[]>([]);
  const [field, setField] = useState("assigned_to");
  const [value, setValue] = useState("");
  const [review, setReview] = useState(false);
  const m = useMutation<Business[]>();
  const selectedRows = rows.filter((r) => selected.some((s) => s.id === r.id));
  const changed = selectionChanged(selected, rows);
  async function apply() {
    if (changed) return;
    const patch: BusinessPatch =
      field === "assigned_to"
        ? { assigned_to: value || null }
        : field === "stage"
          ? { stage: value as Stage }
          : {
              tags: value
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            };
    const result = await m.run((id) => bulkBusinesses(selected, patch, id));
    if (result?.ok) {
      setSelected([]);
      setReview(false);
    }
  }
  return (
    <>
      {selected.length ? (
        <div className="owner-bulk">
          <strong>{selected.length} selected</strong>
          {changed ? (
            <div className="owner-error" role="alert">
              Selected records changed or left this view. Review the latest
              records before applying a change.
              <button
                type="button"
                disabled={m.pending}
                onClick={() => {
                  setSelected(
                    selectedRows.map((r) => ({ id: r.id, version: r.version })),
                  );
                  setReview(false);
                  m.changed();
                }}
              >
                Review latest records
              </button>
            </div>
          ) : null}
          <label className="owner-field">
            Change
            <select
              disabled={m.pending}
              value={field}
              onChange={(e) => {
                setField(e.target.value);
                setValue("");
                setReview(false);
                m.changed();
              }}
            >
              <option value="assigned_to">Assigned owner</option>
              <option value="stage">Stage</option>
              <option value="tags">Replace tags</option>
            </select>
          </label>
          <label className="owner-field">
            New value
            {field === "tags" ? (
              <input
                disabled={m.pending}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setReview(false);
                  m.changed();
                }}
              />
            ) : (
              <select
                disabled={m.pending}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setReview(false);
                  m.changed();
                }}
              >
                {field === "assigned_to" ? (
                  <>
                    <option value="">Unassigned</option>
                    {members.map((o) => (
                      <option value={o.user_id} key={o.user_id}>
                        {o.display_name}
                      </option>
                    ))}
                  </>
                ) : (
                  <>
                    <option value="">Choose stage</option>
                    {stages.map((s) => (
                      <option value={s} key={s}>
                        {stageLabels[s]}
                      </option>
                    ))}
                  </>
                )}
              </select>
            )}
          </label>
          <button
            className="owner-button"
            disabled={m.pending || changed || (field === "stage" && !value)}
            onClick={() => setReview(true)}
          >
            Review change
          </button>
          {review ? (
            <div
              role="dialog"
              aria-label="Confirm bulk change"
              className="owner-bulk-confirm"
            >
              <p>
                Apply {field.replaceAll("_", " ")} to {selected.length}{" "}
                businesses?{" "}
                {field === "tags" ? "This replaces their current tags." : null}
              </p>
              <div className="owner-actions">
                <button
                  className="owner-button"
                  disabled={m.pending || changed}
                  onClick={() => void apply()}
                >
                  {m.pending ? "Saving…" : "Apply to selected"}
                </button>
                <button
                  className="owner-button owner-button-secondary"
                  disabled={m.pending}
                  onClick={() => setReview(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
          <SaveFeedback result={m.result} />
        </div>
      ) : null}
      <div className="owner-table-scroll">
        <table className="owner-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label="Select this page"
                  disabled={m.pending}
                  checked={
                    rows.length > 0 && selectedRows.length === rows.length
                  }
                  onChange={(e) => {
                    setSelected(
                      e.target.checked
                        ? rows.map((r) => ({ id: r.id, version: r.version }))
                        : [],
                    );
                    setReview(false);
                    m.changed();
                  }}
                />
              </th>
              {[
                "Business",
                "Location",
                "Industry",
                "Contact",
                "Stage",
                "Assigned owner",
                "Priority",
                "Last contact",
                "Next follow-up",
                "Updated by",
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => {
              const research = leadResearch(b.source_fields);
              return (
                <tr key={b.id}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={"Select " + b.name}
                      disabled={m.pending}
                      checked={selected.some((s) => s.id === b.id)}
                      onChange={() => {
                        setSelected((v) => toggleSelection(v, b));
                        setReview(false);
                        m.changed();
                      }}
                    />
                  </td>
                  <td>
                    <Link href={"/owner/outreach/" + b.id}>{b.name}</Link>
                    {research.rank ? (
                      <small>
                        Rank {research.rank}
                        {research.score
                          ? ` · Research score ${research.score}`
                          : ""}
                      </small>
                    ) : null}
                    {b.tags.length ? <small>{b.tags.join(" · ")}</small> : null}
                    {b.do_not_contact ? (
                      <small className="owner-badge-danger">
                        Do not contact
                      </small>
                    ) : null}
                  </td>
                  <td>{b.location || "—"}</td>
                  <td>{b.industry || "—"}</td>
                  <td>
                    {b.contacts?.[0]?.name ||
                      b.contacts?.[0]?.email ||
                      b.contacts?.[0]?.phone ||
                      "Incomplete"}
                    <small>{b.contacts?.[0]?.email}</small>
                  </td>
                  <td>
                    <span className="owner-badge" data-stage={b.stage}>
                      {stageLabels[b.stage]}
                    </span>
                  </td>
                  <td>
                    {members.find((m) => m.user_id === b.assigned_to)
                      ?.display_name ?? "Unassigned"}
                  </td>
                  <td>{b.priority}</td>
                  <td>
                    {b.last_contact
                      ? displayTime(b.last_contact, timezone)
                      : "—"}
                  </td>
                  <td>
                    {b.next_follow_up
                      ? displayTime(b.next_follow_up, timezone)
                      : "—"}
                  </td>
                  <td>{b.updated_by_name ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
