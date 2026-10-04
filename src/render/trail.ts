import type { Game } from '../sim/game';

/** Tyre marks: purely visual, derived from the car pose each frame. */
export class Trail {
  /** Each entry: [leftX, leftY, rightX, rightY]. */
  points: number[][] = [];
  private max = 70;

  clear(): void {
    this.points.length = 0;
  }

  update(game: Game): void {
    if (game.state !== 'play') return;
    const c = game.car;
    const cos = Math.cos(c.th);
    const sin = Math.sin(c.th);
    this.points.push([c.x + cos * -6 - sin * 9, c.y + sin * -6 + cos * 9, c.x + cos * 6 - sin * 9, c.y + sin * 6 + cos * 9]);
    if (this.points.length > this.max) this.points.shift();
  }
}
