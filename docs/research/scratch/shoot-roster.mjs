import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
});
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 2 });
await p.goto('http://localhost:3001/', { waitUntil: 'networkidle0' });
// walk the page so every Reveal fires
for (let i = 0; i < 30; i++) {
  await p.evaluate(() => window.scrollBy(0, window.innerHeight * 0.8));
  await new Promise(r => setTimeout(r, 120));
}
await p.evaluate(() => document.querySelector('#roster').scrollIntoView({ block: 'center' }));
await new Promise(r => setTimeout(r, 1600));
await p.screenshot({ path: `${process.argv[2]}/roster.png` });
await b.close();
console.log('done');
