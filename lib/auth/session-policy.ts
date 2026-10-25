/** Persistence preferences only. Supabase identity, MFA and RLS remain authoritative. */
export const REMEMBER_SECONDS = 30 * 86400;
type Cookie = { name: string; value: string };
type Options = { path?: string; maxAge?: number; expires?: Date };
export const rememberSelected = (value: unknown) => value === "on";
export const authCookiePrefix = (url: string) => `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
export const policyName = (url: string) => `pp-session-${new URL(url).hostname.split(".")[0]}`;
export const choiceName = (url: string) => `${policyName(url)}-choice`;
export const isAuthCookie = (name: string, url: string) => name === authCookiePrefix(url) || name.startsWith(`${authCookiePrefix(url)}.`);
export const makePolicy = (remember: boolean, now = Date.now()) => remember ? String(Math.floor(now / 1000) + REMEMBER_SECONDS) : "session";

export function readPolicy(value: string | undefined, now = Date.now()): "legacy" | "session" | "remembered" | "expired" {
  if (value === undefined) return "legacy";
  if (value === "session") return "session";
  const deadline = /^\d+$/.test(value) ? Number(value) : NaN;
  const seconds = Math.floor(now / 1000);
  return Number.isSafeInteger(deadline) && deadline > seconds && deadline <= seconds + REMEMBER_SECONDS ? "remembered" : "expired";
}

export function cookieOptions<T extends Options>(options: T, value: string | undefined, now = Date.now()): T {
  if (options.maxAge === 0 || readPolicy(value, now) === "legacy") return options;
  const out = { ...options };
  delete out.maxAge;
  delete out.expires;
  const mode = readPolicy(value, now);
  if (mode === "remembered") {
    out.maxAge = Number(value) - Math.floor(now / 1000);
    out.expires = new Date(Number(value) * 1000);
  } else if (mode === "expired") out.maxAge = 0;
  return out;
}

export function visibleCookies<T extends Cookie>(cookies: T[], url: string, now = Date.now()): T[] {
  const policy = cookies.find(c => c.name === policyName(url))?.value;
  return readPolicy(policy, now) === "expired" ? cookies.filter(c => !isAuthCookie(c.name, url)) : cookies;
}
