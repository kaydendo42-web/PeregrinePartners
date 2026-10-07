import test from "node:test";
import assert from "node:assert/strict";
import { projectEnvironment } from "../../lib/supabase/environment.ts";
import { authProject } from "../../lib/auth/next.ts";
import { browserSupabase } from "../../lib/supabase/browser.ts";

test("booking and founder credentials resolve only within their own namespace", () => {
  const env = {
    NEXT_PUBLIC_BookingStorage_SUPABASE_URL: "https://booking.supabase.co",
    NEXT_PUBLIC_BookingStorage_SUPABASE_ANON_KEY: "booking-key",
    NEXT_PUBLIC_PEREGRINE_INTERNAL_SUPABASE_URL: "https://internal.supabase.co",
    NEXT_PUBLIC_PEREGRINE_INTERNAL_SUPABASE_PUBLISHABLE_KEY: "internal-key",
    NEXT_PUBLIC_RandomStore_SUPABASE_URL: "https://other.supabase.co",
    NEXT_PUBLIC_RandomStore_SUPABASE_ANON_KEY: "other-key",
  };
  assert.deepEqual(projectEnvironment(env, "booking"), {
    url: env.NEXT_PUBLIC_BookingStorage_SUPABASE_URL,
    key: "booking-key",
  });
  assert.deepEqual(projectEnvironment(env, "internal"), {
    url: env.NEXT_PUBLIC_PEREGRINE_INTERNAL_SUPABASE_URL,
    key: "internal-key",
  });
  assert.equal(
    projectEnvironment(
      {
        NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_BookingStorage_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "booking-key",
      },
      "internal",
    ),
    null,
  );
  assert.equal(
    projectEnvironment(
      {
        NEXT_PUBLIC_RandomStore_SUPABASE_URL:
          env.NEXT_PUBLIC_RandomStore_SUPABASE_URL,
        NEXT_PUBLIC_RandomStore_SUPABASE_ANON_KEY: "other-key",
      },
      "booking",
    ),
    null,
  );
  assert.equal(
    projectEnvironment(
      {
        NEXT_PUBLIC_BookingStorage_SUPABASE_URL:
          env.NEXT_PUBLIC_BookingStorage_SUPABASE_URL,
        NEXT_PUBLIC_PEREGRINE_INTERNAL_SUPABASE_PUBLISHABLE_KEY: "internal-key",
      },
      "booking",
    ),
    null,
  );
});

test("founder routes select internal sign-in while booking connection can return to a founder page", () => {
  assert.equal(authProject("/owner"), "internal");
  assert.equal(authProject("/owner?tab=agency"), "internal");
  assert.equal(authProject("/owner/outreach?page=2"), "internal");
  assert.equal(authProject("/console/the-peacock/crm"), "booking");
  assert.equal(authProject("/owner/clients/example", "booking"), "booking");
  assert.equal(authProject("//outside.example/owner"), "booking");
  assert.equal(authProject("/owner", "https://outside.example"), "internal");
});

test("browser sessions in different Supabase projects cannot share the SDK singleton", () => {
  const booking = browserSupabase(
    "https://booking.supabase.co",
    "booking-public-key",
  );
  const internal = browserSupabase(
    "https://internal.supabase.co",
    "internal-public-key",
  );
  assert.notEqual(booking, internal);
  assert.notEqual(booking.auth, internal.auth);
  assert.equal(
    browserSupabase("https://booking.supabase.co", "booking-public-key"),
    booking,
  );
});
