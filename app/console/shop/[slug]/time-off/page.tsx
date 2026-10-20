import type { Metadata } from "next";
import { shopBySlug, shopOverrides } from "@/lib/shop/data";
import { zonedDate } from "@/lib/shop/day";
import { addTimeOff, removeTimeOff } from "../actions";
import { TimeOffForm } from "./form";

export const metadata: Metadata = { title: "Time off" };

const label = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-AU", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }).format(new Date(Date.UTC(y, m - 1, d)));
};

/** Days off and one-off hours, coming up first, then the form to add more. */
export default async function ShopTimeOff({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await shopBySlug(slug);
  const today = zonedDate(new Date(), shop.timezone);
  const upcoming = await shopOverrides(shop.id, today);
  return (
    <div>
      <div className="shop-page-head">
        <h1>Time off</h1>
        <p>Holidays, days off, or a day with different hours. Clients can&rsquo;t book outside them.</p>
      </div>
      {upcoming.length ? (
        <ul className="shop-list">
          {upcoming.map((o) => (
            <li key={o.id}>
              <span>
                {label(o.date)}
                <small>
                  {o.closed ? "Closed" : `Open ${o.open}–${o.close}`}
                  {o.note ? ` · ${o.note}` : ""}
                </small>
              </span>
              <form action={removeTimeOff.bind(null, slug, o.id)}>
                <button className="console-btn" type="submit">
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="shop-hint" style={{ marginBottom: 20 }}>
          No time off coming up.
        </p>
      )}
      <TimeOffForm action={addTimeOff.bind(null, slug)} today={today} />
    </div>
  );
}
