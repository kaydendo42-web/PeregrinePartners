import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseEnv } from "@/lib/supabase/server";
import { safeDestination, authProject } from "@/lib/auth/next";
import { isShopPath, needsTwoStep } from "@/lib/auth/two-step";
import { SHOP_SCHEMA } from "@/lib/supabase/environment";

/**
 * Keeps a console session alive. Supabase's access token is short-lived; this
 * refreshes it on the way in and writes the new cookies on the way out, which a
 * Server Component cannot do for itself.
 *
 * It also turns a signed-out visitor away from /console before any of it
 * renders, and sends a member who has only done the first step (password or
 * email link) on to the authenticator code, where two-step applies (see
 * lib/auth/two-step.ts: always for venues and /owner, for a barber shop only
 * if they've turned it on). Those are the optimistic checks: every page
 * re-checks the user, and row-level security is what actually keeps the data
 * shut.
 */
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const project =
    path === "/owner" || path.startsWith("/owner/")
      ? "internal"
      : path === "/console" || path.startsWith("/console/")
        ? "booking"
        : authProject(
            request.nextUrl.searchParams.get("next"),
            request.nextUrl.searchParams.get("project"),
          );
  const env = supabaseEnv(project);
  if (!env) return NextResponse.next();
  const { url, key } = env;

  let response = NextResponse.next({ request });
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        const previous = response.cookies.getAll();
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const cookie of previous) response.cookies.set(cookie);
        for (const { name, value, options } of list)
          response.cookies.set(name, value, options);
      },
    },
  });

  const {
    data: { user },
  } = await client.auth.getUser();

  // Optional booking session is independent; its absence never blocks the CRM.
  const bookingEnv =
    project === "internal" && path.startsWith("/owner")
      ? supabaseEnv("booking")
      : null;
  if (bookingEnv) {
    const booking = createServerClient(bookingEnv.url, bookingEnv.key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          const previous = response.cookies.getAll();
          for (const { name, value } of list) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const cookie of previous) response.cookies.set(cookie);
          for (const { name, value, options } of list)
            response.cookies.set(name, value, options);
        },
      },
    });
    await booking.auth.getUser();
  }

  if (
    ["/owner", "/console"].some(
      (root) =>
        request.nextUrl.pathname === root ||
        request.nextUrl.pathname.startsWith(root + "/"),
    )
  ) {
    if (!user) return redirectTo(request, "/sign-in", response);

    const { data: aal } =
      await client.auth.mfa.getAuthenticatorAssuranceLevel();
    const level = { currentLevel: aal?.currentLevel ?? null, nextLevel: aal?.nextLevel ?? null };
    // Only ask the database about shop membership when the answer matters.
    const shopMember =
      project === "booking" && level.currentLevel !== "aal2" && level.nextLevel !== "aal2" && isShopPath(path)
        ? await isShopMember(client, user.id)
        : false;
    if (needsTwoStep(path, level, shopMember))
      return redirectTo(request, "/sign-in/verify", response);
  }

  return response;
}

async function isShopMember(client: ReturnType<typeof createServerClient>, userId: string) {
  const { data } = await client.schema(SHOP_SCHEMA).from("members").select("tenant_id").eq("user_id", userId).limit(1);
  return (data?.length ?? 0) > 0;
}

/** Send them elsewhere, keeping any session cookies the refresh just wrote. */
function redirectTo(
  request: NextRequest,
  pathname: string,
  response: NextResponse,
) {
  const to = request.nextUrl.clone();
  to.pathname = pathname;
  to.search = `?next=${encodeURIComponent(safeDestination(request.nextUrl.pathname + request.nextUrl.search) ?? "")}`;
  const out = NextResponse.redirect(to);
  for (const cookie of response.cookies.getAll()) out.cookies.set(cookie);
  return out;
}

export const config = {
  matcher: [
    "/owner/:path*",
    "/console/:path*",
    "/sign-in/:path*",
    "/auth/:path*",
  ],
};
