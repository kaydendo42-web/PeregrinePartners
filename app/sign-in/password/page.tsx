import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BRAND_NAME } from "@/lib/brand";
import { AuthFrame } from "@/components/auth-frame";
import { PasswordForm } from "@/components/forms/password-form";
import { signInPassword } from "@/lib/content";
import { supabase, supabaseEnv } from "@/lib/supabase/server";
import {
  authProject,
  workspaceDestination,
  PASSWORD_PATH,
} from "@/lib/auth/next";

export const metadata: Metadata = {
  title: { absolute: `Choose a password · ${BRAND_NAME}` },
  robots: { index: false, follow: false },
};

/**
 * Where an invite or a reset link ends up, after the authenticator code, and
 * where a signed-in member comes to change their password. `next` is the
 * workspace to go on to once it is saved.
 */
export default async function Password({
  searchParams,
}: PageProps<"/sign-in/password">) {
  const { next: nextParam, project: projectParam } = await searchParams;
  const project = authProject(nextParam, projectParam);
  const next = workspaceDestination(nextParam, project);
  const self = encodeURIComponent(
    `${PASSWORD_PATH}?next=${encodeURIComponent(next)}`,
  );

  if (!supabaseEnv(project))
    redirect(`/sign-in?project=${project}&next=${self}`);
  const client = await supabase(project);
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect(`/sign-in?project=${project}&next=${self}`);
  const { data: aal } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2")
    redirect(`/sign-in/verify?project=${project}&next=${self}`);

  return (
    <AuthFrame label={signInPassword.eyebrow}>
      <h1 className="t-display mt-[40px] text-white">
        {signInPassword.heading}
      </h1>
      <p className="t-body mt-[22px] text-white/80">{signInPassword.sub}</p>
      <div className="mt-[40px]">
        <PasswordForm project={project} next={next} email={user.email} />
      </div>
    </AuthFrame>
  );
}
