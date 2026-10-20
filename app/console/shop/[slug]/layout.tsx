import type { Metadata } from "next";
import { BRAND_NAME } from "@/lib/brand";
import { shopBySlug } from "@/lib/shop/data";
import { supabaseEnv } from "@/lib/supabase/server";
import { signOut } from "@/app/sign-in/actions";
import { ShopNav } from "./nav";
import { ShopLive } from "./live";
import "../../console.css";
import "../shop.css";

export const metadata: Metadata = {
  title: { absolute: `Shop · ${BRAND_NAME}`, template: `%s · ${BRAND_NAME}` },
  robots: { index: false, follow: false },
};

/**
 * A barber shop's console. Laid out the way Booksy's business app is — the
 * calendar first, with hours, time off, services and settings one tap away —
 * so moving over feels familiar. The look is Peregrine's.
 */
export default async function ShopLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await shopBySlug(slug);
  const env = supabaseEnv();

  return (
    <div className="shop-shell">
      <header className="shop-top">
        <p className="shop-top__name">{shop.name}</p>
        <div className="shop-top__out">
          <a href={`/sign-in/password?next=${encodeURIComponent(`/console/shop/${slug}`)}`}>Password</a>
          <form action={signOut}>
            <button type="submit">Sign out</button>
          </form>
        </div>
      </header>
      <ShopNav slug={slug} />
      <main className="shop-main">{children}</main>
      {env ? <ShopLive url={env.url} anonKey={env.key} shopId={shop.id} /> : null}
    </div>
  );
}
