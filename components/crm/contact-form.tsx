"use client";
import { saveContact } from "@/app/owner/outreach/actions";
import type { Contact } from "@/lib/crm/types";
import { useRecordDraft, useMutation, SaveFeedback } from "./draft-state";
export function ContactForm({
  business,
  contact,
}: {
  business: string;
  contact: Contact;
}) {
  const { draft, edit, accept, receive, rebase, reload } =
    useRecordDraft(contact);
  const m = useMutation<Contact>();
  const isNew = contact.id === "new";
  async function save(reapply = false) {
    const d = reapply ? rebase() : draft;
    if (reapply) m.changed();
    const v = d.value;
    const result = await m.run((r) =>
      saveContact(
        business,
        {
          ...(isNew ? {} : { id: v.id }),
          name: v.name,
          email: v.email || null,
          phone: v.phone || null,
          is_primary: v.is_primary,
        },
        isNew ? null : d.base.version,
        r,
      ),
    );
    if (result?.ok)
      accept(
        isNew
          ? {
              ...contact,
              name: "",
              email: null,
              phone: null,
              is_primary: false,
            }
          : result.value,
      );
    else if (result?.kind === "conflict" && result.current)
      receive(result.current);
  }
  return (
    <form
      className="owner-form"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <fieldset disabled={m.pending} className="owner-form">
        <div className="owner-form-grid">
          {(["name", "email", "phone"] as const).map((key) => (
            <label className="owner-field" key={key}>
              {key === "name"
                ? "Contact name"
                : key === "email"
                  ? "Email"
                  : "Phone"}
              <input
                type={
                  key === "email" ? "email" : key === "phone" ? "tel" : "text"
                }
                maxLength={key === "phone" ? 100 : 320}
                value={draft.value[key] ?? ""}
                onChange={(e) => {
                  edit({ [key]: e.target.value });
                  m.changed();
                }}
              />
            </label>
          ))}
        </div>
        <label className="owner-check">
          <input
            type="checkbox"
            checked={draft.value.is_primary}
            onChange={(e) => {
              edit({ is_primary: e.target.checked });
              m.changed();
            }}
          />
          Primary contact
        </label>
      </fieldset>
      {Object.keys(contact.source_fields).length ? (
        <details>
          <summary>Original contact import fields</summary>
          <dl className="owner-source-fields">
            {Object.entries(contact.source_fields).map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value || "—"}</dd>
              </div>
            ))}
          </dl>
        </details>
      ) : null}
      {draft.incoming ? (
        <div className="owner-error">
          This contact changed. Your input is preserved.
          <div className="owner-actions">
            <button type="button" disabled={m.pending} onClick={reload}>
              Use saved contact
            </button>
            <button
              type="button"
              disabled={m.pending}
              onClick={() => void save(true)}
            >
              Reapply my changes
            </button>
          </div>
        </div>
      ) : null}
      <SaveFeedback result={m.result} />
      <button
        className="owner-button"
        disabled={m.pending || Boolean(draft.incoming)}
      >
        {m.pending ? "Saving…" : isNew ? "Add contact" : "Save contact"}
      </button>
    </form>
  );
}
