import Link from "next/link";
import type { Booking } from "@/lib/console/data";
import { addDays, dayLabel } from "@/lib/console/time";

export function StatusChip({ status }: { status: Booking["status"] }) {
  const text = { confirmed: "Confirmed", seated: "Seated", cancelled: "Cancelled", no_show: "No-show" }[status];
  return <span className={`console-chip console-chip--${status}`}>{text}</span>;
}

/** Previous day, the day, next day, and a picker — the same bar on List, Schedule and Floor plan. */
export function DayBar({ base, date, extra = "" }: { base: string; date: string; extra?: string }) {
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
    </div>
  );
}
