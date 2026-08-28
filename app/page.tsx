import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { Statement } from "@/components/statement";
import { Ticker } from "@/components/ticker";
import { Roster } from "@/components/roster";
import { Departments } from "@/components/departments";
import { Vision } from "@/components/vision";
import { Stack } from "@/components/stack";
import { Faq } from "@/components/faq";
import { Footer } from "@/components/footer";

/**
 * The home page sells the result: what it is like to run a business with the
 * back office on. The argument for why it should exist at all lives on
 * `/about`, and the reader gets there through the nav. Both in-page handoffs
 * are gone: the team block came off this page, and the vision copy lost its
 * closing sentence to the word budget. If that handover matters, it needs a
 * deliberate home rather than a sentence smuggled into a section body.
 *
 * Section order is the reference's, minus the cut sections. What changed is
 * what each slot carries; see the header comment on each component.
 *
 * Every section sits on `band` and `measure` from `globals.css`, so the whole
 * page has one left edge and one content width. Do not reintroduce a literal
 * padding or max-width here.
 */
export default function Home() {
  return (
    <>
      <Nav />

      <main className="relative z-10 bg-[color:var(--page)]">
        <Hero />
        <Statement />

        {/* announcement band, still on the light card */}
        <div className="bg-[color:var(--page)] px-[12px]">
          <div className="section-card py-[7px]">
            <Ticker />
          </div>
        </div>

        <Roster />

        {/* the dark run: the nine departments → why → the stack it runs on */}
        <div
          className="bg-[color:var(--dark)]"
          style={{ borderRadius: "0 0 20px 20px", overflow: "clip" }}
        >
          <Departments />
          <Vision />
          <Stack />
        </div>

        <div className="relative z-10 bg-[color:var(--page)] py-[7px]">
          <Ticker />
        </div>

        <Faq />
      </main>

      <Footer />
    </>
  );
}
