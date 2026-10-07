import type { Metadata } from "next";
import { BRAND_NAME } from "@/lib/brand";
import { requireOwner } from "@/lib/owner/access";
import { signOutOwner } from "@/app/sign-in/actions";
import { OwnerNav } from "./nav";
import { supabaseEnv } from "@/lib/supabase/server";
import {
  WorkspaceLiveRefresh,
  LiveStatus,
} from "@/components/crm/live-refresh";
import { OwnerShell } from "@/components/owner/shell";
import { listClients, visibleVenues } from "@/lib/owner/clients";
import { ownerBookingSession } from "@/lib/owner/bookings";
import { BookingUpdates } from "@/components/owner/booking-updates";
import { WorkspaceSwitcher } from "@/components/owner/workspace-switcher";
import "./owner.css";
import "./agency.css";

export const metadata: Metadata = {
  title: {
    absolute: `Founder workspace · ${BRAND_NAME}`,
    template: `%s · ${BRAND_NAME}`,
  },
  robots: { index: false, follow: false },
};
export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { context } = await requireOwner();
  const env = supabaseEnv("internal")!;
  const [accounts, venues, booking] = await Promise.all([
    listClients(context, { q: "", page: 1 }),
    visibleVenues(context),
    ownerBookingSession(),
  ]);
  const bookingEnv = supabaseEnv("booking");
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
          <>
            <a
              className="owner-signout"
              href="/sign-in/password?next=%2Fowner"
            >
              Password <span aria-hidden="true">↗</span>
            </a>
            <form action={signOutOwner}>
              <button className="owner-signout">
                Sign out <span aria-hidden="true">↗</span>
              </button>
            </form>
          </>
        }
      >
        {children}
        {booking && bookingEnv && venues.length ? (
          <BookingUpdates
            url={bookingEnv.url}
            anonKey={bookingEnv.key}
            userId={booking.user.id}
            venueIds={venues
              .filter((v) => accounts.rows.some((a) => a.venue_id === v.id))
              .map((v) => v.id)}
          />
        ) : null}
      </OwnerShell>
    </WorkspaceLiveRefresh>
  );
}
