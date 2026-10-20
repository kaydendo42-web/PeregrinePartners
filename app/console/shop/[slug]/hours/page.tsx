import type { Metadata } from "next";
import { shopBySlug, shopHours } from "@/lib/shop/data";
import { saveHours } from "../actions";
import { HoursForm } from "./form";

export const metadata: Metadata = { title: "Hours" };

/** The shop's regular week. Days off and one-off changes live under Time off. */
export default async function ShopHours({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await shopBySlug(slug);
  const hours = await shopHours(shop.id);
  return (
    <div>
      <div className="shop-page-head">
        <h1>Working hours</h1>
        <p>Clients can book inside these hours. For a day off or different hours on one date, use Time off.</p>
      </div>
      <HoursForm action={saveHours.bind(null, slug)} hours={hours} />
    </div>
  );
}
