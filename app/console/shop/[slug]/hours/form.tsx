"use client";

import { useActionState, useState } from "react";
import type { FormState } from "../actions";
import type { WeeklyHours } from "@/lib/shop/types";

const ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first, as a week reads
const NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const QUARTERS = Array.from({ length: (22 - 6) * 4 + 1 }, (_, i) => {
  const m = 6 * 60 + i * 15;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
});

type Action = (state: FormState, form: FormData) => Promise<FormState>;

export function HoursForm({ action, hours }: { action: Action; hours: WeeklyHours }) {
  const [state, submit, pending] = useActionState(action, {});
  const [on, setOn] = useState(() => hours.map((h) => h !== null));
  return (
    <form action={submit} className="shop-form">
      {state.error ? <p className="shop-problem">{state.error}</p> : null}
      {state.saved && !pending ? <p className="shop-ok">Saved. Your booking page shows the new hours within a minute.</p> : null}
      <div>
        {ORDER.map((d) => (
          <div key={d} className="shop-day-row">
            <label className="shop-switch">
              <input
                type="checkbox"
                name={`day-${d}-on`}
                checked={on[d]}
                onChange={(e) => setOn((prev) => prev.map((v, i) => (i === d ? e.target.checked : v)))}
              />
              {NAMES[d].slice(0, 3)}
            </label>
            {on[d] ? (
              <div className="shop-pair">
                <select name={`day-${d}-open`} defaultValue={hours[d]?.[0] ?? "10:00"} aria-label={`${NAMES[d]} opens`}>
                  {QUARTERS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <select name={`day-${d}-close`} defaultValue={hours[d]?.[1] ?? "18:00"} aria-label={`${NAMES[d]} closes`}>
                  {QUARTERS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            ) : (
              <span className="shop-hint">Closed</span>
            )}
          </div>
        ))}
      </div>
      <button className="console-btn console-btn--primary" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save hours"}
      </button>
    </form>
  );
}
