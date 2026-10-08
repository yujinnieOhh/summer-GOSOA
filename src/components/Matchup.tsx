import type { GameSchedule } from "@/src/constants/schedule";
import { UPCOMING_LABEL, isUpcoming } from "@/src/lib/schedule-ui";

/**
 * 모달 헤더용 매치업 타이틀 (font-court 2xl). 끝난 경기는 스코어 + 승팀 강조,
 * 예정 경기는 점수 대신 "소노가 이겨주길"(팀명은 유지해 누구랑 하는지는 보이게).
 */
export function MatchupTitle({
  game,
  id,
}: {
  game: GameSchedule;
  id?: string;
}) {
  if (isUpcoming(game)) {
    return (
      <h2
        id={id}
        className="mt-1 font-court text-2xl leading-tight text-sono-navy"
      >
        {game.homeTeamName}
        <span className="mx-1.5 align-middle text-lg text-sono-navy/40">vs</span>
        {game.awayTeamName}
        <span className="mt-0.5 block font-jump text-sm font-normal text-sono-navy/70">
          {UPCOMING_LABEL}
        </span>
      </h2>
    );
  }

  const homeWon = game.homeScore > game.awayScore;
  return (
    <h2 id={id} className="mt-1 font-court text-2xl text-sono-navy">
      <span className={homeWon ? "" : "text-zinc-400"}>
        {game.homeTeamName} {game.homeScore}
      </span>
      <span className="mx-1.5 text-sono-navy/40">:</span>
      <span className={!homeWon ? "" : "text-zinc-400"}>
        {game.awayTeamName} {game.awayScore}
      </span>
    </h2>
  );
}
