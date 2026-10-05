"use client";

import { useActionState, useState } from "react";
import { saveNotifications, type NotifyState } from "../actions";

/**
 * The one setting a venue changes for itself: whether it hears about each
 * online booking by email, and at which address.
 */
export function NotificationsForm({ slug, on, email }: { slug: string; on: boolean; email: string | null }) {
  const [state, action, pending] = useActionState<NotifyState, FormData>(saveNotifications.bind(null, slug), {});
  const [checked, setChecked] = useState(on);

  return (
    <form className="console-notify" action={action}>
      <label className="console-switch">
        <input
          type="checkbox"
          role="switch"
          name="notify"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          aria-describedby="notify-help"
        />
        <span className="console-switch__track" aria-hidden />
        <span>Email me when a guest books online</span>
      </label>
      <p id="notify-help" className="console-muted">
        Guests always get their own confirmation. This is only the heads-up to you, with the booking and their contact
        details.
      </p>

      <label className="console-notify__email" data-off={checked ? undefined : true}>
        Send it to
        <input
          type="email"
          name="email"
          defaultValue={email ?? ""}
          placeholder="Leave blank for your usual inbox"
          readOnly={!checked}
          aria-disabled={!checked || undefined}
          autoComplete="email"
        />
      </label>

      <div className="console-notify__actions">
        <button className="console-btn console-btn--primary" disabled={pending} aria-busy={pending || undefined}>
          {pending ? <span className="console-spin" aria-hidden /> : null}
          {pending ? "Saving" : "Save"}
        </button>
        <span role="status" className={state.error ? "console-notify__error" : "console-muted"}>
          {state.error ?? (state.saved && !pending ? "Saved. The next booking follows this." : "")}
        </span>
      </div>
    </form>
  );
}
