"use client";

/**
 * The Floor's geometry kit.
 *
 * `handoff/art-direction.md` §5 lists the only parts this world is allowed to
 * be built from. Everything on `/platform` is assembled from what is in this
 * file, and nothing here bevels, chamfers, rounds a corner or subdivides.
 *
 * The one idea worth understanding before reading further is `applyFaceValues`.
 * There are no lights in the scene (§0 bans every one of them), so light is
 * assigned per face rather than calculated. That is done once, at build time,
 * by bucketing every triangle of a geometry by the direction it faces and
 * rewriting the geometry's material groups to match. Three materials per mesh,
 * three draw calls, and it works identically for a box, a twelve-sided table
 * and an extruded arch, which is what lets §2 hold across the whole kit
 * instead of only across the boxes.
 */

import { useMemo } from "react";
import * as THREE from "three";
import { type Faces, INK } from "./palette";

/* ------------------------------------------------------------------ */
/* Face assignment                                                     */
/* ------------------------------------------------------------------ */

/**
 * Material slots, in the order `facesToMaterials` returns them.
 *
 * "Left" and "right" are the camera's, not the world's. With the orthographic
 * camera parked on the [1,1,1] axis and Y up, the screen-x of a world
 * direction is `(x - z) · 0.7071`, so a face pointing +Z lands on the left of
 * the frame and one pointing +X lands on the right. Reference 4 darkens the
 * right-hand faces of every tower in the city without exception, which is the
 * direction encoded below.
 */
const TOP = 0;
const LEFT = 1;
const RIGHT = 2;

/**
 * Bucket a geometry's triangles by facing and rewrite its groups so a mesh can
 * take `[top, left, right]` materials.
 *
 * Normals are taken from the triangle itself rather than from the vertex
 * normal attribute, which is what makes every face read as one flat value no
 * matter how the geometry was generated. `flatShading` is not set anywhere in
 * this file because `MeshBasicMaterial` is unlit and never consults a normal;
 * the flat look §0 asks for comes from this function instead.
 *
 * Mutates and returns the geometry. Apply any rotation to the geometry *before*
 * calling this, never to the mesh, or the buckets describe the wrong faces.
 */
export function applyFaceValues(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const index = geo.getIndex();
  const count = index ? index.count : pos.count;
  const at = (i: number) => (index ? index.getX(i) : i);

  const buckets: number[][] = [[], [], []];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const n = new THREE.Vector3();

  for (let i = 0; i < count; i += 3) {
    const i0 = at(i);
    const i1 = at(i + 1);
    const i2 = at(i + 2);
    a.fromBufferAttribute(pos, i0);
    b.fromBufferAttribute(pos, i1);
    c.fromBufferAttribute(pos, i2);
    ab.subVectors(b, a);
    ac.subVectors(c, a);
    n.crossVectors(ab, ac).normalize();

    // Up is the top face. Down is never seen, so it borrows the darkest value
    // rather than earning a fourth one.
    const slot =
      n.y > 0.5 ? TOP : n.y < -0.5 ? RIGHT : n.x > n.z ? RIGHT : LEFT;
    buckets[slot].push(i0, i1, i2);
  }

  const flat = [...buckets[TOP], ...buckets[LEFT], ...buckets[RIGHT]];
  geo.setIndex(flat);
  geo.clearGroups();
  let start = 0;
  for (const slot of [TOP, LEFT, RIGHT]) {
    const len = buckets[slot].length;
    if (len) geo.addGroup(start, len, slot);
    start += len;
  }
  return geo;
}

/* ------------------------------------------------------------------ */
/* Materials                                                           */
/* ------------------------------------------------------------------ */

/**
 * One material per colour, shared across the whole scene.
 *
 * `MeshBasicMaterial` is the only material §0 allows, and it is the right one:
 * it is unlit, so a face is exactly the hex it was assigned, and it respects
 * scene fog, which is what carries §6's depth.
 */
const CACHE = new Map<string, THREE.MeshBasicMaterial>();

export function flat(color: string): THREE.MeshBasicMaterial {
  let m = CACHE.get(color);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color, fog: true });
    CACHE.set(color, m);
  }
  return m;
}

