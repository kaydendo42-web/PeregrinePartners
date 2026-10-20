/**
 * Give someone a login to a barber shop in the PeregrineOffice console.
 *
 *   node scripts/add-shop-member.mjs --email vance@example.com --shop vbarbers
 *
 * Creates the account if it doesn't exist (with a one-off temporary password,
 * printed once here and nowhere else) and adds it to the shop. Run it again
 * for an existing account and it only adds the membership. Two-step is
 * optional for shop owners; they can turn it on later.
 *
 * Needs the booking project's URL and service-role key in .env.local
 * (BookingStorage_SUPABASE_URL or NEXT_PUBLIC_BookingStorage_SUPABASE_URL, and
 * BookingStorage_SUPABASE_SERVICE_ROLE_KEY). The key never leaves this machine.
 */
import nextEnv from "@next/env";
import { randomBytes } from "node:crypto";

nextEnv.loadEnvConfig(process.cwd());

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const email = arg("email")?.trim().toLowerCase();
const shop = arg("shop")?.trim();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !shop) {
  console.error("Usage: node scripts/add-shop-member.mjs --email <email> --shop <slug>");
  process.exit(1);
}

const url = (process.env.BookingStorage_SUPABASE_URL || process.env.NEXT_PUBLIC_BookingStorage_SUPABASE_URL || "").replace(/\/$/, "");
const key = process.env.BookingStorage_SUPABASE_SERVICE_ROLE_KEY;
if (!url.startsWith("https://") || !key) {
  console.error("Set the booking project's URL and BookingStorage_SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  process.exit(1);
}

const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
const shopHeaders = { ...headers, "Accept-Profile": "vbarbers", "Content-Profile": "vbarbers" };

async function json(res, what) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${what}: ${res.status} ${body.msg ?? body.message ?? JSON.stringify(body)}`);
  return body;
}

const [tenant] = await json(await fetch(`${url}/rest/v1/tenants?slug=eq.${encodeURIComponent(shop)}&select=id,name`, { headers: shopHeaders }), "find shop");
if (!tenant) {
  console.error(`No shop "${shop}" in the vbarbers schema.`);
  process.exit(1);
}

// Find the account, or make one.
let user = null;
for (let page = 1; !user; page++) {
  const { users } = await json(await fetch(`${url}/auth/v1/admin/users?page=${page}&per_page=200`, { headers }), "list users");
  user = users.find((u) => u.email?.toLowerCase() === email) ?? null;
  if (users.length < 200) break;
}

let password = null;
if (!user) {
  // Readable but long: 4 groups of 5 from an alphabet without look-alikes.
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(20);
  password = Array.from({ length: 4 }, (_, g) => Array.from({ length: 5 }, (_, i) => alphabet[bytes[g * 5 + i] % alphabet.length]).join("")).join("-");
  user = await json(
    await fetch(`${url}/auth/v1/admin/users`, { method: "POST", headers, body: JSON.stringify({ email, password, email_confirm: true }) }),
    "create account",
  );
}

await json(
  await fetch(`${url}/rest/v1/members?on_conflict=tenant_id,user_id`, {
    method: "POST",
    headers: { ...shopHeaders, Prefer: "resolution=ignore-duplicates,return=representation" },
    body: JSON.stringify({ tenant_id: tenant.id, user_id: user.id, role: "owner" }),
  }),
  "add to shop",
);

console.log(`${email} can now manage ${tenant.name}.`);
if (password) {
  console.log(`\nTemporary password (shown once, pass it on privately):\n\n  ${password}\n`);
  console.log("They sign in at /sign-in, then change it under Password in the shop's top bar.");
} else {
  console.log("They already had an account, so their password is unchanged.");
}
