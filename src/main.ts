import { createConfig, type WindDir } from './config/gameConfig';
import { themes, type ThemeName } from './config/theme';
import { Capacitor } from '@capacitor/core';
import { webPlatform } from './platform/web';
import type { Platform } from './platform/platform';
import './ui/fonts.css';
import { Sound } from './audio/sound';
import { Camera } from './render/camera';
import { Effects } from './render/effects';
import { renderShareCard } from './render/shareCard';
import { Renderer } from './render/renderer';
import { Trail } from './render/trail';
import { Game } from './sim/game';
import { bindInput } from './ui/input';
import { DEFAULT_LANG, formatMeters, getLang, setLang, t, type Lang } from './ui/i18n';
import { Screens } from './ui/screens';

async function main(): Promise<void> {
  // Native plugins are only loaded inside the Capacitor shell.
  const platform: Platform = Capacitor.isNativePlatform() ? (await import('./platform/capacitor')).capacitorPlatform : webPlatform;
  await platform.init();

  const cfg = createConfig();
  const s = platform.storage;
  const lang = await s.getSetting<Lang>('lang', DEFAULT_LANG);
  let themeName = await s.getSetting<ThemeName>('theme', 'day');
  let soundOn = await s.getSetting<boolean>('sound', true);
  const windDir = await s.getSetting<WindDir>('wind', cfg.defaultWindDir);
  const best: Record<string, number> = { '1': await s.getBest(1), '-1': await s.getBest(-1) };
  setLang(lang);

  const canvas = document.getElementById('game') as HTMLCanvasElement;
  const root = document.getElementById('ui') as HTMLElement;
  const game = new Game(cfg, windDir);
  const camera = new Camera();
  const trail = new Trail();
  const effects = new Effects();
  const sound = new Sound();
  sound.enabled = soundOn;
  const renderer = new Renderer(canvas, themes[themeName]);
  const resize = () => renderer.resize(cfg.camera.worldWidth, cfg.camera.maxCssWidth);
  window.addEventListener('resize', resize);
  resize();

  const bestNow = () => best[String(game.windDir)];
  const home = () => screens.showHome({ best: bestNow(), windDir: game.windDir, soundOn, night: themeName === 'night' });
  const toHome = () => {
    game.reset();
    camera.reset();
    trail.clear();
    home();
  };
  const applyTheme = () => {
    renderer.theme = themes[themeName];
    screens.applyTheme(themes[themeName]);
    document.documentElement.style.background = themes[themeName].ground;
  };

  const screens: Screens = new Screens(root, themes[themeName], {
    onWind: (dir) => {
      game.setWindDir(dir);
      void s.setSetting('wind', dir);
      camera.reset();
      trail.clear();
      home();
    },
    onToggleSound: () => {
      soundOn = !soundOn;
      sound.enabled = soundOn;
      sound.unlock();
      sound.tap();
      void s.setSetting('sound', soundOn);
      home();
    },
    onToggleTheme: () => {
      themeName = themeName === 'day' ? 'night' : 'day';
      void s.setSetting('theme', themeName);
      applyTheme();
      home();
    },
    onToggleLang: () => {
      setLang(getLang() === 'fr' ? 'en' : 'fr');
      void s.setSetting('lang', getLang());
      home();
    },
    onLeaderboard: () => screens.flash(t('leaderboardSoon')),
    onShare: () => {
      const score = game.score;
      void renderShareCard(game, camera, trail, themes[themeName], {
        brag: t('shareBrag'),
        meters: formatMeters(score),
        challenge: t('shareChallenge'),
        footer: t('shareFooter'),
      })
        .then((image) => platform.share({ title: 'Windy Drive', text: t('shareText', { n: score }), image }))
        .catch(() => screens.flash(t('shareError')));
    },
    onMenu: toHome,
    onReplay: () => {
      game.tap();
    },
  });

  game.on((e) => {
    if (e.type === 'tap') {
      sound.tap();
    } else if (e.type === 'start') {
      sound.start();
      trail.clear();
      effects.clear();
      screens.hideAll();
      screens.setScore(0);
      screens.showScore(true);
      void platform.keepAwake(true);
    } else if (e.type === 'crash') {
      platform.haptics.crash();
      sound.crash();
      effects.spawnCrash(game, themes[themeName]);
    } else if (e.type === 'over') {
      const prev = bestNow();
      const record = e.score > prev;
      if (record) {
        best[String(game.windDir)] = e.score;
        void s.setBest(game.windDir, e.score);
      }
      if (record) sound.record();
      void platform.keepAwake(false);
      screens.showOver({ score: e.score, best: bestNow(), prevBest: prev, record });
    }
  });

  bindInput(canvas, () => {
    sound.unlock(); // WebAudio needs a user gesture
    game.tap();
  });
  applyTheme();
  home();

  let frozen = false;
  if (import.meta.env.DEV) {
    const { shotRequested, applyShot } = await import('./dev/shots');
    const shot = shotRequested();
    if (shot) {
      frozen = true;
      applyShot(shot, {
        game, camera, trail, effects, screens, renderer,
        setTheme: (n) => { themeName = n; applyTheme(); },
        showHome: (best) => { screens.showHome({ best, windDir: game.windDir, soundOn, night: themeName === 'night' }); },
        w: () => renderer.w, h: () => renderer.h,
      });
      resize(); // pick up the 3x pixel ratio
    }
    (window as unknown as Record<string, unknown>).__wd = { game, camera, trail, themes, renderShareCard };
    const { setupDevPanel } = await import('./dev/devPanel');
    if (!frozen) setupDevPanel(game, () => {
      camera.reset();
      trail.clear();
      home();
    });
  }

  let last = performance.now();
  let lastScore = -1;
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!frozen) {
      game.update(dt);
      camera.update(game, dt);
      trail.update(game);
    }
    if (!frozen) effects.update(dt, game, renderer.w, renderer.h);
    if (!frozen && game.state === 'play' && game.score !== lastScore) {
      lastScore = game.score;
      screens.setScore(lastScore);
    }
    renderer.draw(game, camera, trail, effects);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

void main();
