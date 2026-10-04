import { applyTap, advance, stepCarPlay, type CarState } from '../src/sim/car';
import type { Game } from '../src/sim/game';

/**
 * Test-only autopilot (model-predictive). Policy: "tap every P seconds" (the mean angular
 * velocity is then -tap + drift·P/2, so P selects how fast the car turns towards the wind).
 * Every `decisionEvery` steps it simulates the next `horizon` seconds for several periods
 * and keeps the one that stays furthest from the road edge.
 * If it can drive far on many seeds, the generated roads are physically passable.
 */
const PERIODS = [0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.9, 1.0, 1.1, 1.25, 1.5, 2, 3, Infinity];

function rollout(game: Game, period: number, since: number, horizon: number): number {
  const { cfg, road, windDir } = game;
  const h = cfg.physics.step;
  const c: CarState = { ...game.car };
  let minMargin = Infinity;
  let sinceTap = since;
  const n = Math.round(horizon / h);
  for (let i = 0; i < n; i++) {
    if (sinceTap >= period) {
      applyTap(c, windDir, cfg);
      sinceTap = 0;
    }
    sinceTap += h;
    advance(c, stepCarPlay(c, h, windDir, cfg));
    const near = road.nearest(c.x, c.y, c.idx);
    c.idx = near.idx;
    const margin = road.widthAt(c.idx) / 2 - near.dist;
    if (margin < minMargin) minMargin = margin;
    if (margin < 0) return minMargin - (n - i) * 0.01; // an earlier crash is worse
  }
  return minMargin;
}

/** Drives `game` (must be in 'ready' state) for up to `maxSeconds`; returns the score. */
export function autopilot(game: Game, maxSeconds: number, horizon = 1.6, decisionEvery = 12): number {
  const h = game.cfg.physics.step;
  game.tap();
  let period = 0.6;
  let since = 0;
  for (let step = 0, t = 0; t < maxSeconds && game.state === 'play'; step++, t += h) {
    if (step % decisionEvery === 0) {
      game.road.ensure(game.car.idx, 700);
      let best = -Infinity;
      for (const cand of PERIODS) {
        const m = rollout(game, cand, since, horizon);
        if (m > best + 1e-9) {
          best = m;
          period = cand;
        }
      }
    }
    if (since >= period) {
      game.tap();
      since = 0;
    }
    since += h;
    game.update(h);
  }
  return game.score;
}
