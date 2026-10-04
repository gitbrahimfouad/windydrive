/** Extension point (not implemented): ads between games. */
export interface AdService {
  /** Called when a game ends; may show an interstitial. */
  onGameOver(gamesPlayed: number): Promise<void>;
}
export const ads: AdService | null = null;
