import { App } from '@capacitor/app';
import { Capacitor, SystemBars, registerPlugin } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { Preferences } from '@capacitor/preferences';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { Share } from '@capacitor/share';
import { StatusBar } from '@capacitor/status-bar';
import type { WindDir } from '../config/gameConfig';
import { leaderboardIdFor, leaderboardsConfigured } from '../config/leaderboards';
import type { Platform } from './platform';

/** Native Game Center / Play Games bridge: plugins/windy-leaderboard. */
interface LeaderboardPlugin {
  initialize(): Promise<void>;
  submitScore(opts: { leaderboardId: string; score: number }): Promise<{ submitted: boolean }>;
  show(): Promise<{ shown: boolean }>;
}
const Leaderboard = registerPlugin<LeaderboardPlugin>('Leaderboard');
const store = Capacitor.getPlatform(); // 'ios' | 'android'

const bestKey = (d: WindDir) => `windy.best.${d === 1 ? 'right' : 'left'}`;
const settingKey = (k: string) => `windy.setting.${k}`;

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve((r.result as string).split(',')[1]);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/** Native implementation (iOS / Android) through Capacitor plugins. */
export const capacitorPlatform: Platform = {
  storage: {
    async getBest(dir) {
      const { value } = await Preferences.get({ key: bestKey(dir) });
      return parseInt(value ?? '0', 10) || 0;
    },
    async setBest(dir, meters) {
      await Preferences.set({ key: bestKey(dir), value: String(meters) });
    },
    async getSetting<T>(key: string, fallback: T) {
      const { value } = await Preferences.get({ key: settingKey(key) });
      if (value === null) return fallback;
      try {
        return JSON.parse(value) as T;
      } catch {
        return fallback;
      }
    },
    async setSetting<T>(key: string, v: T) {
      await Preferences.set({ key: settingKey(key), value: JSON.stringify(v) });
    },
  },
  haptics: {
    crash() {
      void Haptics.notification({ type: NotificationType.Error }).catch(() => {});
    },
    tap() {
      void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    },
  },
  async share({ title, text, image }) {
    try {
      let url: string | undefined;
      if (image) {
        // Sharing a file needs a file URI: write the PNG to the cache directory first.
        const saved = await Filesystem.writeFile({ path: 'windy-drive-score.png', data: await blobToBase64(image), directory: Directory.Cache });
        url = saved.uri;
      }
      await Share.share({ title, text, url, dialogTitle: title });
    } catch {
      /* user cancelled or share unavailable */
    }
  },
  leaderboard: {
    available: () => leaderboardsConfigured(store),
    async submit(dir, meters) {
      const leaderboardId = leaderboardIdFor(store, dir);
      if (!leaderboardId || meters <= 0) return;
      try {
        await Leaderboard.submitScore({ leaderboardId, score: Math.round(meters) });
      } catch {
        /* offline or not signed in: the local record is kept anyway */
      }
    },
    async show() {
      try {
        return (await Leaderboard.show()).shown;
      } catch {
        return false;
      }
    },
  },
  async keepAwake(on) {
    try {
      if (on) await KeepAwake.keepAwake();
      else await KeepAwake.allowSleep();
    } catch {
      /* not supported */
    }
  },
  async init() {
    if (leaderboardsConfigured(store)) void Leaderboard.initialize().catch(() => {});
    // Immersive portrait game: hide the status bar, lock the orientation.
    if (Capacitor.getPlatform() === 'android') {
      // Edge-to-edge immersive: hide status + navigation bars (swipe from the edge shows them briefly).
      await SystemBars.hide().catch(() => {});
    }
    await StatusBar.hide().catch(() => {});
    await ScreenOrientation.lock({ orientation: 'portrait' }).catch(() => {});
    // Release the screen when the app goes to the background.
    void App.addListener('pause', () => void KeepAwake.allowSleep().catch(() => {}));
  },
};
