import test from "node:test";
import assert from "node:assert/strict";
import { pickDestination, sortClients, type ClientRef } from "../../lib/console/client-list.ts";

const peacock: ClientRef = { kind: "venue", slug: "the-peacock", name: "The Peacock South Yarra", href: "/console/the-peacock" };
const vb: ClientRef = { kind: "shop", slug: "vbarbers", name: "V Barbers", href: "/console/shop/vbarbers" };

test("one client goes straight in; none or several get the picker", () => {
  assert.equal(pickDestination([vb]), "/console/shop/vbarbers");
  assert.equal(pickDestination([]), null);
  assert.equal(pickDestination([vb, peacock]), null);
});

test("clients are listed by name", () => {
  assert.deepEqual(sortClients([vb, peacock]).map((c) => c.slug), ["the-peacock", "vbarbers"]);
});
