"use client";
import { saveTool } from "./actions";
import { RecordForm } from "@/components/crm/record-form";
import type { EditorRecord } from "@/components/crm/record-form";
export function ToolForm({ record }: { record: EditorRecord }) {
  return (
    <RecordForm
      record={record}
      fields={[
        { name: "name", label: "Tool name", required: true },
        {
          name: "slug",
          label: "Reference",
          required: true,
          max: 100,
          hint: "Lowercase letters, numbers and hyphens, e.g. advertising.",
        },
        {
          name: "availability",
          label: "Availability",
          options: [
            { value: "available", label: "Available" },
            { value: "planned", label: "Planned" },
          ],
        },
        { name: "archived", label: "Archive this tool", type: "checkbox" },
      ]}
      save={saveTool as Parameters<typeof RecordForm>[0]["save"]}
      label={record.id === "new" ? "Add tool" : "Save tool"}
    />
  );
}
