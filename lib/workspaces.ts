import "server-only";
import { connection } from "next/server";
import { supabase, supabaseEnv } from "@/lib/supabase/server";
import { demoOn, demoVenue } from "@/lib/console/demo";

export type Workspace = {
  key: string;
  name: string;
  kind: "office" | "venue";
  href: string;
  /** False when this browser has no session for that workspace's project yet. */
  signedIn: boolean;
};

export type WorkspaceMember = { initial: string; name: string; email: string };

/**
 * Every workspace this browser is signed in to, for the switcher. The two
 * projects keep separate sessions, so each side is read with its own client
 * and neither ever grants the other. Links only: each page re-checks access.
 */
export async function myWorkspaces(displayName?: string): Promise<{
  me: WorkspaceMember;
  workspaces: Workspace[];
}> {
  await connection();
  const [office, booking] = await Promise.all([officeSide(), bookingSide()]);

  const workspaces: Workspace[] = [];
  if (office)
    workspaces.push({
      key: "office",
      name: "Peregrine Office",
      kind: "office",
      href: "/owner",
      signedIn: true,
    });
  for (const v of booking?.venues ?? [])
    workspaces.push({
      key: `venue:${v.slug}`,
      name: v.name,
      kind: "venue",
      href: `/console/${v.slug}`,
      signedIn: true,
    });
  // A founder not yet signed in to the client project can start that here;
  // a venue member never sees the founder workspace offered.
  if (office && !booking?.venues.length)
    workspaces.push({
      key: "console",
      name: "Client console",
      kind: "venue",
      href: "/sign-in?project=booking&next=%2Fconsole",
      signedIn: false,
    });

  const email = office?.email ?? booking?.email ?? "";
  const name = displayName || email.split("@")[0] || "You";
  return {
    me: { initial: name.slice(0, 1).toUpperCase(), name, email },
    workspaces,
  };
}

async function officeSide(): Promise<{ email: string } | null> {
  if (!supabaseEnv("internal")) return null;
  const client = await supabase("internal");
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;
  const { data: owner } = await client.rpc("crm_owner_status");
  return owner === true ? { email: user.email ?? "" } : null;
}

async function bookingSide(): Promise<{
  email: string;
  venues: { slug: string; name: string }[];
} | null> {
  if (demoOn())
    return { email: "", venues: [{ slug: demoVenue.slug, name: demoVenue.name }] };
  if (!supabaseEnv("booking")) return null;
  const client = await supabase("booking");
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;
  // Row-level security returns only this member's venues, and none below aal2.
  const { data } = await client
    .from("venues")
    .select("slug,name")
    .order("name");
  return { email: user.email ?? "", venues: data ?? [] };
}
