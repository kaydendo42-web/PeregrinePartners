"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Reveal } from "@/components/ui/motion-primitives";
import {
  ALL_TASKS,
  COVERS_TONIGHT,
  CLOSE,
  DEPTS,
  ENQUIRIES,
  OPEN,
  SEATINGS,
  SEATS_IN_ROOM,
  TURN,
  clock,
} from "./scene/data";
import type { Dept, Task, TaskState } from "./scene/data";
import { HUB, KY, VIEW, px, walkway, zoomTransform } from "./scene/geometry";
import { Hub } from "./scene/props";
import { Island } from "./scene/island";
import { VenueScene } from "./scene/venue";

/**
 * The floor: a modelled morning at a 40-cover Melbourne bistro, drawn as the
 * office Peregrine kept overnight. Six departments as isometric islands, the
 * restaurant itself at the centre with the brain working above its roof, and
 * two things waiting for the owner, both genuinely tappable.
 *
 * The scene is the desktop surface. Below 810px the floor gives way to the
 * department cards as a straight list, which is not a fallback: it is the
 * morning brief, the same product at phone scale, and the two share their
 * three states and their wording exactly.
 *
 * Colour discipline is the palette's own law. Islands stay neutral and are
 * told apart by their labels, not their hue. The warm cere pair appears on
 * the two waiting items and nowhere else. Watching wears the accent, done
 * wears sage, and Bookings sits on the blush tint because it is the one
 * island we built rather than connected to.
 */

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

