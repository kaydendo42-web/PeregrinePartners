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
import "./owner.css";

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
  return (
    <WorkspaceLiveRefresh
      workspaceId={context.workspaceId}
      userId={context.userId}
      url={env.url}
      anonKey={env.key}
    >
      <OwnerShell
        displayName={context.displayName}
        navigation={<OwnerNav />}
        status={<LiveStatus />}
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
