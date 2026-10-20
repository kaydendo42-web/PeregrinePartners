/**
 * Where a shop action may send the browser afterwards. The value comes back
 * from the client (bound action arguments aren't sealed), so anything outside
 * this shop's own pages falls back to its calendar.
 */
export function safeShopPath(slug: string, path: string): string {
  const home = `/console/shop/${slug}`;
  const ok = (path === home || path.startsWith(`${home}/`) || path.startsWith(`${home}?`)) && !path.includes("..") && !path.includes("//");
  return ok ? path : home;
}
