"use client";

/**
 * The Floor, as geometry.
 *
 * The composition is the one the first floor established and Kayden asked to
 * keep: the venue at the centre, six departments in a ring around it, walkways
 * between. What changed is the language. This is built to
 * `handoff/art-direction.md` and shares nothing with the rest of the site: no
 * radii, no shadows, no gradients on a face, one camera, zero lights.
 *
 * Roles, so the palette stays legible:
 *
 * - **Stone** is what exists. The case, the plinths, the walkways, the venue
 *   itself. It never carries state.
 * - **Coral through drained** is the work. A department with something waiting
 *   is full coral and advances; one that is only being watched sits between;
 *   one that finished overnight drains back into the background architecture
 *   and recedes. That is §4's depth trick doing the whole job, with no legend
 *   anywhere on the screen.
 * - **Accent** is selection, one object at a time, never anything else.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  ACCENT,
  ACCENT_DARK,
  CORAL,
  DRAINED,
  type Faces,
  FOG,
  INK,
  MARKER,
  SKY_TOP,
  STATE_FACES,
  type FloorState,
  STONE,
} from "./palette";
import {
  ArchWall,
  Crenellation,
  Dome,
  FlatShadow,
  InlayTile,
  Ornament,
  Prism,
  Stairs,
  WindowSlits,
  applyFaceValues,
  facesToMaterials,
  flat,
  mergeGeometries,
  shiftLightness,
} from "./kit";
import { DEPTS, type Dept, TABLES, tableState } from "./data";

/* ------------------------------------------------------------------ */
/* The case (§10)                                                      */
/* ------------------------------------------------------------------ */

/**
 * §10's frame, in `--mv-sky-top`.
 *
 * On the white ground the page now uses (see `palette.ts`) the mint reads as a
 * pale case standing around the room, which is what §10 is after and what it
 * could not do while the same mint was also the sky behind it. The three
 * values sit within nine points of lightness of each other, because a frame
 * that competes with the model is not a frame.
 */
const CASE: Faces = [
  shiftLightness(SKY_TOP, 0.055),
  shiftLightness(SKY_TOP, 0.015),
  shiftLightness(SKY_TOP, -0.035),
];

/**
 * The case is around the venue, not around the world.
 *
 * The first pass read §10 as "put the whole floor on a tray", built a 23-unit
 * stone plate and lost the look completely: every surface in the frame was the
 * same pale value, the model had no figure against any ground, and the plate's
 * two dead corners ate a third of the viewport. Reference 4 has no ground plane
 * at all, and Reference 2 puts one small platform in a very large empty field.
 *
 * §10 is precise about this and was simply misread: *"the room sits inside a
 * thin frame"*. So the venue is what is in the case, the departments are
 * platforms floating around it, and the background does the rest of the work.
 */
const CASE_PAD = 0.6;
const CASE_THICK = 0.7;
const POST = 0.46;
const POST_H = 6.6;
const LINTEL = 0.34;

function Case() {
  const half = VENUE_HALF + CASE_PAD;
  const w = half * 2;
  const post = half - POST / 2;

  return (
    <group>
      <Prism at={[0, -CASE_THICK, 0]} size={[w, CASE_THICK, w]} faces={CASE} />
      <Ornament at={[0, 0, 0]} width={w - 0.5} depth={w - 0.5} surface={CASE[0]} delta={0.05} />

      {/*
        Reference 1's frame. Four posts and the two far lintels: a full lid is
        what that reference has, and at this camera a lid covers the back half
        of the room, so the frame is closed on the two sides you look past and
        open on the two you look through.
      */}
      {/*
        Three posts, not four. A square case seen down this axis puts one corner
        dead centre-front, and a post there stands straight through the middle of
        the room the case exists to show. Reference 1's box is open on exactly
        that corner, which is how you look into a display case.
      */}
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
      ].map(([sx, sz]) => (
        <Prism
          key={`post-${sx}${sz}`}
          at={[sx * post, 0, sz * post]}
          size={[POST, POST_H, POST]}
          faces={CASE}
        />
      ))}
      <Prism at={[0, POST_H, -post]} size={[w, LINTEL, POST]} faces={CASE} />
      <Prism at={[-post, POST_H, 0]} size={[POST, LINTEL, w]} faces={CASE} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* A department                                                        */
/* ------------------------------------------------------------------ */

/**
 * A department's state, read off its own morning rather than authored twice.
 * Anything still waiting on a person makes the whole island advance.
 */
export function deptState(d: Dept): FloorState {
  if (d.tasks.some((t) => t.state === "needs")) return "needs";
  if (d.tasks.some((t) => t.state === "watching")) return "watching";
  return "done";
}

/**
 * The building on an island, assembled from §5's kit and sized by the
 * department's own morning: one storey per pair of tasks, a slit per desk, a
 * crenellated crown on anything tall enough to earn one, and a dome on the
 * departments Peregrine runs itself rather than connects to.
 *
 * Deterministic, not random. The same department draws the same building every
 * load, which is what lets a reader learn the skyline.
 */
