import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { projectEnvironment, schemaFor, type SupabaseProject } from "./environment";
import { cookieOptions, isAuthCookie, makePolicy, policyName, visibleCookies } from "../auth/session-policy";

/**
 * Where Peregrine's database is, and the key a browser may hold. The Vercel
 * Supabase integration names them NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_ANON_KEY; newer projects issue a publishable key.
 */
export function supabaseEnv(project: SupabaseProject = "booking") {
  return projectEnvironment(process.env, project);
}

/**
 * A client acting as whoever is signed in. Every query through it runs under
 * row-level security, so a member of one venue can never read another's diary —
 * the database refuses, whatever this code asks for.
 */
export async function supabase(project: SupabaseProject = "booking", remember?: boolean) {
  // Cookies first: reading them is what marks the route as per-request.
  const store = await cookies();
  const env = supabaseEnv(project);
  if (!env) throw new Error("Supabase is not configured for this deployment.");
  const policy = remember === undefined ? store.get(policyName(env.url))?.value : makePolicy(remember);
  return createServerClient(env.url, env.key, {
    db: { schema: schemaFor(project) },
    cookies: {
      getAll: () => remember === undefined ? visibleCookies(store.getAll(), env.url) : store.getAll(),
      setAll: (list) => {
        // A Server Component cannot set cookies; the proxy refreshes them
        // instead, so a failure here is expected and harmless.
        try {
          for (const { name, value, options } of list)
            store.set(name, value, isAuthCookie(name, env.url) ? cookieOptions(options, policy) : options);
        } catch {}
      },
    },
  });
}
