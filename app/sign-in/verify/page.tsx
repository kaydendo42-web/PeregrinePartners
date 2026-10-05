import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { VerifyForm } from "@/components/forms/verify-form";
import { Falcon } from "@/components/ui/mark";
import { SectionLabel } from "@/components/ui/section-label";
import { signInVerify } from "@/lib/content";
import { supabase, supabaseEnv } from "@/lib/supabase/server";
import { signOut } from "../actions";

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
export default async function Verify({ searchParams }: PageProps<"/sign-in/verify">) {
  const { next: nextParam } = await searchParams;
  const next =
    typeof nextParam === "string" && nextParam.startsWith("/console") ? nextParam : "/console";

  if (!supabaseEnv()) redirect("/sign-in");
  const client = await supabase();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(next)}`);

  const { data: aal } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === "aal2") redirect(next);

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
    if (error || !data) throw new Error(`Could not start two-step setup: ${error?.message}`);
    const qr = data.totp.qr_code.startsWith("data:")
      ? data.totp.qr_code
      : `data:image/svg+xml;utf8,${encodeURIComponent(data.totp.qr_code)}`;
    setup = { factorId: data.id, qr, secret: data.totp.secret };
  }

  const factorId = verified?.id ?? setup!.factorId;

  return (
    <>
      <Nav />

      <main className="relative z-10 bg-[color:var(--page)]">
        <section className="w-full bg-[color:var(--page)] p-[12px]">
          <div
            className="relative flex min-h-[calc(100svh-24px)] items-center justify-center overflow-hidden px-[24px] py-[140px] md:px-[56px]"
            style={{ background: "var(--dark)", borderRadius: 20 }}
          >
            <span
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/[0.035]"
              aria-hidden
            >
              <Falcon size={520} />
            </span>

            <div className="relative w-full max-w-[520px]">
              <SectionLabel label={signInVerify.eyebrow} tone="dark" ruleWidth={200} />
              <h1 className="t-display mt-[40px] text-white">
                {setup ? signInVerify.setupHeading : signInVerify.heading}
              </h1>
              <p className="t-body mt-[22px] text-white/80">
                {setup ? signInVerify.setupSub : signInVerify.sub}
              </p>

              {setup ? (
                <div className="mt-[32px] flex flex-col items-start gap-[16px]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- a data: URI, nothing to optimise */}
                  <img
                    src={setup.qr}
                    alt="QR code to add Peregrine to your authenticator app"
                    width={180}
                    height={180}
                    style={{ background: "#fff", padding: 12, borderRadius: 12 }}
                  />
                  <p className="t-label text-white/60">{signInVerify.manual}</p>
                  <code className="font-mono text-white" style={{ fontSize: 15, wordBreak: "break-all" }}>
                    {setup.secret}
                  </code>
                </div>
              ) : null}

              <div className="mt-[40px]">
                <VerifyForm factorId={factorId} next={next} />
              </div>

              <div className="mt-[32px] flex flex-col items-start gap-[12px]">
                <p className="t-label text-white/60">{signInVerify.lost}</p>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="t-label text-white/60 underline underline-offset-[4px] transition-colors duration-300 hover:text-white"
                  >
                    {signInVerify.signOut}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
