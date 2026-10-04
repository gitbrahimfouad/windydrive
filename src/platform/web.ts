import type { WindDir } from '../config/gameConfig';
import type { Platform } from './platform';

const bestKey = (d: WindDir) => `windy.best.${d === 1 ? 'right' : 'left'}`;
const settingKey = (k: string) => `windy.setting.${k}`;

/** Browser implementation (dev, PWA fallback). */
export const webPlatform: Platform = {
  storage: {
    async getBest(dir) {
      try {
        return parseInt(localStorage.getItem(bestKey(dir)) ?? '0', 10) || 0;
      } catch {
        return 0;
      }
    },
    async setBest(dir, meters) {
      try {
        localStorage.setItem(bestKey(dir), String(meters));
      } catch {
        /* storage unavailable: ignore */
      }
    },
    async getSetting<T>(key: string, fallback: T) {
      try {
        const v = localStorage.getItem(settingKey(key));
        return v === null ? fallback : (JSON.parse(v) as T);
      } catch {
        return fallback;
      }
    },
    async setSetting<T>(key: string, value: T) {
      try {
        localStorage.setItem(settingKey(key), JSON.stringify(value));
      } catch {
        /* ignore */
      }
    },
  },
  haptics: {
    crash() {
      try {
        navigator.vibrate?.(40);
      } catch {
        /* ignore */
      }
    },
    tap() {},
  },
  async share({ title, text, image }) {
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    try {
      if (image && nav.canShare?.({ files: [new File([image], 'windy-drive.png', { type: 'image/png' })] })) {
        await nav.share({ title, text, files: [new File([image], 'windy-drive.png', { type: 'image/png' })] });
      } else if (nav.share) {
        await nav.share({ title, text });
      }
    } catch {
      /* user cancelled */
    }
  },
  async keepAwake() {},
  async init() {},
};
