import { venueBySlug } from "@/lib/console/data";
import { dinnerOrdersOn, dishTotals, money, type DinnerOrder } from "@/lib/console/dinners";
import { dayLabel, isDateKey, todayKey } from "@/lib/console/time";
import { setDinnerStatus } from "../actions";
import { DayBar } from "../ui";
import { StatusButton } from "../status-button";

export const metadata = { title: "Dinners" };

const STATUS: Record<DinnerOrder["status"], [string, string]> = {
  paid: ["To collect", ""],
  collected: ["Collected", " console-chip--seated"],
  cancelled: ["Cancelled", " console-chip--cancelled"],
  pending: ["Unpaid", " console-chip--cancelled"],
  expired: ["Unpaid", " console-chip--cancelled"],
};

/**
 * One pickup day of $5 dinners: how many of each dish to have ready, then who
 * is collecting what, ticked off as they're handed over. Orders close at 9pm
 * the night before, so tomorrow's list is final from then.
 */
export default async function DinnersPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const [{ venue: slug }, { date: asked }] = await Promise.all([params, searchParams]);
  const venue = await venueBySlug(slug);
  const date = isDateKey(asked) ? asked : todayKey(venue.timezone);
  const orders = await dinnerOrdersOn(venue.id, date);
  const live = orders.filter((o) => o.status !== "cancelled");
  const totals = dishTotals(orders);
  const left = live.filter((o) => o.status === "paid").length;

  return (
    <div className="console-page">
      <DayBar base={`/console/${slug}/dinners`} date={date} />
      <p className="console-muted console-summary">
        {live.length} {live.length === 1 ? "order" : "orders"} · {totals.reduce((n, t) => n + t.portions, 0)} portions ·{" "}
        {money(live.reduce((n, o) => n + o.total_cents, 0))} paid
        {live.length ? ` · ${left} still to collect` : ""}
      </p>

      {totals.length ? (
        <div className="console-stats">
          {totals.map((t) => (
            <div key={t.name} className="console-stat">
              <span className="console-stat__label">{t.name}</span>
              <div className="console-stat__pair">
                <span>
                  <b>{t.portions}</b> to have ready
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {orders.length ? (
        <table className="console-table console-table--dinners">
          <thead>
            <tr>
              <th>Name</th>
              <th>Dinners</th>
              <th>Paid</th>
              <th>Contact</th>
              <th>Status</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const [label, tone] = STATUS[o.status];
              return (
                <tr key={o.id} id={o.id} className={o.status === "cancelled" ? "is-released" : ""}>
                  <td data-label="Name" className="console-strong">
                    {o.guest_name}
                    <span className="console-ref">{o.id}</span>
                  </td>
                  <td data-label="Dinners">
                    {o.dinner_order_lines.map((l) => (
                      <div key={l.dish_id}>
                        {l.quantity} × {l.dish_name}
                      </div>
                    ))}
                  </td>
                  <td data-label="Paid">{money(o.total_cents)}</td>
                  <td data-label="Contact">
                    <a href={`tel:${o.phone.replace(/\s/g, "")}`}>{o.phone}</a>
                    <span className="console-ref">{o.email}</span>
                  </td>
                  <td data-label="Status">
                    <span className={`console-chip${tone}`}>{label}</span>
                  </td>
                  <td className="console-actions">
                    {o.status === "paid" ? (
                      <form action={setDinnerStatus.bind(null, slug, o.id, "collected")}>
                        <StatusButton label="Collected" primary />
                      </form>
                    ) : o.status === "collected" ? (
                      <form action={setDinnerStatus.bind(null, slug, o.id, "paid")}>
                        <StatusButton label="Undo" />
                      </form>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="console-empty">No dinner orders for pickup on {dayLabel(date)}.</p>
      )}
    </div>
  );
}
