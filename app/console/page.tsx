import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { BRAND_NAME } from "@/lib/brand";
import Link from "next/link";
import { myClients } from "@/lib/console/clients";
import { pickDestination } from "@/lib/console/client-list";
import { supabase } from "@/lib/supabase/server";
import "./console.css";
import { ownerSignedIn } from "@/lib/owner/access";

export const metadata: Metadata = {
  title: { absolute: `Client workspaces · ${BRAND_NAME}` },
  robots: { index: false, follow: false },
};

/**
 * The console's front door. One venue or shop goes straight in — the usual
 * case, and the one Jenny and Vance will see. Several (a group, or
 * Peregrine's own staff) get a list. None means the account exists but nobody
 * has added it to a venue or shop yet — or it's a venue account that hasn't
 * done its authenticator code, so venues aren't readable yet.
 */
export default async function ConsoleHome() {
  if (await ownerSignedIn()) redirect("/owner");
  const clients = await myClients();
  const only = pickDestination(clients);
  if (only) redirect(only);
  if (!clients.length) {
    // Venues need two-step to be readable; an account that hasn't done it yet sees none.
    const { data: aal } = await (await supabase()).auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.currentLevel !== "aal2") redirect("/sign-in/verify?next=%2Fconsole");
  }

  return (
    <main className="console-shell console-shell--bare">
      <div className="console-picker">
        <p className="console-kicker">{BRAND_NAME}</p>
        {clients.length ? (
          <>
            <h1>Choose a workspace</h1>
            <ul>
              {clients.map((c) => (
                <li key={c.href}>
                  <Link href={c.href}>
                    {c.name} <span className="console-picker__kind">{c.kind === "shop" ? "Barber" : "Venue"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <h1>Nothing here yet</h1>
            <p>
              You&rsquo;re signed in, but this account hasn&rsquo;t been added
              to a venue or shop. Ask whoever set you up on Peregrine Office to add you.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
