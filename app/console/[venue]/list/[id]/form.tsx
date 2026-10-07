"use client";

import { useActionState } from "react";
import { updateBooking, type EditState } from "../../actions";
import type { Joined } from "../table-picker";

type Group = { name: string; tables: { id: string; label: string; seats: number }[] };

export function EditBookingForm({
  slug,
  id,
  date,
  time,
  party,
  table,
  notes,
  staffNotes,
  groups,
  joined,
}: {
  slug: string;
  id: string;
  date: string;
  time: string;
  party: number;
  /** "t14", "t2,t3,t4", or "" for no table. */
  table: string;
  notes: string;
  staffNotes: string;
  groups: Group[];
  joined: Joined[];
}) {
  const [state, action, pending] = useActionState<EditState, FormData>(updateBooking.bind(null, slug, id), {});
  const oddSet = table.includes(",") && !joined.some((j) => j.value === table);
  return (
    <form className="console-form" action={action}>
      <div className="console-form__row">
        <label>
          Date
          <input type="date" name="date" defaultValue={date} required />
        </label>
        <label>
          Time
          <input type="time" name="time" defaultValue={time} step={900} required />
        </label>
        <label>
          Guests
          <input type="number" name="party" min={1} max={60} defaultValue={party} required />
        </label>
        <label>
          Table
          <select name="table" defaultValue={table}>
            <option value="">No table</option>
            {groups.map((g) => (
              <optgroup key={g.name} label={g.name}>
                {g.tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label} (seats {t.seats})
                  </option>
                ))}
              </optgroup>
            ))}
            {oddSet ? <option value={table}>{table.split(",").length} tables joined</option> : null}
            {joined.length ? (
              <optgroup label="Joined tables">
                {joined.map((j) => (
                  <option key={j.value} value={j.value}>
                    {j.label} (seats {j.min}–{j.max})
                  </option>
                ))}
              </optgroup>
            ) : null}
          </select>
        </label>
      </div>
      <label>
        Venue notes (guests never see these)
        <textarea name="staff_notes" rows={3} defaultValue={staffNotes} placeholder="Regular, likes the window. Rang to say running late." />
      </label>
      <label>
        Guest&apos;s request
        <textarea name="notes" rows={2} defaultValue={notes} />
      </label>
      {state.error ? (
        <p className="console-problem" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className="console-btn console-btn--primary" disabled={pending} aria-busy={pending || undefined}>
        {pending ? <span className="console-spin" aria-hidden /> : null}
        {pending ? "Saving" : "Save changes"}
      </button>
    </form>
  );
}
