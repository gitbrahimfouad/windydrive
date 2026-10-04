import type { Game } from '../sim/game';

/** Camera angle follows the road heading under the car with exponential smoothing. */
export class Camera {
  angle = 0;

  reset(): void {
    this.angle = 0;
  }

  update(game: Game, dt: number): void {
    if (game.state === 'ready' || game.state === 'over') return;
    const target = game.road.pts[game.car.idx].a;
    this.angle += (target - this.angle) * (1 - Math.exp(-game.cfg.camera.followSmoothing * dt));
  }
}
