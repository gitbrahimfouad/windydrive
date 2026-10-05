import type { WindDir } from './gameConfig';

/**
 * Leaderboard identifiers, one per wind direction and per store.
 * Create the leaderboards in App Store Connect (Game Center) and Google Play Console (Play Games Services),
 * then use these exact identifiers (iOS) or paste the generated ones (Android, "CgkI…").
 * While an id is empty, the leaderboard feature stays disabled (the button is hidden) on that platform.
 */
export const leaderboardIds = {
  ios: { right: 'windydrive.best.right', left: 'windydrive.best.left' },
  android: { right: 'CgkIlYyUsoYGEAIQAA', left: 'CgkIlYyUsoYGEAIQAQ' },
} as const;

export function leaderboardIdFor(platform: string, wind: WindDir): string {
  const ids = platform === 'ios' ? leaderboardIds.ios : platform === 'android' ? leaderboardIds.android : null;
  return ids ? (wind === 1 ? ids.right : ids.left) : '';
}

export function leaderboardsConfigured(platform: string): boolean {
  return !!leaderboardIdFor(platform, 1) && !!leaderboardIdFor(platform, -1);
}
