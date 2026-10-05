"use client";
import { saveClient, convertClient } from "./actions";
import { RecordForm } from "@/components/crm/record-form";
import type { EditorRecord, Field } from "@/components/crm/record-form";
import type { Member, Business, ClientAccount } from "@/lib/crm/types";
import { useMutation, SaveFeedback } from "@/components/crm/draft-state";
import { useRouter } from "next/navigation";
export function ClientForm({
  record,
  members,
  venues,
}: {
  record: EditorRecord;
  members: Member[];
  venues: { id: string; name: string }[];
}) {
  const fields: Field[] = [
    ...(!record.id || record.id === "new"
      ? [{ name: "name", label: "Business name", required: true }]
      : []),
    {
      name: "relationship_owner",
      label: "Relationship owner",
      options: [
        { value: "", label: "Unassigned" },
        ...members.map((m) => ({ value: m.user_id, label: m.display_name })),
      ],
    },
    {
      name: "venue_id",
      label: "Booking venue",
      options: [
        { value: "", label: "No linked venue" },
        ...venues.map((v) => ({ value: v.id, label: v.name })),
      ],
      hint: "Only venues you already have access to are available.",
    },
    {
      name: "status",
      label: "Client status",
      options: ["active", "paused", "closed"].map((v) => ({
        value: v,
        label: v.charAt(0).toUpperCase() + v.slice(1),
      })),
    },
  ];
  return (
    <RecordForm
      record={record}
      fields={fields}
      save={saveClient as Parameters<typeof RecordForm>[0]["save"]}
      label={record.id === "new" ? "Add client" : "Save client account"}
      createdHref="/owner/clients/"
    />
  );
}
export function ConvertClient({ business }: { business: Business }) {
  const m = useMutation<ClientAccount>();
  const router = useRouter();
  return (
    <div className="owner-panel owner-panel-body owner-section">
      <h2>Ready to work together?</h2>
      <p className="owner-muted owner-small">
        Convert this business to a client. Its contacts and conversation history
        stay together.
      </p>
      <SaveFeedback result={m.result} />
      <button
        className="owner-button"
        disabled={m.pending}
        onClick={async () => {
          const result = await m.run((r) =>
            convertClient(business.id, business.version, r),
          );
          if (result?.ok) router.push("/owner/clients/" + result.value.id);
        }}
      >
        {m.pending ? "Converting…" : "Convert to client"}
      </button>
    </div>
  );
}
