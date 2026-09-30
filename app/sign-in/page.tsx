import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { SignInForm } from "@/components/forms/sign-in-form";
import { Falcon } from "@/components/ui/mark";
import { SectionLabel } from "@/components/ui/section-label";
import { signIn } from "@/lib/content";

export const metadata: Metadata = {
  title: "Sign in",
  description: signIn.sub,
  robots: { index: false, follow: true },
};

/**
 * The door to the client console. Signing in lands on /console, or wherever
 * the proxy turned a signed-out visitor away from (`next`). `link=expired` is
 * set by /auth/confirm when a one-time link has gone stale.
 */
export default async function SignIn({ searchParams }: PageProps<"/sign-in">) {
  const { next, link } = await searchParams;
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
              <SectionLabel label={signIn.eyebrow} tone="dark" ruleWidth={200} />
              <h1 className="t-display mt-[40px] text-white">{signIn.heading}</h1>
              <p className="t-body mt-[22px] text-white/80">{signIn.sub}</p>

              <div className="mt-[40px]">
                <SignInForm next={typeof next === "string" ? next : undefined} linkExpired={link === "expired"} />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
