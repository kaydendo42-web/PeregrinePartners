"use client";
import { useRouter } from "next/navigation";
import { createBusiness, saveBusiness } from "@/app/owner/outreach/actions";
import type {
  Business,
  Member,
  Stage,
  Priority,
  BusinessPatch,
} from "@/lib/crm/types";
import { stages, stageLabels } from "@/lib/crm/types";
import { useRecordDraft, useMutation, SaveFeedback } from "./draft-state";
export function BusinessForm({
  business,
  members,
}: {
  business: Business;
  members: Member[];
}) {
  const { draft, edit, accept, receive, reload, rebase } =
    useRecordDraft(business);
  const mutation = useMutation<Business>();
  const router = useRouter();
  const isNew = business.id === "new";
  function change(patch: Partial<Business>) {
    edit(patch);
    mutation.changed();
  }
  async function save(reapply = false) {
    const current = reapply ? rebase() : draft;
    const v = current.value;
    const patch: BusinessPatch = {
      name: v.name,
      location: v.location,
      industry: v.industry,
      website: v.website || null,
      stage: v.stage,
      assigned_to: v.assigned_to,
      priority: v.priority,
      tags: v.tags.map((t) => t.trim()).filter(Boolean),
      do_not_contact: v.do_not_contact,
      archived: v.archived,
    };
    if (reapply) mutation.changed();
    const result = await mutation.run((id) =>
      isNew
        ? createBusiness(patch, id)
        : saveBusiness(v.id, current.base.version, patch, id),
    );
    if (result?.ok) {
      accept(result.value);
      if (isNew) router.push("/owner/outreach/" + result.value.id);
    } else if (result?.kind === "conflict" && result.current)
      receive({ ...business, ...result.current });
  }
  const value = draft.value;
  return (
    <form
      className="owner-form"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <fieldset disabled={mutation.pending} className="owner-form">
        <div className="owner-form-grid">
          <label className="owner-field">
            Business name
            <input
              required
              maxLength={300}
              value={value.name}
              onChange={(e) => change({ name: e.target.value })}
            />
          </label>
          <label className="owner-field">
            Website
            <input
              type="url"
              maxLength={2000}
              value={value.website ?? ""}
              onChange={(e) => change({ website: e.target.value || null })}
              placeholder="https://"
            />
          </label>
          <label className="owner-field">
            Location
            <input
              maxLength={300}
              value={value.location}
              onChange={(e) => change({ location: e.target.value })}
            />
          </label>
          <label className="owner-field">
            Industry
            <input
              maxLength={300}
              value={value.industry}
              onChange={(e) => change({ industry: e.target.value })}
            />
          </label>
          <label className="owner-field">
            Stage
            <select
              value={value.stage}
              onChange={(e) => change({ stage: e.target.value as Stage })}
            >
              {stages.map((s) => (
                <option key={s} value={s}>
                  {stageLabels[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="owner-field">
            Assigned owner
            <select
              value={value.assigned_to ?? ""}
              onChange={(e) => change({ assigned_to: e.target.value || null })}
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.display_name}
                </option>
              ))}
            </select>
          </label>
          <label className="owner-field">
            Priority
            <select
              value={value.priority}
              onChange={(e) => change({ priority: e.target.value as Priority })}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="owner-field">
            Tags <small>Separate with commas</small>
            <input
              value={value.tags.join(",")}
              onChange={(e) => change({ tags: e.target.value.split(",") })}
            />
          </label>
        </div>
        <label className="owner-check">
          <input
            type="checkbox"
            checked={value.do_not_contact}
            onChange={(e) => change({ do_not_contact: e.target.checked })}
          />
          Do not contact — cancel open follow-ups
        </label>
        {!isNew ? (
          <label className="owner-check">
            <input
              type="checkbox"
              checked={value.archived}
              onChange={(e) => change({ archived: e.target.checked })}
            />
            Archive this business
          </label>
        ) : null}
      </fieldset>
      {draft.incoming ? (
        <div className="owner-error" role="alert">
          Another owner updated this record. Your draft is preserved.
          <details>
            <summary>View saved changes</summary>
            <pre className="owner-diff">
              {JSON.stringify(draft.incoming, null, 2)}
            </pre>
          </details>
          <div className="owner-actions">
            <button
              type="button"
              className="owner-button owner-button-secondary"
              onClick={() => {
                reload();
                mutation.changed();
              }}
            >
              Use saved version
            </button>
            <button
              type="button"
              disabled={mutation.pending}
              className="owner-button"
              onClick={() => void save(true)}
            >
              Reapply my changes
            </button>
          </div>
        </div>
      ) : null}
      <SaveFeedback result={mutation.result} />
      <div className="owner-actions">
        <button
          className="owner-button"
          disabled={mutation.pending || Boolean(draft.incoming)}
        >
          {mutation.pending
            ? "Saving…"
            : isNew
              ? "Add business"
              : "Save changes"}
        </button>
        {draft.dirty ? (
          <span className="owner-muted owner-small">Unsaved changes</span>
        ) : null}
      </div>
    </form>
  );
}
