import { sizes, type Theme } from '../config/theme';
import type { Game } from '../sim/game';
import type { Camera } from './camera';
import { decorAt } from './decor';
import type { Effects } from './effects';
import type { Trail } from './trail';

const TAU = Math.PI * 2;

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/**
 * Canvas 2D renderer. Reads the simulation (read-only) and the theme; owns no game state.
 * Only the visible window of road samples is drawn.
 */
export class Renderer {
  /** Canvas pixel-ratio cap: 2 saves fill-rate on phones; store screenshots raise it. */
  static maxDpr = 2;
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  /** CSS size of the canvas. */
  w = 0;
  h = 0;
  /** World units → CSS px. */
  scale = 1;

  constructor(
    private canvas: HTMLCanvasElement,
    public theme: Theme,
  ) {
    this.ctx = canvas.getContext('2d', { alpha: false })!;
  }

  resize(worldWidth: number, maxCssWidth: number): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, Renderer.maxDpr);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.scale = Math.min(this.w, maxCssWidth) / worldWidth;
  }

  /** Explicit size (used for off-screen share cards). */
  setSize(cssW: number, cssH: number, dpr: number, worldWidth: number, maxCssWidth: number): void {
    this.dpr = dpr;
    this.w = cssW;
    this.h = cssH;
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    this.scale = Math.min(cssW, maxCssWidth) / worldWidth;
  }

  draw(game: Game, camera: Camera, trail: Trail, effects?: Effects): void {
    const c = this.ctx;
    const th = this.theme;
    const { cfg, road, car } = game;
    const step = cfg.road.sampleStep;
    const pts = road.pts;

    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.fillStyle = th.ground;
    c.fillRect(0, 0, this.w, this.h);

    // Crash shake, fading out over the crash duration.
    let sx = 0;
    let sy = 0;
    if (game.state === 'crash') {
      const k = game.crashTimeLeft / cfg.game.crashDuration;
      sx = (Math.random() - 0.5) * cfg.game.shakeAmplitude * k;
      sy = (Math.random() - 0.5) * cfg.game.shakeAmplitude * k;
    }

    c.save();
    c.translate(this.w / 2 + sx, this.h * cfg.camera.carScreenY + sy);
    c.scale(this.scale, this.scale);
    c.rotate(-camera.angle);
    c.translate(-car.x, -car.y);

    // Visible window of samples (world units visible vertically ≈ h / scale; rotation adds margin).
    const ahead = Math.ceil((this.h * 0.75) / this.scale / step + 65);
    const behind = Math.ceil((this.h * 0.4) / this.scale / step + 50);
    const i0 = Math.max(0, car.idx - behind);
    const i1 = Math.min(pts.length - 1, car.idx + ahead);

    this.drawTrees(i0, i1, game);
    this.drawRoad(i0, i1, game);

    // Tyre marks
    const tr = trail.points;
    if (tr.length > 1) {
      c.strokeStyle = th.track;
      c.lineWidth = sizes.trackWidth;
      c.lineCap = 'round';
      for (const s of [0, 1]) {
        c.beginPath();
        c.moveTo(tr[0][s * 2], tr[0][s * 2 + 1]);
        for (let i = 1; i < tr.length; i++) c.lineTo(tr[i][s * 2], tr[i][s * 2 + 1]);
        c.stroke();
      }
    }

    effects?.drawWorld(c);
    if (th.headlights) this.drawHeadlights(car.x, car.y, car.th);
    this.drawCar(car.x, car.y, car.th);
    c.restore();
    effects?.drawScreen(c, th, game);

    if (th.vignette) {
      const g = c.createRadialGradient(this.w / 2, this.h * cfg.camera.carScreenY - 60, 120, this.w / 2, this.h * cfg.camera.carScreenY - 60, Math.max(this.w, this.h) * 0.8);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, th.vignette);
      c.fillStyle = g;
      c.fillRect(0, 0, this.w, this.h);
    }
  }

  private halfW(game: Game, i: number): number {
    return game.road.widthAt(i) / 2;
  }

  private drawTrees(i0: number, i1: number, game: Game): void {
    const c = this.ctx;
    const th = this.theme;
    const { road, cfg } = game;
    for (let i = i0; i <= i1; i++) {
      // Layout depends on the road seed: scenery differs from one game to the next.
      const d = decorAt(road.offset + i, road.seed, sizes.treeEvery);
      if (!d) continue;
      const p = road.pts[i];
      const off = cfg.road.width / 2 + sizes.vergeWidth + sizes.curbWidth + 18 + d.offset;
      const r = d.radius;
      const tx = p.x + Math.cos(p.a) * off * d.side;
      const ty = p.y + Math.sin(p.a) * off * d.side;
      if (d.kind === 'hay') {
        c.fillStyle = th.shadow;
        c.beginPath();
        c.arc(tx + 4, ty + 4, r * 0.7, 0, TAU);
        c.fill();
        c.fillStyle = th.hay;
        c.beginPath();
        c.arc(tx, ty, r * 0.7, 0, TAU);
        c.fill();
        continue;
      }
      c.fillStyle = th.shadow;
      c.beginPath();
      c.arc(tx + r * 0.35, ty + r * 0.35, r, 0, TAU);
      c.fill();
      c.fillStyle = th.trees[Math.floor(d.shade * 30) % 3];
      c.beginPath();
      c.arc(tx, ty, r, 0, TAU);
      c.fill();
      c.fillStyle = th.treeHi;
      c.beginPath();
      c.arc(tx - r * 0.3, ty - r * 0.3, r * 0.45, 0, TAU);
      c.fill();
    }
  }

  /** Closed polygon following the road, `extra` units beyond the half-width on each side. */
  private band(i0: number, i1: number, game: Game, extra: number): void {
    const c = this.ctx;
    const pts = game.road.pts;
    c.beginPath();
    for (let i = i0; i <= i1; i++) {
      const p = pts[i];
      const o = this.halfW(game, i) + extra;
      const x = p.x + Math.cos(p.a) * o;
      const y = p.y + Math.sin(p.a) * o;
      i === i0 ? c.moveTo(x, y) : c.lineTo(x, y);
    }
    for (let i = i1; i >= i0; i--) {
      const p = pts[i];
      const o = -(this.halfW(game, i) + extra);
      c.lineTo(p.x + Math.cos(p.a) * o, p.y + Math.sin(p.a) * o);
    }
    c.closePath();
  }

  /** Strokes the road edge for runs of samples where `pred` holds, with an alternating dash. */
  private edgeRuns(i0: number, i1: number, game: Game, side: number, offset: number, pred: (wf: number) => boolean): void {
    const c = this.ctx;
    const { road, cfg } = game;
    const stripe = sizes.curbStripe;
    let start = -1;
    const flush = (end: number) => {
      if (start < 0 || end <= start) {
        start = -1;
        return;
      }
      const phase = ((road.offset + start) * cfg.road.sampleStep) % (stripe * 2);
      c.lineDashOffset = phase;
      c.stroke();
      start = -1;
    };
    c.beginPath();
    for (let i = i0; i <= i1; i++) {
      const p = road.pts[i];
      if (pred(p.wf)) {
        const o = side * (this.halfW(game, i) + offset);
        const x = p.x + Math.cos(p.a) * o;
        const y = p.y + Math.sin(p.a) * o;
        if (start < 0) {
          start = i;
          c.moveTo(x, y);
        } else c.lineTo(x, y);
      } else if (start >= 0) {
        flush(i);
        c.beginPath();
      }
    }
    flush(i1 + 1);
  }

  private drawRoad(i0: number, i1: number, game: Game): void {
    const c = this.ctx;
    const th = this.theme;
    const { road, cfg } = game;
    const step = cfg.road.sampleStep;
    const pts = road.pts;
    const cw = sizes.curbWidth;
    const stripe = sizes.curbStripe;
    c.lineJoin = 'round';
    c.lineCap = 'butt';

    // verge (sand), asphalt
    c.fillStyle = th.verge;
    this.band(i0, i1, game, cw + sizes.vergeWidth);
    c.fill();
    c.fillStyle = th.asphalt;
    this.band(i0, i1, game, 0);
    c.fill();

    // curbs: red base + white dashes; yellow base + black dashes inside narrowed zones
    c.lineWidth = cw;
    const NARROW = 0.97;
    const normal = (wf: number) => wf >= NARROW;
    const narrow = (wf: number) => wf < NARROW;
    for (const side of [-1, 1]) {
      const off = cw / 2;
      c.setLineDash([]);
      c.strokeStyle = th.curbA;
      this.edgeRuns(i0, i1, game, side, off, normal);
      c.strokeStyle = th.warnA;
      this.edgeRuns(i0, i1, game, side, off, narrow);
      c.setLineDash([stripe, stripe]);
      c.strokeStyle = th.curbB;
      this.edgeRuns(i0, i1, game, side, off, normal);
      c.strokeStyle = th.warnB;
      this.edgeRuns(i0, i1, game, side, off, narrow);
    }

    // centre line
    c.setLineDash(sizes.centerDash);
    c.lineDashOffset = ((road.offset + i0) * step) % (sizes.centerDash[0] + sizes.centerDash[1]);
    c.strokeStyle = th.line;
    c.lineWidth = sizes.centerLineWidth;
    c.beginPath();
    c.moveTo(pts[i0].x, pts[i0].y);
    for (let i = i0 + 1; i <= i1; i++) c.lineTo(pts[i].x, pts[i].y);
    c.stroke();
    c.setLineDash([]);
    this.drawNarrowingMarks(i0, i1, game);
  }

  /** Warning sign (about 360 u before) and converging chevrons painted on the road before a narrowing. */
  private drawNarrowingMarks(i0: number, i1: number, game: Game): void {
    const c = this.ctx;
    const th = this.theme;
    const { road } = game;
    const pts = road.pts;
    for (const seg of road.segments) {
      if (seg.narrow >= 1) continue;
      const start = seg.startSample - road.offset;
      if (start < i0 || start - 120 > i1) continue;
      // chevrons between 460 and 130 units before, every 56 units
      c.strokeStyle = th.mark;
      c.lineWidth = 6;
      c.beginPath();
      for (let d = 115; d >= 32; d -= 14) {
        const i = start - d;
        if (i < i0 || i > i1) continue;
        const p = pts[i];
        const h = this.halfW(game, i);
        const nx = Math.cos(p.a);
        const ny = Math.sin(p.a);
        const fx = Math.sin(p.a);
        const fy = -Math.cos(p.a);
        for (const side of [-1, 1]) {
          const ox = p.x + nx * side * (h - sizes.curbWidth - 3);
          const oy = p.y + ny * side * (h - sizes.curbWidth - 3);
          c.moveTo(ox, oy);
          c.lineTo(p.x + nx * side * h * 0.38 + fx * 30, p.y + ny * side * h * 0.38 + fy * 30);
        }
      }
      c.stroke();
      // sign on both sides, 90 samples before
      const si = start - 90;
      if (si >= i0 && si <= i1) {
        const p = pts[si];
        const o = this.halfW(game, si) + sizes.curbWidth + sizes.vergeWidth + 26;
        for (const side of [-1, 1]) this.drawSign(p.x + Math.cos(p.a) * o * side, p.y + Math.sin(p.a) * o * side, p.a);
      }
    }
  }

  private drawSign(x: number, y: number, a: number): void {
    const c = this.ctx;
    const th = this.theme;
    c.save();
    c.translate(x, y);
    c.rotate(a);
    c.fillStyle = th.shadow;
    c.beginPath();
    c.moveTo(5, -12);
    c.lineTo(20, 14);
    c.lineTo(-10, 14);
    c.fill();
    c.fillStyle = th.sign;
    c.strokeStyle = th.signInk;
    c.lineWidth = 2.5;
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(0, -16);
    c.lineTo(16, 11);
    c.lineTo(-16, 11);
    c.closePath();
    c.fill();
    c.stroke();
    c.beginPath();
    c.moveTo(-4, -5);
    c.lineTo(-2, 6);
    c.moveTo(4, -5);
    c.lineTo(2, 6);
    c.stroke();
    c.restore();
  }

  private drawHeadlights(x: number, y: number, a: number): void {
    const c = this.ctx;
    c.save();
    c.translate(x, y);
    c.rotate(a);
    c.globalCompositeOperation = 'lighter';
    const g = c.createLinearGradient(0, -14, 0, -170);
    g.addColorStop(0, this.theme.headlights!);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-6, -14);
    c.lineTo(6, -14);
    c.lineTo(50, -170);
    c.lineTo(-50, -170);
    c.closePath();
    c.fill();
    c.restore();
  }

  /** Design car (26×50 in the mock-up) scaled to the 18×30 hitbox. Centre = collision point. */
  private drawCar(x: number, y: number, a: number): void {
    const c = this.ctx;
    const th = this.theme;
    c.save();
    c.translate(x, y);
    c.rotate(a);
    c.scale(sizes.carScale, sizes.carScale);
    const body = () => {
      c.beginPath();
      c.moveTo(0, -25);
      c.bezierCurveTo(7, -25, 10.5, -24, 11, -20);
      c.lineTo(12.5, -17);
      c.lineTo(12.5, -8);
      c.lineTo(11, -4);
      c.lineTo(11, 6);
      c.lineTo(13, 9);
      c.lineTo(13, 19);
      c.bezierCurveTo(13, 23, 10, 24.5, 0, 24.5);
      c.bezierCurveTo(-10, 24.5, -13, 23, -13, 19);
      c.lineTo(-13, 9);
      c.lineTo(-11, 6);
      c.lineTo(-11, -4);
      c.lineTo(-12.5, -8);
      c.lineTo(-12.5, -17);
      c.lineTo(-11, -20);
      c.bezierCurveTo(-10.5, -24, -7, -25, 0, -25);
      c.closePath();
    };
    c.save();
    c.translate(4, 5);
    c.fillStyle = th.shadow;
    body();
    c.fill();
    c.restore();
    // wheels
    c.fillStyle = '#16161a';
    roundRect(c, -14.5, -18.5, 5, 10, 1.8);
    c.fill();
    roundRect(c, 9.5, -18.5, 5, 10, 1.8);
    c.fill();
    roundRect(c, -15, 8.5, 5.5, 11, 1.8);
    c.fill();
    roundRect(c, 9.5, 8.5, 5.5, 11, 1.8);
    c.fill();
    // body + double white stripe
    c.fillStyle = th.car;
    body();
    c.fill();
    c.save();
    body();
    c.clip();
    c.fillStyle = 'rgba(0,0,0,.18)';
    c.fillRect(-13, -25, 3, 50);
    c.fillRect(10, -25, 3, 50);
    c.fillStyle = th.carAccent;
    c.fillRect(-5, -25, 3.4, 50);
    c.fillRect(1.6, -25, 3.4, 50);
    c.restore();
    // spoiler, glass
    c.fillStyle = '#1d1d22';
    roundRect(c, -12, 21.5, 24, 4, 1.5);
    c.fill();
    c.fillStyle = th.glass;
    c.beginPath();
    c.moveTo(-8.5, -8);
    c.quadraticCurveTo(0, -11.5, 8.5, -8);
    c.lineTo(7.5, -1.5);
    c.lineTo(-7.5, -1.5);
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(-7, 10);
    c.lineTo(7, 10);
    c.lineTo(8, 15);
    c.quadraticCurveTo(0, 16.5, -8, 15);
    c.closePath();
    c.fill();
    // lamps
    c.fillStyle = th.lamp;
    c.beginPath();
    c.ellipse(-7, -22.6, 2.6, 1.6, -0.35, 0, TAU);
    c.fill();
    c.beginPath();
    c.ellipse(7, -22.6, 2.6, 1.6, 0.35, 0, TAU);
    c.fill();
    c.fillStyle = '#ff3b3b';
    roundRect(c, -10.5, 19.5, 5, 2, 1);
    c.fill();
    roundRect(c, 5.5, 19.5, 5, 2, 1);
    c.fill();
    c.restore();
  }
}
