import { myVenues } from "./data";
import { myShops } from "@/lib/shop/data";
import { sortClients, type ClientRef } from "./client-list";

/** Every venue and shop the signed-in member can open. */
export async function myClients(): Promise<ClientRef[]> {
  const [venues, shops] = await Promise.all([myVenues(), myShops()]);
  return sortClients([
    ...venues.map((v) => ({ kind: "venue" as const, slug: v.slug, name: v.name, href: `/console/${v.slug}` })),
    ...shops,
  ]);
}
