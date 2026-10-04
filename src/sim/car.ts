import type { GameConfig, WindDir } from '../config/gameConfig';

export interface CarState {
  x: number;
  y: number;
  /** Heading (rad), 0 = up, positive = towards +x. */
  th: number;
  /** Angular velocity ω (rad/s), positive = turning towards +x (right). */
  w: number;
  /** Speed (units/s); only changes while crashing (slide). */
  v: number;
  /** Local index of the nearest road sample. */
  idx: number;
}

/**
 * Flappy-Bird model applied to rotation:
 *  - the wind constantly increases ω in its own direction (capped);
 *  - a tap sets ω to a fixed value in the opposite direction;
 *  - heading integrates ω; position integrates heading at constant speed.
 * Called with the fixed step (1/120 s) so behaviour is identical on every device.
 */
export function stepCarPlay(c: CarState, h: number, wind: WindDir, cfg: GameConfig): number {
  c.w += wind * cfg.car.drift * h;
  c.w = wind === 1 ? Math.min(c.w, cfg.car.maxOmega) : Math.max(c.w, -cfg.car.maxOmega);
  c.th += c.w * h;
  return cfg.car.speed * h; // distance to advance
}

export function applyTap(c: CarState, wind: WindDir, cfg: GameConfig): void {
  c.w = -wind * cfg.car.tap;
}

/** After a crash: slow down exponentially while the car keeps rotating a little. */
export function stepCarCrash(c: CarState, h: number, cfg: GameConfig): number {
  c.v *= Math.exp(-cfg.game.crashSlideDamping * h);
  c.th += c.w * h * cfg.game.crashSpinFactor;
  return c.v * h;
}

export function advance(c: CarState, d: number): void {
  c.x += Math.sin(c.th) * d;
  c.y -= Math.cos(c.th) * d;
}
