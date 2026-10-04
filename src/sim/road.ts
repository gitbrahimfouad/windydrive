import type { GameConfig, WindDir } from '../config/gameConfig';
import { createRng, type Rng } from './rng';

export interface RoadPoint {
  x: number;
  y: number;
  /** Road heading (rad), 0 = up, positive = towards +x (right). */
  a: number;
  /** Width factor (1 = normal width, <1 = narrowed). */
  wf: number;
}

export type SegKind = 'S' | 'L' | 'R';

/** Metadata about each generated segment; used by tests and the renderer (signs). */
export interface SegmentInfo {
  kind: SegKind;
  /** Global sample index of the first sample of the segment. */
  startSample: number;
  length: number; // units
  radius: number; // 0 for straights
  rmin: number; // 0 for straights
  against: boolean; // turn against the wind (hardest to take)
  angle: number; // total turn angle (rad), 0 for straights
  narrow: number; // width factor reached (1 = no narrowing)
  gentle: boolean;
  intro: boolean; // warm-up segment
}

interface GenState {
  x: number;
  y: number;
  a: number;
  k: number; // target curvature
  kc: number; // smoothed curvature
  rem: number; // units remaining in the current segment
  hist: SegKind[];
  n: number; // number of segments generated after the initial straight
  nf: number;
  L: number;
  T: number;
  lastNarrow: boolean;
  cur: SegmentInfo;
}

/**
 * Endless road: a centre axis sampled every `sampleStep` units, generated lazily
 * by chaining segments (straight / left turn / right turn) with a seeded RNG.
 * Pure data, no DOM: runs in Node tests.
 *
 * Index convention: `pts[i]` is local; the global sample index is `offset + i`.
 * `rebase` drops old samples so memory stays bounded while the global index
 * (and thus the score) keeps counting.
 */
export class Road {
  pts: RoadPoint[] = [];
  offset = 0;
  segments: SegmentInfo[] = [];
  private rng: Rng;
  private g: GenState;

  constructor(
    private cfg: GameConfig,
    private windDir: WindDir,
    readonly seed: number,
  ) {
    this.rng = createRng(seed);
    const r = cfg.road;
    const first = r.initialStraight * (1 + (this.rng.next() * 2 - 1) * r.initialStraightJitter);
    const rem = first + r.startIndex * r.sampleStep;
    const cur: SegmentInfo = { kind: 'S', startSample: 0, length: rem, radius: 0, rmin: 0, against: false, angle: 0, narrow: 1, gentle: true, intro: true };
    this.segments.push(cur);
    this.g = { x: 0, y: 0, a: 0, k: 0, kc: 0, rem, hist: ['S'], n: 0, nf: 1, L: 1, T: 1, lastNarrow: false, cur };
    this.extend(900);
  }

  get length(): number {
    return this.offset + this.pts.length;
  }

  /** Road width at a local sample index. */
  widthAt(i: number): number {
    return this.cfg.road.width * this.pts[i].wf;
  }

  /** Rmin for a turn, depending on whether it goes against the wind. */
  minRadius(against: boolean): number {
    const { car, road } = this.cfg;
    const rmin = against ? car.speed / (road.againstWindFactor * car.tap) : car.speed / road.withWindDivisor;
    return Math.max(rmin, road.width * road.minRadiusWidthFactor);
  }

  private nextSegment(): void {
    const { road, narrowing } = this.cfg;
    const g = this.g;
    const rng = this.rng;
    const a = g.a;
    const h = g.hist;
    g.n++;
    g.nf = 1;
    const intro = g.n <= road.warmupSegments;

    // Allowed kinds. Heading guard: past the soft limit, forbid turns that increase |heading|.
    let opts: SegKind[] = ['L', 'R', 'S'];
    if (a > road.headingSoftLimit) opts = ['L', 'S'];
    else if (a < -road.headingSoftLimit) opts = ['R', 'S'];
    // Never three identical segments in a row.
    if (h.length >= 2 && h[h.length - 1] === h[h.length - 2]) opts = opts.filter((o) => o !== h[h.length - 1]);
    // Never two straights in a row.
    if (h[h.length - 1] === 'S') opts = opts.filter((o) => o !== 'S');
    if (!opts.length) opts = ['S'];

    const weights = opts.map((o) => (o === 'S' ? road.straightWeight : road.turnWeight));
    const total = weights.reduce((x, y) => x + y, 0);
    let r = rng.next() * total;
    let kind = opts[0];
    for (let i = 0; i < opts.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        kind = opts[i];
        break;
      }
    }

