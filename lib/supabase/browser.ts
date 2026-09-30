"use client";
import { createBrowserClient } from "@supabase/ssr";

/** The signed-in member's client in the browser — used only to hear new bookings arrive. */
export function browserSupabase(url: string, key: string) {
  return createBrowserClient(url, key);
}
