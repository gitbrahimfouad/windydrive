import { describe, expect, it } from 'vitest';
import { createConfig } from '../src/config/gameConfig';
import { Road } from '../src/sim/road';

const SEEDS = Array.from({ length: 60 }, (_, i) => i * 7919 + 1);
const SAMPLES = 6000; // 24 km of road per seed

function build(seed: number, dir: 1 | -1 = 1, tweak?: (c: ReturnType<typeof createConfig>) => void) {
  const cfg = createConfig();
  tweak?.(cfg);
  const road = new Road(cfg, dir, seed);
  road.extend(SAMPLES);
  return { cfg, road };
}

describe('road generation', () => {
  it('is identical for the same seed and differs between seeds', () => {
    const a = build(42).road.pts;
    const b = build(42).road.pts;
    expect(a).toEqual(b);
    expect(build(43).road.pts).not.toEqual(a);
  });

  it('does not depend on how the road is chunked', () => {
    const cfg = createConfig();
    const r1 = new Road(cfg, 1, 7);
    r1.extend(3000);
    const r2 = new Road(cfg, 1, 7);
    for (let i = 0; i < 30; i++) r2.extend(100);
    expect(r2.pts.slice(0, r1.pts.length)).toEqual(r1.pts.slice(0, r2.pts.length));
  });

  it('keeps the heading within the limit (plus a small overshoot from curvature smoothing)', () => {
    // The generator clamps each turn so the *target* heading stays within ±headingLimit;
    // the low-pass filtered curvature then overshoots by < ~0.3 rad. We assert a bound
    // on the real heading and that it never nears a U-turn (road never goes backwards).
    const TOLERANCE = 0.35;
    for (const dir of [1, -1] as const) {
      for (const seed of SEEDS) {
        const { cfg, road } = build(seed, dir);
        for (const p of road.pts) {
          expect(Math.abs(p.a)).toBeLessThanOrEqual(cfg.road.headingLimit + TOLERANCE);
          expect(Math.cos(p.a)).toBeGreaterThan(0); // always progressing upwards
        }
      }
    }
  });

  it('never chains two straights nor three identical segments', () => {
    for (const seed of SEEDS) {
      const { road } = build(seed);
      const k = road.segments.map((s) => s.kind);
      for (let i = 1; i < k.length; i++) expect(k[i] === 'S' && k[i - 1] === 'S').toBe(false);
      for (let i = 2; i < k.length; i++) expect(k[i] === k[i - 1] && k[i] === k[i - 2]).toBe(false);
    }
  });

  it('makes every turn passable: radius ≥ Rmin(against/with wind) and ≥ 0.9·width', () => {
    for (const dir of [1, -1] as const) {
      for (const seed of SEEDS) {
        const { cfg, road } = build(seed, dir);
        const rAgainst = cfg.car.speed / (cfg.road.againstWindFactor * cfg.car.tap);
        for (const s of road.segments) {
          if (s.kind === 'S') continue;
          const floor = Math.max(s.against ? rAgainst : cfg.car.speed / cfg.road.withWindDivisor, cfg.road.width * cfg.road.minRadiusWidthFactor);
          expect(s.radius).toBeGreaterThanOrEqual(floor - 1e-9);
          expect(s.radius).toBeLessThanOrEqual(floor * (s.intro ? cfg.road.warmup.radiusMax : cfg.road.turnRadiusMaxFactor) + 1e-9);
          expect(s.against).toBe(dir === 1 ? s.kind === 'L' : s.kind === 'R');
          // Required turn rate (speed / R) must be sustainable: tapping continuously gives
          // a turn rate of ~0.62·tap against the wind; the wind alone gives up to maxOmega with it.
          const needed = cfg.car.speed / s.radius;
          expect(needed).toBeLessThanOrEqual(s.against ? cfg.road.againstWindFactor * cfg.car.tap + 1e-9 : cfg.car.maxOmega);
        }
      }
    }
  });

  it('has a gentle start: initial straight, then 5 warm-up segments without narrowing', () => {
    for (const seed of SEEDS) {
      const { cfg, road } = build(seed);
      const segs = road.segments;
      expect(segs[0].kind).toBe('S');
      const j = cfg.road.initialStraightJitter;
      expect(segs[0].length).toBeGreaterThanOrEqual(cfg.road.initialStraight * (1 - j) + cfg.road.startIndex * cfg.road.sampleStep - 1e-9);
      expect(segs[0].length).toBeLessThanOrEqual(cfg.road.initialStraight * (1 + j) + cfg.road.startIndex * cfg.road.sampleStep + 1e-9);
      for (let i = 1; i <= cfg.road.warmupSegments; i++) {
        const s = segs[i];
        expect(s.intro).toBe(true);
        expect(s.narrow).toBe(1);
        if (s.kind === 'S') {
          expect(s.length).toBeGreaterThanOrEqual(cfg.road.warmup.straightMin);
          expect(s.length).toBeLessThanOrEqual(cfg.road.warmup.straightMax);
        } else {
          expect(s.angle).toBeGreaterThan(0);
          expect(s.angle).toBeLessThanOrEqual(cfg.road.warmup.angleMax + 1e-9);
          expect(s.radius).toBeGreaterThanOrEqual(s.rmin * cfg.road.warmup.radiusMin - 1e-9);
          expect(s.radius).toBeLessThanOrEqual(s.rmin * cfg.road.warmup.radiusMax + 1e-9);
        }
      }
      expect(segs[cfg.road.warmupSegments + 1].intro).toBe(false);
    }
  });

  it('follows the narrowing rules', () => {
    let narrowed = 0;
    let eligible = 0;
    for (const dir of [1, -1] as const) {
      for (const seed of SEEDS) {
        const { cfg, road } = build(seed, dir);
        const n = cfg.narrowing;
        let prevNarrow = false;
        for (const s of road.segments) {
          const isNarrow = s.narrow < 1;
          if (!s.intro && s.length >= n.minSegmentLength && s.gentle) eligible++;
          if (isNarrow) {
            narrowed++;
            expect(s.intro).toBe(false);
            expect(s.length).toBeGreaterThanOrEqual(n.minSegmentLength);
            expect(s.gentle).toBe(true);
            if (s.kind !== 'S' && s.against) expect(s.radius).toBeGreaterThan(s.rmin * n.gentleRadiusFactor);
            expect(s.narrow).toBeGreaterThanOrEqual(n.widthMin - 1e-9);
            expect(s.narrow).toBeLessThanOrEqual(n.widthMax + 1e-9);
            expect(prevNarrow).toBe(false); // never two narrowed segments in a row
          }
          prevNarrow = isNarrow;
        }
        // width factor stays within bounds everywhere
        for (const p of road.pts) {
          expect(p.wf).toBeLessThanOrEqual(1);
          expect(p.wf).toBeGreaterThanOrEqual(n.widthMin - 1e-9);
        }
      }
    }
    expect(narrowed).toBeGreaterThan(0);
    // ~30 % of eligible segments, minus the "not twice in a row" rule
    expect(narrowed / eligible).toBeGreaterThan(0.15);
    expect(narrowed / eligible).toBeLessThan(0.4);
  });

  it('can disable narrowing from the config', () => {
    const { road } = build(5, 1, (c) => (c.narrowing.enabled = false));
    expect(road.pts.every((p) => p.wf === 1)).toBe(true);
  });

  it('changes curvature progressively (no kinks)', () => {
    const { cfg, road } = build(11);
    const step = cfg.road.sampleStep;
    let prev = 0;
    for (let i = 1; i < road.pts.length; i++) {
      const k = (road.pts[i].a - road.pts[i - 1].a) / step;
      expect(Math.abs(k - prev)).toBeLessThan(0.12 * (1 / 99) * 2.5); // smoothing 0.12 · max |Δk| (1/Rmin)
      prev = k;
    }
  });
});
