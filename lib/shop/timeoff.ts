/** Time off: days closed, or open different hours, over a short range. Pure, so it's tested on its own. */

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const QUARTER = /^([01]\d|2[0-3]):(00|15|30|45)$/;
const MAX_DAYS = 60;

export function expandRange(from: string, to: string): string[] {
  const [y, m, d] = from.split("-").map(Number);
  const start = Date.UTC(y, m - 1, d);
  const [y2, m2, d2] = to.split("-").map(Number);
  const days = Math.round((Date.UTC(y2, m2 - 1, d2) - start) / 86_400_000) + 1;
  if (days < 1) throw new Error("The last day can't be before the first.");
  if (days > MAX_DAYS) throw new Error(`Pick ${MAX_DAYS} days or fewer.`);
  return Array.from({ length: days }, (_, i) => new Date(start + i * 86_400_000).toISOString().slice(0, 10));
}

export type TimeOff = { dates: string[]; closed: boolean; open: string | null; close: string | null; note: string | null };

export function parseTimeOff(fd: FormData): ({ ok: true } & TimeOff) | { ok: false; error: string } {
  const from = String(fd.get("from") ?? "");
  const to = String(fd.get("to") ?? "") || from;
  if (!DATE.test(from) || !DATE.test(to)) return { ok: false, error: "Pick the days." };
  let dates: string[];
  try {
    dates = expandRange(from, to);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  const note = String(fd.get("note") ?? "").trim().slice(0, 80) || null;
  if (fd.get("kind") !== "hours") return { ok: true, dates, closed: true, open: null, close: null, note };
  const open = String(fd.get("open") ?? "");
  const close = String(fd.get("close") ?? "");
  if (!QUARTER.test(open) || !QUARTER.test(close)) return { ok: false, error: "Pick times on the quarter hour." };
  if (close <= open) return { ok: false, error: "Closing time must be after opening." };
  return { ok: true, dates, closed: false, open, close, note };
}
