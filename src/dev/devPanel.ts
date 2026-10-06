import type { Game } from '../sim/game';

/** Development-only tuning panel. Imported behind `import.meta.env.DEV`, so absent from production builds. */
export function setupDevPanel(game: Game, onChange: () => void): void {
  const cfg = game.cfg;
  const panel = document.createElement('div');
  panel.style.cssText =
    'position:fixed;left:8px;bottom:calc(var(--sab) + 36px);z-index:99;font:12px system-ui;color:#fff;background:rgba(0,0,0,.78);border-radius:10px;padding:8px 10px;pointer-events:auto;max-width:230px;';
  const toggle = document.createElement('button');
  toggle.textContent = 'DEV';
  toggle.style.cssText = 'position:fixed;left:8px;bottom:calc(var(--sab) + 8px);z-index:100;font:700 11px system-ui;padding:4px 8px;border-radius:8px;border:0;pointer-events:auto;';
  panel.hidden = true;
  toggle.onclick = () => (panel.hidden = !panel.hidden);
  for (const el of [panel, toggle]) el.addEventListener('pointerdown', (e) => e.stopPropagation());

  const rows: Array<[string, () => number, (v: number) => void, number, number, number]> = [
    ['drift (rad/s²)', () => cfg.car.drift, (v) => (cfg.car.drift = v), 2, 14, 0.5],
    ['tap (rad/s)', () => cfg.car.tap, (v) => (cfg.car.tap = v), 1, 4, 0.1],
    ['speed (u/s)', () => cfg.car.speed, (v) => (cfg.car.speed = v), 140, 420, 10],
    ['road width', () => cfg.road.width, (v) => (cfg.road.width = v), 60, 170, 2],
    // -1 = follow the distance; 0..1 = force the difficulty level (test the hardest road immediately)
    ['difficulty (-1 = auto)', () => cfg.difficulty.forceLevel ?? -1, (v) => (cfg.difficulty.forceLevel = v < 0 ? null : v), -1, 1, 0.25],
  ];
  for (const [label, get, set, min, max, step] of rows) {
    const row = document.createElement('label');
    row.style.cssText = 'display:block;margin:4px 0;';
    const val = document.createElement('b');
    val.textContent = String(get());
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(get());
    input.style.width = '100%';
    input.oninput = () => {
      set(parseFloat(input.value));
      val.textContent = input.value;
      game.reset(game.seed); // same seed: compare the effect on the same road
      onChange();
    };
    row.append(`${label}: `, val, input);
    panel.appendChild(row);
  }

  const narrow = document.createElement('label');
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = cfg.narrowing.enabled;
  cb.onchange = () => {
    cfg.narrowing.enabled = cb.checked;
    game.reset(game.seed);
    onChange();
  };
  narrow.append(cb, ' narrowing');
  const seed = document.createElement('input');
  seed.type = 'number';
  seed.placeholder = 'seed (empty = random)';
  seed.style.cssText = 'width:100%;margin-top:6px;box-sizing:border-box;';
  seed.onchange = () => {
    game.reset(seed.value === '' ? undefined : parseInt(seed.value, 10) >>> 0);
    onChange();
  };
  const seedInfo = document.createElement('div');
  seedInfo.style.opacity = '.7';
  const refresh = () => (seedInfo.textContent = `seed ${game.seed}`);
  refresh();
  game.on(() => refresh());
  panel.append(narrow, seed, seedInfo);
  document.body.append(toggle, panel);
}
