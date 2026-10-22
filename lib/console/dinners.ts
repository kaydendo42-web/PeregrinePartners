import { requireUser } from "./data";
import { demoOn } from "./demo";

/**
 * The Peacock's $5 dinner orders, which the website writes once Square has the
 * payment (thepeacock.dinner_orders). Read through the signed-in member's
 * client; row-level security limits it to their venue.
 */

export type DinnerStatus = "pending" | "paid" | "expired" | "cancelled" | "collected";

export type DinnerLine = { dish_id: string; dish_name: string; price_cents: number; quantity: number };

export type DinnerOrder = {
  id: string;
  pickup_date: string;
  guest_name: string;
  phone: string;
  email: string;
  status: DinnerStatus;
  total_cents: number;
  paid_at: string | null;
  created_at: string;
  dinner_order_lines: DinnerLine[];
};

/** Orders to hand over on a pickup day. Unpaid holds and lapsed checkouts are not orders. */
export async function dinnerOrdersOn(venueId: string, date: string): Promise<DinnerOrder[]> {
  if (demoOn()) return [];
  const { client } = await requireUser();
  const { data, error } = await client
    .from("dinner_orders")
    .select("id,pickup_date,guest_name,phone,email,status,total_cents,paid_at,created_at,dinner_order_lines(dish_id,dish_name,price_cents,quantity)")
    .eq("venue_id", venueId)
    .eq("pickup_date", date)
    .in("status", ["paid", "collected", "cancelled"])
    .order("guest_name");
  if (error) throw new Error(`Could not read dinner orders: ${error.message}`);
  return (data ?? []) as DinnerOrder[];
}

/** Portions of each dish across live (paid or collected) orders, biggest first. */
export function dishTotals(orders: DinnerOrder[]): { name: string; portions: number }[] {
  const totals = new Map<string, number>();
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    for (const l of o.dinner_order_lines) totals.set(l.dish_name, (totals.get(l.dish_name) ?? 0) + l.quantity);
  }
  return [...totals].map(([name, portions]) => ({ name, portions })).sort((a, b) => b.portions - a.portions);
}

export const money = (cents: number) => (cents % 100 ? `$${(cents / 100).toFixed(2)}` : `$${cents / 100}`);
