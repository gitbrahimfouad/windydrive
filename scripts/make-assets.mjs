// Generates the app icon / splash masters in ./assets from the Claude Design logo.
// Run: npm run assets
import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync } from 'node:fs';
import { BG, drawLogo, registerFonts } from './logo.mjs';

registerFonts();

/** Logo width as a fraction `k` of the canvas, centred. */
function logo(ctx, size, k) {
  drawLogo(ctx, size / 2, size / 2, size * k);
}

function make(file, size, { bg, k }) {
  const c = createCanvas(size, size);
  const ctx = c.getContext('2d');
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);
  }
  if (k) logo(ctx, size, k);
  writeFileSync(file, c.toBuffer('image/png'));
  console.log('wrote', file);
}

make('assets/icon-only.png', 1024, { bg: BG, k: 0.84 }); // iOS / legacy Android
make('assets/icon-foreground.png', 1024, { k: 0.5 }); // adaptive: logo inside the 66/108 safe zone
make('assets/icon-background.png', 1024, { bg: BG });
make('assets/splash.png', 2732, { bg: BG, k: 0.46 });
make('assets/splash-dark.png', 2732, { bg: BG, k: 0.46 });
