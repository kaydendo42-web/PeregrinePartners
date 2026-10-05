"use client";
import Link from "next/link";
import { useState, useCallback } from "react";
import type { FollowUp, Member } from "@/lib/crm/types";
import { retainDirtyRows } from "@/lib/crm/queues";
import { FollowUpForm } from "./follow-up-form";

export function FollowUpList({
  rows,
  members,
  timezone,
}: {
  rows: FollowUp[];
  members: Member[];
  timezone: string;
}) {
  const [dirty, setDirty] = useState<ReadonlySet<string>>(() => new Set());
  const [retained, setRetained] = useState(rows);
  const [seen, setSeen] = useState({ rows, dirty });
  if (seen.rows !== rows || seen.dirty !== dirty) {
    setSeen({ rows, dirty });
    setRetained(retainDirtyRows(retained, rows, dirty));
  }
  const onDirtyChange = useCallback((id: string, value: boolean) => {
    setDirty((current) => {
      if (current.has(id) === value) return current;
      const next = new Set(current);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);
  return (
    <>
      {retained.map((f) => {
        const outside = !rows.some((row) => row.id === f.id);
        return (
          <details
            className="owner-contact"
            key={f.id}
            open={outside ? true : undefined}
          >
            <summary>
              {f.business?.name} · {f.instruction}
            </summary>
            {outside ? (
              <p className="owner-notice">
                This follow-up no longer matches your filters. Your draft is
                still here; saving will check the current record.
              </p>
            ) : null}
            <Link
              className="owner-link"
              href={"/owner/outreach/" + f.business_id}
            >
              Open business →
            </Link>
            <FollowUpForm
              followUp={f}
              members={members}
              timezone={timezone}
              blocked={f.business?.do_not_contact ?? false}
              onDirtyChange={onDirtyChange}
            />
          </details>
        );
      })}
    </>
  );
}
