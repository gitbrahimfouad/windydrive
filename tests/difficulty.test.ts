import { describe, expect, it } from 'vitest';
import { createConfig } from '../src/config/gameConfig';
import { difficultyLevel, paramsAt } from '../src/sim/difficulty';
import { Game } from '../src/sim/game';
import { Road } from '../src/sim/road';
import { autopilot } from './autopilot';

describe('progressive difficulty', () => {
  it('starts at the base values, ends at the max values, and never decreases', () => {
    const cfg = createConfig();
    const start = paramsAt(cfg, 0);
    expect(start.speed).toBe(cfg.car.speed);
    expect(start.narrowingProbability).toBe(cfg.narrowing.probability);
    const end = paramsAt(cfg, cfg.difficulty.rampStartMeters + cfg.difficulty.rampLengthMeters + 1000);
    expect(end).toEqual(cfg.difficulty.max);
    let prev = -1;
    for (let m = 0; m <= 4000; m += 50) {
      const k = difficultyLevel(cfg, m);
      expect(k).toBeGreaterThanOrEqual(prev);
      prev = k;
    }
  });

  it('can be disabled or forced (dev)', () => {
    const cfg = createConfig();
    cfg.difficulty.enabled = false;
    expect(paramsAt(cfg, 10000).speed).toBe(cfg.car.speed);
    cfg.difficulty.enabled = true;
    cfg.difficulty.forceLevel = 1;
    expect(paramsAt(cfg, 0).speed).toBe(cfg.difficulty.max.speed);
  });

  it('keeps every turn passable at the hardest level (turn rate within what tapping can sustain)', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const cfg = createConfig();
      const road = new Road(cfg, seed % 2 ? 1 : -1, seed * 7919);
      road.extend(12000); // ≈ 4.8 km: beyond the end of the ramp
      for (const s of road.segments) {
        if (s.kind === 'S') continue;
        const rate = s.speed / s.radius;
        const limit = s.against ? cfg.road.againstWindFactor * cfg.car.tap : cfg.car.maxOmega;
        expect(rate).toBeLessThanOrEqual(limit + 1e-9);
      }
      // the late road really is harder: higher speed is used to size its turns
      expect(road.segments[road.segments.length - 1].speed).toBeCloseTo(cfg.difficulty.max.speed, 0);
    }
  });

  it('the test autopilot still drives at the hardest level (forced from the start)', () => {
    const results: number[] = [];
    for (const dir of [1, -1] as const) {
      for (let seed = 1; seed <= 8; seed++) {
        const cfg = createConfig();
        cfg.difficulty.forceLevel = 1;
        // Short horizon + 0.25 s reactions: the long-horizon "tap every P s" policy is too coarse at 300 u/s
        // (it is a weak heuristic, not a proof of impassability).
        results.push(autopilot(new Game(cfg, dir, seed * 104729), 30, 0.9, 30)); // 30 s ≈ 900 m at max speed
      }
    }
    results.sort((a, b) => a - b);
    expect(results[results.length >> 1]).toBeGreaterThanOrEqual(850); // median run survives the 30 s
    expect(results.filter((r) => r >= 400).length).toBeGreaterThanOrEqual(12); // ≥ 75 % go far
  });
});