function Building({
  dept,
  faces,
  crown,
}: {
  dept: Dept;
  faces: Faces;
  /**
   * The value the crenellation and the dome take. Normally the same as the
   * body; on the selected island it is the accent, so §4's "top face becomes
   * the accent" lands on the crown of the building rather than on every square
   * metre of its roof. Reference 4 has one small yellow totem in a whole city,
   * and check 4 caps the accent at 3% of the frame: an entire roof, at the zoom
   * a reader gets after picking a department, is four or five.
   */
  crown: Faces;
}) {
  /**
   * Mass, not height. The first pass drove height straight off the task count
   * and drew six near-identical towers, which is programmer-art. Reference 4's
   * city is chunky and varied: wide masses, arches, a dome, one thing taller
   * than the rest. So the department's morning still sets the scale, but it is
   * capped, and each department gets a different arrangement of the same kit.
   */
  const load = Math.min(dept.tasks.length, 7) / 7;
  const tall = 1.35 + load * 1.25;
  const w = dept.size * 0.74;
  const slit = shiftLightness(faces[1], -0.16);

  /** Which of the four massings this department draws. Fixed per department. */
  const form = FORM[dept.id] ?? "block";

  return (
    <group>
      {/* Every department shares one wide back mass, so the ring reads as one
          city rather than as six unrelated models. */}
      <Prism at={[-w * 0.2, 0, -w * 0.26]} size={[w * 1.1, tall, w * 0.72]} faces={faces} />
      <Crenellation
        at={[-w * 0.2, tall, -w * 0.26 - w * 0.36 + 0.11]}
        length={w * 1.1}
        merlon={0.21}
        height={0.24}
        depth={0.22}
        faces={crown}
      />
      <WindowSlits
        at={[-w * 0.2, tall * 0.24, -w * 0.26 + w * 0.36 + 0.01]}
        count={Math.min(dept.desks.length, 4)}
        height={tall * 0.4}
        spacing={0.32}
        facing="+z"
        color={slit}
      />
      <FlatShadow at={[-w * 0.2, 0, -w * 0.26]} width={w * 1.1} depth={w * 0.72} height={tall} />

      {form === "tower" ? (
        <>
          <Prism at={[w * 0.5, 0, -w * 0.26]} size={[w * 0.5, tall * 1.5, w * 0.5]} faces={faces} />
          <Crenellation
            at={[w * 0.5, tall * 1.5, -w * 0.26 - w * 0.25 + 0.08]}
            length={w * 0.5}
            merlon={0.16}
            height={0.2}
            depth={0.17}
            faces={crown}
          />
          <FlatShadow at={[w * 0.5, 0, -w * 0.26]} width={w * 0.5} depth={w * 0.5} height={tall * 1.5} />
        </>
      ) : null}

      {form === "dome" ? (
        <>
          <Prism at={[w * 0.5, 0, -w * 0.2]} size={[w * 0.56, tall * 0.9, w * 0.56]} faces={faces} />
          <Dome at={[w * 0.5, tall * 0.9, -w * 0.2]} radius={w * 0.26} shaft={0.22} faces={crown} />
          <FlatShadow at={[w * 0.5, 0, -w * 0.2]} width={w * 0.56} depth={w * 0.56} height={tall * 1.2} />
        </>
      ) : null}

      {form === "arch" ? (
        <ArchWall
          at={[w * 0.42, 0, w * 0.3]}
          width={w * 0.95}
          height={tall * 0.88}
          thickness={0.3}
          archWidth={w * 0.42}
          faces={faces}
          rotateY={Math.PI / 2}
        />
      ) : null}

      {form === "block" ? (
        <Prism at={[w * 0.44, 0, w * 0.22]} size={[w * 0.6, tall * 0.52, w * 0.6]} faces={faces} />
      ) : null}

      {/* The step up onto the mass. It is what makes an island read as a place
          you could stand in rather than a shape on a tray. */}
      <Stairs
        at={[-w * 0.1, 0, w * 0.5]}
        treads={4}
        rise={0.11}
        run={0.2}
        width={0.72}
        faces={STONE}
      />
    </group>
  );
}

/**
 * One massing per department, assigned rather than hashed so the skyline is
 * something a reader can learn. Bookings and the venue's own systems get the
 * dome, because those are the two Peregrine runs itself.
 */
const FORM: Record<string, "tower" | "dome" | "arch" | "block"> = {
  bookings: "dome",
  suppliers: "tower",
  books: "arch",
  admin: "tower",
  marketing: "block",
  roster: "arch",
};

/**
 * Island plinths are deep, because there is no ground under them. Reference 2's
 * platform is read as an object entirely through the side of its own slab.
 */
/**
 * Somebody at a desk.
 *
 * Monument Valley's own figure is the whole vocabulary here: a white body, a
 * white hat, no face, no arms, no animation. Anything more detailed reads as a
 * different game, and §5's kit has no curves to build it from anyway.
 */
