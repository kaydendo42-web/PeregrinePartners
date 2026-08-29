import puppeteer from 'puppeteer-core';
const PORT = process.env.PORT || 3001;
const b = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
});
for (const path of ['/', '/about', '/platform']) {
  for (const w of [1440, 390]) {
    const p = await b.newPage();
    await p.setViewport({ width: w, height: 900, deviceScaleFactor: 1 });
    await p.goto(`http://localhost:${PORT}${path}`, { waitUntil: 'networkidle2' });
    await p.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await new Promise(r => setTimeout(r, 600));

    // Every .band / .band-bleed / .section-card block: its own padding + measure edges
    const rows = await p.evaluate(() => {
      const sel = '.band, .band-bleed, .section-card';
      return [...document.querySelectorAll(sel)].map((el, i) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const m = el.querySelector('.measure');
        const mr = m ? m.getBoundingClientRect() : null;
        const label = (el.closest('section')?.id || el.id || el.className.split(' ')[0] || '?');
        return {
          i,
          label,
          cls: el.className.split(' ').slice(0, 3).join(' '),
          pt: parseFloat(cs.paddingTop),
          pb: parseFloat(cs.paddingBottom),
          px: parseFloat(cs.paddingLeft),
          h: Math.round(r.height),
          measure: mr ? `${Math.round(mr.left)}..${Math.round(mr.right)}` : null,
        };
      });
    });
    console.log(`\n=== ${path} @ ${w} ===`);
    for (const r of rows) {
      console.log(
        `${String(r.i).padStart(2)} ${r.label.padEnd(10)} pt=${String(r.pt).padStart(5)} pb=${String(r.pb).padStart(5)} px=${String(r.px).padStart(4)} measure=${r.measure ?? '-'}  [${r.cls}]`
      );
    }
    await p.close();
  }
}
await b.close();
