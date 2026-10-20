/**
 * When to send someone to /sign-in/verify for their authenticator code.
 *
 * Venues and the founder office always need two-step: their row-level security
 * requires an aal2 session. Shop owners (barbers on the vbarbers schema) may
 * use a password or email link alone; their RLS asks for membership only. But
 * anyone who has turned two-step on has to pass it, wherever they're going.
 */

export type Assurance = { currentLevel: string | null; nextLevel: string | null };

/** Paths a shop owner reaches without two-step: their shop, the console's front door, and setting a password. */
export function isShopPath(path: string): boolean {
  return (
    path === "/console" ||
    path === "/console/shop" ||
    path.startsWith("/console/shop/") ||
    path === "/sign-in/password"
  );
}

export function needsTwoStep(path: string, aal: Assurance, isShopMember: boolean): boolean {
  if (aal.currentLevel === "aal2") return false;
  if (aal.nextLevel === "aal2") return true; // a factor is set up: use it
  return !(isShopMember && isShopPath(path));
}
