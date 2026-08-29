"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { brand, footer } from "@/lib/content";

const SOCIALS = ["x", "in", "yt", "ig"] as const;

export function Footer() {
  return (
    <footer
      id="footer"
      className="relative bottom-0 z-0 flex min-h-[760px] w-full flex-col justify-end overflow-hidden bg-[#0d1410] pt-[100px] md:min-h-[1140px] md:pt-0 lg:sticky"
    >
      <div className="pointer-events-none absolute inset-0">
        <img src={footer.bg} alt="" aria-hidden className="h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: "rgba(8,18,10,0.28)" }} />
      </div>

      {/*
        This block sits flush to the footer's bottom edge, and the footer's
        bottom edge is the viewport's, so its top always lands at the viewport
        height minus its own height. Padding cannot move it down: the only way
        to keep it clear of the fixed nav on a short screen is for it to be
        shorter there. Hence the viewport-relative clamps below and on the
        wordmark, which are the two places the block spends most of its height.
      */}
      <div className="band-bleed relative z-10 w-full pb-[clamp(28px,4svh,40px)] md:pb-[clamp(40px,9svh,113px)]">
        {/*
          One measure around the whole block. The wordmark and the legal line
          used to sit outside it, so above 1632 they held the band edge while
          everything else was centred by `--measure` and the footer stepped.
        */}
        <div className="measure">
          {/*
            The wordmark and the link columns share one row, bottom aligned.

            The columns used to sit at the top of the footer with the newsletter
            block. That block is gone, so left alone they would have hung in the
            air above a very large piece of type. Sat on the same baseline as
            the wordmark they read as one masthead instead of two blocks, and
            the footer has one horizon rather than three.
          */}
          <div className="flex flex-col gap-[clamp(32px,6svh,60px)] lg:flex-row lg:items-end lg:justify-between lg:gap-[60px]">
            {/*
              The wordmark, set as large as the block allows.

              It was live text in Inter, which was the right call while there was
              no artwork and the wrong one now: the logo is a serif, and a sans
              approximation of it at 379px is the largest possible place to get
              the brand wrong. The artwork is knocked out to white rather than
              kept as a second file to drift out of sync with the navy original.
            */}
            <motion.img
              src={brand.wordmarkSrc}
              alt={brand.full}
              className="h-[clamp(74px,15svh,150px)] w-auto shrink-0 object-contain object-left md:h-[clamp(120px,26svh,300px)]"
              style={{ filter: "brightness(0) invert(1)" }}
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            />

            <div className="flex flex-wrap gap-y-[40px] lg:pb-[18px]">
              {footer.columns.map((col) => (
                <div
                  key={col.title}
                  className="w-[200px] pl-[35px]"
                  style={{ borderLeft: "1px solid var(--paper-20)" }}
                >
                  <p
                    className="font-mono text-white"
                    style={{ fontSize: 16, lineHeight: "22.4px", fontWeight: 500 }}
                  >
                    {col.title}
                  </p>
                  <ul className="mt-[26px] flex flex-col gap-[12px]">
                    {col.links.map((l) => (
                      <li key={l.label} className="group/link flex h-[21px] items-center">
                        {/* the marker hangs in the 35px indent, as in the reference */}
                        <span
                          className="-ml-[35px] mr-[20px] block h-[1px] w-[15px] shrink-0 transition-[width] duration-300 group-hover/link:w-[24px]"
                          style={{ background: "var(--paper-40)" }}
                        />
                        <Link
                          href={l.href}
                          className="block text-white transition-opacity duration-300 hover:opacity-60"
                          style={{ fontSize: 14, lineHeight: "21px", fontWeight: 300, letterSpacing: "0.28px" }}
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/*
            The last horizon: the legal line and the social row share it.

            The socials used to sit above the wordmark with the newsletter
            block. On their own up there they were an island in the middle of
            the photograph, so they came down here. The footer now reads as two
            rules across it, the masthead and this, rather than three loose
            blocks stacked down the left.
          */}
          <div className="mt-[28px] flex flex-col gap-[20px] sm:flex-row sm:items-center sm:justify-between sm:gap-[40px]">
            <p className="t-mono-xs font-mono uppercase text-white/45">{footer.legal}</p>

            <div className="flex shrink-0 items-center gap-[10px]">
              <span className="t-mono mr-[4px] text-white/45">Follow Us:</span>
              {SOCIALS.map((s) => (
                <motion.a
                  key={s}
                  href="#footer"
                  aria-label={s}
                  className="flex h-[34px] w-[34px] items-center justify-center text-white"
                  style={{ background: "var(--paper-10)", borderRadius: 6 }}
                  whileHover={{ y: -3, backgroundColor: "rgba(255,255,255,0.22)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 24 }}
                >
                  <SocialGlyph kind={s} />
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialGlyph({ kind }: { kind: (typeof SOCIALS)[number] }) {
  const p = { stroke: "currentColor", strokeWidth: 1.5, fill: "none" } as const;
  if (kind === "x")
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden>
        <path
          d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          fill="currentColor"
        />
      </svg>
    );
  if (kind === "in")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="3" {...p} />
        <path d="M8 10v7M8 7.4v.1M12 17v-4a2.6 2.6 0 015 0v4" {...p} strokeLinecap="round" />
      </svg>
    );
  if (kind === "yt")
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
        <rect x="2.5" y="5.5" width="19" height="13" rx="4" {...p} />
        <path d="M10.5 9.5l5 2.5-5 2.5z" fill="currentColor" />
      </svg>
    );
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" {...p} />
      <circle cx="12" cy="12" r="4" {...p} />
      <circle cx="17" cy="7" r="1" fill="currentColor" />
    </svg>
  );
}
