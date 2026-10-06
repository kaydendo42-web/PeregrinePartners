"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Resos's order and names, so Jenny's hands already know them. */
const ITEMS = [
  ["", "Dashboard"],
  ["/calendar", "Calendar"],
  ["/schedule", "Schedule"],
  ["/list", "List"],
  ["/floor", "Floor plan"],
  ["/customers", "Customers"],
  ["/crm", "Customer CRM"],
  ["/settings", "Settings"],
] as const;

export function ConsoleNav({ slug }: { slug: string }) {
  const path = usePathname();
  const base = `/console/${slug}`;
  return (
    <nav className="console-nav" aria-label="Console">
      {ITEMS.map(([href, label]) => {
        const to = base + href;
        const current = href === "" ? path === base : path.startsWith(to);
        return (
          <Link key={label} href={to} aria-current={current ? "page" : undefined}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
