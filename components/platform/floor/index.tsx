"use client";

/**
 * The Floor.
 *
 * Two halves that never overlap, which is §8's layout brief: the diorama on the
 * left with generous margins around it, and a narrow docked column on the right
 * that answers whatever is selected in it. Nothing floats over the scene, and
 * empty space is allowed to do work.
 *
 * The reader can be in one of three places, and the column follows:
 *
 * - Nothing selected: the morning brief, which is what an owner opens at 6am.
 * - A department selected: what that department ran, what it ran it through,
 *   and where it stopped and asked.
 * - Inside the venue: the service itself, hour by hour, with the phone in the
 *   margin.
 *
 * Approving a decision here changes the world: the island drains from coral
 * back into the architecture, and the enquiry it came from resolves. That is
 * the product's whole claim, made once, spatially, without a caption.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { FloorScene, deptState, type Control } from "./scene";
import { Curtain } from "./curtain";
import {
  ALL_TASKS,
  BRIEF,
  CLOSE,
  COVERS_TONIGHT,
  DEPTS,
  ENQUIRIES,
  ENTER_AT,
  OPEN,
  SEATS_IN_ROOM,
  type Dept,
  type Task,
  clock,
} from "./data";
import { useMedia } from "./use-media";
import "./floor.css";

/* ------------------------------------------------------------------ */
/* Chrome                                                              */
/* ------------------------------------------------------------------ */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="mv-display mv-11 mv-dim">{children}</p>;
}

function TaskRow({
  task,
  approved,
  onApprove,
}: {
  task: Task;
  approved: boolean;
  onApprove: (id: string) => void;
}) {
  const state = approved && task.state === "needs" ? "done" : task.state;
  const text = approved && task.doneText ? task.doneText : task.text;
  const time = approved && task.doneTime ? task.doneTime : task.time;

  return (
    <li style={{ display: "flex", gap: 16, paddingBlock: 12 }}>
      <span className={`mv-mark mv-mark-${state}`} aria-hidden />
      <div style={{ minWidth: 0 }}>
        <p className="mv-13">{text}</p>
        <p className="mv-11 mv-faint" style={{ marginTop: 4 }}>
          {time} · {task.system}
        </p>

        {task.trail && !approved ? (
          <div className="mv-trail" style={{ marginTop: 12 }}>
            {task.trail.map((line) => (
              <p key={line} className="mv-11 mv-dim" style={{ marginBottom: 4 }}>
                {line}
              </p>
            ))}
          </div>
        ) : null}

        {task.approveLabel && !approved ? (
          <button
            type="button"
            className="mv-btn mv-btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => onApprove(task.id)}
          >
            {task.approveLabel}
          </button>
        ) : null}
      </div>
    </li>
  );
}

