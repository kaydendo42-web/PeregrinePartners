"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { browserSupabase } from "@/lib/supabase/browser";

/**
 * When a guest books on the venue's website, the open console shows it without
 * a reload: Supabase Realtime tells us a row changed, and the page re-fetches
 * its server data. Row-level security applies to Realtime too, so this only
 * ever hears about the member's own venue.
 */
export function LiveRefresh({ url, anonKey, venueId }: { url: string; anonKey: string; venueId: string }) {
  const router = useRouter();
  useEffect(() => {
    const client = browserSupabase(url, anonKey);
    const channel = client
      .channel(`bookings:${venueId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `venue_id=eq.${venueId}` },
        () => router.refresh(),
      )
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [url, anonKey, venueId, router]);
  return null;
}
