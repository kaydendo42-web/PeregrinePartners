"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "./ui/button";
import { LogoPill } from "./ui/mark";

const LINKS = [
  { label: "Works", href: "#works" },
  { label: "Services", href: "#capabilities" },
  { label: "Insights", href: "#neural" },
  { label: "Pricing", href: "#faq" },
  { label: "Company", href: "#footer" },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <motion.header
      className="pointer-events-none fixed inset-x-0 top-0 z-50 px-[30px] pt-[30px]"
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-start justify-between">
        {/* left pill */}
        <nav
          className="pointer-events-auto flex items-center bg-white"
          style={{ borderRadius: 100, padding: "5px 26px 5px 5px", gap: 24 }}
        >
          <Link href="#top" aria-label="Home">
            <LogoPill />
          </Link>
          <ul className="hidden items-center md:flex" style={{ gap: 32 }}>
            {LINKS.map((l) => (
              <li key={l.label}>
                <Link
                  href={l.href}
                  className="group relative block overflow-hidden"
                  style={{ fontSize: 14, lineHeight: "19.6px", letterSpacing: "0.02em" }}
                >
                  <span className="block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-full">
                    {l.label}
                  </span>
                  <span className="absolute left-0 top-0 block translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0">
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
            aria-label="Menu"
            aria-expanded={open}
          >
            <span className="block h-[1.5px] w-[16px] bg-[color:var(--ink)]" />
            <span className="block h-[1.5px] w-[16px] bg-[color:var(--ink)]" />
          </button>
        </nav>

        {/* right action */}
        <div className="pointer-events-auto hidden sm:block">
          <Button href="#footer" variant="small">
            Hire Team
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
          {LINKS.map((l) => (
            <li key={l.label}>
              <Link href={l.href} onClick={() => setOpen(false)} style={{ fontSize: 16 }}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.header>
  );
}
