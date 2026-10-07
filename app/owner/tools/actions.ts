"use server";
import { rpcMutation } from "@/lib/crm/mutations";
import {
  object,
  onlyKeys,
  text,
  parseUuid,
  parseVersion,
} from "@/lib/crm/validation";
import type { Tool } from "@/lib/crm/types";
export async function saveTool(
  input: unknown,
  version: number | null,
  requestId: string,
) {
  return rpcMutation<Tool>("crm_save_tool", requestId, () => {
    const v = object(input);
    onlyKeys(v, ["id", "slug", "name", "availability", "archived"]);
    if (v.id) parseUuid(v.id);
    const slug = text(v.slug, 100, true);
    if (
      !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) ||
      !["available", "planned"].includes(String(v.availability)) ||
      typeof v.archived !== "boolean"
    )
      throw new Error("Check tool details and slug.");
    return {
      p_input: { ...v, slug, name: text(v.name, 300, true) },
      p_expected_version: version === null ? null : parseVersion(version),
    };
  });
}
