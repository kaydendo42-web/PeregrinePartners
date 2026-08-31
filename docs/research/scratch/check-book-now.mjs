/**
 * Acceptance check for the Book a Session form CTA.
 *
 * Run with the app already serving locally:
 *   node docs/research/scratch/check-book-now.mjs [base-url]
 */
import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";

const base = process.argv[2] ?? "http://localhost:3000";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
});

async function inspect({ reducedMotion = false } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  if (reducedMotion) {
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
  }

  await page.goto(`${base}/waitlist`, {
    waitUntil: "networkidle2",
    timeout: 120_000,
  });

  const button = await page.waitForSelector("form button[type='submit']");
  assert(button, "the booking form must expose a submit button");

  const atRest = await button.evaluate((element) => {
    const label = element.querySelector("[data-book-now-label]");
    const arrows = [...element.querySelectorAll("[data-book-now-arrow]")];
    const rect = element.getBoundingClientRect();
    const labelRect = label?.getBoundingClientRect();

    return {
      text: element.textContent?.replace(/\s+/g, " ").trim(),
      tag: element.tagName,
      type: element.getAttribute("type"),
      draggable: element.getAttribute("draggable"),
      width: rect.width,
      height: rect.height,
      label: labelRect
        ? { left: labelRect.left, right: labelRect.right }
        : null,
      arrows: arrows.map((arrow) => {
        const arrowRect = arrow.getBoundingClientRect();
        return {
          center: arrowRect.left + arrowRect.width / 2,
          side: arrow.getAttribute("data-book-now-arrow"),
        };
      }),
    };
  });

  assert.equal(atRest.text, "Book Now", "the action must use the requested wording");
  assert.equal(atRest.tag, "BUTTON", "the CTA must be a real button, not a slider link");
  assert.equal(atRest.type, "submit", "the CTA must continue to submit the form");
  assert.equal(atRest.draggable, null, "the CTA must not expose a drag interaction");
  assert(atRest.width >= 190, "the bilateral CTA must have a generous tap target");
  assert(atRest.height >= 56, "the booking CTA must remain easy to tap");
  assert(atRest.label, "the booking CTA must expose a centred label");
  assert.equal(atRest.arrows.length, 2, "the label must be framed by two inward arrows");

  const left = atRest.arrows.find((arrow) => arrow.side === "left");
  const right = atRest.arrows.find((arrow) => arrow.side === "right");
  assert(left && right, "the CTA must have a left and a right arrow");
  assert(left.center < atRest.label.left, "the left arrow must sit before the label");
  assert(right.center > atRest.label.right, "the right arrow must sit after the label");

  await button.hover();
  await new Promise((resolve) => setTimeout(resolve, 350));

  const hovered = await button.evaluate((element) =>
    [...element.querySelectorAll("[data-book-now-arrow]")].map((arrow) => {
      const rect = arrow.getBoundingClientRect();
      return {
        center: rect.left + rect.width / 2,
        side: arrow.getAttribute("data-book-now-arrow"),
      };
    }),
  );

  await page.close();
  return { atRest, hovered };
}

try {
  const moving = await inspect();
  const movingLeft = moving.hovered.find((arrow) => arrow.side === "left");
  const movingRight = moving.hovered.find((arrow) => arrow.side === "right");
  const restingLeft = moving.atRest.arrows.find((arrow) => arrow.side === "left");
  const restingRight = moving.atRest.arrows.find((arrow) => arrow.side === "right");

  assert(
    movingLeft.center > restingLeft.center + 2,
    "the left arrow must travel inward on hover",
  );
  assert(
    movingRight.center < restingRight.center - 2,
    "the right arrow must travel inward on hover",
  );

  const reduced = await inspect({ reducedMotion: true });
  const reducedLeft = reduced.hovered.find((arrow) => arrow.side === "left");
  const reducedRight = reduced.hovered.find((arrow) => arrow.side === "right");
  const reducedRestingLeft = reduced.atRest.arrows.find((arrow) => arrow.side === "left");
  const reducedRestingRight = reduced.atRest.arrows.find((arrow) => arrow.side === "right");

  assert(
    Math.abs(reducedLeft.center - reducedRestingLeft.center) < 0.5,
    "the left arrow must stay still when reduced motion is requested",
  );
  assert(
    Math.abs(reducedRight.center - reducedRestingRight.center) < 0.5,
    "the right arrow must stay still when reduced motion is requested",
  );

  console.log("Book Now CTA: PASS");
} finally {
  await browser.close();
}
