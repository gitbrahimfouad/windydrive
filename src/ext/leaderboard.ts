/** Extension point (not implemented): online leaderboard (Game Center / Google Play Games). */
export interface LeaderboardService {
  submitScore(meters: number, wind: 1 | -1): Promise<void>;
  show(): Promise<void>;
}
export const leaderboard: LeaderboardService | null = null;
