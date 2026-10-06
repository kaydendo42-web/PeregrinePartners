import { bookingsBetween, floor, live, venueBySlug, heldTables } from "@/lib/console/data";
import { dayRange, isDateKey, minutesOfDay, timeLabel, todayKey, zoned } from "@/lib/console/time";
import { DayBar } from "../ui";
import { FloorPlanSvg, type TableState } from "./plan";
import { TimeScrub } from "./scrub";

/**
 * The room at a moment: Jenny's plan, every table coloured by who has it then.
 * Top-down and flat — this is the working view; the 3D room is the guests'
 * view on the website.
 */
export default async function FloorPage({
  params,
  searchParams,
}: {
  params: Promise<{ venue: string }>;
  searchParams: Promise<{ date?: string; time?: string }>;
}) {
  const [{ venue: slug }, q] = await Promise.all([params, searchParams]);
  const venue = await venueBySlug(slug);
  const tz = venue.timezone;
  const today = todayKey(tz);
  const date = isDateKey(q.date) ? q.date : today;
  const nowMin = date === today ? minutesOfDay(new Date(), tz) : null;

  const [from, to] = dayRange(date, tz);
  const [bookings, { tables, sections }] = await Promise.all([bookingsBetween(venue.id, from, to), floor(venue.id)]);
  const held = bookings.filter(live);

  // Opening hours by default, stretched to fit anything booked outside them.
  const open = Math.min(7 * 60, ...held.map((b) => Math.floor(minutesOfDay(b.starts_at, tz) / 60) * 60));
  const close = Math.max(15 * 60, ...held.map((b) => Math.ceil((minutesOfDay(b.starts_at, tz) + b.duration_min) / 60) * 60));
  const asked = q.time && /^\d{2}:\d{2}$/.test(q.time) ? Number(q.time.slice(0, 2)) * 60 + Number(q.time.slice(3)) : null;
  const fallback = nowMin !== null && nowMin >= open && nowMin <= close ? nowMin - (nowMin % 15) : 9 * 60;
  const minutes = Math.min(close, Math.max(open, asked ?? fallback));
  const time = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  const at = zoned(date, time, tz).getTime();

  const list = `/console/${slug}/list?date=${date}`;
  const states: TableState[] = tables.map((t) => {
    const mine = held.filter((b) => heldTables(b).includes(t.id));
    const b = mine.find((x) => new Date(x.starts_at).getTime() <= at && new Date(x.ends_at).getTime() > at);
    const n = mine.find((x) => new Date(x.starts_at).getTime() > at);
    // Under a free table, only a booking soon enough to matter for a walk-in.
    const soon = n && new Date(n.starts_at).getTime() - at <= 90 * 60_000 ? n : undefined;
    return {
      table: t,
      state: !b ? "free" : b.status === "seated" ? "seated" : "booked",
      booking: b,
      note: b ? `${b.party_size} · ${b.guest_name.split(" ")[0]}` : soon ? `next ${timeLabel(soon.starts_at, tz)}` : undefined,
      title: `Table ${t.label}, seats ${t.seats}. ${
        b ? `${b.guest_name} (${b.party_size}) until ${timeLabel(b.ends_at, tz)}.` : "Free."
      }${n ? ` Next: ${timeLabel(n.starts_at, tz)} ${n.guest_name}.` : ""}`,
      href: b ? `${list}#${b.id}` : n ? `${list}#${n.id}` : undefined,
    };
  });
  const count = (s: TableState["state"]) => states.filter((x) => x.state === s).length;
  // A joined party holds several tables but is one party.
  const guests = [...new Map(states.flatMap((s) => (s.booking ? [[s.booking.id, s.booking]] as const : []))).values()]
    .reduce((n, b) => n + b.party_size, 0);

  return (
    <div className="console-page">
      <DayBar base={`/console/${slug}/floor`} date={date} extra={`&time=${time}`} view="floor" />
      <div className="console-floorbar">
        <TimeScrub base={`/console/${slug}/floor`} date={date} value={minutes} open={open} close={close} now={nowMin} />
        <span className="console-legend">
          <i className="is-free" /> Free {count("free")}
          <i className="is-booked" /> Booked {count("booked")}
          <i className="is-seated" /> Seated {count("seated")}
          <span className="console-legend__guests">{guests} guests in</span>
        </span>
      </div>

      {tables.length ? (
        <FloorPlanSvg
          plan={venue.plan}
          sections={sections}
          tables={states}
          label={`Floor plan at ${timeLabel(new Date(at), tz)}`}
        />
      ) : (
        <p className="console-empty">No floor plan yet for this venue.</p>
      )}
    </div>
  );
}
