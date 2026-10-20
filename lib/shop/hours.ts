/** The Hours form: seven rows, each on or off with a from and a to. Pure, so it's tested on its own. */

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const QUARTER = /^([01]\d|2[0-3]):(00|15|30|45)$/;

export type HoursDay = { weekday: number; open: string; close: string };

export function parseHoursForm(fd: FormData): { ok: true; days: HoursDay[] } | { ok: false; error: string } {
  const days: HoursDay[] = [];
  for (let d = 0; d < 7; d++) {
    if (!fd.get(`day-${d}-on`)) continue;
    const open = String(fd.get(`day-${d}-open`) ?? "");
    const close = String(fd.get(`day-${d}-close`) ?? "");
    if (!QUARTER.test(open) || !QUARTER.test(close)) return { ok: false, error: `Pick times on the quarter hour for ${DAY_NAMES[d]}.` };
    if (close <= open) return { ok: false, error: `Closing time must be after opening on ${DAY_NAMES[d]}.` };
    days.push({ weekday: d, open, close });
  }
  return { ok: true, days };
}
