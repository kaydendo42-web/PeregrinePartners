import type { BusinessQuery, Stage } from "./types.ts";
import { stages } from "./types.ts";
export type SelectedRecord = { id: string; version: number };
export function retainDirtyRows<T extends { id: string }>(
  previous: T[],
  current: T[],
  dirty: ReadonlySet<string>,
): T[] {
  const visible = new Set(current.map((r) => r.id));
  return [
    ...current,
    ...previous.filter((r) => dirty.has(r.id) && !visible.has(r.id)),
  ];
}
export function toggleSelection(
  selected: SelectedRecord[],
  row: SelectedRecord,
): SelectedRecord[] {
  return selected.some((s) => s.id === row.id)
    ? selected.filter((s) => s.id !== row.id)
    : [...selected, { id: row.id, version: row.version }];
}
export function selectionChanged(
  selected: SelectedRecord[],
  current: SelectedRecord[],
): boolean {
  return selected.some(
    (s) => !current.some((r) => r.id === s.id && r.version === s.version),
  );
}
export function boardStages(query: Pick<BusinessQuery, "stage">): Stage[] {
  return query.stage ? [query.stage] : [...stages];
}
export function boardPageHref(url: string, stage: Stage, page: number): string {
  const parsed = new URL(url, "https://peregrine.invalid");
  parsed.searchParams.set("p_" + stage, String(page));
  return parsed.pathname + "?" + parsed.searchParams.toString();
}
export function queueContactState(
  query: Pick<BusinessQuery, "stopped">,
): boolean {
  return query.stopped;
}
