/** The Settings and Services forms, in the units Vance thinks in. Ranges match the database's checks. */

export type Rules = {
  maxAdvanceDays: number;
  minNoticeMinutes: number;
  slotMinutes: number;
  guestChangeCutoffHours: number;
  bufferMinutes: number;
};

const int = (fd: FormData, key: string) => {
  const v = String(fd.get(key) ?? "").trim();
  return /^\d+$/.test(v) ? Number(v) : NaN;
};

export function parseSettings(fd: FormData): { ok: true; value: Rules } | { ok: false; error: string } {
  const advance = int(fd, "advance");
  if (!(advance >= 1 && advance <= 180)) return { ok: false, error: "Pick between 1 and 180 days." };
  const notice = int(fd, "notice");
  if (!(notice >= 0 && notice <= 48)) return { ok: false, error: "Notice can be 0 to 48 hours." };
  const slots = int(fd, "slots");
  if (![15, 30, 45, 60].includes(slots)) return { ok: false, error: "Slots run every 15, 30, 45 or 60 minutes." };
  const cutoff = int(fd, "cutoff");
  if (!(cutoff >= 0 && cutoff <= 168)) return { ok: false, error: "Pick 0 to 168 hours." };
  const buffer = int(fd, "buffer");
  if (!(buffer >= 0 && buffer <= 60)) return { ok: false, error: "A gap can be 0 to 60 minutes." };
  return {
    ok: true,
    value: { maxAdvanceDays: advance, minNoticeMinutes: notice * 60, slotMinutes: slots, guestChangeCutoffHours: cutoff, bufferMinutes: buffer },
  };
}

export function parseService(
  fd: FormData,
): { ok: true; value: { name: string; durationMin: number; priceCents: number } } | { ok: false; error: string } {
  const name = String(fd.get("name") ?? "").trim();
  if (!name || name.length > 60) return { ok: false, error: "Give the service a name." };
  const duration = int(fd, "duration");
  if (!(duration >= 15 && duration <= 240) || duration % 15) return { ok: false, error: "Use steps of 15 minutes." };
  const raw = String(fd.get("price") ?? "").trim().replace(/^\$/, "");
  if (raw.startsWith("-")) return { ok: false, error: "Price can't be negative." };
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return { ok: false, error: "Enter a price like 50 or 52.50." };
  return { ok: true, value: { name, durationMin: duration, priceCents: Math.round(Number(raw) * 100) } };
}
