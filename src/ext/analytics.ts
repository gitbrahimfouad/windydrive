/** Extension point (not implemented): usage statistics. */
export interface AnalyticsService {
  track(event: string, props?: Record<string, string | number | boolean>): void;
}
export const analytics: AnalyticsService | null = null;
