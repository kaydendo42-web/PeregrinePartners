import Link from "next/link";
import type { Metadata } from "next";
import { shopBySlug, shopServices } from "@/lib/shop/data";
import { saveService, setServiceActive } from "../actions";
import { ServiceForm } from "./form";

export const metadata: Metadata = { title: "Services" };

const money = (cents: number) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;

/** What clients can book, with length and price. Switch one off to stop it being booked. */
export default async function ShopServices({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ edit?: string; add?: string }>;
}) {
  const { slug } = await params;
  const { edit, add } = await searchParams;
  const shop = await shopBySlug(slug);
  const services = await shopServices(shop.id);
  const base = `/console/shop/${slug}/services`;

  return (
    <div>
      <div className="shop-page-head">
        <h1>Services</h1>
        <p>Turned-off services stay on past appointments but can&rsquo;t be booked.</p>
      </div>
      <ul className="shop-list">
        {services.map((s) => (
          <li key={s.id} style={edit === s.id ? { gridTemplateColumns: "1fr" } : undefined}>
            {edit === s.id ? (
              <>
                <ServiceForm action={saveService.bind(null, slug, s.id)} service={s} cta="Save service" />
                <Link className="shop-link" href={base}>
                  Done
                </Link>
              </>
            ) : (
              <>
                <Link href={`${base}?edit=${s.id}`} style={{ color: "inherit", textDecoration: "none", opacity: s.active ? 1 : 0.5 }}>
                  {s.name}
                  <small>
                    {s.durationMin} min · {money(s.priceCents)}
                    {s.active ? "" : " · Off"}
                  </small>
                </Link>
                <form action={setServiceActive.bind(null, slug, s.id, !s.active)}>
                  <button className="console-btn" type="submit">
                    {s.active ? "Turn off" : "Turn on"}
                  </button>
                </form>
              </>
            )}
          </li>
        ))}
      </ul>
      {add ? (
        <>
          <h2 style={{ fontSize: 17, margin: "0 0 12px" }}>New service</h2>
          <ServiceForm action={saveService.bind(null, slug, null)} cta="Add service" />
        </>
      ) : (
        <Link className="console-btn console-btn--primary" href={`${base}?add=1`}>
          Add service
        </Link>
      )}
    </div>
  );
}
