import type { ReactNode } from "react";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Falcon } from "@/components/ui/mark";
import { SectionLabel } from "@/components/ui/section-label";

/**
 * The dark card every sign-in screen sits in: the password step, the
 * authenticator step, and the loading state between them. One frame, so the
 * hand-off from one to the next reads as a single door, not three pages.
 */
export function AuthFrame({
  label,
  wide = false,
  children,
}: {
  label: string;
  /** The authenticator setup needs room for the QR code beside the steps. */
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <Nav />

      <main className="relative z-10 bg-[color:var(--page)]">
        <section className="w-full bg-[color:var(--page)] p-[12px]">
          <div
            className="relative flex min-h-[calc(100svh-24px)] items-center justify-center overflow-hidden px-[24px] py-[140px] md:px-[56px]"
            style={{ background: "var(--dark)", borderRadius: 20 }}
          >
            <span
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/[0.035]"
              aria-hidden
            >
              <Falcon size={520} />
            </span>

            <div className={`relative w-full ${wide ? "max-w-[920px]" : "max-w-[520px]"}`}>
              <SectionLabel label={label} tone="dark" ruleWidth={200} />
              {children}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
