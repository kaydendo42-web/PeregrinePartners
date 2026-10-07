import Link from "next/link";
import type { Booking } from "@/lib/console/data";
import { addDays, dayLabel } from "@/lib/console/time";

export function StatusChip({ status }: { status: Booking["status"] }) {
  const text = { confirmed: "Confirmed", seated: "Seated", cancelled: "Cancelled", no_show: "No-show" }[status];
  return <span className={`console-chip console-chip--${status}`}>{text}</span>;
}

const VIEWS = [
  ["floor", "Floor"],
  ["list", "List"],
  ["schedule", "Timeline"],
] as const;

/**
 * Previous day, the day, next day, a picker, and the three ways to look at a
 * day's bookings. Switching view keeps the day.
 */
export function DayBar({
  base,
  date,
  extra = "",
  view,
}: {
  base: string;
  date: string;
  extra?: string;
  view?: (typeof VIEWS)[number][0];
}) {
  const root = base.slice(0, base.lastIndexOf("/"));
  return (
    <div className="console-daybar">
      <Link className="console-btn console-btn--sm" href={`${base}?date=${addDays(date, -1)}${extra}`} aria-label="Previous day">
        ←
      </Link>
      <h2 className="console-daybar__label">{dayLabel(date)}</h2>
      <Link className="console-btn console-btn--sm" href={`${base}?date=${addDays(date, 1)}${extra}`} aria-label="Next day">
        →
      </Link>
      <form className="console-daybar__pick" action={base}>
        <input type="date" name="date" defaultValue={date} aria-label="Go to date" />
        <button className="console-btn console-btn--sm">Go</button>
      </form>
      {view ? (
        <nav className="console-views" aria-label="View">
          {VIEWS.map(([id, label]) => (
            <Link key={id} href={`${root}/${id}?date=${date}`} aria-current={id === view ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
