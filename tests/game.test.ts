import { describe, expect, it } from 'vitest';
import { createConfig } from '../src/config/gameConfig';
import { Game } from '../src/sim/game';
import { autopilot } from './autopilot';

describe('game simulation', () => {
  it('starts on tap, crashes when leaving the road and reaches game over', () => {
    const game = new Game(createConfig(), 1, 1);
    expect(game.state).toBe('ready');
    game.tap();
    expect(game.state).toBe('play');
    for (let i = 0; i < 60 * 20 && game.state !== 'over'; i++) game.update(1 / 60); // never tap
    expect(game.state).toBe('over');
    expect(game.score).toBeGreaterThanOrEqual(0);
  });

  it('ignores restart taps during the guard delay, then restarts', () => {
    const game = new Game(createConfig(), 1, 1);
    game.tap();
    while (game.state !== 'over') game.update(1 / 60);
    expect(game.tap()).toBe(false);
    game.update(0.2);
    expect(game.tap()).toBe(false);
    game.update(0.2);
    expect(game.tap()).toBe(true);
    expect(game.state).toBe('play');
  });

  it('is deterministic: same seed and inputs give the same result', () => {
    const run = () => {
      const g = new Game(createConfig(), 1, 99);
      return autopilot(g, 20);
    };
    expect(run()).toBe(run());
  });

  it('is physically drivable: a predictive autopilot covers long distances on most seeds, both wind directions', () => {
    // Smoke test of the whole physics + generator. The autopilot is a simple heuristic (it
    // only knows "tap every P seconds"), so it is allowed to fail on the occasional hard
    // S-bend; a systematic impassable turn would drag the median and the tail down.
    const results: number[] = [];
    for (const dir of [1, -1] as const) {
      for (let seed = 1; seed <= 10; seed++) {
        results.push(autopilot(new Game(createConfig(), dir, seed * 104729), 40)); // 40 s ≈ 1040 m max
      }
    }
    results.sort((a, b) => a - b);
    const median = results[results.length >> 1];
    expect(median).toBeGreaterThanOrEqual(1000);
    expect(results.filter((r) => r >= 600).length).toBeGreaterThanOrEqual(Math.ceil(results.length * 0.8));
  });
});
