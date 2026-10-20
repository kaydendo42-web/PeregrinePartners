"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The shop's five places, where a Booksy user expects them: the calendar
 * first, then the things that shape it. A tab bar on a phone, a sidebar on a
 * wider screen.
 */
const ITEMS: [string, string][] = [
  ["", "Calendar"],
  ["/hours", "Hours"],
  ["/time-off", "Time off"],
  ["/services", "Services"],
  ["/settings", "Settings"],
];

export function ShopNav({ slug }: { slug: string }) {
  const path = usePathname();
  const base = `/console/shop/${slug}`;
  return (
    <nav className="shop-nav" aria-label="Shop">
      {ITEMS.map(([href, label]) => {
        const to = base + href;
        const current = href === "" ? path === base || path.startsWith(`${base}/booking`) || path.startsWith(`${base}/new`) : path.startsWith(to);
        return (
          <Link key={label} href={to} aria-current={current ? "page" : undefined}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
