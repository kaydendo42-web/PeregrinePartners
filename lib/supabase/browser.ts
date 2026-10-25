"use client";
import { createBrowserClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookieOptions, isAuthCookie, policyName, visibleCookies } from "../auth/session-policy.ts";
const clients = new Map<string, SupabaseClient>();

/** The signed-in member's client in the browser — used only to hear new bookings arrive. */
export function browserSupabase(url: string, key: string) {
  // The SDK's default singleton spans URLs; keep one instance per project instead.
  const id = JSON.stringify([url, key]);
  let client = clients.get(id);
  if (!client) {
    let lastPolicy: string | undefined;
    const currentPolicy = () => {
      if (typeof document !== "undefined") {
        const value = parseCookieHeader(document.cookie).find(c => c.name === policyName(url))?.value;
        if (value !== undefined) lastPolicy = value;
      }
      return lastPolicy;
    };
    client = createBrowserClient(url, key, {
      isSingleton: false,
      cookies: {
        getAll: () => typeof document === "undefined" ? [] : visibleCookies(parseCookieHeader(document.cookie).map(c => ({ name: c.name, value: c.value ?? "" })), url),
        setAll: (list) => {
          if (typeof document === "undefined") return;
          const policy = currentPolicy();
          for (const { name, value, options } of list)
            document.cookie = serializeCookieHeader(name, value, isAuthCookie(name, url) ? cookieOptions(options, policy) : options);
        },
      },
    });
    clients.set(id, client);
  }
  return client;
}
