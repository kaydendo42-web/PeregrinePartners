"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const spoken = (m: number) => {
  const h = Math.floor(m / 60);
  return `${h % 12 || 12}:${String(m % 60).padStart(2, "0")} ${h >= 12 ? "pm" : "am"}`;
};

/** Drag through the day and watch the room fill and empty. */
export function TimeScrub({
  base,
  date,
  value,
  open,
  close,
  now,
}: {
  base: string;
  date: string;
  value: number;
  open: number;
  close: number;
  /** Minutes into today, or null on any other day. */
  now: number | null;
}) {
  const router = useRouter();
  const [at, setAt] = useState(value);
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // A new time from the server (day change, back button) resets the handle.
  const [seen, setSeen] = useState(value);
  if (seen !== value) {
    setSeen(value);
    setAt(value);
  }

  const go = (m: number, wait = 120) => {
    setAt(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () => start(() => router.replace(`${base}?date=${date}&time=${hhmm(m)}`, { scroll: false })),
      wait,
    );
  };

  return (
    <div className="console-scrub" data-pending={pending || undefined}>
      <output className="console-scrub__time">{spoken(at)}</output>
      <input
        type="range"
        min={open}
        max={close}
        step={15}
        value={at}
        onChange={(e) => go(Number(e.target.value))}
        aria-label="Time of day"
        aria-valuetext={spoken(at)}
      />
      {now !== null ? (
        <button type="button" className="console-btn console-btn--sm" onClick={() => go(now - (now % 15), 0)}>
          Now
        </button>
      ) : null}
    </div>
  );
}
