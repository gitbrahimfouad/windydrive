import { fonts, type Theme } from '../config/theme';
import type { WindDir } from '../config/gameConfig';
import { t } from './i18n';

/**
 * "How to play" overlay: shown automatically on the first launch, then from the "?" button.
 * Blocks taps to the game while open. Illustrations are inline SVG drawn with the theme colours
 * and mirrored when the wind blows to the left.
 */
export class Tutorial {
  private el: HTMLElement | null = null;
  private onClose: (() => void) | null = null;

  constructor(
    private root: HTMLElement,
    private theme: Theme,
  ) {}

  get isOpen(): boolean {
    return this.el !== null;
  }

  applyTheme(theme: Theme): void {
    this.theme = theme;
  }

  open(windDir: WindDir, onClose?: () => void): void {
    this.close(false);
    this.onClose = onClose ?? null;
    const th = this.theme;
    const right = windDir === 1;

    const overlay = document.createElement('div');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', t('howToPlay'));
    overlay.style.cssText =
      'position:absolute;inset:0;pointer-events:auto;display:flex;align-items:center;justify-content:center;' +
      'padding:calc(var(--sat) + 16px) 16px calc(var(--sab) + 16px);box-sizing:border-box;background:rgba(10,20,8,.72);';
    // Taps on the overlay must never reach the game canvas underneath.
    for (const ev of ['pointerdown', 'pointerup', 'click'] as const) overlay.addEventListener(ev, (e) => e.stopPropagation());

    const card = document.createElement('div');
    card.style.cssText =
      `width:100%;max-width:380px;max-height:100%;overflow:auto;box-sizing:border-box;padding:22px 20px 20px;border-radius:24px;` +
      `background:${th.uiPanel};color:${th.uiInk};font-family:${fonts.ui};box-shadow:0 8px 0 rgba(0,0,0,.25);`;

    const title = document.createElement('h2');
    title.textContent = t('howToPlay');
    title.style.cssText = `margin:0 0 14px;text-align:center;font:400 30px ${fonts.display};line-height:1.05;`;

    const steps: Array<[string, string]> = [
      [this.svgWind(right), t(right ? 'tutWindRight' : 'tutWindLeft')],
      [this.svgTap(right), t(right ? 'tutTapRight' : 'tutTapLeft')],
      [this.svgNarrow(), t('tutRoad')],
      [this.svgScore(), t('tutScore')],
    ];
    const list = document.createElement('ol');
    list.style.cssText = 'list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px;';
    steps.forEach(([svg, text], i) => {
      const li = document.createElement('li');
      li.style.cssText = 'display:flex;align-items:center;gap:14px;';
      const pic = document.createElement('div');
      pic.style.cssText = `flex:none;width:84px;height:56px;border-radius:14px;overflow:hidden;background:${th.ground};position:relative;`;
      pic.innerHTML = svg;
      const num = document.createElement('span');
      num.textContent = String(i + 1);
      num.style.cssText = `position:absolute;left:4px;top:4px;width:18px;height:18px;border-radius:50%;display:grid;place-items:center;background:rgba(0,0,0,.45);font:400 11px ${fonts.display};color:#fff;line-height:1;`;
      pic.appendChild(num);
      const p = document.createElement('p');
      p.textContent = text;
      p.style.cssText = 'margin:0;font-size:15px;line-height:1.35;font-weight:500;';
      li.append(pic, p);
      list.appendChild(li);
    });

    const tip = document.createElement('p');
    tip.textContent = t('tutWindTip');
    tip.style.cssText = 'margin:14px 0 0;font-size:13px;line-height:1.35;opacity:.75;text-align:center;';

    const go = document.createElement('button');
    go.textContent = t('tutGo');
    go.style.cssText =
      `display:block;width:100%;height:58px;margin-top:16px;border:0;border-radius:20px;cursor:pointer;` +
      `background:${th.uiYellow};color:#2a2a2a;font:400 24px ${fonts.display};box-shadow:0 6px 0 ${th.uiYellowShadow};`;
    go.addEventListener('click', () => this.close(true));

    card.append(title, list, tip, go);
    overlay.appendChild(card);
    this.ensureKeyframes();
    this.root.appendChild(overlay);
    this.el = overlay;
    // Keyboard users get the focus on the button; on touch screens it would only draw a focus ring.
    if (window.matchMedia?.('(pointer: fine)').matches) go.focus({ preventScroll: true });
  }

  /** Closes the overlay; `notify` runs the onClose callback (marks the tutorial as seen). */
  close(notify = true): void {
    if (!this.el) return;
    this.el.remove();
    this.el = null;
    const cb = this.onClose;
    this.onClose = null;
    if (notify) cb?.();
  }

  // ---- illustrations (viewBox 84×56, wind to the right; mirrored for a left wind) ----

