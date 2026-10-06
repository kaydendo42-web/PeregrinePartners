import "server-only";
import { notFound } from "next/navigation";
import { ownerClient, getBusiness } from "@/lib/crm/query";
import { escapeLike, parseUuid, parseVersion } from "@/lib/crm/validation";
import type {
  OwnerContext,
  ClientAccount,
  PageResult,
  ClientTool,
  BillingRecord,
  Tool,
} from "@/lib/crm/types";
import { ownerBookingSession } from "./bookings";
export async function listClients(
  context: OwnerContext,
  query: { q: string; page: number },
): Promise<PageResult<ClientAccount>> {
  const client = await ownerClient(context);
  let request = client
    .from("crm_clients")
    .select("*,business:crm_businesses!inner(*)", { count: "exact" })
    .eq("workspace_id", context.workspaceId)
    .eq("business.archived", false);
  if (query.q)
    request = request.ilike("business.name", "%" + escapeLike(query.q) + "%");
  const page = parseVersion(query.page);
  const { data, error, count } = await request
    .order("updated_at", { ascending: false })
    .order("id")
    .range((page - 1) * 50, page * 50 - 1);
  if (error) throw new Error("Could not load clients.");
  return {
    rows: (data ?? []) as unknown as ClientAccount[],
    total: count ?? 0,
    page,
    pageSize: 50,
  };
}
export async function getClient(context: OwnerContext, id: string) {
  const client = await ownerClient(context);
  const clientId = parseUuid(id);
  const { data, error } = await client
    .from("crm_clients")
    .select("*")
    .eq("workspace_id", context.workspaceId)
    .eq("id", clientId)
    .maybeSingle();
  if (error) throw new Error("Could not load client.");
  if (!data) notFound();
  const [business, tools, billing] = await Promise.all([
    getBusiness(context, data.business_id),
    client
      .from("crm_client_tools")
      .select("*,tool:crm_tool_catalog(*)")
      .eq("workspace_id", context.workspaceId)
      .eq("client_id", clientId)
      .order("created_at")
      .limit(100),
    client
      .from("crm_billing_records")
      .select("*")
      .eq("workspace_id", context.workspaceId)
      .eq("client_id", clientId)
      .order("due_on", { ascending: false })
      .limit(100),
  ]);
  if (tools.error || billing.error)
    throw new Error("Could not load client tools or billing.");
  return {
    client: data as ClientAccount,
    ...business,
    tools: tools.data as (ClientTool & { tool: Tool })[],
    billing: billing.data as BillingRecord[],
  };
}
export async function visibleVenues(context: OwnerContext) {
  const client = await ownerClient(context);
  const { data: links, error: linkError } = await client
    .from("crm_booking_links")
    .select("venue_id")
    .eq("workspace_id", context.workspaceId);
  if (linkError) throw new Error("Could not load booking connections.");
  const booking = await ownerBookingSession();
  if (!booking || !links?.length) return [];
  const { data, error } = await booking.client
    .from("venues")
    .select("id,name,slug")
    .in(
      "id",
      links.map((l) => l.venue_id),
    )
    .order("name")
    .limit(100);
  if (error) throw new Error("Could not load venue links.");
  return data ?? [];
}
