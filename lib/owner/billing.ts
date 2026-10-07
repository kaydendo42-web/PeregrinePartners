import "server-only";
import { ownerClient } from "@/lib/crm/query";
import type { OwnerContext } from "@/lib/crm/types";
export async function billingTotals(context: OwnerContext) {
  const client = await ownerClient(context);
  const { data, error } = await client.rpc("crm_overview", {
    p_workspace: context.workspaceId,
  });
  if (error) throw new Error("Could not load manual balances.");
  return {
    balances: data.balances as Record<string, string>,
    overdue: data.overdue as Record<string, string>,
  };
}
