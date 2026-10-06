"use server";
import { revalidatePath } from "next/cache";
import { requireClientVenue } from "@/lib/client-crm/data";
import { parseUuid, parseVersion, text } from "@/lib/crm/validation";
export type GuestSaveResult = { ok: true } | { ok: false; error: string };
export async function addGuestEntry(
  slug: string,
  booking: string,
  input: { kind: string; body: string; due: string; request: string },
): Promise<GuestSaveResult> {
  const { client, venue } = await requireClientVenue(slug);
  try {
    if (!["note", "task"].includes(input.kind))
      throw new Error("Choose a note or follow-up.");
    const body = text(input.body, 2000);
    if (!body.trim()) throw new Error("Add a note or task description.");
    if (
      input.kind === "task" &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(input.due) ||
        new Date(input.due + "T00:00:00Z").toISOString().slice(0, 10) !==
          input.due)
    )
      throw new Error("Choose a valid due date.");
    if (!booking || booking.length > 300) throw new Error("Choose a customer.");
    const { error } = await client.rpc("client_crm_add_entry", {
      p_venue: venue.id,
      p_booking: booking,
      p_kind: input.kind,
      p_body: body,
      p_due: input.kind === "task" ? input.due : null,
      p_request: parseUuid(input.request),
    });
    if (error)
      return {
        ok: false,
        error:
          error.code === "42501"
            ? "Your access has changed. Sign in again."
            : "This entry did not save. Your draft is still here; try again.",
      };
    revalidatePath(`/console/${slug}/crm`, "layout");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Check the entry and try again.",
    };
  }
}
export async function setGuestTask(
  slug: string,
  id: string,
  version: number,
  state: string,
): Promise<GuestSaveResult> {
  const { client, venue } = await requireClientVenue(slug);
  try {
    if (!["open", "done", "cancelled"].includes(state))
      throw new Error("Choose a valid task status.");
    const { data, error } = await client.rpc("client_crm_set_state", {
      p_venue: venue.id,
      p_id: parseUuid(id),
      p_version: parseVersion(version),
      p_state: state,
    });
    if (error)
      return {
        ok: false,
        error: "The task did not save. Refresh its status and try again.",
      };
    revalidatePath(`/console/${slug}/crm`, "layout");
    return data.ok ? { ok: true } : { ok: false, error: data.message };
  } catch {
    return { ok: false, error: "Check the task and try again." };
  }
}
