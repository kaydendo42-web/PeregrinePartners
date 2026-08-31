import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { Ticker } from "@/components/ticker";
import { Footer } from "@/components/footer";
import { Cite } from "@/components/ui/cite";
import { SectionLabel } from "@/components/ui/section-label";
import { Reveal, ScrollHighlightText } from "@/components/ui/motion-primitives";
import { AboutHeroArt } from "@/components/about/about-hero-art";
import { OriginVisual } from "@/components/about/origin-visual";
import { about, team } from "@/lib/content";

const DESCRIPTION =
  "Small business bought the software and nobody delivered the work. The gap Peregrine Partners is closing, why it is still open, and the three of us closing it.";

export const metadata: Metadata = {
  title: "About Us",
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Peregrine Partners",
    title: "Small business bought the software. Nobody delivered the work.",
    description: DESCRIPTION,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Peregrine Partners" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Small business bought the software. Nobody delivered the work.",
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

/**
 * About Us — the argument, not the pitch.
 *
 * The home page sells the result. This page has the opposite job: it says what
 * is broken, why nobody has fixed it, and on whose authority we think we can.
 * So it opens dark where the other two pages open light — a reader arriving
 * here has already been sold to once, and the change of ground is the fastest
 * way to say this page is doing something else.
 *
 * The order is the argument: the gap, how we found it, the rules we hold to,
 * and who holds them. No product stats and no pricing band, because both are
 * the home page's job and neither is what a reader came to this page for.
 *
 * Two beats came out on Kayden's call: "why now", which argued the market, and
 * "where we work", which was the closing door. The page ends on the three of us
 * now, and the only way on is the nav's own button, which follows the reader
 * the whole way down.
 *
 * Every band, dark or light, is a card inside the 12px page gutter. The dark
 * ones used to run full bleed with a radius set on them, which rendered as
 * white notches at the viewport corners rather than as a card, and moved the
 * content left edge 12px every time the ground changed.
 */

/** Vertical rhythm only. The horizontal padding and the content measure are
 *  `band` and `measure` in `globals.css`, on the tokens, for the whole site.
 *
 *  There used to be two of these, a lighter one and a heavier one for the dark
 *  bands. Nothing on the site earns that distinction: home's dark Stack is
 *  lighter than its light Faq. Ground is not a reason to change the rhythm, so
 *  every band here is one band on `--block-gap`. */
const BAND = "band py-[var(--block-gap)]";
const MEASURE = "measure";

export default function About() {
  return (
    <>
      <Nav />

      <main className="relative z-10 bg-[color:var(--page)]">
        {/* ── the opening, on dark ─────────────────────────────────── */}
        <section className="w-full bg-[color:var(--page)] p-[12px]">
          {/* The copy is centred in the card, not parked on its floor. It used
              to be justify-end with 190 above and 110 below, which read as a
              caption under the sculpture rather than the page's opening. The
              padding is symmetric so the centring is the real centre, and 150
              is still enough to clear the nav on a short viewport. */}
          <div
            data-about-hero
            className="band relative flex min-h-[calc(100svh-24px)] flex-col justify-center overflow-hidden py-[110px] md:min-h-[720px] md:py-[150px]"
            style={{ background: "var(--dark)", borderRadius: "var(--r-card)" }}
          >
            <AboutHeroArt />

            {/* Keep the argument readable while the sculpture resolves behind
                it. The falloff is darkest where the longest line lands. */}
            <div
              className="pointer-events-none absolute inset-0 z-[2]"
              style={{
                background:
                  "linear-gradient(90deg, var(--dark) 0%, var(--dark) 42%, rgba(26,26,26,0.78) 61%, rgba(26,26,26,0.04) 100%)",
              }}
              aria-hidden="true"
            />

            <div data-about-hero-copy className="measure relative z-10">
              <SectionLabel label={about.eyebrow} tone="dark" ruleWidth={300} />

              <h1 className="t-hero mt-[52px] max-w-[830px]">
                <Reveal>
                  <span className="block" style={{ color: "var(--paper-40)" }}>
                    {about.headlineDim}
                  </span>
                </Reveal>
                <Reveal delay={0.1}>
                  <span className="block text-white">{about.headlineLit}</span>
                </Reveal>
              </h1>

              <Reveal delay={0.2}>
                <p className="t-body mt-[28px] max-w-[560px] text-white">{about.sub}</p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── the gap, on light ────────────────────────────────────── */}
        <section id="gap" className="w-full bg-[color:var(--page)] px-[12px]">
          <div className={`section-card ${BAND}`}>
            <div className={MEASURE}>
              <SectionLabel label={about.gap.label} ruleWidth={300} />

              <ScrollHighlightText
                text={about.gap.text}
                className="t-statement mt-[52px] max-w-[1000px]"
                dim="var(--ink-10)"
                lit="var(--ink)"
              />

              <Reveal delay={0.06}>
                <p className="t-body mt-[40px] max-w-[640px]">{about.gap.body}</p>
              </Reveal>

              <div className="mt-[60px] grid grid-cols-1 gap-[10px] md:grid-cols-3">
                {about.gap.facts.map((f, i) => (
                  <Reveal key={f.figure} delay={0.06 + i * 0.06}>
                    <div
                      className="flex h-full flex-col justify-between gap-[20px] bg-white p-[24px]"
                      style={{ borderRadius: "var(--r-card)" }}
                    >
                      <p
                        style={{
                          fontSize: 34,
                          lineHeight: "36px",
                          letterSpacing: "-1.4px",
                          fontWeight: 500,
                        }}
                      >
                        {f.figure}
                      </p>
                      <div>
                        <p className="t-label" style={{ color: "var(--ink-60)" }}>
                          {f.body}
                        </p>
                        <Cite keys={f.cite} className="mt-[10px]" />
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── how we found it, on dark ─────────────────────────────── */}
        {/*
          The origin. It is the only place on the site where the argument is a
          room rather than a figure, so it gets the page's one photograph and
          the story is set larger than body copy. Everything above this band is
          the shape of the problem; this is the morning we saw it.
        */}
        <section id="origin" className="w-full bg-[color:var(--page)] px-[12px]">
          <div
            className={BAND}
            style={{ background: "var(--dark)", borderRadius: "var(--r-card)" }}
          >
            <div className={MEASURE}>
              <SectionLabel label={about.origin.label} tone="dark" ruleWidth={300} />

              <div className="mt-[52px] grid grid-cols-1 gap-[56px] lg:grid-cols-[minmax(320px,0.72fr)_minmax(0,1.28fr)] lg:items-start lg:gap-[clamp(60px,7vw,110px)]">
                <div className="flex h-full flex-col lg:min-h-[560px]">
                  <Reveal>
                    <h2 className="t-display max-w-[520px] text-white">
                      {about.origin.heading}
                    </h2>
                  </Reveal>

                  <Reveal delay={0.08}>
                    <p
                      className="mt-[42px] max-w-[520px] text-white"
                      style={{ fontSize: 22, lineHeight: "32px", letterSpacing: "-0.3px" }}
                    >
                      {about.origin.body}
                    </p>
                  </Reveal>
                  <Reveal delay={0.14}>
                    <p className="t-body mt-[28px] max-w-[520px] text-white/70">
                      {about.origin.body2}
                    </p>
                  </Reveal>
                </div>

                <OriginVisual
                  src={about.origin.photo}
                  caption={about.origin.photoCaption}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="bg-[color:var(--page)] py-[10px]">
          <Ticker />
        </div>

        {/* ── the three of us, on dark ─────────────────────────────── */}
        <section id="people" className="w-full bg-[color:var(--page)] px-[12px]">
          <div
            className={BAND}
            style={{ background: "var(--dark)", borderRadius: "var(--r-card)" }}
          >
            <div className={MEASURE}>
              <SectionLabel label={about.people.label} tone="dark" ruleWidth={300} />

              <div className="mt-[52px] flex flex-col gap-[50px] lg:flex-row lg:justify-between">
                <Reveal className="lg:max-w-[560px]">
                  <h2 className="t-display text-white">{about.people.heading}</h2>
                </Reveal>
                <Reveal delay={0.08} className="lg:max-w-[480px]">
                  <p className="t-body text-white/80">{about.people.body}</p>
                </Reveal>
              </div>

              {/* Everything on the card at rest — this is the page a reader came
                  to for depth, so nothing worth knowing hides behind a hover. */}
              <div className="mt-[60px] grid grid-cols-1 gap-[14px] sm:grid-cols-2 xl:grid-cols-3">
                {team.members.map((m, i) => (
                  <Reveal key={m.name} delay={0.05 + i * 0.07}>
                    <figure className="flex h-full flex-col">
                      <div
                        className="relative w-full overflow-hidden"
                        style={{ aspectRatio: "330 / 402", borderRadius: "0px 20px 20px 20px" }}
                      >
                        <img
                          src={m.photo}
                          alt={m.name}
                          className="h-full w-full object-cover object-top"
                        />
                      </div>
                      <figcaption className="mt-[24px] flex flex-1 flex-col gap-[10px]">
                        <p
                          className="uppercase text-white"
                          style={{
                            fontFamily: "var(--font-plex), monospace",
                            fontSize: 14,
                            lineHeight: "21px",
                            fontWeight: 500,
                          }}
                        >
                          {m.name}
                        </p>
                        <p
                          className="t-mono-xs font-mono uppercase"
                          style={{ color: "var(--paper-50)" }}
                        >
                          {m.role} · {m.school}
                        </p>
                        <p className="t-body-sm mt-[6px] text-white/80">{m.does}</p>
                      </figcaption>
                    </figure>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
