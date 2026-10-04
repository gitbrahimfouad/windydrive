import type { WindDir } from '../config/gameConfig';

/** Everything that touches the device. The game only talks to this interface. */
export interface Platform {
  storage: {
    getBest(dir: WindDir): Promise<number>;
    setBest(dir: WindDir, meters: number): Promise<void>;
    getSetting<T>(key: string, fallback: T): Promise<T>;
    setSetting<T>(key: string, value: T): Promise<void>;
  };
  haptics: { crash(): void; tap(): void };
  /** Native share of an image (PNG blob) with a text. */
  share(opts: { title: string; text: string; image?: Blob }): Promise<void>;
  keepAwake(on: boolean): Promise<void>;
  /** Called once at startup (status bar, orientation lock…). */
  init(): Promise<void>;
}
