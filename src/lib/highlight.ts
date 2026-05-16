import type { GameSchedule } from "@/src/constants/schedule";

const SEASON_TAG = "2025-26";

/**
 * TVING Sports posts highlights with titles like
 *   [KT vs 소노] 4/8 경기 I 2025-26 LG전자 프로농구 I 하이라이트 I TVING
 *
 * Channel-scoped search (youtube.com/@tvingsports/search) works in the
 * browser but the mobile YouTube app drops the query and only opens the
 * channel page. Using the global results endpoint keeps the search query
 * intact when the mobile app intercepts the link; we include "TVING" in
 * the query so the TVING Sports highlight remains the top result.
 */
export function getHighlightSearchUrl(game: GameSchedule): string {
  const month = parseInt(game.date.slice(2, 4), 10);
  const day = parseInt(game.date.slice(4, 6), 10);
  const matchup = `${game.homeTeamName} vs ${game.awayTeamName}`;
  const query = `${matchup} ${month}/${day} ${SEASON_TAG} 하이라이트 TVING`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}
