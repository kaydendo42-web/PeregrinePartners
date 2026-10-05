import test from "node:test";
import assert from "node:assert/strict";
import type { BillingRecord } from "../../lib/crm/types.ts";
import {
  invoiceState,
  totalsByCurrency,
  parseMinor,
  formatMinor,
} from "../../lib/crm/money.ts";
test("manual balances remain separate by currency and paid invoices are never overdue", () => {
  const a = {
    amount_minor: 10000,
    paid_minor: 10000,
    currency: "AUD",
    due_on: "2026-10-01",
  } as BillingRecord;
  const b = {
    amount_minor: 2000,
    paid_minor: 0,
    currency: "USD",
    due_on: "2026-10-20",
  } as BillingRecord;
  assert.equal(invoiceState(a, "2026-10-05"), "paid");
  assert.equal(invoiceState(b, "2026-10-05"), "due");
  assert.equal(invoiceState(b, "2026-10-21"), "overdue");
  assert.deepEqual(totalsByCurrency([a, b]), { AUD: "0", USD: "2000" });
  assert.deepEqual(
    totalsByCurrency([
      { ...a, amount_minor: 9007199254740991, paid_minor: 0 },
      { ...a, amount_minor: 9007199254740991, paid_minor: 0 },
    ]),
    { AUD: "18014398509481982" },
  );
});
test("decimal money parsing does not round or accept unsafe minor units", () => {
  assert.equal(parseMinor("12.34", "AUD"), 1234);
  assert.equal(parseMinor("12", "JPY"), 12);
  assert.equal(parseMinor("1.234", "KWD"), 1234);
  assert.throws(() => parseMinor("1.001", "AUD"));
  assert.throws(() => parseMinor("-1", "AUD"));
  assert.throws(() => parseMinor("900719925474099.99", "AUD"));
  assert.equal(
    formatMinor("18014398509481982", "AUD"),
    "AUD 180,143,985,094,819.82",
  );
});
