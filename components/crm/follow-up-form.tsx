"use client";
import { useState, useEffect } from "react";
import { saveFollowUp } from "@/app/owner/outreach/actions";
import type { FollowUp, Member } from "@/lib/crm/types";
import {
  localInput,
  workspaceTimeCandidates,
  displayTime,
} from "@/lib/crm/time";
import { useRecordDraft, useMutation, SaveFeedback } from "./draft-state";
export function FollowUpForm({
  followUp,
  members,
  timezone,
  blocked,
  onDirtyChange,
}: {
  followUp: FollowUp;
  members: Member[];
  timezone: string;
  blocked: boolean;
  onDirtyChange?: (id: string, dirty: boolean) => void;
}) {
  const initial = {
    ...followUp,
    local_time: localInput(followUp.due_at, timezone),
  };
  const { draft, edit, accept, receive, reload, rebase } =
    useRecordDraft(initial);
  const [choice, setChoice] = useState("");
  const [timeError, setTimeError] = useState("");
  const m = useMutation<FollowUp>();
  useEffect(() => {
    onDirtyChange?.(followUp.id, draft.dirty);
  }, [followUp.id, draft.dirty, onDirtyChange]);
  const isNew = followUp.id === "new";
  async function save(
    state: FollowUp["state"] = draft.value.state,
    reapply = false,
  ) {
    const current = reapply ? rebase() : draft;
    if (reapply) m.changed();
    let candidates: string[];
    try {
      candidates = workspaceTimeCandidates(current.value.local_time, timezone);
    } catch (error) {
      setTimeError((error as Error).message);
      return;
    }
    if (candidates.length === 0) {
      setTimeError(
        "This time does not exist because the clock moves forward. Choose another time.",
      );
      return;
    }
    if (candidates.length === 2 && !candidates.includes(choice)) {
      setTimeError(
        "This time occurs twice. Choose the earlier or later occurrence.",
      );
      return;
    }
    setTimeError("");
    const result = await m.run((r) =>
      saveFollowUp(
        {
          ...(isNew ? {} : { id: current.value.id }),
          business_id: current.value.business_id,
          assigned_to: current.value.assigned_to,
          due_at: candidates.length === 1 ? candidates[0] : choice,
          instruction: current.value.instruction,
          state,
        },
        isNew ? null : current.base.version,
        r,
      ),
    );
    if (result?.ok) {
      accept(
        isNew
          ? { ...initial, instruction: "" }
          : {
              ...result.value,
              local_time: localInput(result.value.due_at, timezone),
            },
      );
    } else if (result?.kind === "conflict" && result.current)
      receive({
        ...result.current,
        local_time: localInput(result.current.due_at, timezone),
      });
  }
  let options: string[] = [];
  try {
    options = workspaceTimeCandidates(draft.value.local_time, timezone);
  } catch {}
  return (
    <form
      className="owner-form"
      onSubmit={(e) => {
        e.preventDefault();
        void save(isNew ? "open" : draft.value.state);
      }}
    >
      <fieldset disabled={m.pending} className="owner-form">
        <div className="owner-form-grid">
          <label className="owner-field">
            Due time <small>{timezone}</small>
            <input
              type="datetime-local"
              required
              value={draft.value.local_time}
              onChange={(e) => {
                setChoice("");
                edit({ local_time: e.target.value });
                m.changed();
              }}
            />
          </label>
          <label className="owner-field">
            Assigned owner
            <select
              required
              value={draft.value.assigned_to}
              onChange={(e) => {
                edit({ assigned_to: e.target.value });
                m.changed();
              }}
            >
              {members.map((owner) => (
                <option key={owner.user_id} value={owner.user_id}>
                  {owner.display_name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {options.length === 2 ? (
          <label className="owner-field">
            Clock change: choose occurrence
            <select
              required
              value={choice}
              onChange={(e) => {
                setChoice(e.target.value);
                m.changed();
              }}
            >
              <option value="">Choose a time</option>
              {options.map((v, i) => (
                <option value={v} key={v}>
                  {i === 0 ? "Earlier" : "Later"} — {v}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="owner-field">
          Next step
          <textarea
            required
            maxLength={10000}
            value={draft.value.instruction}
            onChange={(e) => {
              edit({ instruction: e.target.value });
              m.changed();
            }}
          />
        </label>
      </fieldset>
      {blocked ? (
        <p className="owner-error">
          Outreach and new follow-ups are stopped for this business.
        </p>
      ) : null}
      {timeError ? (
        <p className="owner-error" role="alert">
          {timeError}
        </p>
      ) : null}
      {draft.incoming ? (
        <div className="owner-error">
          This follow-up changed. Your input is preserved.
          <details>
            <summary>View saved follow-up</summary>
            <dl>
              <dt>Next step</dt>
              <dd>{draft.incoming.instruction}</dd>
              <dt>Due</dt>
              <dd>{displayTime(draft.incoming.due_at, timezone)}</dd>
              <dt>Status</dt>
              <dd>{draft.incoming.state}</dd>
              <dt>Owner</dt>
              <dd>
                {members.find(
                  (owner) => owner.user_id === draft.incoming!.assigned_to,
                )?.display_name ?? "Owner"}
              </dd>
            </dl>
          </details>
          <div className="owner-actions">
            <button type="button" disabled={m.pending} onClick={reload}>
              Use saved version
            </button>
            <button
              type="button"
              disabled={m.pending}
              onClick={() => void save(draft.value.state, true)}
            >
              Reapply my changes
            </button>
          </div>
        </div>
      ) : null}
      <SaveFeedback result={m.result} />
      <div className="owner-actions">
        <button
          className="owner-button"
          disabled={m.pending || blocked || Boolean(draft.incoming)}
        >
          {m.pending ? "Saving…" : isNew ? "Add follow-up" : "Reschedule"}
        </button>
        {!isNew && draft.value.state === "open" ? (
          <>
            <button
              type="button"
              className="owner-button owner-button-secondary"
              disabled={m.pending}
              onClick={() => {
                m.changed();
                void save("done");
              }}
            >
              Mark complete
            </button>
            <button
              type="button"
              className="owner-button owner-button-secondary"
              disabled={m.pending}
              onClick={() => {
                m.changed();
                void save("cancelled");
              }}
            >
              Cancel follow-up
            </button>
          </>
        ) : null}
      </div>
    </form>
  );
}
