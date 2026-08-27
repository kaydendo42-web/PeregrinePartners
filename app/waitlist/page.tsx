import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Falcon } from "@/components/ui/mark";
import { SectionLabel } from "@/components/ui/section-label";
import { Reveal } from "@/components/ui/motion-primitives";
import { WaitlistForm } from "@/components/forms/waitlist-form";
import { waitlist } from "@/lib/content";

const DESCRIPTION =
  "Bring one month of invoices. We will show you where you are paying twice, where the hours go, and which three branches are worth starting with.";

export const metadata: Metadata = {
  title: "Join Waitlist",
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Peregrine Partners",
    title: "Bring one month of invoices",
    description: DESCRIPTION,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Peregrine Partners" }],
  },
};

/**
 * The waitlist.
 *
 * A split rather than a centred form: the left half has to keep arguing while
 * the right half is being filled in, because this is the page where a reader
 * decides whether the three of us are worth twenty minutes. The aside on the
 * left carries the three facts that actually answer the hesitation — where we
 * are, how many we take at once, and what it costs.
 */
export default function Waitlist() {
  return (
    <>
      <Nav />

      <main className="relative z-10 bg-[color:var(--page)]">
        <section className="w-full bg-[color:var(--page)] p-[12px]">
          <div className="grid grid-cols-1 gap-[12px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            {/* the argument */}
            <div
              className="relative flex flex-col justify-between overflow-hidden px-[24px] pb-[48px] pt-[150px] md:px-[48px] md:pb-[56px] md:pt-[200px]"
              style={{ background: "var(--dark)", borderRadius: 20 }}
            >
              <span
                className="pointer-events-none absolute -bottom-[60px] -right-[70px] text-white/[0.05]"
                aria-hidden
              >
                <Falcon size={320} />
              </span>

              <div className="relative">
                <SectionLabel label={waitlist.eyebrow} tone="dark" ruleWidth={220} />
                <h1 className="t-hero mt-[46px] max-w-[520px] text-white">{waitlist.heading}</h1>
                <p className="t-body mt-[26px] max-w-[500px] text-white/80">{waitlist.sub}</p>
              </div>

              <dl className="relative mt-[60px] flex flex-col">
                {waitlist.aside.map((a, i) => (
                  <div
                    key={a.k}
                    className="flex items-baseline justify-between gap-[20px] py-[16px]"
                    style={{ borderTop: i === 0 ? "none" : "1px solid var(--paper-10)" }}
                  >
                    <dt
                      className="font-mono uppercase"
                      style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--paper-40)" }}
                    >
                      {a.k}
                    </dt>
                    <dd className="text-right text-white" style={{ fontSize: 15, lineHeight: "22px" }}>
                      {a.v}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* the form */}
            <div
              className="section-card flex items-center px-[24px] py-[70px] md:px-[48px] md:py-[110px] lg:pt-[200px]"
            >
              <Reveal className="w-full">
                <WaitlistForm />
              </Reveal>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