function Figure({ at }: { at: [number, number, number] }) {
  const geo = useMemo(() => {
    const body = new THREE.CylinderGeometry(0.055, 0.085, 0.22, 12);
    body.translate(0, 0.11, 0);
    const head = new THREE.SphereGeometry(0.055, 12, 4, 0, Math.PI * 2, 0, Math.PI / 2);
    head.translate(0, 0.22, 0);
    return applyFaceValues(mergeGeometries([body, head]));
  }, []);

  return (
    <mesh
      geometry={geo}
      material={facesToMaterials(["#ffffff", "#f2ede6", "#e2dad0"])}
      position={at}
    />
  );
}

/**
 * One desk on a selected island: a stone bench, a screen, and somebody at it.
 *
 * The screen carries the department's state colour, so a desk that is still
 * waiting on a person is lit and one that finished overnight has drained,
 * which is the same reading the island itself makes at the scale above.
 */
function Desk({
  at,
  faces,
  label,
  rotateY = 0,
  lift = 0.82,
}: {
  at: [number, number, number];
  faces: Faces;
  label: string;
  /** Quarter turns only, so the kit's baked face values stay true. */
  rotateY?: number;
  /** How high the label floats. Staggered by the caller so names never meet. */
  lift?: number;
}) {
  // The desk turns as a unit, and every part of it is built through the kit,
  // which bakes the rotation into the geometry rather than onto the mesh.
  const flip = rotateY !== 0;
  const seat: [number, number, number] = flip ? [0.34, 0, 0] : [0, 0, 0.34];
  const screen: [number, number, number] = flip ? [-0.12, 0.21, 0] : [0, 0.21, -0.12];

  return (
    <group position={at}>
      <Prism at={[0, 0, 0]} size={[0.72, 0.21, 0.46]} faces={STONE} rotateY={rotateY} />
      {/* The screen, stood on the far edge of the desk so it faces the room. */}
      <Prism at={screen} size={[0.5, 0.34, 0.07]} faces={faces} rotateY={rotateY} />
      <Figure at={seat} />
      <FlatShadow at={[0, 0, 0]} width={0.72} depth={0.46} height={0.5} />

      {/*
        The system this desk works through. It is DOM rather than geometry
        because §8 puts every piece of type in this world in the 2D chrome, in
        Karla, at a size on its own scale, and none of that can be true of text
        baked into the model.
      */}
      <Html center position={[0, lift, 0]} zIndexRange={[10, 0]} pointerEvents="none">
        <span className="mv-desk-label mv-11">{label}</span>
      </Html>
    </group>
  );
}

/**
 * The desks that appear on an island when a reader picks it.
 *
 * They are the point of the whole selection: the island tells you a department
 * has something waiting, and this tells you who was at it and what they worked
 * through. Laid out in one or two rows across the front of the plinth, in front
 * of the building rather than inside it, so nothing occludes them.
 */
function Desks({ dept, faces }: { dept: Dept; faces: Faces }) {
  const group = useRef<THREE.Group>(null);
  const s = dept.size * ISLAND;
  const desks = dept.desks.slice(0, 6);

  /**
   * Along the island's two open edges rather than in rows in front of the
   * building, which is where they were and where the building stood on them.
   * Two edges give twice the run, keep every desk clear of the mass behind it,
   * and separate the labels in screen space instead of stacking them.
   */
  const edge = s * 0.6;
  const pitch = 1.1;
  const half = Math.ceil(desks.length / 2);
  const right = desks.slice(0, half);
  const left = desks.slice(half);

  // §9's entry, in the scene rather than in a panel: 320ms, one curve, a rise
  // rather than a scale.
  const t = useRef(0);
  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    t.current = Math.min(320, t.current + dt * 1000);
    const k = easeStandard(t.current / 320);
    g.position.y = (1 - k) * -0.5;
  });

  return (
    <group ref={group}>
      {right.map((d, i) => (
        <Desk
          key={d.label}
          at={[(i - (right.length - 1) / 2) * pitch, 0, edge]}
          faces={faces}
          label={d.label}
          lift={0.82 + (i % 2) * 0.42}
        />
      ))}
      {left.map((d, i) => (
        <Desk
          key={d.label}
          at={[edge, 0, (i - (left.length - 1) / 2) * pitch]}
          faces={faces}
          label={d.label}
          rotateY={Math.PI / 2}
          // The two rows meet at the island's near corner, so the second one
          // starts a whole step higher and their names never queue up.
          lift={1.32 + (i % 2) * 0.42}
        />
      ))}
    </group>
  );
}

const PLINTH = 0.78;

/**
 * How far out the ring sits, and how big an island is.
 *
 * Two rules set these. No island may touch the case or another island, because
 * Reference 2's whole composition is the space between things and the moment
 * these platforms met they read as one continuous pale mass. And the ring is
 * put on a single radius rather than left where the first floor placed it: the
 * old layout had four islands on the axes at 7.8 and two on the diagonals at
 * 10.6, so a quarter turn swung the diagonal pair 3 units further out than
 * anything the camera had been fitted to and cropped them off the frame.
 *
 * On one radius the ring's silhouette barely changes as it turns, which is
 * what lets the fit below stay tight instead of being sized for the worst
 * quarter.
 */
