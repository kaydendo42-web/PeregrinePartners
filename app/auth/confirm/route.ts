import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/server";

/**
 * Where a sign-in link lands. Supabase sends either a code (PKCE) or a token
 * hash, depending on the email template; both are exchanged here for a session
 * cookie, then the member goes on into the console.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const nextParam = params.get("next") ?? "/console";
  const next = nextParam.startsWith("/console") ? nextParam : "/console";
  const client = await supabase();

  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;

  const { error } = code
    ? await client.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await client.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("missing token") };

  const to = request.nextUrl.clone();
  to.search = "";
  to.pathname = error ? "/sign-in" : next;
  if (error) to.searchParams.set("link", "expired");
  return NextResponse.redirect(to);
}
