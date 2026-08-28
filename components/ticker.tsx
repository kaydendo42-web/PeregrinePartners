"use client";

import { Marquee } from "./ui/motion-primitives";
import { brand, ticker } from "@/lib/content";

/** Thin announcement band that rides between sections. */
export function Ticker() {
  return (
    <div className="w-full py-[22px]">
      <Marquee duration={46}>
        <div className="flex shrink-0 items-center gap-[172px] pr-[172px]" style={{ color: "var(--ink)" }}>
          <span className="t-label whitespace-nowrap">{brand.tickerTag}</span>
          <span className="t-label whitespace-nowrap">{ticker}</span>
        </div>
      </Marquee>
    </div>
  );
}
