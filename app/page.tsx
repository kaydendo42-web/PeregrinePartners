import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { Statement } from "@/components/statement";
import { Ticker } from "@/components/ticker";
import { Works } from "@/components/works";
import { Capabilities } from "@/components/capabilities";
import { Vision } from "@/components/vision";
import { NeuralGrid } from "@/components/neural-grid";
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

        <div className="bg-[color:var(--page)] py-[18px]">
          <Ticker />
        </div>

        <Faq />
      </main>

      <Footer />
    </>
  );
}
