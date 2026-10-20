"use client";

import { useActionState } from "react";
import type { FormState } from "../actions";
import type { ShopService } from "@/lib/shop/types";

const QUARTERS = Array.from({ length: (22 - 6) * 4 }, (_, i) => {
  const m = 6 * 60 + i * 15;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
});
const money = (cents: number) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;

type Action = (state: FormState, form: FormData) => Promise<FormState>;

export function AppointmentForm({ action, services, date }: { action: Action; services: ShopService[]; date: string }) {
  const [state, submit, pending] = useActionState(action, {});
  const v = state.values ?? {};
  // A new key after each reply re-mounts the fields with what was typed, since React resets a form after its action.
  return (
    <form action={submit} className="shop-form" key={JSON.stringify(v)}>
      {state.error ? <p className="shop-problem">{state.error}</p> : null}
      <label>
        Service
        <select name="service" required defaultValue={v.service || services[0]?.id}>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {s.durationMin} min · {money(s.priceCents)}
            </option>
          ))}
        </select>
      </label>
      <div className="shop-pair">
        <label>
          Date
          <input type="date" name="date" required defaultValue={v.date || date} />
        </label>
        <label>
          Time
          <select name="time" required defaultValue={v.time || "10:00"}>
            {QUARTERS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Client name
        <input name="name" required maxLength={80} autoComplete="off" defaultValue={v.name} />
      </label>
      <label>
        Mobile
        <input name="phone" type="tel" required inputMode="tel" placeholder="0412 345 678" defaultValue={v.phone} />
      </label>
      <label>
        Email (optional, for their confirmation)
        <input name="email" type="email" autoComplete="off" defaultValue={v.email} />
      </label>
      <label>
        Notes
        <textarea name="notes" maxLength={500} defaultValue={v.notes} />
      </label>
      <button className="console-btn console-btn--primary" type="submit" disabled={pending}>
        {pending ? "Booking…" : "Book appointment"}
      </button>
    </form>
  );
}

export function BlockForm({ action, date }: { action: Action; date: string }) {
  const [state, submit, pending] = useActionState(action, {});
  return (
    <form action={submit} className="shop-form">
      {state.error ? <p className="shop-problem">{state.error}</p> : null}
      <label>
        Date
        <input type="date" name="date" required defaultValue={date} />
      </label>
      <div className="shop-pair">
        <label>
          From
          <select name="from" required defaultValue="13:00">
            {QUARTERS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          To
          <select name="to" required defaultValue="14:00">
            {QUARTERS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Reason (only you see this)
        <input name="reason" maxLength={80} placeholder="Lunch" />
      </label>
      <button className="console-btn console-btn--primary" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Block time"}
      </button>
    </form>
  );
}
