import type { Metadata } from "next";
import { BRAND_NAME } from "@/lib/brand";
import { venueBySlug } from "@/lib/console/data";
import { supabaseEnv } from "@/lib/supabase/server";
import { signOut } from "@/app/sign-in/actions";
import { ConsoleNav } from "./nav";
import { LiveRefresh } from "./live-refresh";
import { demoOn } from "@/lib/console/demo";
import "../console.css";

export const metadata: Metadata = {
  title: {
    absolute: `Client workspace · ${BRAND_NAME}`,
    template: `%s · ${BRAND_NAME}`,
  },
  robots: { index: false, follow: false },
};

/**
 * The console frame, laid out the way Resos lays it out — a sidebar of
 * Dashboard, Calendar, Schedule, List, Floor plan, Customers, Settings — so a
 * venue moving over already knows where everything is. The look is Peregrine's.
 */
export default async function VenueLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ venue: string }>;
}) {
  const { venue: slug } = await params;
  const venue = await venueBySlug(slug);
  const env = supabaseEnv();

  return (
    <div className="console-shell">
      <aside className="console-side">
        <p className="console-side__brand">{BRAND_NAME}</p>
        <ConsoleNav slug={slug} />
        <div className="console-side__out">
          <a href={`/sign-in/password?next=${encodeURIComponent(`/console/${slug}`)}`}>
            Password
          </a>
          <form action={signOut}>
            <button type="submit">Sign out</button>
          </form>
        </div>
      </aside>
      <div className="console-main">
        <header className="console-top">
          <h1 className="console-top__venue">{venue.name}</h1>
          {demoOn() ? <span className="console-chip console-chip--no_show">Demo data</span> : null}
          <a className="console-btn console-btn--primary" href={`/console/${slug}/new`}>
            New booking
          </a>
        </header>
        <div className="console-body">{children}</div>
      </div>
      {env ? <LiveRefresh url={env.url} anonKey={env.key} venueId={venue.id} /> : null}
    </div>
  );
}
