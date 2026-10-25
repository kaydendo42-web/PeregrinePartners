import type { Metadata } from "next";
import { authProject, returningDestination } from "@/lib/auth/next";
import { supabase, supabaseEnv } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BRAND_NAME } from "@/lib/brand";
import { AuthFrame } from "@/components/auth-frame";
import { SignInForm } from "@/components/forms/sign-in-form";
import { InstallHint } from "@/components/app/install-hint";
import { signIn } from "@/lib/content";

const clientMetadata: Metadata = {
  title: "Sign in",
  description: signIn.sub,
  robots: { index: false, follow: true },
};

export async function generateMetadata({
  searchParams,
}: PageProps<"/sign-in">): Promise<Metadata> {
  const p = await searchParams;
  return authProject(p.next, p.project) === "internal"
    ? {
        title: { absolute: `Founder sign-in · ${BRAND_NAME}` },
        robots: { index: false, follow: false },
      }
    : clientMetadata;
}

/**
 * The door to the client console. Signing in lands on /console, or wherever
 * the proxy turned a signed-out visitor away from (`next`). `link=expired` is
 * set by /auth/confirm when a one-time link has gone stale.
 */
export default async function SignIn({ searchParams }: PageProps<"/sign-in">) {
  const { next, link, project: requestedProject } = await searchParams;
  const project = authProject(next, requestedProject);
  if (supabaseEnv(project)) {
    const client = await supabase(project);
    const { data: { user } } = await client.auth.getUser();
    const destination = returningDestination(Boolean(user), project, next);
    if (destination) redirect(destination);
  }
  return (
    <AuthFrame label={signIn.eyebrow}>
      <h1 className="t-display mt-[40px] text-white">
        {project === "internal" ? "Founder sign-in" : signIn.heading}
      </h1>
      <p className="t-body mt-[22px] text-white/80">
        {project === "internal"
          ? "Open your Peregrine Office workspace."
          : signIn.sub}
      </p>

      <div className="mt-[40px]">
        <SignInForm
          project={project}
          next={
            typeof next === "string"
              ? next
              : project === "internal"
                ? "/owner"
                : undefined
          }
          linkExpired={link === "expired"}
        />
      </div>
      {project !== "internal" && <InstallHint />}
    </AuthFrame>
  );
}