/** The 6am brief. What ran, and the short list that did not finish without you. */
function Brief({
  approved,
  onApprove,
  onPick,
  onEnter,
}: {
  approved: Set<string>;
  onApprove: (id: string) => void;
  onPick: (id: string) => void;
  onEnter: () => void;
}) {
  const waiting = ALL_TASKS.filter((t) => t.state === "needs" && !approved.has(t.id));
  const watching = ALL_TASKS.filter((t) => t.state === "watching").length;
  const handled =
    ALL_TASKS.filter((t) => t.state === "done").length + approved.size;

  return (
    <div className="mv-enter">
      <Eyebrow>06:04 · the morning brief</Eyebrow>
      <h2 className="mv-display mv-22" style={{ marginTop: 16 }}>
        {waiting.length === 0
          ? "Nothing is waiting"
          : waiting.length === 1
            ? "One thing needs you"
            : `${waiting.length === 2 ? "Two" : waiting.length} things need you`}
      </h2>
      <p className="mv-13 mv-dim" style={{ marginTop: 8 }}>
        {handled} handled, {watching} watched, and the rest is on the log.
      </p>

      <hr className="mv-rule" style={{ marginBlock: 24 }} />

      {waiting.length ? (
        <ul style={{ display: "grid" }}>
          {waiting.map((t) => (
            <TaskRow key={t.id} task={t} approved={false} onApprove={onApprove} />
          ))}
        </ul>
      ) : (
        <p className="mv-13 mv-dim">
          Every decision you were left is away. The floor keeps running.
        </p>
      )}

      <hr className="mv-rule" style={{ marginBlock: 24 }} />

      <Eyebrow>the floor</Eyebrow>
      <ul style={{ marginTop: 12, display: "grid", gap: 2 }}>
        {DEPTS.map((d) => (
          <li key={d.id}>
            <button
              type="button"
              onClick={() => onPick(d.id)}
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                padding: "8px 0",
                background: "none",
                border: 0,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span className="mv-13">{d.name}</span>
              <span className={`mv-mark mv-mark-${deptState(d)}`} style={{ marginTop: 0 }} />
            </button>
          </li>
        ))}
      </ul>

      <hr className="mv-rule" style={{ marginBlock: 24 }} />

      {/*
        The way into the room also lives in the scene, as the stair and the teal
        marker at the venue's near corner. It is here as well because a 0.44
        unit tile is a thing you find, not a thing you are offered, and the room
        is where half the argument is.
      */}
      <button type="button" className="mv-btn" onClick={onEnter}>
        Step inside the room
      </button>
    </div>
  );
}

/** One department: its systems, its numbers, and everything it did overnight. */
function DeptPanel({
  dept,
  approved,
  onApprove,
  onBack,
}: {
  dept: Dept;
  approved: Set<string>;
  onApprove: (id: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="mv-enter" key={dept.id}>
      <button type="button" className="mv-btn" onClick={onBack}>
        Back to the brief
      </button>

      <h2 className="mv-display mv-22" style={{ marginTop: 24 }}>
        {dept.name}
      </h2>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
        {dept.stack.map((s) => (
          <span
            key={s.label}
            className="mv-11"
            style={{
              padding: "6px 10px",
              background:
                "color-mix(in srgb, var(--mv-ink) 6%, transparent)",
              borderRadius: "var(--mv-radius)",
            }}
          >
            {s.label}
            {s.own ? " ·" : ""}
          </span>
        ))}
      </div>

      <hr className="mv-rule" style={{ marginBlock: 24 }} />

      <dl style={{ display: "grid", gap: 12 }}>
        {dept.metrics.map(([label, value]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <dt className="mv-13 mv-dim">{label}</dt>
            <dd className="mv-13">{value}</dd>
          </div>
        ))}
      </dl>

      <hr className="mv-rule" style={{ marginBlock: 24 }} />

      <Eyebrow>overnight</Eyebrow>
      <ul style={{ marginTop: 4 }}>
        {dept.tasks.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            approved={approved.has(t.id)}
            onApprove={onApprove}
          />
        ))}
      </ul>
    </div>
  );
}