const RING_R = 8.8;
const ISLAND = 0.85;

/**
 * How far the whole ring is turned off the layout's own bearings.
 *
 * The layout put one island on each world diagonal, and the back diagonal
 * projects to dead centre behind the venue's tower, so Admin was never once
 * visible. Twenty degrees moves every island off both screen axes and costs
 * the composition nothing: the ring is a circle.
 */
const RING_ROT = (20 * Math.PI) / 180;

/** An island's place on the ring: its own bearing, at the common radius. */
function ringPos(d: Dept): [number, number] {
  const a = Math.atan2(d.v, d.u) + RING_ROT;
  return [Math.cos(a) * RING_R, Math.sin(a) * RING_R];
}

/**
 * The ring stands a course above the room it surrounds, so the departments are
 * not swallowed by the venue's own walls from behind.
 */
const RING_LIFT = 0.55;

function Island({
  dept,
  selected,
  hovered,
  onHover,
  onSelect,
  reduced,
  enabled,
}: {
  dept: Dept;
  selected: boolean;
  hovered: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  reduced: boolean;
  /** False while the ring is falling away, so nothing under it is clickable. */
  enabled: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const state = deptState(dept);

  /**
   * §4: selection puts the accent on the top face and leaves the sides coral.
   * Nothing else in the frame is ever allowed to wear it.
   */
  const faces: Faces = STATE_FACES[state];
  const crown: Faces = selected ? [ACCENT, ACCENT_DARK, ACCENT_DARK] : faces;

  /** §4's hover: 0.06 units of lift over 160ms, no colour change, no outline. */
  const rest = 0;
  const target = hovered ? rest + 0.06 : rest;
  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    if (reduced) {
      g.position.y = target;
      return;
    }
    // 160ms to close the gap, frame-rate independent.
    const k = 1 - Math.exp((-dt * 1000) / 160);
    g.position.y += (target - g.position.y) * k;
  });

  const s = dept.size * ISLAND;

  return (
    <group ref={group} position={[ringPos(dept)[0], RING_LIFT, ringPos(dept)[1]]}>
      <Prism at={[0, -PLINTH, 0]} size={[s * 2, PLINTH, s * 2]} faces={STONE} />
      <Ornament at={[0, 0, 0]} width={s * 2} depth={s * 2} surface={STONE[0]} />

      <group position={[0, 0, 0]}>
        <Building dept={dept} faces={faces} crown={crown} />
        {selected ? <Desks dept={dept} faces={faces} /> : null}
        {/* The interactive marker of §3, small and teal, one per island. */}
        <InlayTile at={[s * 0.66, 0, -s * 0.66]} size={0.34} color={selected ? ACCENT : MARKER} />
      </group>

      {/* Picking happens on one invisible box, never on the building itself. */}
      <mesh
        visible={false}
        position={[0, 1.4, 0]}
        raycast={enabled ? undefined : () => {}}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(dept.id);
        }}
        onPointerOut={() => onHover(null)}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(dept.id);
        }}
      >
        <boxGeometry args={[s * 2, 2.8, s * 2]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* The venue                                                           */
/* ------------------------------------------------------------------ */

const VENUE_HALF = 3.4;
const VENUE_PLINTH = 0.8;

/**
 * The room itself, at the centre of the ring.
 *
 * Stone throughout, because the venue is the thing that exists rather than
 * work in a state. What carries state inside it are the tables, straight off
 * §4: a table that is free is full coral and advances, one that is booked out
 * drains and recedes into the room.
 */
function Venue({
  now,
  onEnter,
  entered,
}: {
  now: number;
  onEnter: () => void;
  entered: boolean;
}) {
  const wallH = 2.5;
  return (
    <group>
      {/* One course above the case floor, so the room reads as set into its
          case rather than as another platform standing on it. */}
      <Prism at={[0, 0, 0]} size={[VENUE_HALF * 2, VENUE_PLINTH, VENUE_HALF * 2]} faces={STONE} />
      <Ornament
        at={[0, VENUE_PLINTH, 0]}
        width={VENUE_HALF * 2}
        depth={VENUE_HALF * 2}
        surface={STONE[0]}
      />
      <FlatShadow at={[0, 0, 0]} width={VENUE_HALF * 2} depth={VENUE_HALF * 2} height={VENUE_PLINTH} />

      <group position={[0, VENUE_PLINTH, 0]}>
        {/* Two back walls with arches through them, so the room reads as a
            room from outside and does not need opening to be understood. */}
        <ArchWall
          at={[0, 0, -VENUE_HALF + 0.3]}
          width={VENUE_HALF * 1.9}
          height={wallH}
          thickness={0.34}
          archWidth={1.5}
          faces={STONE}
        />
        <ArchWall
          at={[-VENUE_HALF + 0.3, 0, 0]}
          width={VENUE_HALF * 1.9}
          height={wallH}
          thickness={0.34}
          archWidth={1.5}
          faces={STONE}
          rotateY={Math.PI / 2}
        />
        <Crenellation
          at={[0, wallH, -VENUE_HALF + 0.3]}
          length={VENUE_HALF * 1.9}
          merlon={0.26}
          height={0.3}
          depth={0.34}
          faces={STONE}
        />
        <Crenellation
          at={[-VENUE_HALF + 0.3, wallH, 0]}
          length={VENUE_HALF * 1.9}
          merlon={0.26}
          height={0.3}
          depth={0.34}
          faces={STONE}
          rotateY={Math.PI / 2}
        />
        <WindowSlits
          at={[0, 0.7, -VENUE_HALF + 0.48]}
          count={5}
          height={1.15}
          spacing={0.62}
          facing="+z"
          color={shiftLightness(STONE[1], -0.13)}
        />

        {/*
          The corner tower, which is the tallest thing in the case and the
          reason the eye lands on the room first. Reference 4 gives its one
          domed tower the same job.
        */}
        <Prism
          at={[-VENUE_HALF + 0.55, 0, -VENUE_HALF + 0.55]}
          size={[1.35, wallH * 1.1, 1.35]}
          faces={STONE}
        />
        <Crenellation
          at={[-VENUE_HALF + 0.55, wallH * 1.1, -VENUE_HALF + 0.55 - 0.68 + 0.1]}
          length={1.35}
          merlon={0.2}
          height={0.24}
          depth={0.2}
          faces={STONE}
        />
        <Dome
          at={[-VENUE_HALF + 0.55, wallH * 1.1 + 0.24, -VENUE_HALF + 0.55]}
          radius={0.48}
          shaft={0.5}
          faces={STONE}
        />
        <FlatShadow
          at={[-VENUE_HALF + 0.55, 0, -VENUE_HALF + 0.55]}
          width={1.35}
          depth={1.35}
          height={wallH * 1.1}
        />

        {/*
          The floor itself, in §5's small square inlays. Almost invisible at the
          resting camera and the thing that makes the room read as a room once
          a reader has stepped into it.
        */}
        <VenueFloor />

        {/* The tables, which is where the room's state lives. */}
        {TABLES.map((t) => (
          <Table key={t.id} id={t.id} kind={t.kind} u={t.u * 0.72} v={t.v * 0.72} now={now} />
        ))}

        {/* The way in. Reference 1's stair, doing the job of a button. */}
        <group
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "";
          }}
          onClick={(e) => {
            e.stopPropagation();
            onEnter();
          }}
        >
          <Stairs
            at={[VENUE_HALF - 1.9, -VENUE_PLINTH, VENUE_HALF - 0.7]}
            treads={6}
            rise={VENUE_PLINTH / 6}
            run={0.26}
            width={1.2}
            faces={STONE}
          />
          <InlayTile
            at={[VENUE_HALF - 0.5, 0, VENUE_HALF - 0.7]}
            size={0.44}
            color={entered ? ACCENT : MARKER}
          />
        </group>
      </group>
    </group>
  );
}

