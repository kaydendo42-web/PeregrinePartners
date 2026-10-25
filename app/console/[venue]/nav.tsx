"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Four places, the $5 dinners pickup list, and the customer CRM. Bookings is one day, seen as the floor, the list or the
 * timeline (tabs on the day bar); Calendar is the month that leads into it.
 */
const ITEMS = [
  ["/list", "Bookings", ["/list", "/floor", "/schedule"]],
  ["/calendar", "Calendar", ["/calendar"]],
  ["/dinners", "Dinners", ["/dinners"]],
  ["/customers", "Customers", ["/customers"]],
  ["/crm", "Customer CRM", ["/crm"]],
  ["/settings", "Settings", ["/settings"]],
] as const;

export function ConsoleNav({ slug, children }: { slug: string; children: ReactNode }) {
  const path = usePathname();
  const base = `/console/${slug}`;
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); }
    };
    const away = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", away);
    return () => { document.removeEventListener("keydown", close); document.removeEventListener("pointerdown", away); };
  }, [open]);
  return (
    <div className="console-navigation" ref={root} data-open={open}>
      <button ref={trigger} type="button" className="console-menu-toggle" aria-expanded={open} aria-controls="console-navigation-panel" onClick={() => setOpen(!open)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        Menu
      </button>
      <div className="console-navigation-panel" id="console-navigation-panel">
      <nav className="console-nav" aria-label="Console">
      {ITEMS.map(([href, label, owns]) => {
        const to = base + href;
        const current = owns.some((o) => path.startsWith(base + o));
        return (
          <Link key={label} href={to} aria-current={current ? "page" : undefined} onClick={() => setOpen(false)}>
            {label}
          </Link>
        );
      })}
    </nav>
      {children}
      </div>
    </div>
  );
}
