/**
 * Everything a console member can open: venues (restaurants, on the
 * thepeacock schema) and shops (barbers, on vbarbers). Kept free of imports so
 * the routing rules can be tested on their own.
 */

export type ClientRef = { kind: "venue" | "shop"; slug: string; name: string; href: string };

export function sortClients(list: ClientRef[]): ClientRef[] {
  return [...list].sort((a, b) => a.name.localeCompare(b.name));
}

/** One client goes straight in, the usual case. None or several get the picker. */
export function pickDestination(list: ClientRef[]): string | null {
  return list.length === 1 ? list[0].href : null;
}
