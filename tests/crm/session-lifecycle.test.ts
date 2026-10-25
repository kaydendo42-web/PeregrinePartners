import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as policy from "../../lib/auth/session-policy.ts";
import * as destinations from "../../lib/auth/next.ts";

// Exercise the actual Next adapters with an in-memory cookie store and SDK.
// No network, credentials or real sessions are used.
function load<T>(file: string, dependencies: Record<string, unknown>) {
  const source = readFileSync(new URL(`../../${file}`, import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const compiled = { exports: {} };
  runInNewContext(js, { module: compiled, exports: compiled.exports, process: { env: {} }, URL, Error, require: (name: string) => {
    if (!(name in dependencies)) throw new Error(`Unmocked dependency: ${name}`);
    return dependencies[name];
  } });
  return compiled.exports as T;
}

function harness(initial: { name: string; value: string }[] = []) {
  const url = "https://booking.supabase.co";
  const jar = new Map(initial.map(c => [c.name, c.value]));
  const writes: { name: string; value: string; options: { maxAge?: number; expires?: Date } }[] = [];
  const store = { getAll: () => [...jar].map(([name, value]) => ({ name, value })), get: (name: string) => jar.has(name) ? { name, value: jar.get(name) } : undefined,
    set: (name: string, value: string, options: { maxAge?: number; expires?: Date }) => { writes.push({ name, value, options }); jar.set(name, value); } };
  let revoked = false;
  const server = load<typeof import("../../lib/supabase/server")>("lib/supabase/server.ts", {
    "next/headers": { cookies: async () => store },
    "./environment": { projectEnvironment: () => ({ url, key: "test-key" }), schemaFor: () => "thepeacock" },
    "../auth/session-policy": policy,
    "@supabase/ssr": { createServerClient: (_url: string, _key: string, { cookies }: { cookies: { getAll: typeof store.getAll; setAll: (list: { name: string; value: string; options: { path: string; maxAge: number } }[]) => void } }) => ({ auth: {
      signOut: async ({ scope }: { scope: string }) => {
        assert.equal(scope, "local");
        const auth = cookies.getAll().filter((c: { name: string }) => policy.isAuthCookie(c.name, url));
        revoked = auth.some((c: { value: string }) => c.value !== "");
        cookies.setAll(auth.map((c: { name: string }) => ({ name: c.name, value: "", options: { path: "/", maxAge: 0 } })));
        return { error: null };
      },
      verifyOtp: async () => { cookies.setAll([{ name: "sb-booking-auth-token", value: "new-session", options: { path: "/", maxAge: 34_560_000 } }, { name: "sb-booking-auth-token.0", value: "", options: { path: "/", maxAge: 0 } }]); return { error: null }; },
    } }) },
  });
  const preferences = load<typeof import("../../lib/auth/session-preference")>("lib/auth/session-preference.ts", {
    "server-only": {}, "next/headers": { cookies: async () => store }, "@/lib/supabase/server": server, "./session-policy": policy,
  });
  return { url, store, writes, server, preferences, revoked: () => revoked };
}

test("recovery and cross-browser email callbacks create a session-cookie policy despite old expired preferences", async () => {
  for (const oldPolicy of [undefined, "broken", "1"]) {
    const h = harness(oldPolicy ? [{ name: "pp-session-booking", value: oldPolicy }] : []);
    const route = load<typeof import("../../app/auth/confirm/route")>("app/auth/confirm/route.ts", {
      "next/server": { NextResponse: { redirect: (to: URL) => to } },
      "@/lib/supabase/server": h.server, "@/lib/auth/next": destinations, "@/lib/auth/session-preference": h.preferences,
    });
    const requestUrl = new URL("https://example.test/auth/confirm?token_hash=test&type=recovery&next=%2Fsign-in%2Fpassword");
    const result = await route.GET({ nextUrl: Object.assign(requestUrl, { clone: () => new URL(requestUrl) }), url: requestUrl.href } as unknown as Parameters<typeof route.GET>[0]);
    assert.equal((result as unknown as URL).pathname, "/sign-in/password");
    assert.equal(h.store.get("pp-session-booking")?.value, "session");
    const credentialWrites = h.writes.filter(c => c.name === "sb-booking-auth-token");
    assert.ok(credentialWrites.length > 0);
    assert.ok(credentialWrites.every(c => c.options.maxAge === undefined && c.options.expires === undefined));
    const tombstones = h.writes.filter(c => c.name === "sb-booking-auth-token.0");
    assert.ok(tombstones.every(c => c.options.maxAge === 0), "deleted SDK chunks must stay deleted");
  }
});

test("sign-out revokes expired local sessions and removes every project chunk before clearing its policy", async () => {
  const h = harness([
    { name: "pp-session-booking", value: "broken" },
    { name: "sb-booking-auth-token.0", value: "first-chunk" },
    { name: "sb-booking-auth-token.1", value: "second-chunk" },
    { name: "sb-internal-auth-token", value: "independent-session" },
  ]);
  const actions = load<typeof import("../../app/sign-in/actions")>("app/sign-in/actions.ts", {
    "@/lib/auth/two-step": {}, "@/lib/supabase/environment": {}, "next/headers": {},
    "next/navigation": { redirect: (to: string) => { throw new Error(`redirect:${to}`); } },
    "@/lib/supabase/server": h.server, "@/lib/auth/next": destinations, "@/lib/content": {},
    "@/lib/auth/session-policy": policy, "@/lib/auth/session-preference": h.preferences,
  });
  await assert.rejects(actions.signOut(), /redirect:\/sign-in/);
  assert.equal(h.revoked(), true);
  for (const name of ["sb-booking-auth-token.0", "sb-booking-auth-token.1", "pp-session-booking"]) {
    assert.ok(h.writes.some(c => c.name === name && c.value === "" && c.options.maxAge === 0), name);
  }
  assert.equal(h.store.get("sb-internal-auth-token")?.value, "independent-session");
});
