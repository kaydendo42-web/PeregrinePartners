import "server-only";
import { cache } from "react";
import { supabase, supabaseEnv } from "@/lib/supabase/server";
import { requireOwner } from "./access";
import { readBookingReport } from "@/lib/client-crm/data";

/** Independent client session: neither project accepts the other project's token. */
export const ownerBookingSession = cache(async () => {
  await requireOwner();
  if (!supabaseEnv("booking")) return null;
  const client = await supabase("booking");
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) return null;
  const { data: aal, error: aalError } =
    await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aalError || aal?.currentLevel !== "aal2") return null;
  return { client, user };
});

export async function ownerBookingReport(venueId: string, days: number) {
  const session = await ownerBookingSession();
  if (!session) return null;
  const { client, context } = await requireOwner();
  const { data: link, error } = await client
    .from("crm_booking_links")
    .select("venue_id")
    .eq("workspace_id", context.workspaceId)
    .eq("venue_id", venueId)
    .maybeSingle();
  if (error) throw new Error("Could not verify booking connection.");
  return link ? readBookingReport(session.client, venueId, days) : null;
}
