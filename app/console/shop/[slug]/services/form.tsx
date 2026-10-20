"use client";

import { useActionState } from "react";
import type { FormState } from "../actions";
import type { ShopService } from "@/lib/shop/types";

const LENGTHS = Array.from({ length: 16 }, (_, i) => (i + 1) * 15);
type Action = (state: FormState, form: FormData) => Promise<FormState>;

/** One service's fields; used to edit an existing one and to add a new one. */
export function ServiceForm({ action, service, cta }: { action: Action; service?: ShopService; cta: string }) {
  const [state, submit, pending] = useActionState(action, {});
  return (
    <form action={submit} className="shop-form">
      {state.error ? <p className="shop-problem">{state.error}</p> : null}
      {state.saved && !pending ? <p className="shop-ok">Saved.</p> : null}
      <label>
        Name
        <input name="name" required maxLength={60} defaultValue={service?.name} />
      </label>
      <div className="shop-pair">
        <label>
          Length
          <select name="duration" defaultValue={service?.durationMin ?? 45}>
            {LENGTHS.map((m) => (
              <option key={m} value={m}>
                {m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}min` : ""}`}
              </option>
            ))}
          </select>
        </label>
        <label>
          Price ($)
          <input name="price" inputMode="decimal" required defaultValue={service ? (service.priceCents / 100).toString() : ""} />
        </label>
      </div>
      <button className="console-btn console-btn--primary" type="submit" disabled={pending}>
        {pending ? "Saving…" : cta}
      </button>
    </form>
  );
}
