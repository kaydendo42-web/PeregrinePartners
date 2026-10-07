import assert from "node:assert/strict";
import { pathToFileURL, fileURLToPath } from "node:url";
import { mkdir, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import puppeteer from "puppeteer-core";

const engine = process.env.CRM_UI_BUNDLER;
if (!engine)
  throw new Error(
    "Set CRM_UI_BUNDLER to an esbuild lib/main.js path outside the app.",
  );
const { build } = await import(pathToFileURL(engine).href);
const out = new URL(
  "../../../docs/owner-dashboard-captures/forms-test.js",
  import.meta.url,
);
await mkdir(
  new URL("../../../docs/owner-dashboard-captures/", import.meta.url),
  { recursive: true },
);
await build({
  entryPoints: [fileURLToPath(new URL("./forms.jsx", import.meta.url))],
  outfile: fileURLToPath(out),
  bundle: true,
  platform: "browser",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"', "process.env": "{}" },
  alias: {
    "@/app/owner/outreach/actions": fileURLToPath(
      new URL("./actions.js", import.meta.url),
    ),
    "@/lib/supabase/browser": fileURLToPath(
      new URL("./supabase.js", import.meta.url),
    ),
  },
});
const browser = await puppeteer.launch({
  executablePath:
    process.env.CRM_UI_BROWSER ??
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--no-sandbox"],
});
const server = createServer((_req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.end(
    '<!doctype html><html><body><div id="root"></div><div id="queue"></div><div id="lifecycle"></div></body></html>',
  );
});
try {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const page = await browser.newPage();
  page.on("pageerror", (error) =>
    console.error("Browser harness:", error.message),
  );
  await page.goto("http://127.0.0.1:" + server.address().port);
  await page.addScriptTag({ content: await readFile(out, "utf8") });
  await page.waitForSelector("#activity textarea");
  const failures = [];
  for (const [section, kind, field] of [
    ["activity", "activity", "textarea"],
    ["contact", "contact", "input[type=text]"],
    ["follow-up", "followUp", "textarea"],
  ]) {
    const selector = "#" + section + " " + field;
    await page.$eval(selector, (e) => {
      e.focus();
      e.select();
    });
    await page.keyboard.type("Submitted draft");
    const before = await page.$eval(selector, (e) => e.value);
    await page.click(
      "#" +
        section +
        " button[type=submit], #" +
        section +
        " button:not([type])",
    );
    await page.waitForFunction(
      (k) => Boolean(window.crmTestRequests?.[k]),
      {},
      kind,
    );
    await page.focus(selector);
    await page.keyboard.type(" UNSAVED");
    try {
      assert.equal(
        await page.$eval(selector, (e) => e.value),
        before,
        section + " must protect edits during a pending save",
      );
    } catch (error) {
      failures.push(error.message);
    }
    await page.evaluate((k) => {
      const pending = window.crmTestRequests[k];
      const input = k === "followUp" ? pending.args[0] : pending.args[1];
      pending.resolve({
        ok: true,
        value: {
          ...input,
          id: input.id ?? "00000000-0000-4000-8000-000000000201",
          version: 2,
        },
      });
    }, kind);
    await page.waitForFunction(
      (s) => !document.querySelector(s).matches(":disabled"),
      {},
      selector,
    );
    console.log("Checked delayed save input protection:", section);
  }
  try {
    assert.ok(
      await page.$eval(
        "#contact",
        (e) =>
          e.textContent.includes("Rating [3]") && e.textContent.includes("4.8"),
      ),
      "Linked contact source fields must be inspectable",
    );
  } catch (error) {
    failures.push(error.message);
  }
  assert.deepEqual(failures, []);
  console.log("Passed linked-contact source visibility");
  await page.$eval("#queue details", (e) => {
    e.open = true;
  });
  await page.focus("#queue textarea");
  await page.keyboard.type(" unsaved next step");
  const queueDraft = await page.$eval("#queue textarea", (e) => e.value);
  await page.evaluate(() => window.crmRenderQueue(false));
  await page.waitForFunction(() =>
    document.querySelector("#queue").textContent.includes("no longer matches"),
  );
  assert.equal(
    await page.$eval("#queue textarea", (e) => e.value),
    queueDraft,
    "A removed filtered row must retain its draft",
  );
  console.log("Passed filtered follow-up draft retention");
  for (const kind of ["sign-out", "unmount"]) {
    await page.evaluate((k) => window.crmRenderLive(true, k), kind);
    await page.waitForFunction(() => window.crmAuthStarted);
    await page.evaluate((k) => {
      if (k === "sign-out") window.crmTestSignOut();
      else window.crmRenderLive(false, k);
    }, kind);
    await page.waitForFunction(
      () => !document.querySelector("#lifecycle #private-data"),
    );
    await page.evaluate(async () => {
      window.crmResolveAuth();
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    assert.equal(
      await page.evaluate(() => window.crmLifecycleStats.subscribed),
      0,
      "Late authorization must not subscribe after " + kind,
    );
    console.log("Passed late realtime authorization after", kind);
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
