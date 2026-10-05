"use client";

import { useActionState, useRef } from "react";
import { setTable, type TableState } from "../actions";

type Group = { name: string; tables: { id: string; label: string; seats: number }[] };
/** A joined set, sent as its tables' ids joined by commas. */
export type Joined = { value: string; label: string; min: number; max: number };

/**
 * The table cell, editable. Choosing a table saves straight away (no save
 * button on a busy floor); the database's no-double-booking rule is the check.
 * An unassigned booking is drawn as a prompt, because until it has a table the
 * website will offer that table to someone else.
 */
export function TablePicker({
  slug,
  bookingId,
  current,
  party,
  groups,
  joined,
}: {
  slug: string;
  bookingId: string;
  /** "t14", "t2,t3,t4", or null for no table. */
  current: string | null;
  party: number;
  groups: Group[];
  joined: Joined[];
}) {
  // Counting tries remounts the select, so a refused move snaps back to the real table.
  const [state, action, pending] = useActionState<TableState & { tries: number }, FormData>(
    async (prev, data) => ({ ...(await setTable(slug, bookingId, prev, data)), tries: prev.tries + 1 }),
    { tries: 0 },
  );
  const form = useRef<HTMLFormElement>(null);

  return (
    <form ref={form} action={action} className="console-tablepick">
      <select
        key={`${current}-${state.tries}`}
        name="table"
        defaultValue={current ?? ""}
        disabled={pending}
        aria-label={current ? "Move to another table" : "Assign a table"}
        data-unassigned={current ? undefined : true}
        onChange={() => form.current?.requestSubmit()}
      >
        <option value="">{current ? "No table" : "Assign table…"}</option>
        {groups.map((g) => (
          <optgroup key={g.name} label={g.name}>
            {g.tables.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label} · {g.name} ({t.seats})
                {t.seats < party ? " too small" : ""}
              </option>
            ))}
          </optgroup>
        ))}
        {current?.includes(",") && !joined.some((j) => j.value === current) ? (
          // A set made some other way (an import, say): show it as it is.
          <option value={current}>{current.split(",").length} tables joined</option>
        ) : null}
        {joined.length ? (
          <optgroup label="Joined tables">
            {joined.map((j) => (
              <option key={j.value} value={j.value}>
                {j.label} ({j.min}–{j.max})
                {j.max < party ? " too small" : ""}
              </option>
            ))}
          </optgroup>
        ) : null}
      </select>
      {pending ? <span className="console-spin" aria-hidden /> : null}
      {state.error ? (
        <span className="console-tablepick__error" role="alert">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
