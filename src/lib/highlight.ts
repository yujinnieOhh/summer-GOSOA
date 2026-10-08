import type { GameSchedule } from "@/src/constants/schedule";

/**
 * 영상 제목에 쓰이는 시즌 태그를 경기 날짜에서 계산.
 * KBL 시즌은 10월 개막 ~ 이듬해 5월 → mm >= 9면 그 해가 시작연도.
 *  251008 → 2025-26 · 260510 → 2025-26 · 261009 → 2026-27 · 240331 → 2023-24
 */
function seasonTag(yymmdd: string): { tag: string; startYear: number } {
  const yy = parseInt(yymmdd.slice(0, 2), 10);
  const mm = parseInt(yymmdd.slice(2, 4), 10);
  const startYear = 2000 + (mm >= 9 ? yy : yy - 1);
  const endTwo = String(startYear + 1).slice(2);
  return { tag: `${startYear}-${endTwo}`, startYear };
}

/**
 * TVING Sports posts highlights with titles like
 *   [KT vs 소노] 4/8 경기 I 2025-26 ... 프로농구 I 하이라이트 I TVING
 *
 * Channel-scoped search (youtube.com/@tvingsports/search) works in the
 * browser but the mobile YouTube app drops the query and only opens the
 * channel page. Using the global results endpoint keeps the query intact.
 *
 * 중계 플랫폼이 시즌마다 다르므로 시즌에 맞게 키워드를 바꾼다:
 *  - 2024-25 시즌~ : TVING KBL 독점 스트리밍(하이라이트도 TVING Sports 채널)
 *    → "하이라이트 TVING"
 *  - 2023-24 이전   : SPOTV/네트워크 중계로 TVING엔 영상 없음 → TVING 키워드가
 *    오히려 방해. KBL 공식 채널 등에 의존해 플랫폼 키워드 없이 "KBL 하이라이트".
 */
export function getHighlightSearchUrl(game: GameSchedule): string {
  const month = parseInt(game.date.slice(2, 4), 10);
  const day = parseInt(game.date.slice(4, 6), 10);
  const matchup = `${game.homeTeamName} vs ${game.awayTeamName}`;
  const { tag, startYear } = seasonTag(game.date);
  const platform = startYear >= 2024 ? "하이라이트 TVING" : "KBL 하이라이트";
  const query = `${matchup} ${month}/${day} ${tag} ${platform}`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}
