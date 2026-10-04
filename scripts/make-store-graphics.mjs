// Store icons + Google Play feature graphic (1024x500). Run by make-store-assets.sh (after the screenshots).
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { BG, YELLOW, drawLogo, registerFonts } from './logo.mjs';

registerFonts();
mkdirSync('store/ios', { recursive: true });
mkdirSync('store/android', { recursive: true });

// --- Icons: flat RGB PNG (App Store forbids alpha; Play 512 px) ---
execFileSync('python3', ['-c', `
from PIL import Image
im = Image.open('assets/icon-only.png').convert('RGB')
im.save('store/ios/app-icon-1024.png')
im.resize((512, 512), Image.LANCZOS).save('store/android/app-icon-512.png')
`]);

// --- Feature graphic 1024x500 ---
const TAGLINES = { fr: ['Le vent pousse.', 'À toi de corriger.'], en: ['The wind pushes.', 'You steer.'] };
for (const lang of ['fr', 'en']) {
  const W = 1024, H = 500;
  const c = createCanvas(W, H);
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#244a40');
  g.addColorStop(1, BG);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // phones (cropped by the bottom edge)
  const phone = async (file, x, y, w, rot) => {
    const img = await loadImage(readFileSync(file));
    const h = (img.height / img.width) * w;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(rot);
    ctx.shadowColor = 'rgba(0,0,0,.45)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#0d0d0d';
    ctx.beginPath();
    ctx.roundRect(-w / 2 - 7, -h / 2 - 7, w + 14, h + 14, 40);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 33);
    ctx.clip();
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  };
  await phone(`store/android/phone_1080x1920/${lang}/06-night.png`, 800, 70, 190, 0.1);
  await phone(`store/android/phone_1080x1920/${lang}/03-narrow.png`, 590, 40, 215, -0.06);

  drawLogo(ctx, 300, 190, 480);
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#fff';
  ctx.font = '700 34px "DM Sans"';
  ctx.fillText(TAGLINES[lang][0], 60, 340);
  ctx.fillStyle = YELLOW;
  ctx.fillText(TAGLINES[lang][1], 60, 384);
  writeFileSync(`store/android/feature-graphic-1024x500-${lang}.png`, c.toBuffer('image/png'));
}
console.log('icons + feature graphics written');
