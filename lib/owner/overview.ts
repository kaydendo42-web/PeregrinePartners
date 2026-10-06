import "server-only";
import { ownerClient, listMembers } from "@/lib/crm/query";
import type { OwnerContext, Activity, FollowUp, Stage } from "@/lib/crm/types";
import { listClients, visibleVenues } from "@/lib/owner/clients";
import { bookingReport } from "@/lib/client-crm/data";
import type { BookingReport } from "@/lib/booking/report";
export type Overview = {
  clients: number;
  prospects: number;
  unassigned: number;
  replies: number;
  due: number;
  stages: Partial<Record<Stage, number>>;
  balances: Record<string, string>;
  overdue: Record<string, string>;
  tools: { id: string; name: string; clients: number }[];
  activity: Activity[];
  followUps: FollowUp[];
  accounts?: {
    id: string;
    name: string;
    status: string;
    slug: string | null;
    report: BookingReport | null;
  }[];
};
export async function ownerOverview(
  context: OwnerContext,
  days = 30,
): Promise<Overview> {
  const client = await ownerClient(context);
  const [summary, activity, followUps, members, accounts, venues] =
    await Promise.all([
      client.rpc("crm_overview", { p_workspace: context.workspaceId }),
      client
        .from("crm_activities")
        .select("*")
        .eq("workspace_id", context.workspaceId)
        .order("occurred_at", { ascending: false })
        .limit(8),
      client
        .from("crm_follow_ups")
        .select(
          "*,business:crm_businesses!inner(id,name,do_not_contact,archived)",
        )
        .eq("workspace_id", context.workspaceId)
        .eq("state", "open")
        .eq("business.do_not_contact", false)
        .eq("business.archived", false)
        .order("due_at")
        .limit(5),
      listMembers(context),
      listClients(context, { q: "", page: 1 }),
      visibleVenues(context),
    ]);
  if (summary.error || activity.error || followUps.error)
    throw new Error("Could not load workspace overview.");
  return {
    ...summary.data,
    accounts: await Promise.all(
      accounts.rows.slice(0, 6).map(async (a) => {
        const venue = venues.find((v) => v.id === a.venue_id);
        return {
          id: a.id,
          name: a.business?.name ?? "Client",
          status: a.status,
          slug: venue?.slug ?? null,
          report: venue ? await bookingReport(venue.id, days) : null,
        };
      }),
    ),
    activity: (activity.data ?? []).map((a) => ({
      ...a,
      actor_name:
        members.find((m) => m.user_id === a.actor_id)?.display_name ?? "Owner",
    })),
    followUps: followUps.data ?? [],
  } as Overview;
}