/**
 * The room's paving: flush square inlays, on §7's contrast ceiling.
 *
 * One merged geometry rather than fifty `InlayTile`s. Fifty tiles is fifty
 * draw calls for something that never moves and never changes colour, and the
 * whole rest of the floor is built to stay in the low hundreds.
 */
function VenueFloor() {
  const geo = useMemo(() => {
    const pitch = 0.92;
    const size = 0.74;
    const edge = VENUE_HALF - 0.6;
    const parts: THREE.BufferGeometry[] = [];
    for (let x = -edge; x <= edge; x += pitch) {
      for (let z = -edge; z <= edge; z += pitch) {
        const g = new THREE.PlaneGeometry(size, size);
        g.rotateX(-Math.PI / 2);
        g.translate(x, 0.006, z);
        parts.push(g);
      }
    }
    return mergeGeometries(parts);
  }, []);

  const color = useMemo(() => shiftLightness(STONE[0], -0.045), []);
  return <mesh geometry={geo} material={flat(color)} renderOrder={1} />;
}

/**
 * One table.
 *
 * §5 says circular tables are twelve-sided cylinders, rectangular ones are
 * boxes, and both sit on a plinth 0.08 proud of the floor so they read as
 * objects rather than as paint. The first pass did exactly that and no more,
 * and at the zoom a reader gets after stepping into the room ten bare drums do
 * not read as a dining room. So the same parts, assembled properly: a plinth,
 * a pedestal, a top slab, and a chair on each side that has one.
 *
 * The state is §4's, verbatim: a free table is full coral and advances, one
 * that is booked out drains and recedes into the room, and a table due inside
 * the hour sits between the two. Chairs stay stone, because a chair is not a
 * booking.
 */