function TaskRow({
  task,
  state,
  onApprove,
}: {
  task: Task;
  state: TaskState;
  onApprove: (id: string) => void;
}) {
  const done = state === "done" && task.state === "needs";
  const text = done ? task.doneText ?? task.text : task.text;
  const time = done ? task.doneTime ?? task.time : task.time;
  return (
    <li className="floor__task" data-state={state} data-cleared={done || undefined}>
      <span className="floor__task-dot" aria-hidden />
      <div className="floor__task-main">
        <p className="floor__task-text">{text}</p>
        <p className="floor__task-meta">
          <span>{time}</span>
          <span aria-hidden> · </span>
          <span>{task.system}</span>
          {done ? (
            <>
              <span aria-hidden> · </span>
              <span>Approved by you</span>
            </>
          ) : null}
        </p>
        {state === "needs" && task.trail ? (
          <>
            <ol className="floor__trail">
              {task.trail.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
            <button type="button" className="floor__approve" onClick={() => onApprove(task.id)}>
              {task.approveLabel ?? "Approve"}
            </button>
          </>
        ) : null}
      </div>
    </li>
  );
}

/** The flagship systems a department works through, as letter-tile chips. */
function StackRow({ dept }: { dept: Dept }) {
  return (
    <div className="floor__stackrow">
      <span className="floor__stackrow-label">{dept.own ? "Runs on" : "Works with"}</span>
      <span className="floor__stackrow-chips">
        {dept.stack.map((s) => (
          <span key={s.label} className="floor__syschip" data-own={s.own || undefined}>
            <span className="floor__syschip-tile" aria-hidden>
              {s.label[0]}
            </span>
            {s.label}
          </span>
        ))}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The section                                                         */
/* ------------------------------------------------------------------ */

export function AgentFloor() {
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [view, setView] = useState<"floor" | "venue">("floor");
  // Reduced motion parks the service mid-shift rather than running it, so the
  // room still shows a seated table, a countdown and a free one at once. That
  // is a starting value, not a synchronisation, so it belongs in the
  // initialiser rather than in an effect.
  const [now, setNow] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
      ? 19 * 60 + 25
      : OPEN,
  );
  const [states, setStates] = useState<Record<string, TaskState>>(() =>
    Object.fromEntries(ALL_TASKS.map((t) => [t.id, t.state])),
  );
  const [announce, setAnnounce] = useState("");

  const panelRef = useRef<HTMLElement>(null);
  const hotRef = useRef(-1);
  const ambientRefs = useRef<(SVGCircleElement | null)[]>([]);
  const cloudRefs = useRef<(SVGCircleElement | null)[]>([]);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const burstsRef = useRef<{ path: number; t: number }[]>([]);
  const burstRefs = useRef<(SVGCircleElement | null)[]>([]);

  const needsCount = ALL_TASKS.filter((t) => states[t.id] === "needs").length;
  const watchCount = ALL_TASKS.filter((t) => states[t.id] === "watching").length;
  const doneCount = ALL_TASKS.filter((t) => states[t.id] === "done").length;

  const headline =
    needsCount === 2
      ? "Two things need you."
      : needsCount === 1
        ? "One thing needs you."
        : "Nothing needs you. Go open.";

  const waitingByDept = useMemo(
    () =>
      Object.fromEntries(
        DEPTS.map((d) => [d.id, d.tasks.filter((t) => states[t.id] === "needs").length]),
      ) as Record<string, number>,
    [states],
  );

  function select(id: string | null) {
    setView("floor");
    setSelected(id);
    hotRef.current = id ? DEPTS.findIndex((d) => d.id === id) : -1;
    if (id && typeof window !== "undefined" && window.innerWidth < 1200) {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function enterVenue() {
    setSelected(null);
    hotRef.current = -1;
    setView("venue");
    setNow(
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        ? 19 * 60 + 25
        : OPEN,
    );
    if (typeof window !== "undefined" && window.innerWidth < 1200) {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  /* Inside the venue the clock runs the service: a minute every 190ms, so a
     four-hour shift plays in about fifty seconds and a countdown visibly
     falls. Reduced motion parks it mid-service instead, where the room is
     half full and every state is on screen at once. */
  useEffect(() => {
    if (view !== "venue") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(
      () => setNow((m) => (m + 1 > CLOSE ? OPEN : m + 1)),
      190,
    );
    return () => window.clearInterval(t);
  }, [view]);

  function approve(id: string) {
    const task = ALL_TASKS.find((t) => t.id === id);
    if (!task) return;
    setStates((s) => ({ ...s, [id]: "done" }));
    setAnnounce(task.doneText ?? "Approved");
    const dept = DEPTS.findIndex((d) => d.tasks.some((t) => t.id === id));
    if (dept >= 0) {
      for (let i = 0; i < 5; i++) {
        burstsRef.current.push({ path: dept, t: 1 + i * 0.09 });
      }
    }
  }

  /* Ambient motion: walkway particles, the brain cloud, approval bursts.
     One rAF loop writing attributes directly, the orbit-tree pattern, so the
     scene never re-renders per frame. */
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lens = pathRefs.current.map((p) => (p ? p.getTotalLength() : 0));

    // Deterministic pseudo-random spread, seeded so hydration never differs.
    const rand = (i: number) => (Math.sin(i * 127.1) * 43758.5453) % 1;
    const ambient = ambientRefs.current.map((_, i) => ({
      path: i % DEPTS.length,
      t: Math.abs(rand(i + 1)),
      speed: 0.05 + Math.abs(rand(i + 7)) * 0.05,
      dir: i % 2 === 0 ? 1 : -1,
    }));

    // Place everything once, so a reduced-motion reader still sees the scene.
    ambient.forEach((p, i) => {
      const el = ambientRefs.current[i];
      const path = pathRefs.current[p.path];
      if (!el || !path || !lens[p.path]) return;
      const pt = path.getPointAtLength(p.t * lens[p.path]);
      el.setAttribute("cx", String(pt.x));
      el.setAttribute("cy", String(pt.y));
      el.setAttribute("opacity", "0.5");
    });
    const cloud = cloudRefs.current.map((_, i) => ({
      angle: Math.abs(rand(i + 3)) * Math.PI * 2,
      rx: 20 + Math.abs(rand(i + 11)) * 38,
      ry: 7 + Math.abs(rand(i + 17)) * 11,
      speed: 0.25 + Math.abs(rand(i + 23)) * 0.4,
      r: 1.9 + Math.abs(rand(i + 29)) * 2.1,
    }));
    const cc = px(0, 0);
    const cloudY = cc.y - HUB.lift - 46 - 62;
    cloud.forEach((d, i) => {
      const el = cloudRefs.current[i];
      if (!el) return;
      el.setAttribute("cx", String(cc.x + Math.cos(d.angle) * d.rx));
      el.setAttribute("cy", String(cloudY + Math.sin(d.angle) * d.ry));
      el.setAttribute("r", String(d.r));
      el.setAttribute("opacity", "0.8");
    });

    if (reduced) return;

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.06, (now - last) / 1000);
      last = now;

      ambient.forEach((p, i) => {
        const el = ambientRefs.current[i];
        const path = pathRefs.current[p.path];
        if (!el || !path || !lens[p.path]) return;
        p.t += p.speed * (p.path === hotRef.current ? 3 : 1) * p.dir * dt;
        if (p.t > 1) p.t -= 1;
        if (p.t < 0) p.t += 1;
        const pt = path.getPointAtLength(p.t * lens[p.path]);
        el.setAttribute("cx", String(pt.x));
        el.setAttribute("cy", String(pt.y));
      });

      const bob = Math.sin(now / 1400) * 3;
      cloud.forEach((d, i) => {
        const el = cloudRefs.current[i];
        if (!el) return;
        d.angle += d.speed * dt;
        el.setAttribute("cx", String(cc.x + Math.cos(d.angle) * d.rx));
        el.setAttribute("cy", String(cloudY + Math.sin(d.angle) * d.ry + bob));
        el.setAttribute(
          "opacity",
          String(0.45 + 0.45 * (0.5 + 0.5 * Math.sin(d.angle * 2 + i))),
        );
      });

      // Bursts run island to hub, then retire.
      const bursts = burstsRef.current;
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        b.t -= dt * 0.9;
        const el = burstRefs.current[i % burstRefs.current.length];
        const path = pathRefs.current[b.path];
        if (b.t <= 0 || !el || !path || !lens[b.path]) {
          if (el) el.setAttribute("opacity", "0");
          if (b.t <= 0) bursts.splice(i, 1);
          continue;
        }
        const t = Math.min(1, b.t);
        const pt = path.getPointAtLength(t * lens[b.path]);
        el.setAttribute("cx", String(pt.x));
        el.setAttribute("cy", String(pt.y));
        el.setAttribute("opacity", "0.9");
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const seatedCovers = SEATINGS.filter((x) => now >= x.at && now < x.at + TURN).reduce(
    (n, x) => n + x.covers,
    0,
  );
  const answered = ENQUIRIES.filter((e) => e.at <= now).length;

  const dept = DEPTS.find((d) => d.id === selected) ?? null;
  const camera = dept ? zoomTransform(dept) : undefined;

  return (
    <section className="floor">

      <div className="floor__caption">
        <Reveal delay={0.08} className="floor__legendwrap">
          <p className="floor__live" aria-hidden>
            <span className="floor__live-dot" />
            Live demo, click anything
          </p>
          <div className="floor__legend" aria-hidden>
            <span data-k="needs">Needs you</span>
            <span data-k="watching">Watching</span>
            <span data-k="done">Done</span>
          </div>
        </Reveal>
      </div>

      <div className="floor__stage">
        <div className="floor__scene" data-zoomed={selected ? "" : undefined} data-view={view}>
          {/* The scene is one image to a screen reader, so the departments get real
              buttons of their own. Focusing one lights the same name plate a pointer
              hover does, so the two paths show the same thing. */}
          <ul className="floor__reach">
            {DEPTS.map((d) => {
              const waiting = waitingByDept[d.id];
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    data-dept={d.id}
                    onClick={() => select(selected === d.id ? null : d.id)}
                    onFocus={() => setHover(d.id)}
                    onBlur={() => setHover((h) => (h === d.id ? null : h))}
                    aria-expanded={selected === d.id}
                  >
                    {`Open ${d.name}. ${d.desks.length} desks. ${
                      waiting ? `${waiting} waiting for you.` : "Nothing waiting."
                    }`}
                  </button>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                data-dept="venue"
                onClick={() => (view === "venue" ? select(null) : enterVenue())}
                aria-expanded={view === "venue"}
              >
                Step inside the venue.
              </button>
            </li>
          </ul>
          <svg
            viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
            role="img"
            aria-label={
              view === "venue"
                ? "Inside the restaurant: the dining room with the coming days' bookings laid over it"
                : "An isometric floor plan of the venue's six departments, connected to the restaurant and Peregrine at the centre"
            }
          >
            {view === "venue" ? (
              <VenueScene now={now} />
            ) : (
            <g key="office" className="floor__office" transform={camera}>
            {/* walkways first, so everything sits on top of them */}
            {DEPTS.map((d, i) => (
              <path
                key={d.id}
                ref={(el) => {
                  pathRefs.current[i] = el;
                }}
                className="floor__walk"
                d={walkway(d)}
              />
            ))}

            {/* ambient particles: three per walkway */}
            {Array.from({ length: DEPTS.length * 3 }, (_, i) => (
              <circle
                key={i}
                ref={(el) => {
                  ambientRefs.current[i] = el;
                }}
                className="floor__mote"
                r={2.1}
                opacity={0}
              />
            ))}

            {/* islands, back to front so overlap stacks correctly */}
            {[...DEPTS]
              .sort((a, b) => a.u + a.v - (b.u + b.v))
              .map((d) => (
                <g key={d.id} onClick={() => select(d.id)}>
                  <Island
                    dept={d}
                    waiting={waitingByDept[d.id]}
                    selected={selected === d.id}
                    hovered={hover === d.id}
                    onEnter={() => setHover(d.id)}
                    onLeave={() => setHover((h) => (h === d.id ? null : h))}
                  />
                </g>
              ))}

            <g onClick={enterVenue} className="floor__hubhit">
              <Hub />
              <text className="floor__hub-hint" data-audit-ignore x={0} y={2 * HUB.size * KY + 30}>
                STEP INSIDE
              </text>
            </g>

            {/* the brain at work */}
            {Array.from({ length: 22 }, (_, i) => (
              <circle
                key={i}
                ref={(el) => {
                  cloudRefs.current[i] = el;
                }}
                className="floor__brain"
                r={2}
                opacity={0}
              />
            ))}

            {/* burst pool for approvals */}
            {Array.from({ length: 6 }, (_, i) => (
              <circle
                key={i}
                ref={(el) => {
                  burstRefs.current[i] = el;
                }}
                className="floor__burst"
                r={2.7}
                opacity={0}
              />
            ))}
            </g>
            )}
          </svg>

          {view === "venue" ? (
            <>
              <div className="floor__clock">
                <span className="floor__clock-time">{clock(now)}</span>
                <span className="floor__clock-meta">
                  Friday · Dinner service
                  <em>{now < 18 * 60 ? "Doors" : now > 21 * 60 ? "Last turn" : "On"}</em>
                </span>
              </div>
              <div className="floor__status">
                <span>
                  <b>{seatedCovers}</b> of {SEATS_IN_ROOM} seats filled
                </span>
                <span className="floor__status-sep" aria-hidden />
                <span>
                  <b>{answered}</b> answered while you worked
                </span>
                {states.b1 === "done" ? (
                  <span className="floor__status-fn">Saturday lunch · function of 18 on the book</span>
                ) : null}
                <button type="button" className="floor__exit" onClick={() => select(null)}>
                  Exit to dashboard
                </button>
              </div>
            </>
          ) : null}

          {/* The cards double as the accessible controls for the scene. */}
          <div className="floor__cards">
            <button
              type="button"
              className="floor__card floor__card--venue"
              data-dept="venue"
              data-selected={view === "venue" || undefined}
              onClick={() => (view === "venue" ? select(null) : enterVenue())}
              aria-expanded={view === "venue"}
            >
              <span className="floor__card-name">
                The venue<em> step inside</em>
              </span>
              <span className="floor__card-count">One service, running</span>
              <span className="floor__card-metric">
                <span>Booked tonight</span>
                <span>{COVERS_TONIGHT} covers</span>
              </span>
              <span className="floor__card-metric">
                <span>Answered on the phone</span>
                <span>{ENQUIRIES.length}</span>
              </span>
            </button>
            {DEPTS.map((d) => {
              const waiting = waitingByDept[d.id];
              return (
                <button
                  key={d.id}
                  type="button"
                  className="floor__card"
                  data-dept={d.id}
                  data-selected={selected === d.id || undefined}
                  onClick={() => select(selected === d.id ? null : d.id)}
                  aria-expanded={selected === d.id}
                >
                  <span className="floor__card-name">
                    {d.name}
                    {d.own ? <em> ours</em> : null}
                  </span>
                  <span className="floor__card-count">
                    {d.desks.length} desks
                    {waiting > 0 ? (
                      <span className="floor__chip">{waiting} waiting approval</span>
                    ) : null}
                  </span>
                  {d.metrics.map(([k, v]) => (
                    <span key={k} className="floor__card-metric">
                      <span>{k}</span>
                      <span>{v}</span>
                    </span>
                  ))}
                </button>
              );
            })}
          </div>
        </div>

        <aside ref={panelRef} className="floor__panel">
          <p className="floor__panel-time">06:04 · The morning brief</p>
          <p className="floor__panel-headline" data-clear={needsCount === 0 || undefined}>
            {headline}
          </p>
          <p className="floor__panel-tally">
            Watched {watchCount} · Handled {doneCount}
            {needsCount > 0 ? " · Everything else is watched or handled" : ""}
          </p>

          {view === "venue" ? (
            <>
              <div className="floor__panel-head">
                <p className="floor__panel-dept">The phone, tonight</p>
                <button type="button" className="floor__panel-back" onClick={() => select(null)}>
                  Back to the office
                </button>
              </div>
              <p className="floor__venue-sub">
                Answered while the room was full. Nothing rang out.
              </p>
              <ul className="floor__enquiries">
                {ENQUIRIES.filter((e) => e.at <= now)
                  .slice()
                  .reverse()
                  .map((e) => {
                    const resolved = e.linkTask ? states[e.linkTask] === "done" : false;
                    const tag = resolved ? e.approvedTag ?? e.tag : e.tag;
                    const reply = resolved ? e.approvedReply ?? e.reply : e.reply;
                    return (
                      <li key={e.at} className="floor__enq">
                        <p className="floor__enq-meta">
                          <span className="floor__enq-ch">{e.channel === "call" ? "Call" : "Email"}</span>
                          <span>{clock(e.at)}</span>
                          <span className="floor__enq-tag" data-tag={tag}>
                            {tag}
                          </span>
                        </p>
                        <p className="floor__enq-text">{e.text}</p>
                        <p className="floor__enq-reply">
                          <span>Peregrine replied</span>
                          {reply}
                        </p>
                      </li>
                    );
                  })}
                {answered === 0 ? (
                  <li className="floor__enq-empty">Quiet so far. The line is open.</li>
                ) : null}
              </ul>
            </>
          ) : dept ? (
            <>
              <div className="floor__panel-head">
                <p className="floor__panel-dept">{dept.name}</p>
                <button type="button" className="floor__panel-back" onClick={() => select(null)}>
                  All departments
                </button>
              </div>
              <StackRow dept={dept} />
              <ul className="floor__tasks">
                {[...dept.tasks]
                  .sort(
                    (a, b) =>
                      ["needs", "watching", "done"].indexOf(states[a.id]) -
                      ["needs", "watching", "done"].indexOf(states[b.id]),
                  )
                  .map((t) => (
                    <TaskRow key={t.id} task={t} state={states[t.id]} onApprove={approve} />
                  ))}
              </ul>
            </>
          ) : (
            <ul className="floor__tasks">
              {ALL_TASKS.filter((t) => states[t.id] === "needs").map((t) => (
                <TaskRow key={t.id} task={t} state="needs" onApprove={approve} />
              ))}
              {needsCount === 0 ? (
                <li className="floor__task-empty">
                  Both cleared. The order is with Ordermentum and the quote is
                  in their inbox, and both are on the log with what they cost.
                </li>
              ) : null}
            </ul>
          )}

          <p className="floor__panel-note">
            {view === "venue"
              ? "The service runs itself. Approve the Saturday function in the brief and watch it land on the book."
              : "Open a department above for the full night, desk by desk."}
          </p>
          <span className="sr-only" role="status" aria-live="polite">
            {announce}
          </span>
        </aside>
      </div>
    </section>
  );
}
