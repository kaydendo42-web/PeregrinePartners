"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { browserSupabase } from "@/lib/supabase/browser";
import { SHOP_SCHEMA } from "@/lib/supabase/environment";

/** A guest books online and the open calendar shows it without a reload. RLS keeps it to this shop. */
export function ShopLive({ url, anonKey, shopId }: { url: string; anonKey: string; shopId: string }) {
  const router = useRouter();
  useEffect(() => {
    const client = browserSupabase(url, anonKey);
    const filter = `tenant_id=eq.${shopId}`;
    const channel = client
      .channel(`shop:${shopId}`)
      .on("postgres_changes", { event: "*", schema: SHOP_SCHEMA, table: "bookings", filter }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: SHOP_SCHEMA, table: "blocks", filter }, () => router.refresh())
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [url, anonKey, shopId, router]);
  return null;
}
