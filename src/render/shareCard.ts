import { fonts, type Theme } from '../config/theme';
import type { Game } from '../sim/game';
import type { Camera } from './camera';
import { Renderer } from './renderer';
import type { Trail } from './trail';

const W = 360;
const H = 640;
const K = 3; // 360×640 design units → 1080×1920 px (Instagram story)

export interface ShareCardText {
  brag: string; // « J'ai tenu »
  meters: string; // distance, already formatted
  challenge: string; // « Tu feras mieux ? »
  footer: string;
}

/** Story-format (1080×1920) image of the last crash with the score, drawn off-screen. */
export async function renderShareCard(game: Game, camera: Camera, trail: Trail, theme: Theme, text: ShareCardText): Promise<Blob> {
  if (document.fonts) await Promise.all([document.fonts.load('40px "Bowlby One"'), document.fonts.load('700 14px "DM Sans"')]);
  const canvas = document.createElement('canvas');
  const r = new Renderer(canvas, theme);
  r.setSize(W, H, K, 360, 520);
  r.draw(game, camera, trail);

  const c = canvas.getContext('2d')!;
  c.setTransform(K, 0, 0, K, 0, 0);
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(22,40,12,.78)');
  g.addColorStop(0.5, 'rgba(22,40,12,.2)');
  g.addColorStop(1, 'rgba(22,40,12,.85)');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);

  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  // logo
  c.save();
  c.translate(W / 2, 100);
  c.transform(1, 0, Math.tan((9 * Math.PI) / 180), 1, 0, 0);
  c.font = `44px ${fonts.display}`;
  c.fillStyle = theme.uiAccent;
  c.fillText('WINDY', 0, 4);
  c.fillText('DRIVE', 0, 44);
  c.fillStyle = '#fff';
  c.fillText('WINDY', 0, 0);
  c.fillStyle = theme.uiYellow;
  c.fillText('DRIVE', 0, 40);
  c.restore();

  c.fillStyle = '#fff';
  c.font = `700 15px ${fonts.ui}`;
  if ('letterSpacing' in c) (c as unknown as { letterSpacing: string }).letterSpacing = '2.4px';
  c.fillText(text.brag.toUpperCase(), W / 2, 200);
  if ('letterSpacing' in c) (c as unknown as { letterSpacing: string }).letterSpacing = '0px';

  c.font = `76px ${fonts.display}`;
  c.fillStyle = '#24401a';
  c.fillText(`${text.meters} m`, W / 2, 288 + 6);
  c.fillStyle = '#fff';
  c.fillText(`${text.meters} m`, W / 2, 288);

  // challenge badge
  c.save();
  c.translate(W / 2, 350);
  c.rotate((-3 * Math.PI) / 180);
  c.font = `28px ${fonts.display}`;
  const bw = c.measureText(text.challenge).width + 40;
  c.fillStyle = theme.uiYellowShadow;
  c.beginPath();
  c.roundRect(-bw / 2, -26 + 6, bw, 52, 16);
  c.fill();
  c.fillStyle = theme.uiYellow;
  c.beginPath();
  c.roundRect(-bw / 2, -26, bw, 52, 16);
  c.fill();
  c.fillStyle = '#2a2a2a';
  c.fillText(text.challenge, 0, 10);
  c.restore();

  c.fillStyle = '#fff';
  c.font = `700 14px ${fonts.ui}`;
  c.fillText(text.footer, W / 2, H - 30);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'));
}
