// Draws the Windy Drive logo (Claude Design) on a 2D canvas context. Shared by icon/splash/feature-graphic scripts.
import { GlobalFonts } from '@napi-rs/canvas';

export const BG = '#1d3a33';
export const COBALT = '#2563eb';
export const YELLOW = '#ffc21a';

export function registerFonts() {
  if (!GlobalFonts.registerFromPath('src/assets/fonts/BowlbyOne-latin.woff2', 'Bowlby One')) throw new Error('Bowlby One not registered');
  GlobalFonts.registerFromPath('src/assets/fonts/DMSans-latin.woff2', 'DM Sans');
}

/** Logo centred at (cx, cy), `width` px wide. Geometry from the design (units of a 240 px icon). */
export function drawLogo(ctx, cx, cy, width) {
  const FS = 42, BAR_H = 5, BAR_GAP = 6, GAP = 6, ROW_H = FS * 0.86, SHADOW = 3, MARGIN = 10;
  const bars1 = [20, 12, 17], bars2 = [12, 17, 20];
  ctx.font = `${FS}px "Bowlby One"`;
  const w1 = ctx.measureText('WINDY').width, w2 = ctx.measureText('DRIVE').width;
  const barsW = 20;
  const blockW = Math.max(barsW + GAP + w1, MARGIN + barsW + GAP + w2);
  const blockH = ROW_H * 2;
  const s = width / blockW;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.transform(1, 0, Math.tan((-9 * Math.PI) / 180), 1, 0, 0); // skewX(-9deg)
  ctx.translate(-blockW / 2, -blockH / 2);
  const row = (y, x0, bars, text, color) => {
    const cyRow = y + ROW_H / 2;
    const stackH = bars.length * BAR_H + (bars.length - 1) * BAR_GAP;
    bars.forEach((bw, i) => {
      const by = cyRow - stackH / 2 + i * (BAR_H + BAR_GAP);
      const bx = x0 + barsW - bw;
      for (const [dy, c] of [[SHADOW, COBALT], [0, '#fff']]) {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.roundRect(bx, by + dy, bw, BAR_H, 2.5);
        ctx.fill();
      }
    });
    ctx.font = `${FS}px "Bowlby One"`;
    ctx.textBaseline = 'middle';
    const tx = x0 + barsW + GAP;
    ctx.fillStyle = COBALT;
    ctx.fillText(text, tx, cyRow + SHADOW + 2);
    ctx.fillStyle = color;
    ctx.fillText(text, tx, cyRow + 2);
  };
  row(0, 0, bars1, 'WINDY', '#fff');
  row(ROW_H, MARGIN, bars2, 'DRIVE', YELLOW);
  ctx.restore();
}
