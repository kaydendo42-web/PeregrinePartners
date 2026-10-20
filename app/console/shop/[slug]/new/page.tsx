import Link from "next/link";
import type { Metadata } from "next";
import { shopBySlug, shopServices } from "@/lib/shop/data";
import { zonedDate } from "@/lib/shop/day";
import { createAppointment, createBlock } from "../actions";
import { AppointmentForm, BlockForm } from "./form";

export const metadata: Metadata = { title: "New" };

/** The "+" on the calendar: book a client in, or block out time. */
export default async function ShopNew({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string; tab?: string }>;
}) {
  const { slug } = await params;
  const { date: asked, tab } = await searchParams;
  const shop = await shopBySlug(slug);
  const date = asked && /^\d{4}-\d{2}-\d{2}$/.test(asked) ? asked : zonedDate(new Date(), shop.timezone);
  const services = (await shopServices(shop.id)).filter((s) => s.active);
  const base = `/console/shop/${slug}/new?date=${date}`;
  const blocking = tab === "block";

  return (
    <div className="shop-sheet">
      <Link className="shop-link" href={`/console/shop/${slug}?date=${date}`}>
        ‹ Calendar
      </Link>
      <nav className="shop-tabs" aria-label="New">
        <Link href={base} aria-current={blocking ? undefined : "page"}>
          Appointment
        </Link>
        <Link href={`${base}&tab=block`} aria-current={blocking ? "page" : undefined}>
          Block time
        </Link>
      </nav>
      {blocking ? (
        <BlockForm action={createBlock.bind(null, slug)} date={date} />
      ) : services.length ? (
        <AppointmentForm action={createAppointment.bind(null, slug)} services={services} date={date} />
      ) : (
        <p className="shop-problem">
          Add a service first. <Link href={`/console/shop/${slug}/services`}>Services</Link>
        </p>
      )}
    </div>
  );
}
