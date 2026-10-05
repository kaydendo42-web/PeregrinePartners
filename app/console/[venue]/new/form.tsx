"use client";

import { useActionState } from "react";
import { createBooking, type NewBookingState } from "../actions";

type Group = { name: string; tables: { id: string; label: string; seats: number }[] };

export function NewBookingForm({ slug, date, groups }: { slug: string; date: string; groups: Group[] }) {
  const [state, action, pending] = useActionState<NewBookingState, FormData>(createBooking.bind(null, slug), {});
  return (
    <form className="console-form" action={action}>
      <div className="console-form__row">
        <label>
          Date
          <input type="date" name="date" defaultValue={date} required />
        </label>
        <label>
          Time
          <input type="time" name="time" defaultValue="09:00" step={900} required />
        </label>
        <label>
          Guests
          <input type="number" name="party" min={1} max={60} defaultValue={2} required />
        </label>
        <label>
          Table
          <select name="table" defaultValue="">
            <option value="">Not yet</option>
            {groups.map((g) => (
              <optgroup key={g.name} label={g.name}>
                {g.tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label} (seats {t.seats})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>
      <div className="console-form__row">
        <label>
          Name
          <input name="name" required autoComplete="off" />
        </label>
        <label>
          Phone
          <input name="phone" type="tel" autoComplete="off" />
        </label>
        <label>
          Email
          <input name="email" type="email" autoComplete="off" />
        </label>
        <label>
          Came in by
          <select name="source" defaultValue="phone">
            <option value="phone">Phone</option>
            <option value="walk_in">Walk-in</option>
            <option value="console">Other</option>
          </select>
        </label>
      </div>
      <label>
        Notes
        <textarea name="notes" rows={3} />
      </label>
      {state.error ? (
        <p className="console-problem" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className="console-btn console-btn--primary" disabled={pending} aria-busy={pending || undefined}>
        {pending ? <span className="console-spin" aria-hidden /> : null}
        {pending ? "Saving" : "Save booking"}
      </button>
    </form>
  );
}
