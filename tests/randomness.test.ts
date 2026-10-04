import { describe, expect, it } from 'vitest';
import { createConfig } from '../src/config/gameConfig';
import { decorAt } from '../src/render/decor';
import { Road } from '../src/sim/road';
import { createRng } from '../src/sim/rng';

const seeds = (n: number) => {
  const r = createRng(2024);
  return Array.from({ length: n }, () => (r.next() * 0xffffffff) >>> 0);
};

describe('randomness', () => {
  it('road: no left/right bias and a varied start', () => {
    const cfg = createConfig();
    const N = 2000;
    let firstLeft = 0;
    let L = 0;
    let R = 0;
    const starts = new Set<number>();
    for (const s of seeds(N)) {
      const road = new Road(cfg, 1, s);
      road.extend(2000);
      const segs = road.segments;
      if (segs[1].kind === 'L') firstLeft++;
      for (const g of segs.slice(1)) {
        if (g.kind === 'L') L++;
        if (g.kind === 'R') R++;
      }
      starts.add(Math.round(segs[0].length));
    }
    expect(Math.abs(firstLeft / N - 0.5)).toBeLessThan(0.04);
    expect(Math.abs(L / (L + R) - 0.5)).toBeLessThan(0.03);
    expect(starts.size).toBeGreaterThan(50); // initial straight length varies between games
  });

  it('road: different seeds give different shapes (no duplicates)', () => {
    const cfg = createConfig();
    const sigs = new Set<string>();
    for (const s of seeds(500)) {
      const road = new Road(cfg, 1, s);
      road.extend(600);
      const p = road.pts[599];
      sigs.add(`${p.x.toFixed(3)},${p.y.toFixed(3)}`);
    }
    expect(sigs.size).toBe(500);
  });

  it('decor: depends on the seed (scenery is not identical from game to game)', () => {
    const layout = (seed: number) => {
      const out: string[] = [];
      for (let g = 0; g < 2000; g++) {
        const d = decorAt(g, seed, 7);
        out.push(d ? `${d.kind}${d.side}${d.offset.toFixed(1)}` : '-');
      }
      return out;
    };
    const a = layout(1);
    const b = layout(2);
    expect(a).toEqual(layout(1)); // deterministic for a given seed
    const same = a.filter((v, i) => v === b[i] && v !== '-').length;
    expect(same).toBe(0); // no shared tree between two seeds
    // both sides and both kinds are used
    const items = Array.from({ length: 3000 }, (_, i) => decorAt(i * 7, 5, 7)).filter(Boolean);
    expect(items.some((d) => d!.side === -1) && items.some((d) => d!.side === 1)).toBe(true);
    expect(items.some((d) => d!.kind === 'hay') && items.some((d) => d!.kind === 'tree')).toBe(true);
    expect(items.length / 3000).toBeGreaterThan(0.45); // ≈ 55 % of slots are occupied
  });
});