    let gentle = true;
    let radius = 0;
    let rmin = 0;
    let against = false;
    let angle = 0;
    if (kind === 'S') {
      g.k = 0;
      g.rem = intro ? rng.range(road.warmup.straightMin, road.warmup.straightMax) : rng.range(road.straightMin, road.straightMax);
    } else {
      const sign = kind === 'R' ? 1 : -1;
      against = this.windDir === 1 ? kind === 'L' : kind === 'R';
      rmin = this.minRadius(against);
      if (intro) {
        radius = rng.range(rmin * road.warmup.radiusMin, rmin * road.warmup.radiusMax);
        angle = rng.range(road.warmup.angleMin, road.warmup.angleMax);
      } else {
        radius = rng.range(rmin, rmin * road.turnRadiusMaxFactor);
        angle = rng.range(road.turnAngleMin, road.turnAngleMax);
      }
      // Do not push the heading much beyond headingLimit.
      angle = Math.min(angle, Math.max(road.angleFloorWhenLimited, road.headingLimit - sign * a));
      gentle = !against || radius > rmin * narrowing.gentleRadiusFactor;
      g.k = sign / radius;
      g.rem = angle * radius;
    }
    g.L = g.rem;

    // Narrowing: only after warm-up, on eligible segments, never twice in a row.
    if (narrowing.enabled && !intro && gentle && g.L >= narrowing.minSegmentLength && !g.lastNarrow && rng.next() < narrowing.probability) {
      g.nf = rng.range(narrowing.widthMin, narrowing.widthMax);
      g.T = Math.min(narrowing.transitionMax, g.L * narrowing.transitionFraction);
    }
    g.lastNarrow = g.nf < 1;
    h.push(kind);
    if (h.length > 4) h.shift();

    g.cur = { kind, startSample: this.length, length: g.L, radius, rmin, against, angle, narrow: g.nf, gentle, intro };
    this.segments.push(g.cur);
  }

  /** Generate `n` more samples. */
  extend(n: number): void {
    const { road } = this.cfg;
    const step = road.sampleStep;
    const g = this.g;
    for (let i = 0; i < n; i++) {
      if (g.rem <= 0) this.nextSegment();
      // Curvature is low-pass filtered so it never jumps between segments.
      g.kc += (g.k - g.kc) * road.curvatureSmoothing;
      g.a += g.kc * step;
      g.x += Math.sin(g.a) * step;
      g.y -= Math.cos(g.a) * step;
      g.rem -= step;
      let wf = 1;
      if (g.nf < 1) {
        // smoothstep ramp in and out over T units
        const t = g.L - g.rem;
        let u = t < g.T ? t / g.T : t > g.L - g.T ? (g.L - t) / g.T : 1;
        u = Math.max(0, Math.min(1, u));
        u = u * u * (3 - 2 * u);
        wf = 1 - (1 - g.nf) * u;
      }
      this.pts.push({ x: g.x, y: g.y, a: g.a, wf });
    }
  }

  /** Make sure at least `ahead` samples exist beyond local index `idx`. */
  ensure(idx: number, ahead: number): void {
    const missing = idx + ahead - this.pts.length;
    if (missing > 0) this.extend(missing + 50);
  }

  /** Closest axis sample to (x, y), searching a window around `hint`. */
  nearest(x: number, y: number, hint: number): { idx: number; dist: number } {
    let bd = Infinity;
    let bi = hint;
    const lo = Math.max(0, hint - 8);
    const hi = Math.min(this.pts.length, hint + 40);
    for (let i = lo; i < hi; i++) {
      const dx = this.pts[i].x - x;
      const dy = this.pts[i].y - y;
      const dd = dx * dx + dy * dy;
      if (dd < bd) {
        bd = dd;
        bi = i;
      }
    }
    return { idx: bi, dist: Math.sqrt(bd) };
  }

  /** Drop `count` old samples; returns the number dropped. */
  rebase(count: number): number {
    this.pts.splice(0, count);
    this.offset += count;
    // forget segments that ended before the first kept sample
    while (this.segments.length > 2 && this.segments[1].startSample <= this.offset) this.segments.shift();
    return count;
  }
}
