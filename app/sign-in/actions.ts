"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabase, supabaseEnv } from "@/lib/supabase/server";

export type SignInState = { error?: string; sent?: boolean };

/** Only ever send someone back inside the console, never to another site. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/console") ? next : "/console";
}

/**
 * Email and password — how Resos signs Jenny in, so it is how Peregrine does
 * too. One message for every failure: a sign-in form that says "no such
 * account" is an account-enumeration oracle.
 */
export async function signInWithPassword(_: SignInState, form: FormData): Promise<SignInState> {
  if (!supabaseEnv()) return { error: "Sign-in isn't switched on for this site yet." };
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const client = await supabase();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) return { error: "Those details did not match." };
  redirect(safeNext(form.get("next")));
}

/**
 * A one-time link instead of a password. Never creates an account: people are
 * added to a venue by Peregrine, not by signing themselves up. Everyone gets
 * the same answer whether or not the address is known.
 */
export async function sendSignInLink(_: SignInState, form: FormData): Promise<SignInState> {
  if (!supabaseEnv()) return { error: "Sign-in isn't switched on for this site yet." };
  const email = String(form.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email." };

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const client = await supabase();
  await client.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(safeNext(form.get("next")))}`,
    },
  });
  return { sent: true };
}

export async function signOut() {
  const client = await supabase();
  await client.auth.signOut();
  redirect("/sign-in");
}
