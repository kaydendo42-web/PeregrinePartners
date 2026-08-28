import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";

const base = process.env.PEREGRINE_URL ?? "http://localhost:3001";
const browser = await puppeteer.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: "new",
});

async function inspect(width, reducedMotion = false) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
  if (reducedMotion) {
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
  }
  await page.goto(`${base}/about`, {
    waitUntil: "networkidle2",
    timeout: 120_000,
  });

  const result = await page.evaluate(() => {
    const hero = document.querySelector("[data-about-hero]");
    const art = document.querySelector("[data-about-hero-art]");
    const heroCopy = document.querySelector("[data-about-hero-copy]");
    const origin = document.querySelector("[data-about-origin-visual]");
    const originImage = origin?.querySelector("img");
    const artPiece = art?.querySelector("[data-art-piece]");
    const nowArt = document.querySelector("[data-about-now-art]");
    const all = [...document.querySelectorAll("body *")];
    const overflow = all
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return (
          rect.width > 0 &&
          rect.right > innerWidth + 2 &&
          style.position !== "fixed" &&
          !element.closest(".marquee")
        );
      })
      .map((element) => `${element.tagName}.${String(element.className).slice(0, 48)}`)
      .slice(0, 6);

    return {
      heroFound: Boolean(hero),
      artFound: Boolean(art),
      copyFound: Boolean(heroCopy),
      originFound: Boolean(origin),
      originSrc: originImage?.getAttribute("src") ?? "",
      originReady: Boolean(
        originImage?.complete && (originImage.naturalWidth ?? 0) >= 1200,
      ),
      nowArtFound: Boolean(nowArt),
      artOnRight:
        Boolean(hero && art) &&
        art.getBoundingClientRect().left >=
          hero.getBoundingClientRect().left + hero.getBoundingClientRect().width * 0.45,
      copyAboveArt:
        Boolean(heroCopy && art) &&
        Number(getComputedStyle(heroCopy).zIndex || 0) >
          Number(getComputedStyle(art).zIndex || 0),
      artTransform: artPiece ? getComputedStyle(artPiece).transform : "missing",
      overflow,
    };
  });

  await page.close();
  return result;
}

try {
  const desktop = await inspect(1440);
  assert.equal(desktop.heroFound, true, "the About hero must expose its visual frame");
  assert.equal(desktop.artFound, true, "the About hero must contain the commissioned artwork");
  assert.equal(desktop.copyFound, true, "the About hero copy must remain a separate readable layer");
  assert.equal(desktop.artOnRight, true, "the commissioned artwork must occupy the hero's right side");
  assert.equal(desktop.copyAboveArt, true, "hero copy must stay above the decorative art layer");
  assert.equal(desktop.originFound, true, "the origin story must expose its editorial visual");
  assert.match(desktop.originSrc, /south-yarra-cafe/, "the origin story must use the new cafe image");
  assert.equal(desktop.originReady, true, "the origin image must load at editorial resolution");
  assert.equal(desktop.nowArtFound, false, "the closing About block must not show the paper stack");
  assert.deepEqual(desktop.overflow, [], `desktop overflow: ${desktop.overflow.join(", ")}`);

  const mobile = await inspect(390);
  assert.equal(mobile.artFound, true, "the hero artwork must remain present on mobile");
  assert.equal(mobile.nowArtFound, false, "the closing paper stack must stay removed on mobile");
  assert.equal(mobile.copyAboveArt, true, "mobile hero copy must stay above the art layer");
  assert.deepEqual(mobile.overflow, [], `mobile overflow: ${mobile.overflow.join(", ")}`);

  const reduced = await inspect(1440, true);
  assert.equal(
    reduced.artTransform,
    "none",
    "reduced motion must render the hero artwork without spatial movement",
  );

  console.log("About acceptance passed at 1440px, 390px, and reduced motion.");
} finally {
  await browser.close();
}