export function facesToMaterials(faces: Faces): THREE.MeshBasicMaterial[] {
  return [flat(faces[TOP]), flat(faces[LEFT]), flat(faces[RIGHT])];
}

/** The flat, hard-edged, unblurred shadow of §6. Never a shadow map. */
export const SHADOW_MATERIAL = new THREE.MeshBasicMaterial({
  color: INK,
  transparent: true,
  opacity: 0.1,
  depthWrite: false,
  fog: false,
});

/**
 * The one direction every shadow in the scene falls, in world units per unit of
 * height. Global, like the face values, and never tuned per object.
 */
export const SHADOW_OFFSET = { x: 0.34, z: 0.14 };

/**
 * How far a flush inlay floats above the surface it is set into. Small enough
 * to read as flush at this camera, large enough that nothing z-fights.
 */
const FLUSH = 0.006;

/* ------------------------------------------------------------------ */
/* The kit                                                             */
/* ------------------------------------------------------------------ */

type Vec3 = [number, number, number];

/**
 * The base unit of the whole world: a rectangular prism, sitting on the ground
 * plane rather than centred on it, because everything in this scene is stacked.
 *
 * `size` is [width (x), height (y), depth (z)] and `at` is the centre of its
 * footprint, so a caller places things in plan and never has to halve a height.
 */
export function Prism({
  at,
  size,
  faces,
  rotateY = 0,
}: {
  at: Vec3;
  size: Vec3;
  faces: Faces;
  /** Quarter turns only. Baked into the geometry so face values stay correct. */
  rotateY?: number;
}) {
  // Destructured so the geometry is rebuilt on a real change of size rather
  // than on every fresh array literal a caller passes.
  const [sx, sy, sz] = size;
  const geo = useMemo(() => {
    const g = new THREE.BoxGeometry(sx, sy, sz);
    g.translate(0, sy / 2, 0);
    if (rotateY) g.rotateY(rotateY);
    return applyFaceValues(g);
  }, [sx, sy, sz, rotateY]);

  return <mesh geometry={geo} material={facesToMaterials(faces)} position={at} />;
}

/**
 * A wall slab with a semicircular arch cut through it (§5, References 1 and 4).
 *
 * Built in the XZ plane and extruded upward, so the arch reads as an opening
 * you could walk through rather than a shape painted on a face.
 */
export function ArchWall({
  at,
  width,
  height,
  thickness,
  archWidth,
  faces,
  rotateY = 0,
}: {
  at: Vec3;
  width: number;
  height: number;
  thickness: number;
  archWidth: number;
  faces: Faces;
  rotateY?: number;
}) {
  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0);
    shape.lineTo(width / 2, 0);
    shape.lineTo(width / 2, height);
    shape.lineTo(-width / 2, height);
    shape.closePath();

    const r = archWidth / 2;
    const springing = Math.min(height * 0.55, height - r - 0.1);
    const hole = new THREE.Path();
    hole.moveTo(-r, 0);
    hole.lineTo(-r, springing);
    // A true semicircle, drawn in the twelve straight steps the rest of the
    // kit's curves use, so nothing in the frame is smoother than anything else.
    for (let i = 1; i <= 12; i++) {
      const t = Math.PI - (i / 12) * Math.PI;
      hole.lineTo(Math.cos(t) * r, springing + Math.sin(t) * r);
    }
    hole.lineTo(r, 0);
    hole.closePath();
    shape.holes.push(hole);

    const g = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: false,
      curveSegments: 1,
    });
    // Extrude builds the shape in XY and pushes it along +Z, which is already
    // a wall standing on the ground facing the camera. Only centre it across
    // its own thickness.
    g.translate(0, 0, -thickness / 2);
    if (rotateY) g.rotateY(rotateY);
    return applyFaceValues(g);
  }, [width, height, thickness, archWidth, rotateY]);

  return <mesh geometry={geo} material={facesToMaterials(faces)} position={at} />;
}

/**
 * A flight of stairs with visible tread ribs, each tread its own box (§5,
 * References 1 and 3). Climbs along +X from `at`.
 */
