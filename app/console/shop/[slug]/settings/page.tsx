import type { Metadata } from "next";
import { shopBySlug } from "@/lib/shop/data";
import { saveSettings } from "../actions";
import { SettingsForm } from "./form";

export const metadata: Metadata = { title: "Settings" };

export default async function ShopSettings({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await shopBySlug(slug);
  return (
    <div>
      <div className="shop-page-head">
        <h1>Booking settings</h1>
        <p>How clients book you online. You can always book anyone in yourself from the calendar.</p>
      </div>
      <SettingsForm action={saveSettings.bind(null, slug)} shop={shop} />
    </div>
  );
}