  private car(x: number, y: number, rot = 0): string {
    const th = this.theme;
    return (
      `<g transform="translate(${x} ${y}) rotate(${rot})">` +
      `<rect x="-6" y="-10" width="12" height="20" rx="3.5" fill="${th.car}"/>` +
      `<rect x="-2.6" y="-10" width="1.8" height="20" fill="${th.carAccent}"/><rect x=".8" y="-10" width="1.8" height="20" fill="${th.carAccent}"/>` +
      `<rect x="-4.5" y="-4.5" width="9" height="3.5" rx="1" fill="${th.glass}"/></g>`
    );
  }

  private road(x: number, w: number): string {
    const th = this.theme;
    return `<rect x="${x - w / 2}" y="-2" width="${w}" height="60" fill="${th.asphalt}"/>` + `<rect x="${x - w / 2 - 3}" y="-2" width="3" height="60" fill="${th.curbA}"/><rect x="${x + w / 2}" y="-2" width="3" height="60" fill="${th.curbA}"/>`;
  }

  private mirror(svg: string, right: boolean): string {
    return right ? svg : `<g transform="translate(84 0) scale(-1 1)">${svg}</g>`;
  }

  private svgWind(right: boolean): string {
    const w = 'rgba(255,255,255,.95)';
    const inner =
      this.road(46, 34) +
      `<g stroke="${w}" stroke-width="2.6" stroke-linecap="round" fill="none">` +
      `<path d="M6 16h18M10 26h16M4 36h20"/><path d="M20 12l5 4-5 4M22 22l5 4-5 4M20 32l5 4-5 4"/></g>` +
      this.car(52, 30, 18) +
      `<path d="M50 46c6 0 10-3 12-8" stroke="${this.theme.uiYellow}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M60 37l3 1 0 3" stroke="${this.theme.uiYellow}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    return `<svg viewBox="0 0 84 56" width="84" height="56" aria-hidden="true">${this.mirror(inner, right)}</svg>`;
  }

  private svgTap(right: boolean): string {
    const th = this.theme;
    const inner =
      this.road(34, 34) +
      this.car(36, 32, -16) +
      `<path d="M38 18c-4-3-9-3-12 1" stroke="${th.uiYellow}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M28 16l-2 3 3 1" stroke="${th.uiYellow}" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
      `<circle cx="68" cy="32" r="11" fill="none" stroke="#fff" stroke-width="2" style="transform-origin:68px 32px;animation:wdTap 1.2s ease-out infinite"/>` +
      `<circle cx="68" cy="32" r="5.5" fill="#fff"/>`;
    return `<svg viewBox="0 0 84 56" width="84" height="56" aria-hidden="true">${this.mirror(inner, right)}</svg>`;
  }

  private svgNarrow(): string {
    const th = this.theme;
    return (
      `<svg viewBox="0 0 84 56" width="84" height="56" aria-hidden="true">` +
      `<path d="M22 58 L30 30 L30 -2 L54 -2 L54 30 L62 58 Z" fill="${th.asphalt}"/>` +
      `<path d="M22 58 L30 30 L30 -2" stroke="${th.warnA}" stroke-width="3" fill="none"/><path d="M62 58 L54 30 L54 -2" stroke="${th.warnA}" stroke-width="3" fill="none"/>` +
      `<g transform="translate(13 22)"><path d="M0 -9 L9 7 L-9 7 Z" fill="${th.sign}" stroke="${th.signInk}" stroke-width="1.6" stroke-linejoin="round"/>` +
      `<path d="M-2 -3 L-1 4 M2 -3 L1 4" stroke="${th.signInk}" stroke-width="1.5"/></g>` +
      this.car(42, 42) +
      `</svg>`
    );
  }

  private svgScore(): string {
    return (
      `<svg viewBox="0 0 84 56" width="84" height="56" aria-hidden="true">` +
      this.road(42, 30) +
      `<text x="48" y="25" text-anchor="middle" font-family='"Bowlby One", Impact, sans-serif' font-size="14" fill="#fff" stroke="${this.theme.scoreShadow}" stroke-width=".8">1 286</text>` +
      `<text x="48" y="35" text-anchor="middle" font-family='"DM Sans", sans-serif' font-weight="700" font-size="7" fill="#fff" letter-spacing="1">m</text>` +
      this.car(42, 47) +
      `</svg>`
    );
  }

  private ensureKeyframes(): void {
    if (document.getElementById('wd-tut-kf')) return;
    const s = document.createElement('style');
    s.id = 'wd-tut-kf';
    s.textContent =
      '@keyframes wdTap{0%{transform:scale(.5);opacity:1}100%{transform:scale(1.35);opacity:0}}' +
      '@media (prefers-reduced-motion:reduce){[style*="wdTap"]{animation:none!important}}';
    document.head.appendChild(s);
  }
}
