import type { GameSchedule } from "@/src/constants/schedule";

const TVING_CHANNEL = "https://www.youtube.com/@tvingsports";
const SEASON_TAG = "2025-26";

/**
 * TVING Sports posts highlights with titles like
 *   [KT vs 소노] 4/8 경기 I 2025-26 LG전자 프로농구 I 하이라이트 I TVING
 *
 * We don't have a YouTube API key to deep-link to the exact video, so we
 * return a channel-scoped search URL that lands the user on the right video
 * as the top result.
 *
 * Season note: the 2025-26 schedule spans Sep 2025 (yymmdd starting "25") to
 * May 2026 (yymmdd starting "26"). The title only uses month/day, so we just
 * extract those and rely on the season tag to disambiguate any same-day
 * games from prior seasons.
 */
export function getHighlightSearchUrl(game: GameSchedule): string {
  const month = parseInt(game.date.slice(2, 4), 10);
  const day = parseInt(game.date.slice(4, 6), 10);
  const matchup = `${game.homeTeamName} vs ${game.awayTeamName}`;
  const query = `${matchup} ${month}/${day} ${SEASON_TAG} 하이라이트`;
  return `${TVING_CHANNEL}/search?query=${encodeURIComponent(query)}`;
}
