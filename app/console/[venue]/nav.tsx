"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Four places. Bookings is one day, seen as the floor, the list or the
 * timeline (tabs on the day bar); Calendar is the month that leads into it.
 */
const ITEMS = [
  ["/list", "Bookings", ["/list", "/floor", "/schedule"]],
  ["/calendar", "Calendar", ["/calendar"]],
  ["/customers", "Customers", ["/customers"]],
  ["/settings", "Settings", ["/settings"]],
] as const;

export function ConsoleNav({ slug }: { slug: string }) {
  const path = usePathname();
  const base = `/console/${slug}`;
  return (
    <nav className="console-nav" aria-label="Console">
      {ITEMS.map(([href, label, owns]) => {
        const to = base + href;
        const current = owns.some((o) => path.startsWith(base + o));
        return (
          <Link key={label} href={to} aria-current={current ? "page" : undefined}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
