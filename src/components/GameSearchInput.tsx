"use client";

import { useMemo, useState } from "react";
import {
  SONO_SCHEDULE_2526,
  type GameSchedule,
} from "@/src/constants/schedule";

interface GameSearchInputProps {
  onSelect?: (game: GameSchedule) => void;
  onRecommend?: (game: GameSchedule) => void;
}

const MAX_SUGGESTIONS = 6;

function formatDateLabel(yymmdd: string) {
  const yy = yymmdd.slice(0, 2);
  const mm = yymmdd.slice(2, 4);
  const dd = yymmdd.slice(4, 6);
  return `${yy}.${mm}.${dd}`;
}

function GameSummary({ game }: { game: GameSchedule }) {
  const homeWon = game.homeScore > game.awayScore;
  const homeClass = homeWon
    ? "font-jump font-extrabold text-sono-navy"
    : "text-zinc-400";
  const awayClass = !homeWon
    ? "font-jump font-extrabold text-sono-navy"
    : "text-zinc-400";

  return (
    <span className="tabular-nums">
      <span className={homeClass}>
        {game.homeTeamName} {game.homeScore}
      </span>
      <span className="mx-1 text-zinc-500">:</span>
      <span className={awayClass}>
        {game.awayTeamName} {game.awayScore}
      </span>
    </span>
  );
}

export default function GameSearchInput({
  onSelect,
  onRecommend,
}: GameSearchInputProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<GameSchedule | null>(null);
  const [open, setOpen] = useState(false);

  const suggestions = useMemo(() => {
    const cleaned = query.replace(/\D/g, "");
    if (cleaned.length === 0) return [];
    return SONO_SCHEDULE_2526.filter((g) => g.date.startsWith(cleaned)).slice(
      0,
      MAX_SUGGESTIONS,
    );
  }, [query]);

  const handleSelect = (game: GameSchedule) => {
    setSelected(game);
    setQuery(game.date);
    setOpen(false);
    onSelect?.(game);
  };

  return (
    <div className="relative w-full">
      <label className="block text-sm text-sono-navy/80 mb-1.5">
        경기 날짜 검색 (yymmdd)
      </label>
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={query}
        placeholder="예: 251008"
        onChange={(e) => {
          setQuery(e.target.value.replace(/\D/g, ""));
          setSelected(null);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className="w-full rounded-lg bg-white/95 px-4 py-3 text-sono-navy placeholder:text-zinc-400 outline-none ring-1 ring-white/60 focus:ring-2 focus:ring-sono-navy tabular-nums"
      />

      {open && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1.5 w-full overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-sono-navy/10">
          {suggestions.map((game) => (
            <li key={game.date}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(game)}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-sono-sky/15"
              >
                <span className="text-zinc-500 tabular-nums">
                  {formatDateLabel(game.date)}
                </span>
                <GameSummary game={game} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-white/90 px-4 py-3 text-sm">
          <div className="min-w-0">
            <div className="mb-1 text-xs text-zinc-500 tabular-nums">
              {formatDateLabel(selected.date)} · {selected.venue}
            </div>
            <GameSummary game={selected} />
          </div>
          <button
            type="button"
            onClick={() => onRecommend?.(selected)}
            className="shrink-0 rounded-lg bg-sono-navy px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-sono-navy/90"
          >
            추천하기
          </button>
        </div>
      )}
    </div>
  );
}
