import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { Ticker } from "@/components/ticker";
import { Footer } from "@/components/footer";
import { Floor } from "@/components/platform/floor";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion-primitives";
import { platform } from "@/lib/content";
import { jost, karla } from "./fonts";
import "../platform.css";

/**
 * The Floor.
 *
 * The demo is on screen at load: no heading above it, no intro, no stat tiles,
 * no marquee. Everything the page used to say first now sits underneath, where
 * a reader arrives at it having already played with the thing it describes.
 *
 * The page runs in two languages and the seam is deliberate. Inside `<Floor />`
 * it is `handoff/art-direction.md`: zero radii, no shadows, Jost and Karla,
 * the mint and coral palette. Below it, the site's own system. Neither crosses
 * the other (CLAUDE.md, "The Floor art direction").
 */

const DESCRIPTION =
  "A modelled morning on the floor: six departments, the venue at the centre, and only the decisions that need a person.";

export const metadata: Metadata = {
  title: "Platform",
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Peregrine Partners",
    title: "The office it keeps overnight",
    description: DESCRIPTION,
    images: [{ url: "/og-platform.png", width: 1200, height: 630, alt: "The floor" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The office it keeps overnight",
    description: DESCRIPTION,
    images: ["/og-platform.png"],
  },
};

export default function Platform() {
  return (
    <>
      <Nav />

      <main className="relative z-10 bg-[color:var(--page)]">
        {/* The demo, first thing, filling the screen it opens on. */}
        <section id="floor" className={`${jost.variable} ${karla.variable}`}>
          <Floor />
        </section>

        {/* Everything the page has to say, after the thing it describes. */}
        <section className="w-full bg-[color:var(--page)] px-[12px] pt-[12px]">
          <div className="section-card band py-[120px] md:py-[180px]">
            <div className="measure">
              <Reveal>
                <h2 className="t-display max-w-[820px]">{platform.heading}</h2>
              </Reveal>
              <Reveal delay={0.06}>
                <p className="t-body mt-[40px] max-w-[560px]">{platform.intro}</p>
              </Reveal>

              <div className="mt-[60px] grid grid-cols-1 gap-[10px] sm:grid-cols-2 xl:grid-cols-4">
                {platform.facts.map((f, i) => (
                  <Reveal key={f.label} delay={0.06 + i * 0.05}>
                    <div
                      className="flex h-full flex-col justify-between gap-[24px] bg-white p-[24px]"
                      style={{ borderRadius: "var(--r-card)" }}
                    >
                      <p
                        className="font-mono"
                        style={{ fontSize: 34, lineHeight: "34px", letterSpacing: "-1px", fontWeight: 500 }}
                      >
                        {f.value}
                      </p>
                      <p className="t-label" style={{ color: "var(--ink-60)" }}>
                        {f.label}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="bg-[color:var(--page)] py-[7px]">
          <Ticker />
        </div>

        {/* closing band */}
        <section className="w-full bg-[color:var(--page)] px-[12px] pb-[12px]">
          <div className="section-card band bg-[color:var(--dark)] py-[120px] md:py-[180px]">
            <div className="measure">
              <Reveal>
                <h2 className="t-display max-w-[820px] text-white">{platform.close.heading}</h2>
              </Reveal>
              <div className="mt-[50px] flex flex-col justify-between gap-[40px] lg:flex-row lg:items-end">
                <Reveal delay={0.06}>
                  <p className="t-body max-w-[520px] text-white">{platform.close.body}</p>
                </Reveal>
                <Reveal delay={0.12}>
                  <Button href={platform.close.cta.href} variant="secondary" gap={30} minWidth={232}>
                    {platform.close.cta.label}
                  </Button>
                </Reveal>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
