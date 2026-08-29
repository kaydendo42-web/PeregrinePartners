import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { Ticker } from "@/components/ticker";
import { Footer } from "@/components/footer";
import { AgentFloor } from "@/components/platform/agent-floor";
import { Departments } from "@/components/departments";
import "../platform.css";

/**
 * The Floor.
 *
 * Back on the original agent floor: the isometric SVG where every island is a
 * department you can click into, and the hub in the middle is the venue you
 * can step inside. The react-three-fiber build is still in
 * `components/platform/floor/` but is no longer wired to this page.
 *
 * The demo is on screen at load: no heading above it, no intro, no stat tiles,
 * no marquee. Everything the page used to say first now sits underneath, where
 * a reader arrives at it having already played with the thing it describes.
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
        <section id="floor" className="w-full bg-[color:var(--page)] px-[12px] pt-[12px]">
          {/*
            The demo opens tight at the top on purpose: it has to be on screen
            at load. The bottom is a different problem. At 40px the scene ended
            almost on the card edge and the next band opened on 190, so the
            seam stepped 40 / 12 / 190 and read as crammed above and loose
            below. Half the block gap under the demo closes that step without
            pushing the demo itself down the screen.
          */}
          <div className="band section-card pt-[40px] pb-[calc(var(--block-gap)/2)]">
            <AgentFloor />
          </div>
        </section>

        {/* What the demo was showing, named. This replaced two sections that
            explained the Floor in prose and then asked for a booking: the rack
            does the first job better and the nav carries the second. */}
        <Departments />

        <div className="bg-[color:var(--page)] py-[7px]">
          <Ticker />
        </div>

      </main>

      <Footer />
    </>
  );
}
