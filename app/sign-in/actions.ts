"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabase, supabaseEnv } from "@/lib/supabase/server";
import {
  safeDestination,
  defaultDestination,
  authProject,
  workspaceDestination,
  PASSWORD_PATH,
} from "@/lib/auth/next";
import { signInPassword as passwordCopy } from "@/lib/content";

export type SignInState = { error?: string; sent?: boolean };
export type VerifyState = { error?: string };
export type PasswordState = { error?: string };

/**
 * Email and password — how Resos signs Jenny in, so it is how Peregrine does
 * too. One message for every failure: a sign-in form that says "no such
 * account" is an account-enumeration oracle.
 */
export async function signInWithPassword(
  _: SignInState,
  form: FormData,
): Promise<SignInState> {
  const project = authProject(form.get("next"), form.get("project"));
  if (!supabaseEnv(project))
    return { error: "Sign-in isn't switched on for this site yet." };
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const client = await supabase(project);
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) return { error: "Those details did not match." };
  // A password is only the first step; the code from an authenticator app is
  // the second. The proxy would send them there anyway — this saves a hop.
  redirect(
    `/sign-in/verify?project=${project}&next=${encodeURIComponent(safeDestination(form.get("next")) ?? "")}`,
  );
}

/**
 * The second step: a six-digit code from the member's authenticator app. The
 * same action finishes setting the app up the first time (the factor is still
 * unverified) and signs in every time after. Success raises the session to
 * aal2, which the database requires before it shows a single booking.
 */
export async function verifyCode(
  _: VerifyState,
  form: FormData,
): Promise<VerifyState> {
  const project = authProject(form.get("next"), form.get("project"));
  if (!supabaseEnv(project))
    return { error: "Sign-in isn't switched on for this site yet." };
  const factorId = String(form.get("factor") ?? "");
  const code = String(form.get("code") ?? "").replace(/\s/g, "");
  if (!factorId)
    return { error: "Something went wrong. Reload the page and try again." };
  if (!/^\d{6}$/.test(code))
    return { error: "Enter the six-digit code from your app." };

  const client = await supabase(project);
  const { error } = await client.auth.mfa.challengeAndVerify({
    factorId,
    code,
  });
  if (error)
    return {
      error:
        "That code didn't work. Codes change every 30 seconds; try the one showing now.",
    };
  const explicit = safeDestination(form.get("next"));
  if (explicit) redirect(explicit);
  if (project === "booking") redirect("/console");
  const { data: owner, error: ownerError } =
    await client.rpc("crm_owner_status");
  if (ownerError)
    return { error: "Could not open your workspace. Please try again." };
  redirect(defaultDestination(null, owner === true));
}

/**
 * A one-time link instead of a password. Never creates an account: people are
 * added to a venue by Peregrine, not by signing themselves up. Everyone gets
 * the same answer whether or not the address is known.
 */
export async function sendSignInLink(
  _: SignInState,
  form: FormData,
): Promise<SignInState> {
  const project = authProject(form.get("next"), form.get("project"));
  if (!supabaseEnv(project))
    return { error: "Sign-in isn't switched on for this site yet." };
  const email = String(form.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email." };

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const client = await supabase(project);
  await client.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/auth/confirm?project=${project}&next=${encodeURIComponent(safeDestination(form.get("next")) ?? "")}`,
    },
  });
  return { sent: true };
}

/**
 * A link that lands on the set-password page, through the authenticator code
 * like every other sign-in. Same answer for every address, as above.
 */
export async function sendPasswordReset(
  _: SignInState,
  form: FormData,
): Promise<SignInState> {
  const project = authProject(form.get("next"), form.get("project"));
  if (!supabaseEnv(project))
    return { error: "Sign-in isn't switched on for this site yet." };
  const email = String(form.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email." };

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const then = `${PASSWORD_PATH}?next=${encodeURIComponent(workspaceDestination(form.get("next"), project))}`;
  const client = await supabase(project);
  await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?project=${project}&next=${encodeURIComponent(then)}`,
  });
  return { sent: true };
}

/**
 * Saves a new password. Only an aal2 session may: a reset email on its own
 * must not be enough to take over an account, any more than it is to read one.
 */
export async function setPassword(
  _: PasswordState,
  form: FormData,
): Promise<PasswordState> {
  const project = authProject(form.get("next"), form.get("project"));
  if (!supabaseEnv(project))
    return { error: "Sign-in isn't switched on for this site yet." };
  const next = workspaceDestination(form.get("next"), project);
  const password = String(form.get("password") ?? "");
  const again = String(form.get("again") ?? "");
  if (password.length < 8) return { error: passwordCopy.tooShort };
  if (password !== again) return { error: passwordCopy.mismatch };

  const self = encodeURIComponent(
    `${PASSWORD_PATH}?next=${encodeURIComponent(next)}`,
  );
  const client = await supabase(project);
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect(`/sign-in?project=${project}&next=${self}`);
  const { data: aal } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2")
    redirect(`/sign-in/verify?project=${project}&next=${self}`);

  const { error } = await client.auth.updateUser({ password });
  if (error)
    return {
      error:
        error.code === "same_password"
          ? passwordCopy.same
          : error.code === "weak_password"
            ? passwordCopy.weak
            : passwordCopy.failed,
    };
  redirect(next);
}

export async function signOut() {
  const client = await supabase();
  await client.auth.signOut();
  redirect("/sign-in");
}

export async function signOutOwner() {
  const client = await supabase("internal");
  await client.auth.signOut();
  redirect("/sign-in?next=%2Fowner");
}

export async function signOutForProject(form: FormData) {
  if (authProject(form.get("next"), form.get("project")) === "internal")
    return signOutOwner();
  return signOut();
}
