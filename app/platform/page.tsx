import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { Ticker } from "@/components/ticker";
import { Footer } from "@/components/footer";
import { AgentFloor } from "@/components/platform/agent-floor";
import { Button } from "@/components/ui/button";
import { Marquee, Reveal } from "@/components/ui/motion-primitives";
import { Starburst } from "@/components/ui/starburst";
import { SectionLabel } from "@/components/ui/section-label";
import { platform } from "@/lib/content";
import "../platform.css";

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
        {/* opening band */}
        <section className="w-full bg-[color:var(--page)] px-[12px] pt-[12px]">
          <div className="section-card px-[24px] pb-[80px] pt-[190px] md:px-[40px] md:pt-[220px]">
            <div className="mx-auto w-full max-w-[1336px]">
              <SectionLabel label={platform.label} ruleWidth={520} />

              <Reveal delay={0.04}>
                <h1 className="t-hero mt-[52px] max-w-[900px]">{platform.heading}</h1>
              </Reveal>

              <div className="mt-[50px] flex flex-col justify-between gap-[40px] lg:flex-row lg:items-end">
                <Reveal delay={0.08}>
                  <p className="t-body max-w-[520px]">{platform.intro}</p>
                </Reveal>
                <Reveal delay={0.14}>
                  <Button href="#floor" gap={26}>
                    {platform.cta.label}
                  </Button>
                </Reveal>
              </div>

              <div className="mt-[60px] grid grid-cols-1 gap-[10px] sm:grid-cols-2 xl:grid-cols-4">
                {platform.facts.map((f, i) => (
                  <Reveal key={f.label} delay={0.06 + i * 0.05}>
                    <div
                      className="flex h-full flex-col justify-between gap-[24px] bg-white p-[24px]"
                      style={{ borderRadius: 20 }}
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

        {/* display marquee, the same beat the works section opens on */}
        <div className="bg-[color:var(--page)] py-[120px]">
          <Marquee duration={34}>
            <div className="flex shrink-0 items-center gap-[60px] pr-[60px]">
              <h2 className="t-marquee whitespace-nowrap">{platform.marquee}</h2>
              <Starburst />
            </div>
          </Marquee>
        </div>

        {/* the floor itself */}
        <section id="floor" className="w-full bg-[color:var(--page)] px-[12px] pb-[120px]">
          <div className="section-card px-[8px] py-[40px] md:px-[20px]">
            <AgentFloor />
          </div>
        </section>

        <div className="bg-[color:var(--page)] py-[7px]">
          <Ticker />
        </div>

        {/* closing band */}
        <section className="w-full bg-[color:var(--dark)] px-[24px] py-[120px] md:py-[180px] md:px-[40px]">
          <div className="mx-auto w-full max-w-[1336px]">
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
        </section>
      </main>

      <Footer />
    </>
  );
}
