import type { Metadata } from "next";
import { requireOwner } from "@/lib/owner/access";
import { signOut } from "@/app/sign-in/actions";
import { OwnerNav } from "./nav";
import { supabaseEnv } from "@/lib/supabase/server";
import {
  WorkspaceLiveRefresh,
  LiveStatus,
} from "@/components/crm/live-refresh";
import { OwnerShell } from "@/components/owner/shell";
import { listClients, visibleVenues } from "@/lib/owner/clients";
import { WorkspaceSwitcher } from "@/components/owner/workspace-switcher";
import "./owner.css";
import "./agency.css";

export const metadata: Metadata = {
  title: "Owner workspace",
  robots: { index: false, follow: false },
};
export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { context } = await requireOwner();
  const env = supabaseEnv()!;
  const [accounts, venues] = await Promise.all([
    listClients(context, { q: "", page: 1 }),
    visibleVenues(context),
  ]);
  return (
    <WorkspaceLiveRefresh
      workspaceId={context.workspaceId}
      userId={context.userId}
      url={env.url}
      anonKey={env.key}
      venueIds={venues
        .filter((v) => accounts.rows.some((a) => a.venue_id === v.id))
        .map((v) => v.id)}
    >
      <OwnerShell
        displayName={context.displayName}
        navigation={<OwnerNav />}
        status={<LiveStatus label="CRM" />}
        workspaceControl={
          <WorkspaceSwitcher
            clients={accounts.rows.map((c) => ({
              id: c.id,
              name: c.business?.name ?? "Client",
            }))}
          />
        }
        signOutControl={
          <form action={signOut}>
            <button className="owner-signout">
              Sign out <span aria-hidden="true">↗</span>
            </button>
          </form>
        }
      >
        {children}
      </OwnerShell>
    </WorkspaceLiveRefresh>
  );
}
