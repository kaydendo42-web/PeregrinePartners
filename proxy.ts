import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseEnv } from "@/lib/supabase/server";

/**
 * Keeps a console session alive. Supabase's access token is short-lived; this
 * refreshes it on the way in and writes the new cookies on the way out, which a
 * Server Component cannot do for itself.
 *
 * It also turns a signed-out visitor away from /console before any of it
 * renders. That is the optimistic check only: every page re-checks the user,
 * and row-level security is what actually keeps one venue out of another.
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

  if (!user && request.nextUrl.pathname.startsWith("/console")) {
    const to = request.nextUrl.clone();
    to.pathname = "/sign-in";
    to.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
    return NextResponse.redirect(to);
  }

  return response;
}

export const config = {
  matcher: ["/console/:path*", "/sign-in", "/auth/:path*"],
};
