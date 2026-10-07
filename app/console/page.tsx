import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { BRAND_NAME } from "@/lib/brand";
import Link from "next/link";
import { myVenues } from "@/lib/console/data";
import "./console.css";
import { ownerSignedIn } from "@/lib/owner/access";

export const metadata: Metadata = {
  title: { absolute: `Client workspaces · ${BRAND_NAME}` },
  robots: { index: false, follow: false },
};

/**
 * The console's front door. One venue goes straight in — the usual case, and
 * the one Jenny will see. Several (a group, or Peregrine's own staff) get a
 * list. None means the account exists but nobody has added it to a venue yet.
 */
export default async function ConsoleHome() {
  if (await ownerSignedIn()) redirect("/owner");
  const venues = await myVenues();
  if (venues.length === 1) redirect(`/console/${venues[0].slug}`);

  return (
    <main className="console-shell console-shell--bare">
      <div className="console-picker">
        <p className="console-kicker">{BRAND_NAME}</p>
        {venues.length ? (
          <>
            <h1>Choose a venue</h1>
            <ul>
              {venues.map((v) => (
                <li key={v.id}>
                  <Link href={`/console/${v.slug}`}>{v.name}</Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <h1>No venue yet</h1>
            <p>
              You&rsquo;re signed in, but this account hasn&rsquo;t been added
              to a venue. Ask whoever set up your venue on Peregrine Office to add you.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
