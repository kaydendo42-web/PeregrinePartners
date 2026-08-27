"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Logo } from "./ui/mark";
import { nav } from "@/lib/content";

/**
 * Fixed nav. The reference never hides it on scroll, so neither do we.
 *
 * Four destinations rather than the template's five: the site is small on
 * purpose and a nav that lists more than the site holds reads as a company
 * pretending to be bigger than it is. `Sign in` sits with the links rather
 * than beside the CTA because it is navigation, not an action — the one
 * action on this bar is the waitlist.
 */
export function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <motion.header
      className="pointer-events-none fixed inset-x-0 top-0 z-50 px-[16px] pt-[16px] md:px-[30px] md:pt-[30px]"
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-start justify-between gap-[12px]">
        {/* left pill */}
        <nav
          className="pointer-events-auto flex w-full items-center justify-between bg-white md:w-auto md:justify-start"
          style={{ borderRadius: 100, padding: "5px 26px 5px 5px", gap: 40 }}
        >
          <Link href="/" aria-label="Peregrine Partners, home">
            <Logo />
          </Link>

          <ul className="hidden items-center md:flex" style={{ gap: 32 }}>
            {nav.links.map((l) => (
              <li key={l.label}>
                <Link
                  href={l.href}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className="group relative block overflow-hidden"
                  style={{
                    fontSize: 14,
                    lineHeight: "19.6px",
                    letterSpacing: "0.02em",
                    /* the current page reads full-strength, the rest step back */
                    color: isActive(l.href) ? "var(--ink)" : "var(--ink-60)",
                  }}
                >
                  <span className="block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-full">
                    {l.label}
                  </span>
                  <span className="absolute left-0 top-0 block translate-y-full text-[color:var(--ink)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0">
                    {l.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-[34px] w-[34px] flex-col items-center justify-center gap-[5px] md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            <motion.span
              className="block h-[1.5px] w-[16px] bg-[color:var(--ink)]"
              animate={{ rotate: open ? 45 : 0, y: open ? 3.25 : 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.span
              className="block h-[1.5px] w-[16px] bg-[color:var(--ink)]"
              animate={{ rotate: open ? -45 : 0, y: open ? -3.25 : 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            />
          </button>
        </nav>

        {/* right action */}
        <div className="pointer-events-auto hidden sm:block">
          <Button href={nav.cta.href} variant="small">
            {nav.cta.label}
          </Button>
        </div>
      </div>

      {/* mobile sheet */}
      <motion.div
        className="pointer-events-auto mt-2 overflow-hidden bg-white md:hidden"
        style={{ borderRadius: 20 }}
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <ul className="flex flex-col gap-4 p-6">
          {nav.links.map((l) => (
            <li key={l.label}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(l.href) ? "page" : undefined}
                style={{ fontSize: 16, color: isActive(l.href) ? "var(--ink)" : "var(--ink-60)" }}
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li className="pt-[6px] sm:hidden">
            <Button href={nav.cta.href} variant="small">
              {nav.cta.label}
            </Button>
          </li>
        </ul>
      </motion.div>
    </motion.header>
  );
}
