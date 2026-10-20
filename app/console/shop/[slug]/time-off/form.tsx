"use client";

import { useActionState, useState } from "react";
import type { FormState } from "../actions";

const QUARTERS = Array.from({ length: (22 - 6) * 4 + 1 }, (_, i) => {
  const m = 6 * 60 + i * 15;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
});

type Action = (state: FormState, form: FormData) => Promise<FormState>;

export function TimeOffForm({ action, today }: { action: Action; today: string }) {
  const [state, submit, pending] = useActionState(action, {});
  const [kind, setKind] = useState<"closed" | "hours">("closed");
  return (
    <form action={submit} className="shop-form">
      {state.error ? <p className="shop-problem">{state.error}</p> : null}
      {state.saved && !pending ? <p className="shop-ok">Saved. Your booking page follows within a minute.</p> : null}
      {state.warning && !pending ? <p className="shop-problem">{state.warning}</p> : null}
      <div className="shop-pair">
        <label>
          From
          <input type="date" name="from" required min={today} defaultValue={today} />
        </label>
        <label>
          To (optional)
          <input type="date" name="to" min={today} />
        </label>
      </div>
      <label className="shop-switch">
        <input type="radio" name="kind" value="closed" checked={kind === "closed"} onChange={() => setKind("closed")} />
        Closed all day
      </label>
      <label className="shop-switch">
        <input type="radio" name="kind" value="hours" checked={kind === "hours"} onChange={() => setKind("hours")} />
        Different hours
      </label>
      {kind === "hours" ? (
        <div className="shop-pair">
          <label>
            Open
            <select name="open" defaultValue="10:00">
              {QUARTERS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            Close
            <select name="close" defaultValue="16:00">
              {QUARTERS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
      <label>
        Note (shows on your booking page)
        <input name="note" maxLength={80} placeholder="Holiday" />
      </label>
      <button className="console-btn console-btn--primary" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Add time off"}
      </button>
    </form>
  );
}
