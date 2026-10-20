"use client";

import { useActionState } from "react";
import type { FormState } from "../actions";
import type { Shop } from "@/lib/shop/types";

type Action = (state: FormState, form: FormData) => Promise<FormState>;

/** Booking rules, worded the way the questions come up, not the way the database stores them. */
export function SettingsForm({ action, shop }: { action: Action; shop: Shop }) {
  const [state, submit, pending] = useActionState(action, {});
  return (
    <form action={submit} className="shop-form">
      {state.error ? <p className="shop-problem">{state.error}</p> : null}
      {state.saved && !pending ? <p className="shop-ok">Saved. Your booking page follows within a minute.</p> : null}
      <label>
        How far ahead clients can book (days)
        <input name="advance" inputMode="numeric" required defaultValue={shop.maxAdvanceDays} />
      </label>
      <label>
        Minimum notice (hours)
        <input name="notice" inputMode="numeric" required defaultValue={Math.round(shop.minNoticeMinutes / 60)} />
      </label>
      <label>
        Appointment slots every
        <select name="slots" defaultValue={shop.slotMinutes}>
          {[15, 30, 45, 60].map((m) => (
            <option key={m} value={m}>
              {m} minutes
            </option>
          ))}
        </select>
      </label>
      <label>
        Clients can cancel or move up to (hours before)
        <input name="cutoff" inputMode="numeric" required defaultValue={shop.guestChangeCutoffHours} />
      </label>
      <label>
        Gap after each appointment (minutes)
        <input name="buffer" inputMode="numeric" required defaultValue={shop.bufferMinutes} />
      </label>
      <button className="console-btn console-btn--primary" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
