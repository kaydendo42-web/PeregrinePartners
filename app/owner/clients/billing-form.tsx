"use client";
import { saveBilling } from "./actions";
import { RecordForm } from "@/components/crm/record-form";
import type { EditorRecord } from "@/components/crm/record-form";
import { minorDecimal } from "@/lib/crm/money";
export function decorateBilling(r: EditorRecord): EditorRecord {
  return {
    ...r,
    amount:
      r.amount_minor === undefined
        ? ""
        : minorDecimal(Number(r.amount_minor), String(r.currency)),
    paid:
      r.paid_minor === undefined
        ? "0"
        : minorDecimal(Number(r.paid_minor), String(r.currency)),
  };
}
export function BillingForm({ record }: { record: EditorRecord }) {
  return (
    <RecordForm
      record={decorateBilling(record)}
      fields={[
        {
          name: "client_id",
          label: "Client ID",
          options: [{ value: String(record.client_id), label: "This client" }],
          locked: true,
        },
        { name: "reference", label: "Invoice reference", required: true },
        {
          name: "currency",
          label: "Currency code",
          required: true,
          max: 3,
          hint: "AUD, USD, NZD, etc.",
        },
        {
          name: "amount",
          label: "Invoice amount",
          required: true,
          hint: "Decimal amount, without commas.",
        },
        { name: "paid", label: "Amount paid", required: true },
        { name: "due_on", label: "Due date", type: "date", required: true },
      ]}
      save={saveBilling as Parameters<typeof RecordForm>[0]["save"]}
      decorate={decorateBilling}
      label={record.id === "new" ? "Add billing record" : "Save billing record"}
    />
  );
}