export function Stairs({
  at,
  treads,
  rise,
  run,
  width,
  faces,
  rotateY = 0,
}: {
  at: Vec3;
  treads: number;
  rise: number;
  run: number;
  width: number;
  faces: Faces;
  rotateY?: number;
}) {
  const geo = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < treads; i++) {
      const h = rise * (i + 1);
      const g = new THREE.BoxGeometry(run, h, width);
      g.translate(run * (i + 0.5), h / 2, 0);
      parts.push(g);
    }
    const merged = mergeGeometries(parts);
    if (rotateY) merged.rotateY(rotateY);
    return applyFaceValues(merged);
  }, [treads, rise, run, width, rotateY]);

  return <mesh geometry={geo} material={facesToMaterials(faces)} position={at} />;
}

/**
 * Regular square notches along a top edge (§5, Reference 4's tower crowns).
 * Runs along X, centred on `at`.
 */
export function Crenellation({
  at,
  length,
  merlon,
  height,
  depth,
  faces,
  rotateY = 0,
}: {
  at: Vec3;
  length: number;
  /** Width of one tooth. The gap between teeth matches it. */
  merlon: number;
  height: number;
  depth: number;
  faces: Faces;
  rotateY?: number;
}) {
  const geo = useMemo(() => {
    const pitch = merlon * 2;
    const n = Math.max(1, Math.floor(length / pitch));
    const span = n * pitch - merlon;
    const parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < n; i++) {
      const g = new THREE.BoxGeometry(merlon, height, depth);
      g.translate(-span / 2 + i * pitch + merlon / 2, height / 2, 0);
      parts.push(g);
    }
    const merged = mergeGeometries(parts);
    if (rotateY) merged.rotateY(rotateY);
    return applyFaceValues(merged);
  }, [length, merlon, height, depth, rotateY]);

  return <mesh geometry={geo} material={facesToMaterials(faces)} position={at} />;
}

/**
 * A cylinder capped with a hemisphere (§5, References 1 and 4). Twelve sides,
 * so it faces the same way the tables do and nothing in the frame is round.
 */
export function Dome({
  at,
  radius,
  shaft,
  faces,
}: {
  at: Vec3;
  radius: number;
  /** Height of the straight cylinder under the cap. */
  shaft: number;
  faces: Faces;
}) {
  const geo = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    if (shaft > 0) {
      const c = new THREE.CylinderGeometry(radius, radius, shaft, 12, 1, true);
      c.translate(0, shaft / 2, 0);
      parts.push(c);
    }
    const cap = new THREE.SphereGeometry(radius, 12, 4, 0, Math.PI * 2, 0, Math.PI / 2);
    cap.translate(0, shaft, 0);
    parts.push(cap);
    return applyFaceValues(mergeGeometries(parts));
  }, [radius, shaft]);

  return <mesh geometry={geo} material={facesToMaterials(faces)} position={at} />;
}

/**
 * Thin vertical window slits at the spec's 1:6 ratio (§5), set into a face as
 * flush inlays rather than cut through it.
 *
 * `facing` is the world direction the wall's face points. Only the two faces
 * the camera can see are ever worth slitting.
 */
export function WindowSlits({
  at,
  count,
  height,
  spacing,
  facing,
  color,
}: {
  at: Vec3;
  count: number;
  height: number;
  spacing: number;
  facing: "+x" | "+z";
  color: string;
}) {
  const width = height / 6;
  const geo = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const span = (count - 1) * spacing;
    for (let i = 0; i < count; i++) {
      const g = new THREE.PlaneGeometry(width, height);
      g.translate(-span / 2 + i * spacing, height / 2, 0);
      parts.push(g);
    }
    const merged = mergeGeometries(parts);
    if (facing === "+x") merged.rotateY(Math.PI / 2);
    return merged;
  }, [count, height, spacing, width, facing]);

  return <mesh geometry={geo} material={flat(color)} position={at} />;
}

