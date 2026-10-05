import type { Metadata } from "next";
import { AuthFrame } from "@/components/auth-frame";
import { SignInForm } from "@/components/forms/sign-in-form";
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
    <AuthFrame label={signIn.eyebrow}>
      <h1 className="t-display mt-[40px] text-white">{signIn.heading}</h1>
      <p className="t-body mt-[22px] text-white/80">{signIn.sub}</p>

      <div className="mt-[40px]">
        <SignInForm next={typeof next === "string" ? next : undefined} linkExpired={link === "expired"} />
      </div>
    </AuthFrame>
  );
}
