import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseEnv } from "@/lib/supabase/server";
import { safeDestination } from '@/lib/auth/next';

/**
 * Keeps a console session alive. Supabase's access token is short-lived; this
 * refreshes it on the way in and writes the new cookies on the way out, which a
 * Server Component cannot do for itself.
 *
 * It also turns a signed-out visitor away from /console before any of it
 * renders, and sends a member who has only done the first step (password or
 * email link) on to the authenticator code. Those are the optimistic checks:
 * every page re-checks the user, and row-level security — which requires an
 * aal2 session — is what actually keeps the data shut.
 */
export async function proxy(request: NextRequest) {
  const env = supabaseEnv();
  if (!env) return NextResponse.next();
  const { url, key } = env;

  let response = NextResponse.next({ request });
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });

  const {
    data: { user },
  } = await client.auth.getUser();

  if (['/owner','/console'].some(root=>request.nextUrl.pathname===root||request.nextUrl.pathname.startsWith(root+'/'))) {
    if (!user) return redirectTo(request, "/sign-in", response);

    const { data: aal } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== "aal2") return redirectTo(request, "/sign-in/verify", response);
  }

  return response;
}

/** Send them elsewhere, keeping any session cookies the refresh just wrote. */
function redirectTo(request: NextRequest, pathname: string, response: NextResponse) {
  const to = request.nextUrl.clone();
  to.pathname = pathname;
  to.search = `?next=${encodeURIComponent(safeDestination(request.nextUrl.pathname+request.nextUrl.search)??'')}`;
  const out = NextResponse.redirect(to);
  for (const cookie of response.cookies.getAll()) out.cookies.set(cookie);
  return out;
}

export const config = {
  matcher: ["/owner/:path*", "/console/:path*", "/sign-in/:path*", "/auth/:path*"],
};
