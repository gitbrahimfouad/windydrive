import type { Theme } from '../config/theme';
import type { Game } from '../sim/game';

interface Particle {
  kind: 'dust' | 'spark';
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  max: number;
  col: string;
}
interface Streak {
  x: number;
  y: number;
  len: number;
  s: number;
}

const TAU = Math.PI * 2;

/** Purely visual effects: crash dust and sparks (world space), wind streaks (screen space). */
export class Effects {
  private parts: Particle[] = [];
  private streaks: Streak[] = [];

  clear(): void {
    this.parts.length = 0;
  }

  spawnCrash(game: Game, theme: Theme): void {
    const c = game.car;
    const hx = Math.sin(c.th);
    const hy = -Math.cos(c.th);
    const side = game.windDir;
    for (let i = 0; i < 20; i++) {
      const a = Math.random() * TAU;
      const sp = 40 + Math.random() * 150;
      this.parts.push({ kind: 'dust', x: c.x, y: c.y, vx: Math.cos(a) * sp + hx * 90 + side * 40, vy: Math.sin(a) * sp + hy * 90, r: 5 + Math.random() * 7, life: 0, max: 0.9 + Math.random() * 0.9, col: theme.dust[i % theme.dust.length] });
    }
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * TAU;
      const sp = 120 + Math.random() * 260;
      this.parts.push({ kind: 'spark', x: c.x, y: c.y, vx: Math.cos(a) * sp + hx * 120, vy: Math.sin(a) * sp + hy * 120, r: 2, life: 0, max: 0.25 + Math.random() * 0.45, col: theme.spark[i % theme.spark.length] });
    }
  }

  update(dt: number, game: Game, w: number, h: number): void {
    for (const p of this.parts) {
      p.life += dt;
      const d = Math.exp(-(p.kind === 'dust' ? 2.2 : 1.2) * dt);
      p.vx *= d;
      p.vy *= d;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.parts = this.parts.filter((p) => p.life < p.max);

    if (!this.streaks.length) {
      for (let i = 0; i < 16; i++) this.streaks.push({ x: Math.random() * w, y: Math.random() * h, len: 6 + Math.random() * 12, s: Math.random() });
    }
    const speed = game.state === 'play' ? 1 : game.state === 'crash' ? 0.4 : 0.25;
    for (const s of this.streaks) {
      s.x += game.windDir * (120 + s.s * 150) * dt * speed;
      s.y += game.speed * (0.85 + s.s * 0.25) * dt * speed * 0.6;
      if (s.y > h + 20 || s.x < -30 || s.x > w + 30) {
        s.y = -10 - Math.random() * 80;
        s.x = Math.random() * w;
      }
    }
  }

  drawWorld(c: CanvasRenderingContext2D): void {
    for (const p of this.parts) {
      const t = p.life / p.max;
      if (p.kind === 'dust') {
        c.globalAlpha = (1 - t) * 0.85;
        c.fillStyle = p.col;
        c.beginPath();
        c.arc(p.x, p.y, p.r * (1 + t * 2.2), 0, TAU);
        c.fill();
      } else {
        c.globalAlpha = 1 - t;
        c.strokeStyle = p.col;
        c.lineWidth = 2.2;
        c.beginPath();
        c.moveTo(p.x, p.y);
        c.lineTo(p.x - p.vx * 0.035, p.y - p.vy * 0.035);
        c.stroke();
      }
    }
    c.globalAlpha = 1;
  }

  drawScreen(c: CanvasRenderingContext2D, theme: Theme, game: Game): void {
    c.strokeStyle = theme.wind;
    c.lineWidth = 2;
    c.lineCap = 'round';
    c.beginPath();
    for (const s of this.streaks) {
      const vx = game.windDir * (120 + s.s * 150);
      const vy = game.speed * 0.6 * (0.85 + s.s * 0.25);
      const m = Math.hypot(vx, vy);
      c.moveTo(s.x, s.y);
      c.lineTo(s.x - (vx / m) * s.len, s.y - (vy / m) * s.len);
    }
    c.stroke();
  }
}
