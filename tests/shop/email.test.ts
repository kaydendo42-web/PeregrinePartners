import test from "node:test";
import assert from "node:assert/strict";
import { sendShopEmail, shopEmail } from "../../lib/shop/email.ts";

const appt = {
  shopName: "V Barbers",
  clientName: "Kai",
  serviceName: "Haircut",
  startsAt: "2026-10-19T23:00:00.000Z",
  tz: "Australia/Melbourne",
  address: "41 Flowerdale Road, Hampton East VIC 3188",
  contact: "Questions? Message @vbarbersz on Instagram.",
};

test("the booked email names the cut, the shop and the local time", () => {
  const m = shopEmail("booked", appt);
  assert.equal(m.subject, "Your Haircut at V Barbers is booked for Tue 20 Oct, 10:00 am");
  assert.match(m.text, /41 Flowerdale Road, Hampton East VIC 3188/);
  assert.match(m.text, /Questions\? Message @vbarbersz on Instagram\./);
  assert.match(m.html, /Tue 20 Oct, 10:00 am/);
});

test("the cancelled email says so", () => {
  assert.equal(shopEmail("cancelled", appt).subject, "Your Haircut at V Barbers on Tue 20 Oct, 10:00 am is cancelled");
});

test("names are escaped in the html", () => {
  assert.doesNotMatch(shopEmail("booked", { ...appt, clientName: "<b>Kai</b>" }).html, /<b>Kai/);
});

test("no key, no from-address or no client email: nothing is sent", async () => {
  let calls = 0;
  const fetcher = (async () => (calls++, new Response("{}"))) as typeof fetch;
  const msg = shopEmail("booked", appt);
  assert.equal(await sendShopEmail("kai@example.com", msg, {}, fetcher), "skipped");
  assert.equal(await sendShopEmail(null, msg, { RESEND_API_KEY: "k", SHOP_FROM_ADDRESS: "b@x.au" }, fetcher, "V Barbers"), "skipped");
  assert.equal(calls, 0);
});

test("with a key it posts once to Resend", async () => {
  const seen: { url: string; init: RequestInit }[] = [];
  const fetcher = (async (url: string, init: RequestInit) => (seen.push({ url, init }), new Response("{}"))) as unknown as typeof fetch;
  const r = await sendShopEmail("kai@example.com", shopEmail("booked", appt), { RESEND_API_KEY: "re_test", SHOP_FROM_ADDRESS: "bookings@x.au" }, fetcher, "V Barbers");
  assert.equal(r, "sent");
  assert.equal(seen.length, 1);
  assert.equal(seen[0].url, "https://api.resend.com/emails");
  assert.equal((seen[0].init.headers as Record<string, string>).Authorization, "Bearer re_test");
  assert.equal(JSON.parse(String(seen[0].init.body)).to, "kai@example.com");
  // Each shop sends under its own name from the shared Peregrine address.
  assert.equal(JSON.parse(String(seen[0].init.body)).from, "V Barbers <bookings@x.au>");
});

test("a Resend failure is reported, never thrown", async () => {
  const fetcher = (async () => new Response("{}", { status: 500 })) as typeof fetch;
  assert.equal(await sendShopEmail("kai@example.com", shopEmail("booked", appt), { RESEND_API_KEY: "k", SHOP_FROM_ADDRESS: "b@x.au" }, fetcher, "V Barbers"), "failed");
});
