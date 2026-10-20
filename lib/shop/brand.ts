/**
 * What a shop's emails say about where to go and how to get in touch. It
 * lives with the shop's public page (V Barbers' src/config/tenant.ts), not in
 * the database, so it's mirrored here per shop.
 */
export const SHOP_BRAND: Record<string, { address: string; contact: string }> = {
  vbarbers: {
    address: "41 Flowerdale Road, Hampton East VIC 3188",
    contact: "Questions? Message @vbarbersz on Instagram.",
  },
};

export const brandFor = (slug: string) => SHOP_BRAND[slug] ?? { address: "", contact: "" };
