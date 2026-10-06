"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addGuestEntry,
  setGuestTask,
  type GuestSaveResult,
} from "@/app/console/[venue]/crm/actions";
import type { GuestEntry } from "@/lib/client-crm/data";
export function GuestEntryForm({
  slug,
  booking,
}: {
  slug: string;
  booking: string;
}) {
  const [kind, setKind] = useState("note");
  const [body, setBody] = useState("");
  const [due, setDue] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<GuestSaveResult | null>(null);
  const request = useRef<string | null>(null);
  const router = useRouter();
  const changed = () => {
    request.current = null;
    setResult(null);
  };
  return (
    <form
      className="owner-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (pending) return;
        request.current ??= crypto.randomUUID();
        setPending(true);
        try {
          const saved = await addGuestEntry(slug, booking, {
            kind,
            body,
            due,
            request: request.current,
          });
          setResult(saved);
          if (saved.ok) {
            setBody("");
            setDue("");
            request.current = null;
            router.refresh();
          }
        } catch {
          setResult({
            ok: false,
            error:
              "The entry did not save. Your draft is still here; try again.",
          });
        } finally {
          setPending(false);
        }
      }}
    >
      <fieldset disabled={pending} className="owner-form">
        <label className="owner-field">
          Entry type
          <select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value);
              changed();
            }}
          >
            <option value="note">Customer note</option>
            <option value="task">Follow-up task</option>
          </select>
        </label>
        <label className="owner-field">
          {kind === "note" ? "Note" : "Task description"}
          <textarea
            required
            maxLength={2000}
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              changed();
            }}
            placeholder={
              kind === "note"
                ? "What should your team know?"
                : "What needs to happen next?"
            }
          />
        </label>
        {kind === "task" ? (
          <label className="owner-field">
            Due date
            <input
              type="date"
              required
              value={due}
              onChange={(e) => {
                setDue(e.target.value);
                changed();
              }}
            />
          </label>
        ) : null}
      </fieldset>
      <p className="owner-privacy-note">
        Shared with your venue team. Saving an entry does not send a customer
        message.
      </p>
      {result ? (
        <p
          className={result.ok ? "owner-notice" : "owner-error"}
          role={result.ok ? "status" : "alert"}
        >
          {result.ok ? "Saved." : result.error}
        </p>
      ) : null}
      <button className="owner-button" disabled={pending}>
        {pending ? "Saving…" : kind === "note" ? "Save note" : "Add follow-up"}
      </button>
    </form>
  );
}
export function GuestTaskControls({
  slug,
  task,
}: {
  slug: string;
  task: GuestEntry;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function save(state: string) {
    setPending(true);
    setError("");
    try {
      const result = await setGuestTask(slug, task.id, task.version, state);
      if (!result.ok) setError(result.error);
      router.refresh();
    } catch {
      setError("This task did not save. Try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <div>
      <div className="owner-actions">
        {task.state === "open" ? (
          <>
            <button
              type="button"
              className="owner-button owner-button-secondary"
              disabled={pending}
              onClick={() => void save("done")}
            >
              Complete
            </button>
            <button
              type="button"
              className="owner-button owner-button-secondary"
              disabled={pending}
              onClick={() => void save("cancelled")}
            >
              Cancel task
            </button>
          </>
        ) : (
          <button
            type="button"
            className="owner-button owner-button-secondary"
            disabled={pending}
            onClick={() => void save("open")}
          >
            Reopen
          </button>
        )}
      </div>
      {error ? (
        <p role="alert" className="owner-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
