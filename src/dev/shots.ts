import type { Camera } from '../render/camera';
import type { Effects } from '../render/effects';
import { Renderer } from '../render/renderer';
import type { Trail } from '../render/trail';
import type { Game } from '../sim/game';
import type { Screens } from '../ui/screens';
import { setLang, type Lang } from '../ui/i18n';
import { themes, type Theme, type ThemeName } from '../config/theme';

/**
 * Store-screenshot mode (dev server only): `?shot=home|curve|narrow|record|near|night&lang=fr&sat=62&sab=34`.
 * Puts the game in a deterministic scene and freezes the simulation so a headless browser can capture it.
 * See scripts/make-store-assets.sh.
 */
export interface ShotCtx {
  game: Game;
  camera: Camera;
  trail: Trail;
  effects: Effects;
  screens: Screens;
  renderer: Renderer;
  setTheme(name: ThemeName): void;
  showHome(best: number): void;
  w: () => number;
  h: () => number;
}

const SEED = 31;

export function shotRequested(): string | null {
  return new URLSearchParams(location.search).get('shot');
}

export function applyShot(shot: string, ctx: ShotCtx): void {
  const q = new URLSearchParams(location.search);
  const lang = (q.get('lang') ?? 'fr') as Lang;
  setLang(lang);
  Renderer.maxDpr = 3; // sharp captures at 3x
  if (q.get('sat')) document.documentElement.style.setProperty('--sat', `${q.get('sat')}px`);
  if (q.get('sab')) document.documentElement.style.setProperty('--sab', `${q.get('sab')}px`);

  const { game, camera, trail, effects, screens } = ctx;
  const night = shot === 'night';
  ctx.setTheme(night ? 'night' : 'day');
  const theme: Theme = themes[night ? 'night' : 'day'];

  game.reset(SEED);
  game.road.extend(4000);
  const road = game.road;
  const step = game.cfg.road.sampleStep;

  /** Puts the car on the road axis at local sample `i` (lateral offset + heading offset), camera aligned. */
  const place = (i: number, lateral = 0, dth = 0) => {
    const p = road.pts[i];
    game.car.x = p.x + Math.cos(p.a) * lateral;
    game.car.y = p.y + Math.sin(p.a) * lateral;
    game.car.th = p.a + dth;
    game.car.idx = i;
    camera.angle = p.a;
  };
  /** Synthetic tyre marks following the road behind the car. */
  const fillTrail = (i: number) => {
    trail.clear();
    for (let j = i - 17; j <= i; j++) {
      const p = road.pts[j];
      const wob = Math.sin(j * 0.55) * 7; // gentle weaving: the driver is tapping
      const cx = p.x + Math.cos(p.a) * wob;
      const cy = p.y + Math.sin(p.a) * wob;
      const c = Math.cos(p.a);
      const s = Math.sin(p.a);
      trail.points.push([cx + c * -6 - s * 9, cy + s * -6 + c * 9, cx + c * 6 - s * 9, cy + s * 6 + c * 9]);
    }
  };
  const turn = road.segments.find((s, k) => k > 1 && s.kind !== 'S' && s.angle > 0.8 && s.length > 200);
  const turnMid = turn ? Math.round(turn.startSample - road.offset + turn.length / step / 2) : 200;
  const narrow = road.segments.find((s) => s.narrow < 1 && !s.intro);
  const narrowStart = narrow ? narrow.startSample - road.offset : 400;

  switch (shot) {
    case 'home':
      game.state = 'ready';
      ctx.showHome(2310);
      break;
    case 'curve':
    case 'night': {
      const i = turnMid;
      place(i, 6, 0.04);
      fillTrail(i);
      game.state = 'play';
      screens.hideAll();
      screens.setScore(shot === 'night' ? 1530 : 842);
      screens.showScore(true);
      break;
    }
    case 'narrow': {
      const i = narrowStart - 62; // sign + chevrons ahead
      place(i, -4, 0);
      fillTrail(i);
      game.state = 'play';
      screens.hideAll();
      screens.setScore(1286);
      screens.showScore(true);
      break;
    }
    case 'record':
    case 'near': {
      const i = turnMid;
      const half = road.widthAt(i) / 2;
      place(i, half + 9, 0.9); // just off the road, spinning
      fillTrail(i);
      game.state = 'over';
      effects.spawnCrash(game, theme);
      effects.update(0.25, game, ctx.w(), ctx.h());
      const score = shot === 'record' ? 2586 : 2223; // headline numbers for the listing
      if (shot === 'record') screens.showOver({ score, best: score, prevBest: Math.round(score * 0.78), record: true });
      else screens.showOver({ score, best: Math.round(score * 1.06), prevBest: Math.round(score * 1.06), record: false });
      break;
    }
    default:
      ctx.showHome(0);
  }
  document.title = `shot:${shot}`;
}
