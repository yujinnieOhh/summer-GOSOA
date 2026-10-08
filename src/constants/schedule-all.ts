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
