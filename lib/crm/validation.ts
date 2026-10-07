import { stages } from "./types.ts";
import type {
  UUID,
  Stage,
  BusinessPatch,
  BusinessQuery,
  Priority,
} from "./types.ts";

export function parseUuid(value: unknown): UUID {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    throw new Error("Choose a valid record.");
  return value;
}
export function parseVersion(value: unknown): number {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    (typeof value === "string" && !/^\d+$/.test(value))
  )
    throw new Error("Reload the record before saving.");
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1)
    throw new Error("Reload the record before saving.");
  return number;
}
export function text(value: unknown, max: number, required = false): string {
  if (typeof value !== "string") throw new Error("Enter text in this field.");
  const result = value.trim();
  if (result.length > max || (required && !result))
    throw new Error(
      required
        ? `Enter between 1 and ${max} characters.`
        : `Use at most ${max} characters.`,
    );
  return result;
}
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Check the submitted fields.");
  return value as Record<string, unknown>;
}
export function onlyKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
) {
  if (Object.keys(value).some((key) => !keys.includes(key)))
    throw new Error("Some submitted fields are not editable.");
}
export function parseStage(value: unknown): Stage {
  if (!stages.includes(value as Stage))
    throw new Error("Choose a valid stage.");
  return value as Stage;
}
export function website(value: unknown): string | null {
  if (value === null || value === "") return null;
  const result = text(value, 2000);
  try {
    const url = new URL(result);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new Error();
    return url.href;
  } catch {
    throw new Error("Use an http or https website address.");
  }
}
export function email(value: unknown): string | null {
  if (value === null || value === "") return null;
  const result = text(value, 320);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result))
    throw new Error("Check the email address.");
  return result;
}
export function tags(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 20)
    throw new Error("Use at most 20 tags.");
  return [...new Set(value.map((v) => text(v, 80, true)))];
}
export function parseBusinessPatch(value: unknown): BusinessPatch {
  const source = object(value);
  onlyKeys(source, [
    "name",
    "location",
    "industry",
    "website",
    "stage",
    "assigned_to",
    "priority",
    "tags",
    "do_not_contact",
    "archived",
  ]);
  const result: BusinessPatch = {};
  for (const [key, v] of Object.entries(source)) {
    if (key === "name" || key === "location" || key === "industry")
      result[key] = text(v, 300, key === "name");
    else if (key === "website") result.website = website(v);
    else if (key === "stage") result.stage = parseStage(v);
    else if (key === "assigned_to")
      result.assigned_to = v === null ? null : parseUuid(v);
    else if (key === "priority") {
      if (!["low", "normal", "high"].includes(String(v)))
        throw new Error("Choose a priority.");
      result.priority = v as Priority;
    } else if (key === "tags") result.tags = tags(v);
    else if (key === "do_not_contact" || key === "archived") {
      if (typeof v !== "boolean") throw new Error("Choose yes or no.");
      result[key] = v;
    }
  }
  return result;
}
export function parseQuery(value: unknown): BusinessQuery {
  const source = object(value);
  const read = (key: string, max = 300) =>
    source[key] === undefined ? "" : text(source[key], max);
  const page = source.page === undefined ? 1 : parseVersion(source.page);
  if (page > 100000) throw new Error("Page is out of range.");
  const sort = source.sort ?? "updated_at";
  if (
    ![
      "name",
      "updated_at",
      "last_contact",
      "next_follow_up",
      "source_row",
    ].includes(String(sort))
  )
    throw new Error("Choose a sort order.");
  const priority = source.priority ? String(source.priority) : null;
  if (priority && !["low", "normal", "high"].includes(priority))
    throw new Error("Choose a priority.");
  const boardPages: BusinessQuery["boardPages"] = {};
  for (const stage of stages) {
    if (source["p_" + stage])
      boardPages[stage] = parseVersion(source["p_" + stage]);
  }
  return {
    q: read("q"),
    stage: source.stage ? parseStage(source.stage) : null,
    owner:
      source.owner === "unassigned"
        ? "unassigned"
        : source.owner
          ? parseUuid(source.owner)
          : null,
    location: read("location"),
    industry: read("industry"),
    tag: read("tag", 80),
    priority: priority as Priority | null,
    batch: source.batch ? parseUuid(source.batch) : null,
    incomplete: source.incomplete === "1",
    due: source.due === "1",
    stopped: source.stopped === "1",
    page,
    sort: sort as BusinessQuery["sort"],
    view: source.view === "board" ? "board" : "table",
    boardPages,
  };
}
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}
export function outreachAllowed(doNotContact: boolean, kind: string): boolean {
  return !doNotContact || !["outreach", "follow_up"].includes(kind);
}
