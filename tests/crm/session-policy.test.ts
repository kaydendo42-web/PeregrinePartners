import test from "node:test";
import assert from "node:assert/strict";
import { policyName, makePolicy, readPolicy, cookieOptions, visibleCookies, rememberSelected } from "../../lib/auth/session-policy.ts";
import { returningDestination } from "../../lib/auth/next.ts";

const url = "https://booking.supabase.co";
const now = 1_800_000_000_000;
const defaults = { path: "/", sameSite: "lax" as const, maxAge: 34_560_000, expires: new Date(now + 34_560_000_000) };

test("remembered expiry is fixed and refreshes only get the remaining time", () => {
  const value = makePolicy(true, now);
  assert.equal(cookieOptions(defaults, value, now).maxAge, 30 * 86400);
  assert.equal(cookieOptions(defaults, value, now + 86400_000).maxAge, 29 * 86400);
  assert.equal(readPolicy(value, now + 30 * 86400_000), "expired");
});
test("unchecked sessions have no persistence, including refresh writes", () => {
  const result = cookieOptions(defaults, makePolicy(false, now), now);
  assert.equal(result.maxAge, undefined);
  assert.equal(result.expires, undefined);
  assert.equal(result.sameSite, "lax");
  assert.equal(rememberSelected("on"), true);
  for (const value of [null, "false", "true", "off", 1]) assert.equal(rememberSelected(value), false);
});
test("legacy sessions are unchanged and SDK cookie deletion stays deletion", () => {
  assert.deepEqual(cookieOptions(defaults, undefined, now), defaults);
  assert.equal(cookieOptions({ ...defaults, maxAge: 0 }, "session", now).maxAge, 0);
});
test("policy and expiry are isolated by project and never suppress verifier cookies", () => {
  assert.notEqual(policyName(url), policyName("https://internal.supabase.co"));
  const cookies = [
    { name: policyName(url), value: "broken" },
    { name: "sb-booking-auth-token.0", value: "session" },
    { name: "sb-booking-auth-token-code-verifier", value: "pkce" },
    { name: "sb-internal-auth-token", value: "other" },
  ];
  assert.deepEqual(visibleCookies(cookies, url, now).map(c => c.name), [policyName(url), "sb-booking-auth-token-code-verifier", "sb-internal-auth-token"]);
  for (const value of ["broken", "-1", "Infinity", String(now / 1000 + 31 * 86400)]) assert.equal(readPolicy(value, now), "expired");
});
test("returning verified sessions go to a safe workspace; new sessions still sign in", () => {
  assert.equal(returningDestination(false, "booking", null), null);
  assert.equal(returningDestination(true, "booking", null), "/console");
  assert.equal(returningDestination(true, "internal", "//evil.example"), "/owner");
  assert.equal(returningDestination(true, "booking", "/sign-in/password?next=%2Fconsole"), "/sign-in/password?next=%2Fconsole");
});