function Table({
  id,
  kind,
  u,
  v,
  now,
}: {
  id: string;
  kind: "two" | "four" | "banq";
  u: number;
  v: number;
  now: number;
}) {
  const st = tableState(id, now);
  const faces: Faces =
    st.kind === "seated" ? DRAINED : st.kind === "due" ? STATE_FACES.watching : CORAL;

  const seats = kind === "banq" ? 3 : kind === "four" ? 4 : 2;
  const w = kind === "banq" ? 1.45 : kind === "four" ? 0.82 : 0.58;
  const d = kind === "banq" ? 0.6 : w;

  const PLINTH_H = 0.08;
  const LEG = 0.2;
  const TOP = 0.07;

  return (
    <group position={[u, 0, v]}>
      <Prism at={[0, 0, 0]} size={[w + 0.5, PLINTH_H, d + 0.5]} faces={STONE} />

      {kind === "banq" ? (
        <>
          {/* The banquette: a bench against the wall and a long top in front. */}
          <Prism at={[0, PLINTH_H, -d * 0.72]} size={[w, 0.34, 0.24]} faces={STONE} />
          <Prism at={[0, PLINTH_H, 0]} size={[w * 0.16, LEG, d * 0.5]} faces={faces} />
          <Prism at={[0, PLINTH_H + LEG, 0]} size={[w, TOP, d]} faces={faces} />
        </>
      ) : (
        <>
          <Dome at={[0, PLINTH_H, 0]} radius={w * 0.17} shaft={LEG} faces={faces} />
          <Dome at={[0, PLINTH_H + LEG, 0]} radius={w / 2} shaft={TOP} faces={faces} />
        </>
      )}

      {Array.from({ length: seats }).map((_, i) => {
        // Chairs sit on the axes, so their faces stay square to the camera and
        // the kit's baked face values keep telling the truth.
        const angle = kind === "banq" ? (i - 1) * 0.5 : i * (Math.PI / 2);
        const cx = kind === "banq" ? angle * w * 0.6 : Math.cos(angle) * (w / 2 + 0.22);
        const cz = kind === "banq" ? d * 0.62 : Math.sin(angle) * (w / 2 + 0.22);
        return (
          <Prism
            key={i}
            at={[cx, PLINTH_H, cz]}
            size={[0.19, 0.3, 0.19]}
            faces={STONE}
          />
        );
      })}

      <FlatShadow at={[0, PLINTH_H, 0]} width={w} depth={d} height={LEG + TOP} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Walkways                                                            */
/* ------------------------------------------------------------------ */

/** A stone strip from an island back to the venue, with its own fine border. */
function Walkway({ dept }: { dept: Dept }) {
  const [u, v] = ringPos(dept);
  const dx = -u;
  const dz = -v;
  const dist = Math.hypot(dx, dz);
  const len = dist - dept.size * ISLAND - VENUE_HALF - CASE_PAD + 0.7;
  if (len <= 0.2) return null;

  // Quarter turns only, so the baked face values stay true (see kit.tsx).
  const along = Math.abs(dx) > Math.abs(dz);
  const mid: [number, number, number] = [
    u + (dx / dist) * (dept.size * ISLAND + len / 2 - 0.35),
    0,
    v + (dz / dist) * (dept.size * ISLAND + len / 2 - 0.35),
  ];
  const w = along ? len : 0.9;
  const d = along ? 0.9 : len;

  /**
   * A shade under the plinths they run between, because a walkway in the same
   * stone as the case floor is not a walkway, it is nothing. Still inside §7's
   * 12% ceiling against the surface beneath it.
   */
  const deck: Faces = [
    shiftLightness(STONE[0], -0.05),
    shiftLightness(STONE[1], -0.05),
    shiftLightness(STONE[2], -0.05),
  ];

  return (
    <group>
      {/* The walk from the ring down to the case, so the two levels connect. */}
      <Prism at={[mid[0], RING_LIFT - 0.34, mid[2]]} size={[w, 0.34, d]} faces={deck} />
      <Stairs
        at={[
          mid[0] - (along ? Math.sign(dx) * (w / 2) : 0),
          0,
          mid[2] - (along ? 0 : Math.sign(dz) * (d / 2)),
        ]}
        treads={4}
        rise={RING_LIFT / 4}
        run={0.22}
        width={0.9}
        faces={deck}
        rotateY={along ? (dx > 0 ? Math.PI : 0) : dz > 0 ? -Math.PI / 2 : Math.PI / 2}
      />
    </group>
  );
}

/**
 * The ring, and what happens to it when a reader steps into the room.
 *
 * Zooming alone does not hand the frame over: at any zoom close enough to
 * exclude the six islands the room is cropped to bare floor, and at any zoom
 * loose enough to hold the room the nearest island is the largest thing on
 * screen. So the ring falls away instead, and the camera comes in to meet it.
 *
 * A drop rather than a fade because every material in the scene is shared by
 * colour, which is what keeps the whole floor down to a handful of draw calls;
 * fading one group would mean a second set of materials for every hue in the
 * palette. A drop costs one number.
 */
const RING_DROP = -8;

function Ring({
  entered,
  reduced,
  children,
}: {
  entered: boolean;
  reduced: boolean;
  children: React.ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  const target = entered ? RING_DROP : 0;

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    if (reduced) {
      g.position.y = target;
    } else {
      const k = 1 - Math.exp((-dt * 1000) / 190);
      g.position.y += (target - g.position.y) * k;
    }
    g.visible = g.position.y > RING_DROP + 0.4;
  });

  return <group ref={group}>{children}</group>;
}

/* ------------------------------------------------------------------ */
/* Camera and stage                                                    */
/* ------------------------------------------------------------------ */

/**
 * §1's camera, and the only one in the app.
 *
 * Position is equal on all three axes, which is what yields 35.264° elevation
 * at 45° azimuth and keeps edges parallel in plan parallel on screen
 * (acceptance check 1). Only the zoom is ever tuned, and it is fitted to the
 * viewport rather than typed, so the model fills the same share of the frame
 * at every width.
 */
/**
 * World units the fit is measured against.
 *
 * The ring stands still, so this is measured once off the resting silhouette.
 * An island on the ring reaches 8.8 units, its plinth another 2.0 and the
 * building on it another 0.9, so the widest thing on screen is 11.7 units from
 * the centre and this leaves about 5% of the frame as margin on each side. The
 * room turning inside its case does not change the number, which is the other
 * reason the rotation lives where it does.
 */
const SPAN = 24.5;

/**
 * How much closer the camera sits once a reader has chosen something.
 *
 * Picking a department is a move, not a highlight. At the resting fit an island
 * is about 170px across, which is not enough to hold six desks, six people and
 * six labels, so choosing one takes the camera to it. Stepping into the room
 * does the same thing one notch wider, because a room is bigger than an island.
 */
const FOCUS_ZOOM = { room: 1.75, island: 2.35, none: 1 };

function Rig({
  zoomScale,
  entered,
  focused,
  reduced,
}: {
  zoomScale: number;
  entered: boolean;
  focused: boolean;
  reduced: boolean;
}) {
  const size = useThree((s) => s.size);
  const fit = Math.min(size.width, size.height * 1.55) / SPAN;
  const step = entered ? FOCUS_ZOOM.room : focused ? FOCUS_ZOOM.island : FOCUS_ZOOM.none;
  const target = fit * zoomScale * step;
  const zoom = useRef(target);
  const fitted = useRef(0);

  /**
   * Stepping into the room is a camera move rather than a page, so the zoom is
   * driven here in the frame loop instead of from React state: one number
   * changing sixty times a second is not something to re-render for.
   *
   * The camera is taken off the frame callback's own state rather than out of
   * `useThree`, which is both the r3f idiom and what keeps the compiler's
   * immutability rule satisfied: this is the render loop, not a render.
   */
  useFrame((state, dt) => {
    const cam = state.camera as THREE.OrthographicCamera;

    // A resize is not something to ease through, so it lands whole.
    const key = size.width * 100000 + size.height;
    if (fitted.current !== key) {
      fitted.current = key;
      zoom.current = target;
    } else if (reduced) {
      zoom.current = target;
    } else {
      // 220ms to close, which puts the hand-off inside the panel's own 320.
      const k = 1 - Math.exp((-dt * 1000) / 220);
      zoom.current += (target - zoom.current) * k;
    }

    if (Math.abs(cam.zoom - zoom.current) > 0.01) {
      cam.zoom = zoom.current;
      cam.updateProjectionMatrix();
    }
  });

  return null;
}

/**
 * The pan.
 *
 * The camera never moves. It cannot: §1 fixes it on the [1,1,1] axis and the
 * first acceptance check is that edges parallel in plan stay parallel on
 * screen, which is only true from there. So the world slides under it instead,
 * which is the same picture and keeps the projection untouched.
 */
function World({
  at,
  reduced,
  children,
}: {
  at: [number, number];
  reduced: boolean;
  children: React.ReactNode;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const k = reduced ? 1 : 1 - Math.exp((-dt * 1000) / 220);
    g.position.x += (-at[0] - g.position.x) * k;
    g.position.z += (-at[1] - g.position.z) * k;
  });

  return <group ref={group}>{children}</group>;
}