/** Inside the room: one service, running, with the phone in the margin. */
function ServicePanel({
  now,
  approved,
  onBack,
}: {
  now: number;
  approved: Set<string>;
  onBack: () => void;
}) {
  const seen = ENQUIRIES.filter((e) => e.at <= now);
  return (
    <div className="mv-enter">
      <button type="button" className="mv-btn" onClick={onBack}>
        Step back out
      </button>

      <p className="mv-display mv-11 mv-dim" style={{ marginTop: 24 }}>
        friday service
      </p>
      <h2 className="mv-display mv-40" style={{ marginTop: 8 }}>
        {clock(now)}
      </h2>

      <hr className="mv-rule" style={{ marginBlock: 24 }} />

      <dl style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <dt className="mv-13 mv-dim">Covers booked</dt>
          <dd className="mv-13">
            {COVERS_TONIGHT} across {SEATS_IN_ROOM} seats
          </dd>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <dt className="mv-13 mv-dim">Answered so far</dt>
          <dd className="mv-13">{seen.length}</dd>
        </div>
      </dl>

      <hr className="mv-rule" style={{ marginBlock: 24 }} />

      <Eyebrow>the phone</Eyebrow>
      <ul style={{ marginTop: 8 }}>
        {seen
          .slice()
          .reverse()
          .map((e) => {
            const resolved = e.linkTask ? approved.has(e.linkTask) : false;
            return (
              <li key={e.at} style={{ paddingBlock: 12 }}>
                <p className="mv-11 mv-faint">
                  {clock(e.at)} · {e.channel}
                </p>
                <p className="mv-13" style={{ marginTop: 4 }}>
                  {e.text}
                </p>
                <p className="mv-11 mv-dim" style={{ marginTop: 4 }}>
                  {resolved && e.approvedReply ? e.approvedReply : e.reply}
                </p>
              </li>
            );
          })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The floor                                                           */
/* ------------------------------------------------------------------ */

export function Floor() {
  /**
   * Whether this viewport gets the scene or the plate.
   *
   * `null` on the server and for the first paint, and nothing is rendered in
   * the stage until it resolves, which is what stops a desktop from fetching a
   * 1350px still it will never show and a phone from booting a WebGL context it
   * cannot use well. The curtain is over the top for that whole window.
   */
  const wide = useMedia("(min-width: 1024px)");
  const reduced = useMedia("(prefers-reduced-motion: reduce)") === true;
  const [selected, setSelected] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);
  const [quarter, setQuarter] = useState(0);
  const [zoomScale, setZoomScale] = useState(1);
  const [approved, setApproved] = useState<Set<string>>(() => new Set());
  /**
   * The page opens on the brief, which is 06:04, so the room opens empty. The
   * clock only starts once a reader steps inside it.
   */
  const [now, setNow] = useState(BRIEF);

  /**
   * The service runs while the reader is inside the room and holds still when
   * they are not, so the world is never moving behind a panel they are reading.
   * §9 asks for no ambient motion; a clock the reader chose to step into is
   * the one thing that is not ambient.
   */
  /**
   * Stepping in starts the room's clock where the room says most, and it is
   * done here rather than in an effect on `entered` so that opening the room
   * is one state change and not a render that corrects itself.
   */
  const enter = useCallback((open: boolean) => {
    setEntered(open);
    if (open) setNow((n) => (n < OPEN ? ENTER_AT : n));
  }, []);

  const raf = useRef(0);
  useEffect(() => {
    if (!entered || reduced) return;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = t - last;
      last = t;
      setNow((n) => (n < OPEN || n >= CLOSE ? OPEN : n + dt * 0.006));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [entered, reduced]);

  const approve = useCallback((id: string) => {
    setApproved((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const dept = useMemo(() => DEPTS.find((d) => d.id === selected) ?? null, [selected]);

  /* ── turning the room by hand ─────────────────────────────────────── */

  /**
   * Dragging turns the room. §1 allows the reader to rotate the floor plan and
   * forbids free orbit, and this is the first and not the second: the drag runs
   * one axis, and a release snaps to the nearest quarter and eases there. There
   * is no orientation you can leave it in except the four.
   */
  const control = useRef<Control>({ spin: 0, dragging: false, moved: false });
  const drag = useRef({ x: 0, from: 0 });

  /** A quarter turn per 320px of travel, which is about a hand's width. */
  const SENSITIVITY = Math.PI / 2 / 320;

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      drag.current = { x: e.clientX, from: control.current.spin };
      control.current.moved = false;
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [],
  );

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const dx = e.clientX - drag.current.x;
    // A few pixels of slop, so a click that wobbles is still a click.
    if (!control.current.moved && Math.abs(dx) < 4) return;
    control.current.moved = true;
    control.current.dragging = true;
    control.current.spin = drag.current.from + dx * SENSITIVITY;
  }, [SENSITIVITY]);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (!control.current.dragging) return;
    control.current.dragging = false;
    const q = Math.round(control.current.spin / (Math.PI / 2));
    control.current.spin = (q * Math.PI) / 2;
    setQuarter(q);
  }, []);

  /** A drag that ends over an island must not also pick it. */
  const pick = useCallback((id: string | null) => {
    if (control.current.moved) return;
    setSelected(id);
  }, []);

  const turn = useCallback((by: number) => {
    setQuarter((q) => {
      control.current.spin = ((q + by) * Math.PI) / 2;
      return q + by;
    });
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft") turn(-1);
      else if (e.key === "ArrowRight") turn(1);
      else if (e.key === "+" || e.key === "=") setZoomScale((z) => Math.min(1.8, +(z + 0.2).toFixed(2)));
      else if (e.key === "-") setZoomScale((z) => Math.max(0.6, +(z - 0.2).toFixed(2)));
      else return;
      e.preventDefault();
    },
    [turn],
  );

  return (
    <div className="mv" style={{ display: "grid", gap: 0 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          minHeight: "100svh",
        }}
        data-floor-layout
      >
        <div className="mv-floor-grid">
          {/* The stage. Nothing docks over it, ever. */}
          <div
            className="mv-stage mv-floor-stage"
            onPointerDown={wide ? onPointerDown : undefined}
            onPointerMove={wide ? onPointerMove : undefined}
            onPointerUp={wide ? onPointerUp : undefined}
            onPointerCancel={wide ? onPointerUp : undefined}
            onKeyDown={wide ? onKeyDown : undefined}
            tabIndex={wide ? 0 : undefined}
            role={wide ? "application" : undefined}
            aria-label={
              wide ? "The floor. Drag to turn the room, arrow keys to turn it a quarter." : undefined
            }
          >
            {wide === true ? (
              <FloorScene
                control={control}
                selected={selected}
                onSelect={pick}
                onEnterVenue={() => enter(!entered)}
                entered={entered}
                now={now}
                quarter={quarter}
                zoomScale={zoomScale}
                reduced={reduced}
              />
            ) : null}

            {/*
              A phone gets the still, not the diorama. An isometric model that
              is picked from and turned does not survive a 390px screen, and
              the brief underneath is the thing an owner actually opens at six
              in the morning. It is a render of this same scene, made by
              docs/research/scratch/shoot-plate.mjs, so the two cannot drift.
            */}
            {wide === false ? (
              <Image
                className="mv-floor-plate"
                src="/floor-plate.png"
                alt="The floor before open: the venue in its case, six departments around it, and two of them still lit."
                width={1350}
                height={1350}
                sizes="100vw"
                priority
              />
            ) : null}

            <Curtain />

            <div className="mv-floor-controls" hidden={wide !== true}>
              {/*
                The room is turned by dragging it, so there are no turn buttons
                any more. What is left is the one thing a drag cannot say, plus
                the zoom, which stays on buttons because taking the wheel would
                trap a reader on a floor that fills their screen.
              */}
              <p className="mv-display mv-11 mv-dim mv-floor-hint">Drag to turn the room</p>
              <button
                type="button"
                className="mv-btn"
                aria-label="Zoom out"
                onClick={() => setZoomScale((z) => Math.max(0.6, +(z - 0.2).toFixed(2)))}
                disabled={zoomScale <= 0.6}
              >
                −
              </button>
              <button
                type="button"
                className="mv-btn"
                aria-label="Zoom in"
                onClick={() => setZoomScale((z) => Math.min(1.8, +(z + 0.2).toFixed(2)))}
                disabled={zoomScale >= 1.8}
              >
                +
              </button>
            </div>
          </div>

          {/* The docked column. */}
          <aside className="mv-floor-column">
            {entered ? (
              <ServicePanel now={now} approved={approved} onBack={() => enter(false)} />
            ) : dept ? (
              <DeptPanel
                dept={dept}
                approved={approved}
                onApprove={approve}
                onBack={() => setSelected(null)}
              />
            ) : (
              <Brief
                approved={approved}
                onApprove={approve}
                onPick={setSelected}
                onEnter={() => enter(true)}
              />
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
