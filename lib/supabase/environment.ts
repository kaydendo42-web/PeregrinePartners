export type SupabaseProject = "booking" | "internal";

/**
 * Clients - Booking keeps each client in its own Postgres schema. The venue
 * console's tables (venues, bookings, tables, client CRM) are The Peacock's.
 * The internal project still uses public.
 */
export const BOOKING_SCHEMA = "thepeacock";
export const schemaFor = (project: SupabaseProject) =>
  project === "booking" ? BOOKING_SCHEMA : "public";
export type PublicEnvironment = Record<string, string | undefined>;

/** Exact namespaces prevent a second database from silently replacing bookings. */
export function projectEnvironment(
  env: PublicEnvironment,
  project: SupabaseProject,
) {
  const prefixes =
    project === "internal"
      ? ["NEXT_PUBLIC_PEREGRINE_INTERNAL_"]
      : ["NEXT_PUBLIC_BookingStorage_", "NEXT_PUBLIC_"];
  for (const prefix of prefixes) {
    const url = env[prefix + "SUPABASE_URL"];
    const key =
      env[prefix + "SUPABASE_PUBLISHABLE_KEY"] ??
      env[prefix + "SUPABASE_ANON_KEY"];
    if (url && key) return { url, key };
  }
  return null;
}
