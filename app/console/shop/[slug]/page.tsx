import Link from "next/link";
import type { Metadata } from "next";
import { shopBySlug, shopDay, shopHours, shopOverrides } from "@/lib/shop/data";
import { clock, dayBounds, layoutDay, zonedDate } from "@/lib/shop/day";
import { removeBlock } from "./actions";

export const metadata: Metadata = { title: "Calendar" };

const PX = 1.6; // pixels per minute: an hour is 96px, a 45-minute cut 72px
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const shift = (date: string, days: number) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};
const weekday = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

/** Who's coming: a week strip, then the chosen day hour by hour. */
export default async function ShopCalendar({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { slug } = await params;
  const shop = await shopBySlug(slug);
  const today = zonedDate(new Date(), shop.timezone);
  const { date: asked } = await searchParams;
  const date = asked && DATE.test(asked) ? asked : today;

  const { from, to } = dayBounds(date, shop.timezone);
  const [day, weekly, overrides] = await Promise.all([shopDay(shop.id, from, to), shopHours(shop.id), shopOverrides(shop.id, date)]);
  const special = overrides.find((o) => o.date === date);
  const hours: [string, string] | null = special
    ? special.closed
      ? null
      : [special.open!, special.close!]
    : weekly[weekday(date)];
  const layout = layoutDay(day.bookings, day.blocks, hours, shop.timezone);

  const monday = shift(date, -((weekday(date) + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => shift(monday, i));
  const base = `/console/shop/${slug}`;
  const [, mm, dd] = date.split("-").map(Number);
  const count = day.bookings.filter((b) => b.status === "confirmed").length;

  const hourMarks: number[] = [];
  for (let m = layout.startMin; m <= layout.endMin; m += 60) hourMarks.push(m);
  const openMin = hours ? Number(hours[0].slice(0, 2)) * 60 + Number(hours[0].slice(3)) : null;
  const closeMin = hours ? Number(hours[1].slice(0, 2)) * 60 + Number(hours[1].slice(3)) : null;

  return (
    <div className="shop-cal">
      <div className="shop-week">
        <Link className="shop-week__arrow" href={`${base}?date=${shift(monday, -7)}`} aria-label="Previous week">
          ‹
        </Link>
        <ol>
          {week.map((d) => (
            <li key={d}>
              <Link
                href={`${base}?date=${d}`}
                aria-current={d === date ? "date" : undefined}
                data-today={d === today ? "" : undefined}
              >
                <span>{DAY_NAMES[weekday(d)]}</span>
                <strong>{Number(d.slice(8))}</strong>
              </Link>
            </li>
          ))}
        </ol>
        <Link className="shop-week__arrow" href={`${base}?date=${shift(monday, 7)}`} aria-label="Next week">
          ›
        </Link>
      </div>

      <div className="shop-day-head">
        <h1>
          {DAY_NAMES[weekday(date)]} {dd} {MONTHS[mm - 1]}
        </h1>
        <p>
          {hours ? `Open ${hours[0]}–${hours[1]}` : "Closed"}
          {special?.note ? ` · ${special.note}` : ""} · {count} {count === 1 ? "appointment" : "appointments"}
        </p>
        {date !== today ? (
          <Link className="shop-link" href={base}>
            Today
          </Link>
        ) : null}
      </div>

      <div className="shop-timeline" style={{ height: (layout.endMin - layout.startMin) * PX }}>
        {openMin !== null && openMin > layout.startMin ? (
          <div className="shop-closed" style={{ top: 0, height: (openMin - layout.startMin) * PX }} />
        ) : null}
        {closeMin !== null && closeMin < layout.endMin ? (
          <div className="shop-closed" style={{ top: (closeMin - layout.startMin) * PX, height: (layout.endMin - closeMin) * PX }} />
        ) : null}
        {hours === null ? <div className="shop-closed" style={{ top: 0, height: (layout.endMin - layout.startMin) * PX }} /> : null}
        {hourMarks.map((m) => (
          <div key={m} className="shop-hour" style={{ top: (m - layout.startMin) * PX }}>
            <span>{clock(m)}</span>
          </div>
        ))}
        {layout.items.map((item) =>
          item.kind === "booking" ? (
            <Link
              key={item.id}
              href={`${base}/booking/${item.id}?date=${date}`}
              className="shop-item"
              data-status={item.status}
              style={{ top: item.top * PX, height: Math.max(item.height * PX, 28) }}
            >
              <strong>{item.label}</strong>
              <span>{item.sub}</span>
            </Link>
          ) : (
            <div key={item.id} className="shop-item shop-item--block" style={{ top: item.top * PX, height: Math.max(item.height * PX, 24) }}>
              <strong>
                {clock(item.startMin)}–{clock(item.endMin)} {item.label}
              </strong>
              <form action={removeBlock.bind(null, slug, item.id, date)}>
                <button type="submit" className="shop-item__remove">
                  Remove
                </button>
              </form>
            </div>
          ),
        )}
      </div>

      <Link className="shop-fab" href={`${base}/new?date=${date}`} aria-label="New appointment or block time">
        +
      </Link>
    </div>
  );
}
