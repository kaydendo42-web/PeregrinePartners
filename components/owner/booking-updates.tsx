"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { browserSupabase } from "@/lib/supabase/browser";
import { createRefreshScheduler } from "@/lib/crm/live-state";

/** Read-only client updates do not control the independent founder session. */
export function BookingUpdates({
  url,
  anonKey,
  userId,
  venueIds,
}: {
  url: string;
  anonKey: string;
  userId: string;
  venueIds: string[];
}) {
  const router = useRouter();
  const venues = [...venueIds].sort().join(",");
  useEffect(() => {
    if (!venues) return;
    const client = browserSupabase(url, anonKey);
    let active = true;
    let subscribed = false;
    const refresh = createRefreshScheduler(() => {
      if (active) router.refresh();
    });
    const channel = client.channel("agency-booking-reports:" + venues);
    for (const venue of venues.split(","))
      for (const event of ["INSERT", "UPDATE"] as const) {
        channel.on(
          "postgres_changes",
          {
            event,
            schema: "public",
            table: "bookings",
            filter: "venue_id=eq." + venue,
          },
          () => refresh.schedule(),
        );
      }
    async function validate() {
      const {
        data: { user },
        error,
      } = await client.auth.getUser();
      const { data: aal, error: aalError } =
        await client.auth.mfa.getAuthenticatorAssuranceLevel();
      if (!active) return;
      if (
        error ||
        !user ||
        user.id !== userId ||
        aalError ||
        aal?.currentLevel !== "aal2"
      ) {
        void client.removeChannel(channel);
        refresh.schedule();
        return;
      }
      if (!subscribed) {
        subscribed = true;
        channel.subscribe((status) => {
          if (active && status === "SUBSCRIBED") refresh.schedule();
        });
      }
    }
    void validate();
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(() => {
      setTimeout(() => {
        void validate();
      }, 0);
    });
    const focus = () => {
      void validate();
      refresh.schedule();
    };
    window.addEventListener("focus", focus);
    const fallback = setInterval(focus, 30000);
    return () => {
      active = false;
      refresh.dispose();
      clearInterval(fallback);
      subscription.unsubscribe();
      window.removeEventListener("focus", focus);
      void client.removeChannel(channel);
    };
  }, [url, anonKey, userId, venues, router]);
  return null;
}
