/**
 * Single source of truth for every gameplay value.
 * Values come from the validated prototype (derive.html). Units: world units
 * (the visible screen width is `camera.worldWidth` units), seconds, radians.
 */
export type WindDir = 1 | -1; // 1 = wind pushes right (tap steers left), -1 = the opposite

export interface GameConfig {
  car: {
    speed: number; // units/s, constant
    drift: number; // rad/s² added to ω in the wind direction
    tap: number; // rad/s: ω is set to this (opposite to wind) on tap
    maxOmega: number; // rad/s cap of ω in the wind direction
    width: number;
    length: number;
  };
  physics: { step: number }; // fixed time step (s)
  road: {
    width: number;
    sampleStep: number; // distance between axis samples
    startIndex: number; // sample index where the car starts
    initialStraight: number; // nominal length of the first straight (before startIndex padding)
    initialStraightJitter: number; // ± fraction applied per road, so the start is not identical every game
    lookaheadSamples: number; // samples generated ahead of the car
    straightMin: number;
    straightMax: number;
    turnAngleMin: number;
    turnAngleMax: number;
    turnRadiusMaxFactor: number; // R ∈ [Rmin, factor·Rmin]
    againstWindFactor: number; // Rmin(against wind) = speed / (factor · tap)
    withWindDivisor: number; // Rmin(with wind) = speed / divisor
    minRadiusWidthFactor: number; // Rmin ≥ factor · road width
    curvatureSmoothing: number; // per-sample low-pass factor on curvature
    turnWeight: number;
    straightWeight: number;
    headingLimit: number; // |heading| soft bound (rad), see roadGenerator notes
    headingSoftLimit: number; // beyond this, turns that increase |heading| are forbidden
    angleFloorWhenLimited: number; // minimum turn angle when clamped by headingLimit
    warmupSegments: number;
    warmup: { radiusMin: number; radiusMax: number; angleMin: number; angleMax: number; straightMin: number; straightMax: number };
  };
  narrowing: {
    enabled: boolean;
    probability: number; // per eligible segment
    minSegmentLength: number;
    gentleRadiusFactor: number; // against-wind turns are "gentle" only if R > factor·Rmin
    widthMin: number; // fraction of normal width
    widthMax: number;
    transitionMax: number; // units
    transitionFraction: number; // of segment length
  };
  /**
   * Progressive difficulty: parameters move from their base value (above) to `max` as the distance grows,
   * from `rampStartMeters` over `rampLengthMeters`, then stay at `max`. Turn feasibility is preserved because
   * Rmin is always computed from the speed the car will have on that segment.
   */
  difficulty: {
    enabled: boolean;
    rampStartMeters: number;
    rampLengthMeters: number;
    /** Dev only: force the level (0..1); null = follow the distance. */
    forceLevel: number | null;
    max: {
      speed: number;
      narrowingProbability: number;
      narrowingWidthMin: number;
      narrowingWidthMax: number;
      turnRadiusMaxFactor: number;
      straightMax: number;
    };
  };
  camera: {
    worldWidth: number; // visible width in world units
    maxCssWidth: number; // beyond this CSS width (tablets) the scale stops growing
    carScreenY: number; // fraction of screen height
    followSmoothing: number; // exponential smoothing rate (1/s)
  };
  game: {
    crashDuration: number; // s of crash slide + shake before the end screen
    restartGuard: number; // s during which a tap does not restart
    metersPerUnit: number;
    crashSlideDamping: number;
    crashSpinFactor: number;
    shakeAmplitude: number;
  };
  defaultWindDir: WindDir;
}

export const defaultConfig: GameConfig = {
  car: { speed: 260, drift: 7, tap: 2.2, maxOmega: 3, width: 18, length: 30 },
  physics: { step: 1 / 120 },
  road: {
    width: 110,
    sampleStep: 4,
    startIndex: 40,
    initialStraight: 420,
    initialStraightJitter: 0.2,
    lookaheadSamples: 450,
    straightMin: 110,
    straightMax: 440,
    turnAngleMin: 0.4,
    turnAngleMax: 1.5,
    turnRadiusMaxFactor: 2.8,
    againstWindFactor: 0.62,
    withWindDivisor: 1.8,
    minRadiusWidthFactor: 0.9,
    curvatureSmoothing: 0.12,
    turnWeight: 1.7,
    straightWeight: 1,
    headingLimit: 1.25,
    headingSoftLimit: 0.75,
    angleFloorWhenLimited: 0.3,
    warmupSegments: 5,
    warmup: { radiusMin: 2.6, radiusMax: 3.6, angleMin: 0.3, angleMax: 0.65, straightMin: 120, straightMax: 220 },
  },
  narrowing: {
    enabled: true,
    probability: 0.3,
    minSegmentLength: 260,
    gentleRadiusFactor: 1.9,
    widthMin: 0.62,
    widthMax: 0.75,
    transitionMax: 130,
    transitionFraction: 0.3,
  },
  // Measured with the test autopilot (0.25 s reactions): at max level the time spent < 12 u from the edge is ×5,
  // survival over 40 s drops from 96 % to 83 %: harder but still passable.
  difficulty: {
    enabled: true,
    rampStartMeters: 0,
    rampLengthMeters: 2500,
    forceLevel: null,
    max: { speed: 300, narrowingProbability: 0.45, narrowingWidthMin: 0.55, narrowingWidthMax: 0.7, turnRadiusMaxFactor: 2.0, straightMax: 300 },
  },
  camera: { worldWidth: 360, maxCssWidth: 520, carScreenY: 0.68, followSmoothing: 3 },
  game: { crashDuration: 0.5, restartGuard: 0.35, metersPerUnit: 0.1, crashSlideDamping: 5, crashSpinFactor: 0.6, shakeAmplitude: 14 },
  defaultWindDir: 1,
};

export function createConfig(): GameConfig {
  return structuredClone(defaultConfig);
}
