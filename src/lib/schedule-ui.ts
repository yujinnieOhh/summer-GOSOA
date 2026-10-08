import type { GameSchedule } from "@/src/constants/schedule";

// 아직 치르지 않은(예정) 경기에 점수 대신 보여줄 문구. 한 줄만 바꾸면 전체가
// 바뀜 (예: "예정된 경기"). resultIcon "⏳" = 미종료 경기.
export const UPCOMING_LABEL = "소노가 이겨주길";

export function isUpcoming(game: GameSchedule): boolean {
  return game.resultIcon === "⏳";
}
