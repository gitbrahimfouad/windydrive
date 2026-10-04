import type { GameConfig, WindDir } from '../config/gameConfig';
import { advance, applyTap, stepCarCrash, stepCarPlay, type CarState } from './car';
import { Road } from './road';
import { randomSeed } from './rng';

export type GameState = 'ready' | 'play' | 'crash' | 'over';
export type GameEvent = { type: 'start' } | { type: 'tap' } | { type: 'crash' } | { type: 'over'; score: number };

/**
 * Game simulation: state machine, fixed-step physics, collision, score.
 * No DOM, no clock: time only enters through `update(dt)`.
 */
export class Game {
  road!: Road;
  car!: CarState;
  state: GameState = 'ready';
  crashTimeLeft = 0;
  /** Seconds since the game-over state began (restart guard). */
  overElapsed = 0;
  seed: number;
  private acc = 0;
  private listeners: Array<(e: GameEvent) => void> = [];

  constructor(
    public cfg: GameConfig,
    public windDir: WindDir = cfg.defaultWindDir,
    seed: number = randomSeed(),
  ) {
    this.seed = seed;
    this.reset(seed);
  }

  on(fn: (e: GameEvent) => void): void {
    this.listeners.push(fn);
  }
  private emit(e: GameEvent): void {
    for (const fn of this.listeners) fn(e);
  }

  /** New road (new seed unless given) and car at the start; state 'ready'. */
  reset(seed: number = randomSeed()): void {
    this.seed = seed;
    this.road = new Road(this.cfg, this.windDir, seed);
    const p = this.road.pts[this.cfg.road.startIndex];
    this.car = { x: p.x, y: p.y, th: 0, w: 0, v: this.cfg.car.speed, idx: this.cfg.road.startIndex };
    this.state = 'ready';
    this.crashTimeLeft = 0;
    this.overElapsed = 0;
    this.acc = 0;
  }

  setWindDir(dir: WindDir): void {
    this.windDir = dir;
    this.reset();
  }

  /** Distance along the road, in metres. */
  get score(): number {
    const samples = this.road.offset + this.car.idx - this.cfg.road.startIndex;
    return Math.max(0, Math.floor(samples * this.cfg.road.sampleStep * this.cfg.game.metersPerUnit));
  }

  /** Local half-width of the road under the car. */
  get halfWidth(): number {
    return this.road.widthAt(this.car.idx) / 2;
  }

  /** Returns true when the tap was consumed. */
  tap(): boolean {
    switch (this.state) {
      case 'ready':
        this.state = 'play';
        applyTap(this.car, this.windDir, this.cfg);
        this.emit({ type: 'start' });
        return true;
      case 'play':
        applyTap(this.car, this.windDir, this.cfg);
        this.emit({ type: 'tap' });
        return true;
      case 'over':
        if (this.overElapsed < this.cfg.game.restartGuard) return false;
        this.reset();
        this.state = 'play';
        applyTap(this.car, this.windDir, this.cfg);
        this.emit({ type: 'start' });
        return true;
      default:
        return false;
    }
  }

  update(dt: number): void {
    if (this.state === 'over') {
      this.overElapsed += dt;
      return;
    }
    if (this.state !== 'play' && this.state !== 'crash') return;
    const h = this.cfg.physics.step;
    this.acc += dt;
    while (this.acc >= h) {
      this.step(h);
      this.acc -= h;
      if ((this.state as GameState) === 'over') {
        this.acc = 0;
        break;
      }
    }
    // Keep memory bounded: drop old samples, preserving the global index.
    if (this.car.idx > 1600) this.car.idx -= this.road.rebase(1000);
  }

  private move(d: number): number {
    advance(this.car, d);
    const n = this.road.nearest(this.car.x, this.car.y, this.car.idx);
    this.car.idx = n.idx;
    return n.dist;
  }

  private step(h: number): void {
    if (this.state === 'play') {
      this.road.ensure(this.car.idx, this.cfg.road.lookaheadSamples);
      const d = stepCarPlay(this.car, h, this.windDir, this.cfg);
      const dist = this.move(d);
      // Lost when the car centre leaves the axis by more than half the local width.
      if (dist > this.halfWidth) {
        this.state = 'crash';
        this.crashTimeLeft = this.cfg.game.crashDuration;
        this.car.v = this.cfg.car.speed;
        this.emit({ type: 'crash' });
      }
    } else if (this.state === 'crash') {
      this.move(stepCarCrash(this.car, h, this.cfg));
      this.crashTimeLeft -= h;
      if (this.crashTimeLeft <= 0) {
        this.crashTimeLeft = 0;
        this.state = 'over';
        this.overElapsed = 0;
        this.emit({ type: 'over', score: this.score });
      }
    }
  }
}
