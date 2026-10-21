// App Store header / featuring artwork: 5244×2950 and 3840×1646, with and without the logo.
// Background = the real game renderer (shot mode `?shot=header`), logo drawn on top.
// Usage: npm run store:header   (starts its own Vite server)
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { openChrome } from './cdp.mjs';
import { drawLogo, registerFonts } from './logo.mjs';

const PORT = 5198;
const APP = `http://localhost:${PORT}`;
const OUT = 'store/ios/header';
// size, CSS viewport (× dpr = pixels), zoom (world units visible vertically), car height, logo width / centre height
const FORMATS = [
  { name: '5244x2950', w: 2622, h: 1475, dpr: 2, viewh: 560, cy: 0.68, logoW: 0.44, logoY: 0.3 },
  { name: '3840x1646', w: 1920, h: 823, dpr: 2, viewh: 470, cy: 0.7, logoW: 0.34, logoY: 0.31 },
];

registerFonts();
mkdirSync(OUT, { recursive: true });

const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
process.on('exit', () => vite.kill());
for (let i = 0; i < 60; i++) {
  try {
    await fetch(APP);
    break;
  } catch {
    await new Promise((r) => setTimeout(r, 300));
  }
}

const chrome = await openChrome(9334);
for (const f of FORMATS) {
  const png = await chrome.capture(`${APP}/?shot=header&lang=en&viewh=${f.viewh}&cy=${f.cy}&t=${Date.now()}`, { w: f.w, h: f.h, dpr: f.dpr, title: 'shot:header' });
  const bg = await loadImage(png);
  const W = f.w * f.dpr;
  const H = f.h * f.dpr;

  // 1) clean key art (no text)
  const clean = createCanvas(W, H);
  clean.getContext('2d').drawImage(bg, 0, 0, W, H);
  writeFileSync(`${OUT}/header-${f.name}-nologo.png`, clean.toBuffer('image/png'));

  // 2) with the logo: soft shade at the top for legibility, logo centred (crop-safe)
  const c = createCanvas(W, H);
  const ctx = c.getContext('2d');
  ctx.drawImage(bg, 0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, 0, H * 0.62);
  g.addColorStop(0, 'rgba(22,40,12,.55)');
  g.addColorStop(1, 'rgba(22,40,12,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  drawLogo(ctx, W / 2, H * f.logoY, W * f.logoW);
  writeFileSync(`${OUT}/header-${f.name}.png`, c.toBuffer('image/png'));
}
chrome.close();
vite.kill();

// App Store artwork: flatten to RGB (no alpha channel)
execFileSync('python3', ['-c', `
import glob
from PIL import Image
for p in glob.glob('${OUT}/*.png'):
    Image.open(p).convert('RGB').save(p)
`]);
console.log(`header artwork written to ${OUT}`);
process.exit(0);
