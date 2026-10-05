import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthFrame } from "@/components/auth-frame";
import { TwoStepView } from "@/components/two-step-view";
import { signInVerify } from "@/lib/content";
import { supabase, supabaseEnv } from "@/lib/supabase/server";
import { safeDestination, defaultDestination } from "@/lib/auth/next";

export const metadata: Metadata = {
  title: "Two-step sign-in",
  robots: { index: false, follow: false },
};

/**
 * The second step of signing in. A member with an authenticator app already
 * set up is asked for a code; one without gets a QR code to set it up first.
 * Nobody reaches the console without passing here: the proxy sends any session
 * below aal2 back, and the database refuses aal1 sessions outright.
 */
export default async function Verify({
  searchParams,
}: PageProps<"/sign-in/verify">) {
  const { next: nextParam } = await searchParams;
  const next = safeDestination(nextParam) ?? "";

  if (!supabaseEnv()) redirect("/sign-in");
  const client = await supabase();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(next)}`);

  const { data: aal } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === "aal2") {
    if (next) redirect(next);
    const { data: owner, error } = await client.rpc("crm_owner_status");
    if (error) throw new Error("Could not open your workspace.");
    redirect(defaultDestination(null, owner === true));
  }

  const { data: factors } = await client.auth.mfa.listFactors();
  const verified = factors?.totp[0];

  let setup: { factorId: string; qr: string; secret: string } | null = null;
  if (!verified) {
    // A half-finished setup from an earlier visit would block a new one with
    // the same name, and its QR code is gone anyway. Start clean.
    for (const f of factors?.all ?? []) {
      if (f.factor_type === "totp" && f.status === "unverified") {
        await client.auth.mfa.unenroll({ factorId: f.id });
      }
    }
    const { data, error } = await client.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Authenticator app",
      issuer: "Peregrine",
    });
    if (error || !data)
      throw new Error(`Could not start two-step setup: ${error?.message}`);
    const qr = data.totp.qr_code.startsWith("data:")
      ? data.totp.qr_code
      : `data:image/svg+xml;utf8,${encodeURIComponent(data.totp.qr_code)}`;
    setup = { factorId: data.id, qr, secret: data.totp.secret };
  }

  return (
    <AuthFrame label={signInVerify.eyebrow} wide={Boolean(setup)}>
      <TwoStepView
        factorId={verified?.id ?? setup!.factorId}
        next={next}
        setup={setup ? { qr: setup.qr, secret: setup.secret } : null}
      />
    </AuthFrame>
  );
}
