/** Seeded PRNG (mulberry32): same seed → same sequence, on every device. */
export interface Rng {
  next(): number; // [0, 1)
  range(a: number, b: number): number;
}

export function createRng(seed: number): Rng {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { next, range: (a, b) => a + next() * (b - a) };
}

export function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}
