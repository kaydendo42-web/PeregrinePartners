import "server-only";
import { cookies } from "next/headers";
import { supabaseEnv } from "@/lib/supabase/server";
import type { SupabaseProject } from "@/lib/supabase/environment";
import { choiceName, cookieOptions, isAuthCookie, makePolicy, policyName, REMEMBER_SECONDS } from "./session-policy";

const base = () => ({ path: "/", sameSite: "lax" as const, secure: process.env.NODE_ENV === "production" });

export async function saveSessionPreference(project: SupabaseProject, remember: boolean) {
  const env = supabaseEnv(project);
  if (!env) return;
  const store = await cookies();
  const value = makePolicy(remember);
  // Keep the non-credential deadline marker a day beyond the auth cookies so
  // an open tab cannot mistake expiry for a legacy session during refresh.
  store.set(policyName(env.url), value, remember ? { ...base(), maxAge: REMEMBER_SECONDS + 86400 } : base());
  // Reissue any chunks already written by sign-in with the same fixed policy.
  for (const c of store.getAll()) if (isAuthCookie(c.name, env.url)) store.set(c.name, c.value, cookieOptions(base(), value));
  store.set(choiceName(env.url), "", { ...base(), maxAge: 0 });
}

export async function savePendingChoice(project: SupabaseProject, remember: boolean) {
  const env = supabaseEnv(project);
  if (env) (await cookies()).set(choiceName(env.url), remember ? "remember" : "session", { ...base(), maxAge: 3600 });
}

export async function pendingChoice(project: SupabaseProject): Promise<boolean | undefined> {
  const env = supabaseEnv(project);
  const value = env ? (await cookies()).get(choiceName(env.url))?.value : undefined;
  return value === "remember" ? true : value === "session" ? false : undefined;
}

export async function clearSessionPreference(project: SupabaseProject) {
  const env = supabaseEnv(project);
  if (!env) return;
  const store = await cookies();
  for (const name of [policyName(env.url), choiceName(env.url)]) store.set(name, "", { ...base(), maxAge: 0 });
}
