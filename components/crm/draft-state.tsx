"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  beginDraft,
  editDraft,
  receiveServerRecord,
  rebaseDraft,
} from "@/lib/crm/draft";
import type { Versioned } from "@/lib/crm/draft";
import type { MutationResult } from "@/lib/crm/types";
export function useRecordDraft<T extends Versioned>(record: T) {
  const [draft, setDraft] = useState(() => beginDraft(record));
  const [seen, setSeen] = useState(record.version);
  if (record.version !== seen) {
    setSeen(record.version);
    setDraft(receiveServerRecord(draft, record));
  }
  return {
    draft,
    edit: (patch: Partial<T>) => setDraft((d) => editDraft(d, patch)),
    accept: (next: T) => setDraft(beginDraft(next)),
    receive: (next: T) => setDraft((d) => receiveServerRecord(d, next)),
    reload: () => setDraft((d) => beginDraft(d.incoming ?? d.base)),
    rebase: () => {
      const next = rebaseDraft(draft);
      setDraft(next);
      return next;
    },
  };
}
export function useMutation<T>() {
  const router = useRouter();
  const request = useRef<string | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<MutationResult<T> | null>(null);
  function changed() {
    request.current = null;
    setResult(null);
  }
  async function run(action: (id: string) => Promise<MutationResult<T>>) {
    if (pending) return null;
    request.current ??= crypto.randomUUID();
    setPending(true);
    try {
      const value = await action(request.current);
      setResult(value);
      if (value.ok) {
        request.current = null;
        router.refresh();
      } else if (value.kind === "forbidden") {
        window.dispatchEvent(new Event("peregrine-access-lost"));
        router.replace("/sign-in?next=%2Fowner");
        router.refresh();
      }
      return value;
    } catch {
      const value: MutationResult<T> = {
        ok: false,
        kind: "unavailable",
        message:
          "The change did not save. Your input is still here; try again.",
      };
      setResult(value);
      return value;
    } finally {
      setPending(false);
    }
  }
  return { pending, result, run, changed };
}
export function SaveFeedback({
  result,
}: {
  result: MutationResult<unknown> | null;
}) {
  return result ? (
    <p
      role={result.ok ? "status" : "alert"}
      className={result.ok ? "owner-notice" : "owner-error"}
    >
      {result.ok ? "Saved." : result.message}
    </p>
  ) : null;
}
