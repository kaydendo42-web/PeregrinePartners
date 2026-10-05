"use client";
import { useState } from "react";
import { addActivity } from "@/app/owner/outreach/actions";
import type { Activity, ActivityInput } from "@/lib/crm/types";
import { useMutation, SaveFeedback } from "./draft-state";
import {
  resolveActivityTime,
  workspaceTimeCandidates,
  displayTime,
} from "@/lib/crm/time";
export function ActivityForm({
  business,
  doNotContact,
  timezone,
}: {
  business: string;
  doNotContact: boolean;
  timezone: string;
}) {
  const [kind, setKind] = useState<ActivityInput["kind"]>("note");
  const [channel, setChannel] = useState("email");
  const [summary, setSummary] = useState("");
  const [occurred, setOccurred] = useState("");
  const [markReplied, setMarkReplied] = useState(false);
  const [localTime, setLocalTime] = useState("");
  const [choice, setChoice] = useState("");
  const [timeError, setTimeError] = useState("");
  const m = useMutation<Activity>();
  let options: string[] = [];
  try {
    if (localTime) options = workspaceTimeCandidates(localTime, timezone);
  } catch {}
  return (
    <form
      className="owner-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const captured = occurred || new Date().toISOString();
        if (!occurred) setOccurred(captured);
        let time: string;
        try {
          time = resolveActivityTime(localTime, timezone, choice, captured);
        } catch (error) {
          setTimeError((error as Error).message);
          return;
        }
        setTimeError("");
        const result = await m.run((r) =>
          addActivity(
            business,
            {
              kind,
              channel: kind === "note" ? null : channel,
              occurred_at: time,
              summary,
              mark_replied: kind === "reply" && markReplied,
            },
            r,
          ),
        );
        if (result?.ok) {
          setSummary("");
          setOccurred("");
          setLocalTime("");
          setChoice("");
          setMarkReplied(false);
        }
      }}
    >
      <div className="owner-form-grid">
        <label className="owner-field">
          Activity
          <select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as ActivityInput["kind"]);
              m.changed();
            }}
          >
            <option value="note">Internal note</option>
            <option value="outreach" disabled={doNotContact}>
              Outreach sent
            </option>
            <option value="reply">Reply received</option>
            <option value="meeting">Meeting</option>
            <option value="proposal">Proposal</option>
          </select>
        </label>
        {kind !== "note" ? (
          <label className="owner-field">
            Channel
            <select
              value={channel}
              onChange={(e) => {
                setChannel(e.target.value);
                m.changed();
              }}
            >
              {["email", "phone", "sms", "social", "other"].map((c) => (
                <option key={c} value={c}>
                  {c === "sms" ? "SMS" : c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <label className="owner-field">
        When <small>{timezone} · leave empty for now</small>
        <input
          type="datetime-local"
          value={localTime}
          onChange={(e) => {
            setLocalTime(e.target.value);
            setChoice("");
            setTimeError("");
            m.changed();
          }}
        />
      </label>
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
              <option key={v} value={v}>
                {i === 0 ? "Earlier" : "Later"} — {displayTime(v, timezone)}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className="owner-field">
        Summary
        <textarea
          required
          maxLength={10000}
          value={summary}
          onChange={(e) => {
            setSummary(e.target.value);
            setOccurred("");
            m.changed();
          }}
          placeholder="What happened? What should the team know?"
        />
      </label>
      {kind === "reply" ? (
        <label className="owner-check">
          <input
            type="checkbox"
            checked={markReplied}
            onChange={(e) => {
              setMarkReplied(e.target.checked);
              m.changed();
            }}
          />
          Move to Replied (Won and Lost stay as they are)
        </label>
      ) : null}
      <p className="owner-privacy-note">
        Recorded manually. This saves history for the team; it does not send a
        message.
      </p>
      <SaveFeedback result={m.result} />
      {timeError ? (
        <p className="owner-error" role="alert">
          {timeError}
        </p>
      ) : null}
      <button className="owner-button" disabled={m.pending}>
        {m.pending ? "Saving…" : "Log activity"}
      </button>
    </form>
  );
}
