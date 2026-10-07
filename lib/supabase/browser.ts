"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
const clients = new Map<string, SupabaseClient>();

/** The signed-in member's client in the browser — used only to hear new bookings arrive. */
export function browserSupabase(url: string, key: string) {
  // The SDK's default singleton spans URLs; keep one instance per project instead.
  const id = JSON.stringify([url, key]);
  let client = clients.get(id);
  if (!client) {
    client = createBrowserClient(url, key, { isSingleton: false });
    clients.set(id, client);
  }
  return client;
}
