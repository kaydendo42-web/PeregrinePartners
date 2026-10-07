"use server";
import { rpcMutation } from "@/lib/crm/mutations";
import {
  parseUuid,
  parseVersion,
  parseBusinessPatch,
  object,
  onlyKeys,
  text,
  email,
} from "@/lib/crm/validation";
import type { Business, Activity, Contact, FollowUp } from "@/lib/crm/types";
export async function createBusiness(input: unknown, requestId: string) {
  return rpcMutation<Business>("crm_create_business", requestId, () => ({
    p_input: parseBusinessPatch(input),
  }));
}
export async function saveBusiness(
  id: string,
  version: number,
  input: unknown,
  requestId: string,
) {
  return rpcMutation<Business>("crm_update_business", requestId, () => ({
    p_id: parseUuid(id),
    p_expected_version: parseVersion(version),
    p_patch: parseBusinessPatch(input),
  }));
}
export async function addActivity(
  id: string,
  input: unknown,
  requestId: string,
) {
  return rpcMutation<Activity>("crm_add_activity", requestId, () => {
    const v = object(input);
    onlyKeys(v, ["kind", "channel", "occurred_at", "summary", "mark_replied"]);
    if (
      !["note", "outreach", "reply", "meeting", "proposal"].includes(
        String(v.kind),
      )
    )
      throw new Error("Choose an activity.");
    if (
      v.channel !== null &&
      !["email", "phone", "sms", "social", "other"].includes(String(v.channel))
    )
      throw new Error("Choose a channel.");
    if (
      typeof v.mark_replied !== "boolean" ||
      typeof v.occurred_at !== "string" ||
      !Number.isFinite(Date.parse(v.occurred_at))
    )
      throw new Error("Check the activity time.");
    return {
      p_business: parseUuid(id),
      p_input: { ...v, summary: text(v.summary, 10000, true) },
    };
  });
}
export async function saveContact(
  business: string,
  input: unknown,
  version: number | null,
  requestId: string,
) {
  return rpcMutation<Contact>("crm_save_contact", requestId, () => {
    const v = object(input);
    onlyKeys(v, ["id", "name", "email", "phone", "is_primary"]);
    if (v.id) parseUuid(v.id);
    if (typeof v.is_primary !== "boolean")
      throw new Error("Check primary contact.");
    return {
      p_business: parseUuid(business),
      p_expected_version: version === null ? null : parseVersion(version),
      p_input: {
        ...v,
        name: text(v.name, 300),
        email: email(v.email),
        phone: v.phone ? text(v.phone, 100) : null,
      },
    };
  });
}
export async function saveFollowUp(
  input: unknown,
  version: number | null,
  requestId: string,
) {
  return rpcMutation<FollowUp>("crm_save_follow_up", requestId, () => {
    const v = object(input);
    onlyKeys(v, [
      "id",
      "business_id",
      "assigned_to",
      "due_at",
      "instruction",
      "state",
    ]);
    if (v.id) parseUuid(v.id);
    if (
      !["open", "done", "cancelled"].includes(String(v.state)) ||
      typeof v.due_at !== "string" ||
      !Number.isFinite(Date.parse(v.due_at))
    )
      throw new Error("Check the follow-up details.");
    return {
      p_expected_version: version === null ? null : parseVersion(version),
      p_input: {
        ...v,
        business_id: parseUuid(v.business_id),
        assigned_to: parseUuid(v.assigned_to),
        instruction: text(v.instruction, 10000, true),
      },
    };
  });
}
export async function bulkBusinesses(
  items: { id: string; version: number }[],
  input: unknown,
  requestId: string,
) {
  return rpcMutation<Business[]>("crm_bulk_businesses", requestId, () => {
    if (!Array.isArray(items) || items.length < 1 || items.length > 100)
      throw new Error("Select between 1 and 100 businesses.");
    const patch = object(input);
    onlyKeys(patch, ["assigned_to", "stage", "tags"]);
    return {
      p_items: items.map((item) => ({
        id: parseUuid(item.id),
        version: parseVersion(item.version),
      })),
      p_patch: parseBusinessPatch(patch),
    };
  });
}
