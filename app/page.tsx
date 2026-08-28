import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { Statement } from "@/components/statement";
import { Ticker } from "@/components/ticker";
import { Roster } from "@/components/roster";
import { Departments } from "@/components/departments";
import { Vision } from "@/components/vision";
import { Stack } from "@/components/stack";
import { Team } from "@/components/team";
import { Faq } from "@/components/faq";
import { Footer } from "@/components/footer";

/**
 * The home page sells the result: what it is like to run a business with the
 * nine departments on. The argument for why it should exist at all lives on
 * `/about`, and the page hands over to it twice — once at the vision block and
 * once under the team.
 *
 * Section order is the reference's, minus the cut sections. What changed is
 * what each slot carries; see the header comment on each component.
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
          <div className="section-card py-[6px]">
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

        <div
          className="relative z-10 bg-[color:var(--page)] py-[7px]"
          style={{ borderRadius: "0 0 20px 20px" }}
        >
          <Ticker />
        </div>

        {/* the second dark run: the three of us */}
        <section
          className="w-full bg-[color:var(--dark)]"
          style={{ borderRadius: "0 0 20px 20px", overflow: "clip" }}
        >
          <div className="flex flex-col items-start px-[24px] py-[140px] md:px-[40px] xl:pb-[200px] xl:pt-[200px]">
            <Team />
          </div>
        </section>

        <div className="bg-[color:var(--page)] py-[18px]">
          <Ticker />
        </div>

        <Faq />
      </main>

      <Footer />
    </>
  );
}
