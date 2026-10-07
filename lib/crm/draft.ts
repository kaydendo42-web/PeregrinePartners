export type Versioned = { id: string; version: number };
export type Draft<T extends Versioned> = {
  base: T;
  value: T;
  dirty: boolean;
  incoming: T | null;
};
export function beginDraft<T extends Versioned>(record: T): Draft<T> {
  return { base: record, value: record, dirty: false, incoming: null };
}
export function editDraft<T extends Versioned>(
  draft: Draft<T>,
  patch: Partial<T>,
): Draft<T> {
  return { ...draft, value: { ...draft.value, ...patch }, dirty: true };
}
export function receiveServerRecord<T extends Versioned>(
  draft: Draft<T>,
  record: T,
): Draft<T> {
  if (record.id !== draft.base.id) return beginDraft(record);
  if (record.version <= draft.base.version) return draft;
  return draft.dirty ? { ...draft, incoming: record } : beginDraft(record);
}
export function rebaseDraft<T extends Versioned>(draft: Draft<T>): Draft<T> {
  return draft.incoming
    ? { ...draft, base: draft.incoming, incoming: null }
    : draft;
}