/**
 * §1's rotation: 90° snapped steps with easing, never free orbit, never tilt.
 *
 * The reader turns the room by dragging it, which is the mechanic Kayden
 * asked for and is not the same thing as free orbit: the drag runs the room
 * around the Y axis and nothing else, and letting go snaps to the nearest
 * quarter and eases there over §9's 520ms on §9's one curve. There is no tilt
 * to be had, and no orientation that survives a release except the four.
 */
function Turntable({
  quarter,
  control,
  reduced,
  children,
}: {
  quarter: number;
  control: React.RefObject<Control>;
  reduced: boolean;
  children: React.ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  const target = (quarter * Math.PI) / 2;
  const elapsed = useRef(520);
  const from = useRef(target);
  const last = useRef(quarter);
  const dragged = useRef(false);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const c = control.current;

    if (c.dragging) {
      // Under the hand the room follows exactly, so the drag reads as the room
      // and not as a control that happens to move it.
      g.rotation.y = c.spin;
      dragged.current = true;
      return;
    }

    // A release, or a step from the keyboard, starts one tween.
    if (dragged.current || last.current !== quarter) {
      from.current = g.rotation.y;
      elapsed.current = 0;
      last.current = quarter;
      dragged.current = false;
    }

    if (reduced) {
      g.rotation.y = target;
      return;
    }

    elapsed.current = Math.min(520, elapsed.current + dt * 1000);
    g.rotation.y =
      from.current + (target - from.current) * easeStandard(elapsed.current / 520);
  });

  return <group ref={group}>{children}</group>;
}

