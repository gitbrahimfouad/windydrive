import { fonts, type Theme } from '../config/theme';
import type { WindDir } from '../config/gameConfig';
import { formatMeters, t } from './i18n';

export interface ScreenCallbacks {
  onWind(dir: WindDir): void;
  onToggleSound(): void;
  onToggleTheme(): void;
  onToggleLang(): void;
  onLeaderboard(): void;
  onShare(): void;
  onMenu(): void;
  onReplay(): void;
}

export interface HomeData {
  best: number;
  windDir: WindDir;
  soundOn: boolean;
  night: boolean;
  /** Show the Leaderboard button (native app with leaderboards configured). */
  leaderboard: boolean;
}
export interface OverData {
  score: number;
  best: number;
  prevBest: number;
  record: boolean;
}

/** HTML overlay for HUD, home and game-over screens. Styled only through the theme. */
export class Screens {
  private hud = document.createElement('div');
  private scoreEl = document.createElement('div');
  private screen = document.createElement('div');
  private toast = document.createElement('div');
  private toastTimer = 0;
  private last: { kind: 'home'; d: HomeData } | { kind: 'over'; d: OverData } | { kind: 'none' } = { kind: 'none' };

  constructor(
    root: HTMLElement,
    private theme: Theme,
    private cb: ScreenCallbacks,
  ) {
    const safeTop = 'var(--sat)';
    this.hud.style.cssText = `position:absolute;top:0;left:0;right:0;text-align:center;padding-top:calc(${safeTop} + 14px);`;
    this.scoreEl.style.cssText = `font-family:${fonts.display};font-size:56px;line-height:1;`;
    this.hud.appendChild(this.scoreEl);
    this.screen.style.cssText = 'position:absolute;inset:0;';
    this.toast.style.cssText = `position:absolute;left:50%;bottom:calc(var(--sab) + 150px);transform:translateX(-50%);padding:12px 18px;border-radius:22px;font:700 14px ${fonts.ui};text-align:center;width:max-content;max-width:calc(100vw - 48px);opacity:0;transition:opacity .2s;`;
    root.append(this.hud, this.screen, this.toast);
    this.applyTheme(theme);
  }

  applyTheme(theme: Theme): void {
    this.theme = theme;
    this.scoreEl.style.color = theme.score;
    this.scoreEl.style.textShadow = `0 3px 0 ${theme.scoreShadow}`;
    this.toast.style.background = theme.uiPanel;
    this.toast.style.color = theme.uiInk;
    if (this.last.kind === 'home') this.showHome(this.last.d);
    else if (this.last.kind === 'over') this.showOver(this.last.d);
  }

  setScore(n: number): void {
    this.scoreEl.textContent = String(n);
  }
  showScore(on: boolean): void {
    this.hud.style.display = on ? '' : 'none';
  }

