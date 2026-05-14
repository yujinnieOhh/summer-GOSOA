"use client";

import { useEffect } from "react";
import type { GameSchedule } from "@/src/constants/schedule";
import { formatCount } from "@/src/lib/format";

interface Reason {
  id: string;
  content: string;
  likes: number;
}

interface ReasonsListModalProps {
  game: GameSchedule | null;
  reasons: Reason[];
  likedIds: Set<string>;
  open: boolean;
  onClose: () => void;
  onToggleLike: (reasonId: string) => void;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9Z" />
    </svg>
  );
}

export default function ReasonsListModal({
  game,
  reasons,
  likedIds,
  open,
  onClose,
  onToggleLike,
}: ReasonsListModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !game) return null;

  const sorted = [...reasons].sort((a, b) => b.likes - a.likes);
  const homeWon = game.homeScore > game.awayScore;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reasons-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-sono-navy/45 backdrop-blur-sm"
      />
      <div className="relative flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl bg-white p-5 shadow-xl ring-1 ring-sono-navy/10">
        <div className="mb-3 shrink-0">
          <p className="text-xs tracking-widest text-sono-navy/60">
            {game.date.slice(0, 2)}.{game.date.slice(2, 4)}.{game.date.slice(4, 6)} · {game.venue}
          </p>
          <h2
            id="reasons-modal-title"
            className="mt-1 font-court text-2xl text-sono-navy"
          >
            <span className={homeWon ? "" : "text-zinc-400"}>
              {game.homeTeamName} {game.homeScore}
            </span>
            <span className="mx-1.5 text-sono-navy/40">:</span>
            <span className={!homeWon ? "" : "text-zinc-400"}>
              {game.awayTeamName} {game.awayScore}
            </span>
          </h2>
        </div>

        <ul className="min-h-0 flex-1 divide-y divide-sono-navy/10 overflow-y-auto">
          {sorted.length === 0 ? (
            <li className="py-6 text-center text-sm text-zinc-400">
              아직 추천 이유가 없어요
            </li>
          ) : (
            sorted.map((r) => {
              const liked = likedIds.has(r.id);
              return (
                <li
                  key={r.id}
                  className="flex items-center gap-3 py-3"
                >
                  <p className="flex-1 text-sm leading-relaxed text-zinc-800">
                    {r.content}
                  </p>
                  <div className="flex shrink-0 flex-col items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => onToggleLike(r.id)}
                      aria-pressed={liked}
                      aria-label={liked ? "좋아요 취소" : "좋아요"}
                      className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                        liked
                          ? "text-rose-500"
                          : "text-zinc-400 hover:text-rose-500"
                      }`}
                    >
                      <HeartIcon filled={liked} />
                    </button>
                    <span className="text-[11px] font-medium text-zinc-500 tabular-nums">
                      {formatCount(r.likes)}
                    </span>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
