import type { GameSchedule } from "@/src/constants/schedule";

/**
 * Seoul hosts two KBL teams — SK at 학생체육관, 삼성 at 실내체육관 — so a bare
 * "서울" can't tell them apart in the list. Disambiguate by the game's home
 * team. `short` for the dense card list, `long` for modals.
 */
const SEOUL_ARENAS: Record<string, { short: string; long: string }> = {
  SK: { short: "서울(학)", long: "서울 학생체육관" },
  삼성: { short: "서울(실)", long: "서울 실내체육관" },
};

export function venueLabel(game: GameSchedule, form: "short" | "long"): string {
  const arena = SEOUL_ARENAS[game.homeTeamName];
  if (arena) return arena[form];
  return game.venue;
}
