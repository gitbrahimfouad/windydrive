/** Roadside scenery placement. Pure (no canvas): deterministic for a given (sample index, road seed). */
export interface DecorItem {
  kind: 'tree' | 'hay';
  side: -1 | 1;
  /** Extra distance from the verge edge (units). */
  offset: number;
  radius: number;
  /** 0..1, picks the tree shade. */
  shade: number;
}

/** Integer hash → [0, 1). `k` selects an independent stream for the same sample. */
export function hash(i: number, seed: number, k: number): number {
  let h = Math.imul((i | 0) ^ Math.imul(k + 1, 0x9e3779b1), 374761393) + Math.imul(seed | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = Math.imul(h ^ (h >>> 16), 2246822519);
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
}

/** Scenery next to global sample index `g` of the road with seed `seed`; null = nothing here. */
export function decorAt(g: number, seed: number, every: number): DecorItem | null {
  if (g % every) return null;
  const h = hash(g, seed, 0);
  if (h < 0.45) return null;
  return {
    kind: h < 0.58 ? 'hay' : 'tree',
    side: hash(g, seed, 1) < 0.5 ? -1 : 1,
    offset: hash(g, seed, 2) * 140,
    radius: 9 + hash(g, seed, 3) * 11,
    shade: h,
  };
}
