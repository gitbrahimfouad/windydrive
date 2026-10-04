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
  /** Online leaderboards (Game Center / Play Games). `available()` is false on the web or while unconfigured. */
  leaderboard: {
    available(): boolean;
    /** Submits the score for the given wind direction; failures are silent. */
    submit(dir: WindDir, meters: number): Promise<void>;
    /** Opens the native leaderboards; false when the player is not signed in. */
    show(): Promise<boolean>;
  };
  keepAwake(on: boolean): Promise<void>;
  /** Called once at startup (status bar, orientation lock…). */
  init(): Promise<void>;
}
