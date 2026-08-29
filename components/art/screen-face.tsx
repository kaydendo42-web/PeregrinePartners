"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * The plate's natural size, and the television's lit screen inside it.
 *
 * Both were measured off the file rather than eyeballed. Thresholding the
 * plate's luminance above 248 isolates the saturated glass, and that mask
 * gives four numbers that matter: the left edge is vertical at x 1370 and runs
 * y 566 to 662, the right edge is vertical at x 1499 and runs y 580 to 668.
 *
 * Verticals staying vertical while the top and bottom slope is a shear, not a
 * rotation. That distinction is the whole difference between the face sitting
 * on the glass and sitting on top of the photograph. Rotating instead puts the
 * box's own corners outside the bezel, because the rectangle being rotated is
 * the bounding box of a shape that is already leaning.
 *
 * The centre line falls from y 614 on the left to 624 on the right, so the
 * shear is atan(10 / 129), and the box to shear is the mean of the two edge
 * heights (92) centred on that line. The real screen is a trapezoid rather
 * than a parallelogram, the right edge being the shorter, so this leaves about
 * two plate pixels of error at each corner. That is under a pixel and a half
 * on screen at 1440, and no transform available in CSS closes it.
 */
const PLATE = { w: 2832, h: 1318 };
const SCREEN = { x: 0.48375, y: 0.43475, w: 0.04555, h: 0.0698 };
const SCREEN_SHEAR = 4.43;

const EYE_LERP = 0.12;
const EYE_EPSILON = 0.002;
const EYE_MAX = { x: 1.35, y: 0.9 };
const EYE_BASE = {
  left: { x: 4, y: 5 },
  right: { x: 10, y: 5 },
};

/**
 * Warm rather than neutral, and multiplied rather than laid over.
 *
 * The glass is blown out to white in the middle and falls off to orange at the
 * bezel, so a flat black at a flat opacity is the same darkness in both places
 * and belongs to neither. Multiplying a warm brown lets the screen's own
 * gradient come through the pixels: the face is palest where the bloom is
 * hottest and deepest where the glass has already turned.
 */
const FILL = "#3d2113";

/**
 * The tube is never quite steady, and the glare is where that shows.
 *
 * Only the glare layer carries this. It sits in front of the face, so a surge
 * washes the face out and a dip lets it back in, which is one coherent effect
 * rather than two things dimming at once. `steps(1, end)` because a tube jumps
 * between levels; a tween reads as a CSS animation, which is what it is.
 */
const FLICKER_KEYFRAMES = `
@keyframes screen-face-flicker {
  0%, 100% { opacity: 1; }
  17% { opacity: 0.955; }
  19% { opacity: 1; }
  46% { opacity: 0.976; }
  48% { opacity: 1; }
  73% { opacity: 0.94; }
  75% { opacity: 1; }
}`;

type Box = { left: number; top: number; width: number; height: number };

const ZERO_BOX: Box = { left: 0, top: 0, width: 0, height: 0 };

const clamp = (value: number) => Math.max(-1, Math.min(1, value));

