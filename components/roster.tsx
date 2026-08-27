"use client";

import { motion } from "motion/react";
import { Marquee, Reveal } from "./ui/motion-primitives";
import { Starburst } from "./ui/starburst";
import { ClientMark } from "./ui/client-mark";
import { roster } from "@/lib/content";

/**
 * The floors the branches are shaped around.
 *
 * The template used this slot for five invented case studies carrying invented
 * figures. It holds four real Melbourne businesses instead, shown as the kinds
 * of floor the product is built for rather than as a customer ledger. The
 * spread of trades is the argument: a brunch room, a cafe, a school counting
 * terms and a spa seating one guest per room all run the same nine branches.
 *
 * The card treatment is finally the reference's own: rest on the business's
 * mark, and reveal the detail on hover. It never worked before because there
 * were no real marks to rest on. The marks run in their own colours — they
 * belong to other businesses, and restyling someone's logo to suit our page is
 * not ours to do.
 */
export function Roster() {
  return (
    <section id="roster" className="relative w-full bg-[color:var(--dark)]">
      <div
        className="w-full bg-[color:var(--page)] pb-[196px]"
        style={{ borderRadius: "0 0 20px 20px" }}
      >
        {/* display marquee */}
        <div className="pt-[174px]">
          <Marquee duration={30}>
            <div className="flex shrink-0 items-center gap-[60px] pr-[60px]">
              <h2 className="t-marquee whitespace-nowrap" style={{ letterSpacing: "-0.04em" }}>
                {roster.marquee}
              </h2>
              <Starburst />
            </div>
          </Marquee>
        </div>

        {/* the four */}
        <div className="mx-auto mt-[46px] grid w-full max-w-[1440px] grid-cols-1 gap-x-[52px] gap-y-[33px] px-[24px] md:grid-cols-2 md:px-[56px] xl:grid-cols-4">
          {roster.clients.map((c, i) => (
            <Reveal key={c.name} delay={(i % 4) * 0.06}>
              <ClientCard {...c} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClientCard({
  name,
  logo,
  href,
  trade,
  where,
  note,
}: {
  name: string;
  logo: string | null;
  href: string;
  trade: string;
  where: string;
  note: string;
}) {
  /* Four facts that hold for every floor. Branch counts and start dates would
     say more, and they would also turn this row into a customer ledger, which
     is not what it is. */
  const stats = [
    { v: where, l: "Where" },
    { v: "Native", l: "Bookings" },
    { v: "0", l: "Logins added" },
    { v: "Every action", l: "Waits for you" },
  ];

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="group flex w-full flex-col overflow-hidden"
      style={{ background: "var(--ink-03)", borderRadius: 20, padding: 1, gap: 1 }}
      whileHover="hover"
      whileFocus="hover"
      aria-label={`${name}, ${trade}, ${where}`}
    >
      {/* mark, resting on white */}
      <div
        className="relative flex h-[302px] w-full items-start overflow-hidden p-[10px]"
        style={{ background: "#fff", borderRadius: "19px 19px 10px 10px" }}
      >
        <span
          className="relative z-20 flex items-center bg-white"
          style={{
            borderRadius: 100,
            padding: "8px 16px 7px",
            boxShadow: "inset 0 0 0 1px var(--ink-10)",
          }}
        >
          <span
            className="font-mono uppercase"
            style={{ fontSize: 10, lineHeight: "16px", letterSpacing: "0.06em" }}
          >
            {trade}
          </span>
        </span>

        <div className="absolute inset-0 z-10 flex items-center justify-center p-[28px]">
          {logo ? (
            <motion.img
              src={logo}
              alt={name}
              className="max-h-[110px] w-full max-w-[210px] object-contain"
              variants={{ hover: { scale: 1.03 } }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          ) : (
            /* No artwork yet — a neutral mark, never a stand-in logo. */
            <ClientMark name={name} tone="dark" scale={0.78} />
          )}
        </div>

        {/* what they are, sliding up from the floor of the card on hover */}
        <motion.div
          className="absolute inset-x-[10px] bottom-[10px] z-20 flex flex-col gap-[8px] p-[18px]"
          style={{ background: "var(--ink)", borderRadius: 12 }}
          variants={{ hover: { y: 0, opacity: 1 } }}
          initial={{ y: 16, opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <p
            className="text-white"
            style={{ fontSize: 15, lineHeight: "21px", fontWeight: 500, letterSpacing: "-0.2px" }}
          >
            {name}
          </p>
          <p
            className="text-white/70"
            style={{ fontSize: 13, lineHeight: "19px", fontWeight: 300 }}
          >
            {note}
          </p>
        </motion.div>
      </div>

      {/* the facts */}
      <div className="grid grid-cols-2" style={{ gap: 1 }}>
        {stats.map((s) => (
          <div
            key={s.l}
            className="flex flex-col justify-center"
            style={{
              background: "#fff",
              borderRadius: 10,
              padding: "14px 11px 15px 15px",
              gap: 4,
              minHeight: 72,
            }}
          >
            <p
              className="font-mono"
              style={{ fontSize: 14, lineHeight: "20px", fontWeight: 500, color: "var(--ink-70)" }}
            >
              {s.v}
            </p>
            <p
              style={{
                fontSize: 12,
                lineHeight: "16.8px",
                fontWeight: 300,
                letterSpacing: "0.01em",
                color: "var(--ink-40)",
              }}
            >
              {s.l}
            </p>
          </div>
        ))}
      </div>
    </motion.a>
  );
}
