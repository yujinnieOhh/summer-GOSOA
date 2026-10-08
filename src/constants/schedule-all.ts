import type { GameSchedule } from "./schedule";
import { SONO_SCHEDULE_2526 } from "./schedule";
import { SONO_SCHEDULE_2627 } from "./schedule-2627";

/**
 * 모든 시즌 경기를 하나로 합친 통합 목록 (검색/조회용). 날짜(yymmdd) 오름차순.
 * 시즌 간 날짜가 겹치지 않음(2526: 250920–260513, 2627: 261003–270411)이라
 * date를 그대로 고유 키로 쓸 수 있음. 새 시즌을 추가하면 여기에 spread만 더하면 됨.
 */
export const ALL_SONO_GAMES: GameSchedule[] = [
  ...SONO_SCHEDULE_2526,
  ...SONO_SCHEDULE_2627,
].sort((a, b) => a.date.localeCompare(b.date));

export interface Season {
  id: string;
  label: string;
  games: GameSchedule[];
}

/**
 * 시즌 목록 — 최신 시즌이 앞(배열 0번 = 기본 선택, 탭 왼쪽부터 최신→예전).
 * 새 시즌을 추가하면 이 배열 맨 앞에 넣으면 됨.
 */
export const SEASONS: Season[] = [
  { id: "2627", label: "26-27", games: SONO_SCHEDULE_2627 },
  { id: "2526", label: "25-26", games: SONO_SCHEDULE_2526 },
];

/** 어떤 경기가 속한 시즌 id. (date 접두사 매칭이 아니라 실제 소속 배열 기준) */
export function seasonIdOf(date: string): string {
  const s = SEASONS.find((season) => season.games.some((g) => g.date === date));
  return s?.id ?? SEASONS[0].id;
}
