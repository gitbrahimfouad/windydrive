import type { GameConfig } from '../config/gameConfig';

/** Difficulty level 0..1 at a given distance (metres), eased with smoothstep so there is no visible step. */
export function difficultyLevel(cfg: GameConfig, meters: number): number {
  const d = cfg.difficulty;
  if (!d.enabled) return 0;
  if (d.forceLevel !== null) return Math.max(0, Math.min(1, d.forceLevel));
  const t = Math.max(0, Math.min(1, (meters - d.rampStartMeters) / d.rampLengthMeters));
  return t * t * (3 - 2 * t);
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Gameplay parameters in effect at a given distance. */
export interface DifficultyParams {
  speed: number;
  narrowingProbability: number;
  narrowingWidthMin: number;
  narrowingWidthMax: number;
  turnRadiusMaxFactor: number;
  straightMax: number;
}

export function paramsAt(cfg: GameConfig, meters: number): DifficultyParams {
  const k = difficultyLevel(cfg, meters);
  const m = cfg.difficulty.max;
  return {
    speed: lerp(cfg.car.speed, m.speed, k),
    narrowingProbability: lerp(cfg.narrowing.probability, m.narrowingProbability, k),
    narrowingWidthMin: lerp(cfg.narrowing.widthMin, m.narrowingWidthMin, k),
    narrowingWidthMax: lerp(cfg.narrowing.widthMax, m.narrowingWidthMax, k),
    turnRadiusMaxFactor: lerp(cfg.road.turnRadiusMaxFactor, m.turnRadiusMaxFactor, k),
    straightMax: lerp(cfg.road.straightMax, m.straightMax, k),
  };
}
