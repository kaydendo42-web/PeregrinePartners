import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { Ticker } from "@/components/ticker";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Cite } from "@/components/ui/cite";
import { Falcon } from "@/components/ui/mark";
import { SectionLabel } from "@/components/ui/section-label";
import { Reveal, ScrollHighlightText } from "@/components/ui/motion-primitives";
import { DollarSplit } from "@/components/about/dollar-split";
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
 * Every band alternates ground from there, which also does the structural
 * work the template used numbered eyebrows for: you can tell where you are in
 * the argument by what colour you are standing on.
 */
export default function About() {
  return (
    <>
      <Nav />

      <main className="relative z-10 bg-[color:var(--page)]">
        {/* ── the opening, on dark ─────────────────────────────────── */}
        <section className="w-full bg-[color:var(--page)] p-[12px]">
          <div
            className="relative flex min-h-[calc(100svh-24px)] flex-col justify-between overflow-hidden px-[24px] pb-[48px] pt-[150px] md:min-h-[820px] md:px-[56px] md:pt-[210px]"
            style={{ background: "var(--dark)", borderRadius: 20 }}
          >
            {/* the mark, set once at a size it can carry */}
            <span
              className="pointer-events-none absolute -right-[40px] -top-[30px] text-white/[0.045] md:right-[40px] md:top-[60px]"
              aria-hidden
            >
              <Falcon size={340} />
            </span>

            <div className="relative">
              <SectionLabel label={about.eyebrow} tone="dark" ruleWidth={300} />

              <h1 className="t-hero mt-[52px] max-w-[900px]">
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

            <div className="relative mt-[60px] grid grid-cols-1 gap-[10px] sm:grid-cols-3">
              {about.stats.map((s, i) => (
                <Reveal key={s.label} delay={0.26 + i * 0.06}>
                  <div
                    className="flex h-full flex-col justify-between gap-[22px] p-[24px]"
                    style={{ borderRadius: 20, boxShadow: "inset 0 0 0 1px var(--paper-10)" }}
                  >
                    <p
                      className="font-mono text-white"
                      style={{ fontSize: 40, lineHeight: "40px", letterSpacing: "-1.6px", fontWeight: 500 }}
                    >
                      {s.value}
                    </p>
                    <p className="t-label text-white/60">{s.label}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── the gap, on light ────────────────────────────────────── */}
        <section id="gap" className="w-full bg-[color:var(--page)] px-[12px]">
          <div className="section-card px-[24px] py-[140px] md:px-[56px] md:py-[190px]">
            <div className="mx-auto w-full max-w-[1336px]">
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
                      style={{ borderRadius: 20 }}
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

        {/* ── the six dollars, on dark ─────────────────────────────── */}
        <section
          id="six"
          className="w-full bg-[color:var(--dark)] px-[24px] py-[160px] md:px-[56px] md:py-[200px]"
          style={{ borderRadius: "20px 20px 20px 20px" }}
        >
          <div className="mx-auto w-full max-w-[1336px]">
            <SectionLabel label={about.six.label} tone="dark" ruleWidth={300} />

            <div className="mt-[52px] flex flex-col gap-[70px] lg:flex-row lg:justify-between lg:gap-[80px]">
              <div className="max-w-[600px]">
                <Reveal>
                  <h2 className="t-display text-white">{about.six.heading}</h2>
                </Reveal>
                <Reveal delay={0.06}>
                  <p className="t-body mt-[32px] text-white/80">{about.six.body}</p>
                  <Cite keys={about.six.bodyCite} tone="dark" className="mt-[14px]" />
                </Reveal>

                <Reveal delay={0.12}>
                  <figure
                    className="mt-[40px] p-[28px]"
                    style={{ borderRadius: 20, background: "var(--dark-2)" }}
                  >
                    <blockquote
                      className="text-white"
                      style={{ fontSize: 22, lineHeight: "30px", fontWeight: 400, letterSpacing: "-0.3px" }}
                    >
                      &ldquo;{about.six.quote}&rdquo;
                    </blockquote>
                  </figure>
                </Reveal>

                <Reveal delay={0.16}>
                  <p className="t-body mt-[36px] max-w-[520px] text-white">{about.six.after}</p>
                </Reveal>
              </div>

              <Reveal delay={0.1} className="w-full lg:max-w-[460px]">
                <DollarSplit />
              </Reveal>
            </div>
          </div>
        </section>

        <div className="bg-[color:var(--page)] py-[10px]">
          <Ticker />
        </div>

        {/* ── why now, on light ────────────────────────────────────── */}
        <section id="why" className="w-full bg-[color:var(--page)] px-[12px]">
          <div className="section-card px-[24px] py-[140px] md:px-[56px] md:py-[190px]">
            <div className="mx-auto w-full max-w-[1336px]">
              <SectionLabel label={about.why.label} ruleWidth={300} />

              <Reveal delay={0.04}>
                <h2 className="t-display mt-[52px] max-w-[760px]">{about.why.heading}</h2>
              </Reveal>

              {/*
                Numbered, because this one genuinely is a sequence: the second
                point only makes sense once the first is granted, and the third
                is what follows from both. Nothing else on this page is
                numbered for that reason.
              */}
              <ol className="mt-[60px] flex flex-col">
                {about.why.points.map((p, i) => (
                  <Reveal key={p.n} delay={0.04 + i * 0.06}>
                    <li
                      className="grid gap-x-[30px] gap-y-[14px] py-[36px] md:grid-cols-[80px_320px_1fr]"
                      style={{ borderTop: "1px solid var(--ink-10)" }}
                    >
                      <span
                        className="font-mono"
                        style={{ fontSize: 13, lineHeight: "24px", color: "var(--ink-40)" }}
                      >
                        {`// ${p.n}`}
                      </span>
                      <h3
                        style={{ fontSize: 20, lineHeight: "27px", fontWeight: 500, letterSpacing: "-0.4px" }}
                      >
                        {p.title}
                      </h3>
                      <div>
                        <p className="t-body max-w-[560px]" style={{ color: "var(--ink-70)" }}>
                          {p.body}
                        </p>
                        {"cite" in p && p.cite ? <Cite keys={p.cite} className="mt-[12px]" /> : null}
                      </div>
                    </li>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ── the wedge, on dark ───────────────────────────────────── */}
        <section
          id="wedge"
          className="w-full bg-[color:var(--dark)] px-[24px] py-[160px] md:px-[56px] md:py-[200px]"
          style={{ borderRadius: 20 }}
        >
          <div className="mx-auto w-full max-w-[1336px]">
            <SectionLabel label={about.wedge.label} tone="dark" ruleWidth={300} />
            <div className="mt-[52px] flex flex-col gap-[50px] lg:flex-row lg:justify-between">
              <Reveal className="lg:max-w-[520px]">
                <h2 className="t-display text-white">{about.wedge.heading}</h2>
              </Reveal>
              <Reveal delay={0.08} className="lg:max-w-[640px]">
                <p className="t-body text-white/80">{about.wedge.body}</p>
              </Reveal>
            </div>

            {/* The one photograph on this page, and it is here because this is
                the section arguing about a real floor rather than a market. */}
            <Reveal delay={0.12}>
              <figure className="mt-[70px]">
                <div className="relative w-full overflow-hidden" style={{ borderRadius: 20 }}>
                  <img
                    src={about.wedge.photo}
                    alt=""
                    aria-hidden
                    className="h-[280px] w-full object-cover md:h-[420px]"
                  />
                </div>
                <figcaption
                  className="mt-[18px] font-mono uppercase text-white/40"
                  style={{ fontSize: 11, letterSpacing: "0.06em" }}
                >
                  {about.wedge.photoCaption}
                </figcaption>
              </figure>
            </Reveal>
          </div>
        </section>

        {/* ── what we will not do, on light ────────────────────────── */}
        <section id="refuse" className="w-full bg-[color:var(--page)] px-[12px]">
          <div className="section-card px-[24px] py-[140px] md:px-[56px] md:py-[190px]">
            <div className="mx-auto w-full max-w-[1336px]">
              <SectionLabel label={about.refuse.label} ruleWidth={300} />

              <Reveal delay={0.04}>
                <h2 className="t-display mt-[52px] max-w-[720px]">{about.refuse.heading}</h2>
              </Reveal>

              <div className="mt-[60px] grid grid-cols-1 gap-[10px] md:grid-cols-2">
                {about.refuse.items.map((it, i) => (
                  <Reveal key={it.title} delay={0.04 + i * 0.05}>
                    <div
                      className="flex h-full flex-col gap-[16px] bg-white p-[30px]"
                      style={{ borderRadius: 20 }}
                    >
                      <span
                        className="flex h-[30px] w-[30px] items-center justify-center rounded-full"
                        style={{ background: "var(--ink)" }}
                        aria-hidden
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M6 6l12 12M18 6L6 18"
                            stroke="#fff"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                      <h3
                        style={{ fontSize: 19, lineHeight: "26px", fontWeight: 500, letterSpacing: "-0.35px" }}
                      >
                        {it.title}
                      </h3>
                      <p className="t-body-sm" style={{ color: "var(--ink-70)" }}>
                        {it.body}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── the three of us, on dark ─────────────────────────────── */}
        <section
          id="people"
          className="w-full bg-[color:var(--dark)] px-[24px] py-[160px] md:px-[56px] md:py-[200px]"
          style={{ borderRadius: 20 }}
        >
          <div className="mx-auto w-full max-w-[1336px]">
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
                        className="font-mono uppercase"
                        style={{ fontSize: 11, letterSpacing: "0.06em", color: "var(--paper-50)" }}
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
        </section>

        {/* ── where we are, on light, and the door out ─────────────── */}
        <section id="now" className="w-full bg-[color:var(--page)] px-[12px]">
          <div className="section-card px-[24px] py-[140px] md:px-[56px] md:py-[180px]">
            <div className="mx-auto flex w-full max-w-[1336px] flex-col justify-between gap-[50px] lg:flex-row lg:items-end">
              <div className="max-w-[640px]">
                <SectionLabel label={about.now.label} ruleWidth={280} />
                <Reveal delay={0.04}>
                  <h2 className="t-display mt-[52px]">{about.now.heading}</h2>
                </Reveal>
                <Reveal delay={0.08}>
                  <p className="t-body mt-[28px] max-w-[560px]">{about.now.body}</p>
                </Reveal>
              </div>
              <Reveal delay={0.12} className="shrink-0">
                <Button href={about.now.cta.href} gap={30}>
                  {about.now.cta.label}
                </Button>
              </Reveal>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
