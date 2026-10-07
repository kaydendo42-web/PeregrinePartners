"use client";
import { targets } from "@/lib/crm/import/types";
import type { ColumnMapping, Column } from "@/lib/crm/import/types";
const labels: Record<string, string> = {
  name: "Business name (required)",
  location: "Location / address",
  industry: "Industry",
  contact_name: "Contact name",
  email: "Email",
  phone: "Phone",
  website: "Website",
  tags: "Tags",
  notes: "Notes",
};
export function Mapping({
  columns,
  mapping,
  onChange,
}: {
  columns: Column[];
  mapping: ColumnMapping;
  onChange: (next: ColumnMapping) => void;
}) {
  return (
    <div className="owner-form-grid">
      {targets.map((field) => (
        <label className="owner-field" key={field}>
          {labels[field]}
          <select
            required={field === "name"}
            value={mapping[field] ?? ""}
            onChange={(e) =>
              onChange({
                ...mapping,
                [field]: e.target.value === "" ? null : Number(e.target.value),
              })
            }
          >
            <option value="">Not mapped — keep as extra field</option>
            {columns.map((c) => (
              <option value={c.index} key={c.key}>
                {c.label} · column {c.index + 1}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}
