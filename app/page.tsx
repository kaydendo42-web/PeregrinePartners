import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { Statement } from "@/components/statement";
import { Ticker } from "@/components/ticker";
import { Works } from "@/components/works";
import { Capabilities } from "@/components/capabilities";
import { Vision } from "@/components/vision";
import { NeuralGrid } from "@/components/neural-grid";
import { VideoBlock } from "@/components/video-block";
import { Process } from "@/components/process";
import { Team } from "@/components/team";
import { Faq } from "@/components/faq";
import { Footer } from "@/components/footer";

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

        <Works />

        {/* the dark run: capabilities → vision → neural grid */}
        <div
          className="bg-[color:var(--dark)]"
          style={{ borderRadius: "0 0 20px 20px", overflow: "clip" }}
        >
          <Capabilities />
          <Vision />
          <NeuralGrid />
        </div>

        {/* white band over the film frame, rounded into it */}
        <div
          className="relative z-10 bg-[color:var(--page)] py-[7px]"
          style={{ borderRadius: "0 0 20px 20px" }}
        >
          <Ticker />
        </div>

        <VideoBlock />

        {/* the second dark run: process → team */}
        <section
          className="w-full bg-[color:var(--dark)]"
          style={{ borderRadius: "0 0 20px 20px", overflow: "clip" }}
        >
          <div className="flex flex-col items-start gap-[160px] px-[24px] py-[140px] md:px-[40px] xl:pt-[250px] xl:pb-[200px]">
            <Process />
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