/** §9's one easing curve, cubic-bezier(0.4, 0, 0.2, 1), sampled. */
function easeStandard(t: number): number {
  if (t >= 1) return 1;
  // Newton solve for x, then read y. Three iterations is inside a pixel.
  const cx = 3 * 0.4;
  const bx = 3 * (1 - 0.4) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * 0;
  const by = 3 * (0.2 - 0) - cy;
  const ay = 1 - cy - by;
  let x = t;
  for (let i = 0; i < 4; i++) {
    const fx = ((ax * x + bx) * x + cx) * x - t;
    const d = (3 * ax * x + 2 * bx) * x + cx;
    if (Math.abs(d) < 1e-6) break;
    x -= fx / d;
  }
  return ((ay * x + by) * x + cy) * x;
}

/* ------------------------------------------------------------------ */
/* The scene                                                           */
/* ------------------------------------------------------------------ */

/**
 * The live state of a drag, shared between the DOM handlers on the stage and
 * the frame loop inside the canvas.
 *
 * A ref rather than state on purpose: a drag changes sixty times a second and
 * none of those are renders. `moved` is what tells a click from a drag, so
 * turning the room never also picks the department under the cursor.
 */
export type Control = {
  /** Where the room is being held, in radians. */
  spin: number;
  dragging: boolean;
  moved: boolean;
};

export type SceneProps = {
  control: React.RefObject<Control>;
  selected: string | null;
  onSelect: (id: string | null) => void;
  onEnterVenue: () => void;
  entered: boolean;
  now: number;
  quarter: number;
  zoomScale: number;
  reduced: boolean;
};

function Stage(props: SceneProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  /** What the camera is looking at: an island, or the middle of the case. */
  const focus = useMemo<[number, number]>(() => {
    const d = DEPTS.find((x) => x.id === props.selected);
    if (!d || props.entered) return [0, 0];
    const [x, z] = ringPos(d);
    /*
      Not the island's middle: the front of it, where the desks are.

      The building is the biggest thing on an island and it stands at the back,
      so aiming at the centre puts the mass in the middle of the frame and the
      people at work down in a corner. Nudging the aim a unit toward the camera
      along the world's near diagonal puts the working edge in the middle and
      leaves the building where it belongs, behind it.
    */
    return [x + 0.7, z + 0.7];
  }, [props.selected, props.entered]);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered]);

  return (
    <>
      {/*
        §6: distance dissolves into one flat colour. View-space depth across the
        case runs about 24 to 46 from this camera, so the near edge is untouched
        and the far corner loses roughly 40% of its contrast.
      */}
      <fog attach="fog" args={[FOG, 30, 58]} />

      <Rig
        zoomScale={props.zoomScale}
        entered={props.entered}
        focused={props.selected !== null}
        reduced={props.reduced}
      />
      {/*
        What turns is the room, inside a case that is held still. That is
        Reference 1's mechanic exactly, and it is what §1 means by "the user may
        rotate the floor plan": the floor plan is the venue.

        Turning the whole world instead was tried and is wrong twice over. The
        frame goes with it, so the two far lintels swing to the near side and
        cut across the room; and the ring's silhouette changes by three units as
        it goes, so the camera has to be fitted for the worst quarter and the
        model shrinks at every other one.
      */}
      <World at={focus} reduced={props.reduced}>
        <group onClick={() => props.onSelect(null)}>
          <Case />
        </group>
        <Turntable quarter={props.quarter} control={props.control} reduced={props.reduced}>
          <Venue now={props.now} onEnter={props.onEnterVenue} entered={props.entered} />
        </Turntable>
        <Ring entered={props.entered} reduced={props.reduced}>
          {DEPTS.map((d) => (
            <Walkway key={`w-${d.id}`} dept={d} />
          ))}
          {DEPTS.map((d) => (
            <Island
              key={d.id}
              dept={d}
              selected={props.selected === d.id}
              hovered={hovered === d.id}
              onHover={setHovered}
              onSelect={(id) => props.onSelect(id)}
              reduced={props.reduced}
              enabled={!props.entered}
            />
          ))}
        </Ring>
      </World>
    </>
  );
}

export function FloorScene(props: SceneProps) {
  const dpr = useMemo<[number, number]>(() => [1, 2], []);

  return (
    <Canvas
      dpr={dpr}
      gl={{ antialias: true, alpha: true }}
      orthographic
      camera={{ position: [20, 20, 20], zoom: 48, near: -100, far: 200 }}
    >
      <Stage {...props} />
    </Canvas>
  );
}

export { INK, MARKER, flat };