/**
 * The repeating border every platform in every reference carries (§7).
 *
 * Sits 0.15 units in from the platform edge and repeats every 0.4. The caller
 * passes the surface colour and a lightness delta; the delta is clamped to the
 * spec's 12% ceiling here rather than trusted to the call site, because
 * high-contrast ornament is the single fastest way to lose the style.
 */
export function Ornament({
  at,
  width,
  depth,
  surface,
  delta = 0.07,
}: {
  at: Vec3;
  width: number;
  depth: number;
  surface: string;
  delta?: number;
}) {
  const color = useMemo(() => shiftLightness(surface, -Math.min(Math.abs(delta), 0.12)), [surface, delta]);

  const geo = useMemo(() => {
    const inset = 0.15;
    const pitch = 0.4;
    const s = 0.11; // half-diagonal of one diamond
    const w = width / 2 - inset;
    const d = depth / 2 - inset;
    const parts: THREE.BufferGeometry[] = [];

    const diamond = (x: number, z: number) => {
      const g = new THREE.PlaneGeometry(s * 2, s * 2);
      g.rotateX(-Math.PI / 2);
      g.rotateY(Math.PI / 4);
      g.translate(x, 0, z);
      parts.push(g);
    };

    const nx = Math.max(1, Math.floor((w * 2) / pitch));
    const nz = Math.max(1, Math.floor((d * 2) / pitch));
    for (let i = 0; i <= nx; i++) {
      const x = -w + (i * (w * 2)) / nx;
      diamond(x, -d);
      diamond(x, d);
    }
    for (let i = 1; i < nz; i++) {
      const z = -d + (i * (d * 2)) / nz;
      diamond(-w, z);
      diamond(w, z);
    }
    return mergeGeometries(parts);
  }, [width, depth]);

  return (
    <mesh
      geometry={geo}
      material={flat(color)}
      position={[at[0], at[1] + FLUSH, at[2]]}
      renderOrder={1}
    />
  );
}

/** A small square tile set flush into a floor (§5, Reference 2). */
export function InlayTile({
  at,
  size,
  color,
}: {
  at: Vec3;
  size: number;
  color: string;
}) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(size, size);
    g.rotateX(-Math.PI / 2);
    return g;
  }, [size]);
  return (
    <mesh
      geometry={geo}
      material={flat(color)}
      position={[at[0], at[1] + FLUSH, at[2]]}
      renderOrder={1}
    />
  );
}

/**
 * §6's shadow: one flat polygon per object, hard-edged, offset in the scene's
 * single global direction and scaled by how far the object stands off the
 * surface beneath it.
 */
export function FlatShadow({
  at,
  width,
  depth,
  height,
}: {
  at: Vec3;
  width: number;
  depth: number;
  /** How tall the caster is. Only used to length the offset. */
  height: number;
}) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, depth);
    g.rotateX(-Math.PI / 2);
    return g;
  }, [width, depth]);

  return (
    <mesh
      geometry={geo}
      material={SHADOW_MATERIAL}
      position={[
        at[0] + SHADOW_OFFSET.x * height,
        at[1] + 0.004,
        at[2] + SHADOW_OFFSET.z * height,
      ]}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Merge non-indexed or indexed geometries that share an attribute layout.
 *
 * Written here rather than pulled from `three/examples` because the kit only
 * ever merges its own output: position-only, same layout, no morph targets.
 */
export function mergeGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const positions: number[] = [];
  for (const g of geos) {
    const src = g.toNonIndexed();
    const p = src.getAttribute("position");
    for (let i = 0; i < p.count; i++) {
      positions.push(p.getX(i), p.getY(i), p.getZ(i));
    }
    src.dispose();
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return out;
}

/** Move a hex along the lightness axis only, leaving hue and saturation. */
export function shiftLightness(hex: string, delta: number): string {
  const n = parseInt(hex.slice(1), 16);
  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
  const max = Math.max(...rgb);
  const min = Math.min(...rgb);
  const l = (max + min) / 2;
  const target = Math.min(1, Math.max(0, l + delta));
  const k = l === 0 ? 0 : target / l;
  const out = rgb
    .map((v) => Math.round(Math.min(1, v * k) * 255).toString(16).padStart(2, "0"))
    .join("");
  return `#${out}`;
}
