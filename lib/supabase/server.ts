import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Where Peregrine's database is, and the key a browser may hold. The Vercel
 * Supabase integration names them NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_ANON_KEY; newer projects issue a publishable key.
 */
export function supabaseEnv() {
  const url = publicEnv("SUPABASE_URL");
  const key = publicEnv("SUPABASE_PUBLISHABLE_KEY") ?? publicEnv("SUPABASE_ANON_KEY");
  return url && key ? { url, key } : null;
}

/**
 * NEXT_PUBLIC_SUPABASE_URL, or the same under the prefix the Vercel integration
 * adds when a store is connected with a name (NEXT_PUBLIC_BookingStorage_…).
 * Only public names are read: this file never touches the service-role key.
 */
export function publicEnv(name: string): string | undefined {
  const env = process.env;
  if (env[`NEXT_PUBLIC_${name}`]) return env[`NEXT_PUBLIC_${name}`];
  const key = Object.keys(env).find((k) => k.startsWith("NEXT_PUBLIC_") && k.endsWith(`_${name}`) && env[k]);
  return key ? env[key] : undefined;
}

/**
 * A client acting as whoever is signed in. Every query through it runs under
 * row-level security, so a member of one venue can never read another's diary —
 * the database refuses, whatever this code asks for.
 */
export async function supabase() {
  // Cookies first: reading them is what marks the route as per-request.
  const store = await cookies();
  const env = supabaseEnv();
  if (!env) throw new Error("Supabase is not configured for this deployment.");
  return createServerClient(env.url, env.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        // A Server Component cannot set cookies; the proxy refreshes them
        // instead, so a failure here is expected and harmless.
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {}
      },
    },
  });
}
