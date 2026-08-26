/** Render app/apple-icon.png (180x180) from the same mark as app/icon.svg. */
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const svg = readFileSync('app/icon.svg', 'utf8');
writeFileSync(
  'public/_icon.html',
  `<!doctype html><meta charset="utf-8"><style>*{margin:0;padding:0}body{width:180px;height:180px}svg{width:180px;height:180px;display:block}</style>${svg}`,
);

const b = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  defaultViewport: { width: 180, height: 180, deviceScaleFactor: 1 },
});
const p = await b.newPage();
await p.goto('http://localhost:3001/_icon.html', { waitUntil: 'networkidle0', timeout: 60000 });
await p.screenshot({ path: 'app/apple-icon.png' });
await b.close();
unlinkSync('public/_icon.html');
console.log('wrote app/apple-icon.png');