export function ScreenFace() {
  const rootRef = useRef<HTMLDivElement>(null);
  const leftEyeRef = useRef<SVGRectElement>(null);
  const rightEyeRef = useRef<SVGRectElement>(null);
  const frameRef = useRef<number | null>(null);
  const currentRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });

  const [screenBox, setScreenBox] = useState<Box>(ZERO_BOX);
  const [isBlinking, setIsBlinking] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  /**
   * The face belongs to the photograph, not to the viewport, so the plate's
   * cover crop has to be solved again here. Percentages cannot do this: under
   * `object-cover` the image is scaled to the larger of the two ratios and then
   * centred, so the screen's position in the container depends on the
   * container's aspect ratio, which the hero changes at every breakpoint and
   * again whenever a phone retracts its address bar.
   */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const measure = () => {
      const { width: cw, height: ch } = root.getBoundingClientRect();
      const scale = Math.max(cw / PLATE.w, ch / PLATE.h);
      const drawnW = PLATE.w * scale;
      const drawnH = PLATE.h * scale;
      const originX = (cw - drawnW) / 2;
      const originY = (ch - drawnH) / 2;

      setScreenBox({
        left: originX + SCREEN.x * drawnW,
        top: originY + SCREEN.y * drawnH,
        width: SCREEN.w * drawnW,
        height: SCREEN.h * drawnH,
      });
    };

    const observer = new ResizeObserver(measure);
    measure();
    observer.observe(root);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);

    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);

  /**
   * The eyes are written straight onto the two rects rather than held in state.
   * A lerp that ran through React would re-render the glass and its two washes
   * sixty times a second to move two numbers.
   */
  useEffect(() => {
    if (reducedMotion || screenBox.width === 0) return;

    const paint = () => {
      const { x, y } = currentRef.current;
      leftEyeRef.current?.setAttribute("x", String(EYE_BASE.left.x + x));
      leftEyeRef.current?.setAttribute("y", String(EYE_BASE.left.y + y));
      rightEyeRef.current?.setAttribute("x", String(EYE_BASE.right.x + x));
      rightEyeRef.current?.setAttribute("y", String(EYE_BASE.right.y + y));
    };

    const animate = () => {
      const current = currentRef.current;
      const target = targetRef.current;
      const next = {
        x: current.x + (target.x - current.x) * EYE_LERP,
        y: current.y + (target.y - current.y) * EYE_LERP,
      };
      const settled =
        Math.abs(target.x - next.x) < EYE_EPSILON &&
        Math.abs(target.y - next.y) < EYE_EPSILON;

      currentRef.current = settled ? { ...target } : next;
      paint();

      if (settled) {
        frameRef.current = null;
        return;
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    const track = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root) return;

      const rootBox = root.getBoundingClientRect();
      const centerX = rootBox.left + screenBox.left + screenBox.width / 2;
      const centerY = rootBox.top + screenBox.top + screenBox.height / 2;
      const falloff = Math.hypot(window.innerWidth, window.innerHeight) / 2;

      targetRef.current = {
        x: clamp((event.clientX - centerX) / falloff) * EYE_MAX.x,
        y: clamp((event.clientY - centerY) / falloff) * EYE_MAX.y,
      };

      if (frameRef.current === null) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    window.addEventListener("pointermove", track, { passive: true });

    return () => {
      window.removeEventListener("pointermove", track);
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [screenBox, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) {
      setIsBlinking(false);
      return;
    }

    let cycle: number | null = null;
    let blink: number | null = null;

    const schedule = () => {
      cycle = window.setTimeout(
        () => {
          setIsBlinking(true);
          blink = window.setTimeout(() => {
            setIsBlinking(false);
            schedule();
          }, 110);
        },
        4000 + Math.random() * 3000,
      );
    };

    schedule();

    return () => {
      if (cycle !== null) window.clearTimeout(cycle);
      if (blink !== null) window.clearTimeout(blink);
    };
  }, [reducedMotion]);

  /**
   * The glass, twice.
   *
   * `skewY` creates a stacking context, and a stacking context isolates
   * blending. Any `mix-blend-mode` set on a child of the sheared box therefore
   * composites against transparency rather than against the photograph, which
   * is the difference between the face taking the tube's colour and the face
   * being a brown shape the tube happens to sit behind.
   *
   * So the blend modes go on the sheared boxes themselves and the boxes are
   * siblings: everything painted on the phosphor multiplies down onto the
   * plate, and the glare is a second box in front of the result. That order is
   * also the physical one. The bloom washing out the middle of the tube has to
   * wash out the middle of the face too, or the face is the only object in the
   * frame the camera managed to expose correctly.
   */
  const glassStyle: CSSProperties = {
    position: "absolute",
    left: screenBox.left,
    top: screenBox.top,
    width: screenBox.width,
    height: screenBox.height,
    transform: `skewY(${SCREEN_SHEAR}deg)`,
    borderRadius: "7% / 9%",
  };

  /**
   * The glass has no edge in the photograph, so it must not have one here.
   *
   * Light from a tube this blown out spills past its own bezel, which is why
   * the plate has an orange halo standing off the set on every side. Clipping
   * the scanlines and the glare to a hard rounded rectangle puts a crisp
   * boundary inside that halo, and a crisp boundary is the one thing a lens
   * this overexposed could not have produced. Feathering the last fifth of the
   * box hands the edge back to the photograph.
   */
  const FEATHER =
    "radial-gradient(76% 80% at 50% 48%, #000 58%, rgba(0,0,0,0.55) 86%, rgba(0,0,0,0) 100%)";

  const blinkShift = isBlinking ? 1 : 0;
  const eyeHeight = isBlinking ? 1 : 2;

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="pointer-events-none absolute inset-0"
    >
      <style>{FLICKER_KEYFRAMES}</style>

      <div
        style={{
          ...glassStyle,
          overflow: "hidden",
          mixBlendMode: "multiply",
          maskImage: FEATHER,
          WebkitMaskImage: FEATHER,
        }}
      >
        <svg
          className="absolute"
          style={{
            left: "9%",
            top: "9%",
            width: "82%",
            height: "82%",
          }}
          viewBox="0 0 16 12"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Wider than it is tall, because a tube smears horizontally: the
                beam is still settling as it crosses, so a hard vertical edge
                trails to its right and a hard horizontal one does not. It also
                keeps the corners from being the only thing in the photograph
                the camera resolved perfectly. */}
            <filter
              id="screen-face-bloom"
              x="-40%"
              y="-40%"
              width="180%"
              height="180%"
            >
              <feGaussianBlur stdDeviation="0.2 0.08" />
            </filter>
          </defs>

          <g filter="url(#screen-face-bloom)" opacity="0.9">
            <rect
              ref={leftEyeRef}
              x={EYE_BASE.left.x}
              y={EYE_BASE.left.y + blinkShift}
              width="2"
              height={eyeHeight}
              fill={FILL}
            />
            <rect
              ref={rightEyeRef}
              x={EYE_BASE.right.x}
              y={EYE_BASE.right.y + blinkShift}
              width="2"
              height={eyeHeight}
              fill={FILL}
            />
            {/* The smile is a floor and two lifted corners, spanning the same
                five to eleven the eyes span, so it centres on the same axis.
                One cell of lift, not two: at four pixels a cell, two turns the
                mouth into a bowl and the face into a mascot. */}
            <rect x="6" y="9" width="4" height="1" fill={FILL} />
            <rect x="5" y="8" width="1" height="1" fill={FILL} />
            <rect x="10" y="8" width="1" height="1" fill={FILL} />
          </g>
        </svg>

        {/* Scanlines over the whole glass rather than over the face, so the
            face has no edge of its own to give it away.

            Masked out of the middle, because that is where the tube is blown
            out and a blown-out highlight has no line structure left in it. Left
            unmasked they are a flat grid, and a flat grid over a photograph is
            a texture rather than a tube. */}
        <div
          className="absolute inset-0"
          style={{
            opacity: 0.18,
            backgroundImage:
              "repeating-linear-gradient(to bottom, rgba(74,40,22,0.5) 0px, rgba(74,40,22,0.5) 1px, rgba(74,40,22,0) 1px, rgba(74,40,22,0) 2.5px)",
            maskImage:
              "radial-gradient(58% 62% at 47% 45%, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,1) 100%)",
            WebkitMaskImage:
              "radial-gradient(58% 62% at 47% 45%, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,1) 100%)",
          }}
        />

        {/* The tube falls off into its own corners. White is the identity for
            multiply, so the middle is left alone and only the corners take it.

            Kept faint, and kept red rather than brown. The plate is already
            hot orange at the bezel, so a heavy neutral vignette here darkens
            the one part of the glass the photograph has burning, and the tube
            grows a grey ring it never had. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(72% 78% at 50% 47%, rgba(255,255,255,0) 56%, rgba(168,72,28,0.2) 100%)",
          }}
        />
      </div>

      <div
        style={{
          ...glassStyle,
          mixBlendMode: "plus-lighter",
          background:
            "radial-gradient(58% 62% at 47% 45%, rgba(255,246,232,0.4) 0%, rgba(255,238,214,0.15) 55%, rgba(255,232,204,0) 100%)",
          maskImage: FEATHER,
          WebkitMaskImage: FEATHER,
          animation: reducedMotion
            ? undefined
            : "screen-face-flicker 5.5s steps(1, end) infinite",
        }}
      />
    </div>
  );
}
