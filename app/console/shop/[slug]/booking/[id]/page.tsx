import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { shopBooking, shopBySlug } from "@/lib/shop/data";
import { clock, zonedDate, zonedMinutes } from "@/lib/shop/day";
import { setStatus } from "../../actions";

export const metadata: Metadata = { title: "Appointment" };

const STATUS_LABEL = { confirmed: "Booked", completed: "Completed", no_show: "No-show", cancelled: "Cancelled" } as const;
const money = (cents: number) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;

export default async function ShopAppointment({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ confirm?: string; problem?: string }>;
}) {
  const { slug, id } = await params;
  const { confirm, problem } = await searchParams;
  const shop = await shopBySlug(slug);
  const b = await shopBooking(shop.id, id);
  if (!b) notFound();

  const date = zonedDate(new Date(b.startsAt), shop.timezone);
  const self = `/console/shop/${slug}/booking/${id}`;
  const back = `/console/shop/${slug}?date=${date}`;
  const when = new Intl.DateTimeFormat("en-AU", { timeZone: shop.timezone, weekday: "long", day: "numeric", month: "long" }).format(new Date(b.startsAt));
  const time = `${clock(zonedMinutes(b.startsAt, shop.timezone))}–${clock(zonedMinutes(b.endsAt, shop.timezone))}`;
  const act = (status: "confirmed" | "completed" | "no_show" | "cancelled") => setStatus.bind(null, slug, id, status, self);

  return (
    <div className="shop-sheet">
      <Link className="shop-link" href={back}>
        ‹ Calendar
      </Link>
      <h1>{b.customer.name}</h1>
      <p className="shop-chip" data-status={b.status}>
        {STATUS_LABEL[b.status]}
      </p>
      {problem ? <p className="shop-problem">{problem}</p> : null}

      <dl className="shop-facts">
        <div>
          <dt>Service</dt>
          <dd>
            {b.serviceName} · {money(b.priceCents)}
          </dd>
        </div>
        <div>
          <dt>When</dt>
          <dd>
            {when}, {time}
          </dd>
        </div>
        <div>
          <dt>Mobile</dt>
          <dd>{b.customer.phone || "—"}</dd>
        </div>
        {b.customer.email ? (
          <div>
            <dt>Email</dt>
            <dd>{b.customer.email}</dd>
          </div>
        ) : null}
        {b.notes ? (
          <div>
            <dt>Notes</dt>
            <dd>{b.notes}</dd>
          </div>
        ) : null}
        <div>
          <dt>Booked</dt>
          <dd>{b.source === "web" ? "Online" : "By you"}</dd>
        </div>
      </dl>

      {b.customer.phone ? (
        <div className="shop-row">
          <a className="console-btn" href={`tel:${b.customer.phone}`}>
            Call
          </a>
          <a className="console-btn" href={`sms:${b.customer.phone}`}>
            Message
          </a>
        </div>
      ) : null}

      {b.status === "confirmed" ? (
        confirm === "cancel" ? (
          <div className="shop-confirm">
            <p>Cancel {b.customer.name}&rsquo;s {b.serviceName.toLowerCase()}? The time opens up for others to book.</p>
            <div className="shop-row">
              <form action={act("cancelled")}>
                <button className="console-btn shop-btn--danger" type="submit">
                  Yes, cancel it
                </button>
              </form>
              <Link className="console-btn" href={self}>
                Keep it
              </Link>
            </div>
          </div>
        ) : (
          <div className="shop-row">
            <form action={act("completed")}>
              <button className="console-btn console-btn--primary" type="submit">
                Completed
              </button>
            </form>
            <form action={act("no_show")}>
              <button className="console-btn" type="submit">
                No-show
              </button>
            </form>
            <Link className="console-btn shop-btn--danger" href={`${self}?confirm=cancel`}>
              Cancel appointment
            </Link>
          </div>
        )
      ) : (
        <form action={act("confirmed")}>
          <button className="console-btn" type="submit">
            {b.status === "cancelled" ? "Rebook this time" : "Undo"}
          </button>
        </form>
      )}
    </div>
  );
}