  flash(text: string): void {
    this.toast.textContent = text;
    this.toast.style.opacity = '1';
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => (this.toast.style.opacity = '0'), 1600);
  }

  hideAll(): void {
    this.last = { kind: 'none' };
    this.screen.replaceChildren();
  }

  // ---- building blocks ----

  private pill(label: string, onClick: () => void): HTMLElement {
    const b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = `pointer-events:auto;height:44px;padding:0 16px;border-radius:999px;background:rgba(0,0,0,.28);border:2px solid rgba(255,255,255,.9);color:#fff;font:700 14px ${fonts.ui};cursor:pointer;`;
    b.addEventListener('pointerdown', (e) => e.stopPropagation());
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick();
    });
    return b;
  }

  private logo(): HTMLElement {
    const th = this.theme;
    const word = (text: string, color: string, bars: number[], margin: number) => {
      const row = document.createElement('div');
      row.style.cssText = `display:flex;align-items:center;gap:10px;margin-left:${margin}px;`;
      const gust = document.createElement('div');
      gust.style.cssText = 'display:flex;flex-direction:column;gap:9px;align-items:flex-end;';
      for (const w of bars) {
        const bar = document.createElement('div');
        bar.style.cssText = `width:${w}px;height:7px;border-radius:4px;background:#fff;box-shadow:0 5px 0 ${th.uiAccent};`;
        gust.appendChild(bar);
      }
      const span = document.createElement('span');
      span.textContent = text;
      span.style.cssText = `font-size:62px;color:${color};`;
      row.append(gust, span);
      return row;
    };
    const logo = document.createElement('div');
    logo.style.cssText = `display:flex;flex-direction:column;transform:skewX(-9deg);font-family:${fonts.display};line-height:.88;text-shadow:0 5px 0 ${th.uiAccent};`;
    logo.append(word('WINDY', '#fff', [30, 18, 26], 0), word('DRIVE', th.uiYellow, [18, 26, 30], 16));
    return logo;
  }

  private base(gradient: string): HTMLElement {
    const el = document.createElement('div');
    const top = 'calc(var(--sat) + 18px)';
    const bottom = 'calc(var(--sab) + 28px)';
    el.style.cssText = `position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;box-sizing:border-box;padding:${top} 22px ${bottom};color:#fff;font-family:${fonts.ui};background:${gradient};pointer-events:none;`;
    return el;
  }

  // ---- screens ----

  showHome(d: HomeData): void {
    this.last = { kind: 'home', d };
    this.showScore(false);
    const th = this.theme;
    const el = this.base('linear-gradient(180deg,rgba(22,40,12,.62) 0%,rgba(22,40,12,0) 44%,rgba(22,40,12,0) 58%,rgba(22,40,12,.7) 100%)');

    const top = document.createElement('div');
    top.style.cssText = 'width:100%;display:flex;justify-content:space-between;gap:8px;';
    top.append(this.pill(d.soundOn ? t('soundOn') : t('soundOff'), this.cb.onToggleSound));
    if (d.leaderboard) top.append(this.pill(t('leaderboard'), this.cb.onLeaderboard));

    const rec = document.createElement('div');
    rec.style.cssText = `margin-top:30px;display:flex;align-items:center;gap:10px;background:${th.uiPanel};color:${th.uiInk};padding:9px 18px;border-radius:999px;box-shadow:0 4px 0 rgba(36,64,26,.5);`;
    rec.innerHTML = `<span style="font-weight:700;font-size:12px;letter-spacing:.14em;color:${th.uiAccent}">${t('record')}</span><span style="font-family:${fonts.display};font-size:20px;white-space:nowrap">${formatMeters(d.best)} m</span>`;

    const spacer = document.createElement('div');
    spacer.style.flex = '1';

    const cta = document.createElement('div');
    cta.textContent = t('tapToPlay');
    cta.style.cssText = `font-family:${fonts.display};font-size:30px;text-shadow:0 4px 0 #24401a;animation:wdPulse 1.1s ease-in-out infinite;`;
    const hint = document.createElement('div');
    hint.textContent = t('hint');
    hint.style.cssText = 'font-size:14px;font-weight:500;margin-top:8px;';

    const wind = document.createElement('div');
    wind.style.cssText = 'margin-top:26px;display:flex;align-items:center;gap:12px;';
    const label = document.createElement('span');
    label.textContent = t('wind');
    label.style.cssText = 'font-weight:700;font-size:12px;letter-spacing:.16em;';
    const seg = document.createElement('div');
    seg.style.cssText = 'display:flex;padding:4px;border-radius:999px;background:rgba(0,0,0,.3);gap:4px;';
    for (const [dir, text] of [[-1, t('left')], [1, t('right')]] as const) {
      const on = d.windDir === dir;
      const b = document.createElement('button');
      b.textContent = text;
      b.style.cssText = `pointer-events:auto;height:40px;padding:0 16px;border-radius:999px;border:0;font:700 14px ${fonts.ui};white-space:nowrap;cursor:pointer;background:${on ? th.uiPanel : 'transparent'};color:${on ? th.uiInk : '#fff'};`;
      b.addEventListener('pointerdown', (e) => e.stopPropagation());
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        this.cb.onWind(dir);
      });
      seg.appendChild(b);
    }
    wind.append(label, seg);

    const prefs = document.createElement('div');
    prefs.style.cssText = 'margin-top:16px;display:flex;gap:10px;';
    prefs.append(this.pill(d.night ? t('light') : t('dark'), this.cb.onToggleTheme), this.pill(t('language') + ' · FR/EN', this.cb.onToggleLang));

    const logoWrap = document.createElement('div');
    logoWrap.style.marginTop = '40px';
    logoWrap.appendChild(this.logo());

    el.append(top, logoWrap, rec, spacer, cta, hint, wind, prefs);
    this.screen.replaceChildren(el);
    this.ensureKeyframes();
  }

  showOver(d: OverData): void {
    this.last = { kind: 'over', d };
    this.showScore(false);
    const th = this.theme;
    const el = this.base('linear-gradient(180deg,rgba(22,40,12,.72) 0%,rgba(22,40,12,.35) 48%,rgba(22,40,12,.8) 100%)');

    const top = document.createElement('div');
    top.style.cssText = 'width:100%;display:flex;';
    top.appendChild(this.pill(t('menu'), this.cb.onMenu));

    const badge = document.createElement('div');
    badge.style.marginTop = '30px';
    if (d.record) {
      badge.textContent = t('newRecord');
      badge.style.cssText += `font-family:${fonts.display};font-size:28px;color:#2a2a2a;background:${th.uiYellow};padding:10px 20px;border-radius:16px;transform:rotate(-4deg);box-shadow:0 6px 0 ${th.uiYellowShadow};`;
    } else {
      badge.textContent = t('offRoad');
      badge.style.cssText += `font-weight:700;font-size:12px;letter-spacing:.18em;text-transform:uppercase;background:${th.uiRed};padding:8px 14px;border-radius:999px;`;
    }

    const big = document.createElement('div');
    big.textContent = formatMeters(d.score);
    big.style.cssText = `font-family:${fonts.display};font-size:96px;line-height:1;margin-top:22px;text-shadow:0 6px 0 #24401a;white-space:nowrap;`;
    const unit = document.createElement('div');
    unit.textContent = t('meters');
    unit.style.cssText = 'font-weight:700;font-size:17px;letter-spacing:.14em;text-transform:uppercase;margin-top:4px;';

    const extra = document.createElement('div');
    if (d.record) {
      extra.style.cssText = 'margin-top:30px;font-weight:700;font-size:15px;';
      extra.innerHTML = `${t('prevRecord')} ${formatMeters(d.prevBest)} m · <span style="color:${th.uiYellow}">+${formatMeters(d.score - d.prevBest)} m</span>`;
    } else {
      extra.style.cssText = 'margin-top:34px;width:100%;max-width:300px;display:flex;flex-direction:column;gap:10px;';
      const pct = d.best ? Math.min(100, (d.score / d.best) * 100) : 0;
      extra.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:baseline;font-weight:700"><span style="font-size:19px;color:${th.uiYellow};white-space:nowrap">${t('almost', { n: formatMeters(d.best - d.score) })}</span><span style="font-size:14px;white-space:nowrap">${t('bestIs', { n: formatMeters(d.best) })}</span></div><div style="height:12px;border-radius:6px;background:rgba(255,255,255,.25);overflow:hidden"><div style="width:${pct.toFixed(1)}%;height:100%;background:${th.uiYellow};border-radius:6px"></div></div>`;
    }

    const spacer = document.createElement('div');
    spacer.style.flex = '1';

    const replay = document.createElement('button');
    replay.textContent = t('replay');
    replay.style.cssText = `pointer-events:auto;width:100%;height:84px;border:0;border-radius:26px;background:${th.uiYellow};color:#2a2a2a;font-family:${fonts.display};font-size:30px;box-shadow:0 7px 0 ${th.uiYellowShadow};cursor:pointer;`;
    replay.addEventListener('pointerdown', (e) => e.stopPropagation());
    replay.addEventListener('click', (e) => {
      e.stopPropagation();
      this.cb.onReplay();
    });

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:14px;align-items:center;margin-top:22px;width:100%;';
    const share = document.createElement('button');
    share.textContent = t('share');
    share.style.cssText = `pointer-events:auto;height:54px;padding:0 22px;border-radius:18px;border:2px solid #fff;background:transparent;color:#fff;font:700 16px ${fonts.ui};cursor:pointer;`;
    share.addEventListener('pointerdown', (e) => e.stopPropagation());
    share.addEventListener('click', (e) => {
      e.stopPropagation();
      this.cb.onShare();
    });
    const or = document.createElement('div');
    or.textContent = t('orTap');
    or.style.cssText = 'font-size:14px;line-height:1.3;opacity:.85;';
    row.append(share, or);

    el.append(top, badge, big, unit, extra, spacer, replay, row);
    this.screen.replaceChildren(el);
  }

  private ensureKeyframes(): void {
    if (document.getElementById('wd-kf')) return;
    const s = document.createElement('style');
    s.id = 'wd-kf';
    s.textContent = '@keyframes wdPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.07);opacity:.75}}';
    document.head.appendChild(s);
  }
}
