"use client";

import { useEffect } from "react";
import type { GameSchedule } from "@/src/constants/schedule";
import { venueLabel } from "@/src/lib/venue";

interface GameDetailModalProps {
  game: GameSchedule | null;
  open: boolean;
  onClose: () => void;
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function resultLabel(icon: string): string {
  if (icon === "🩵") return "소노 승";
  if (icon === "💔") return "소노 패";
  if (icon === "⏳") return "경기 예정";
  return "";
}

/**
 * Read-only game detail popup. Opened by tapping a card's info column — users
 * kept dead-clicking there (Clarity 6월) expecting the score. Mirrors the
 * ReasonModal header (matchup + winner styling) minus the input/submit.
 */
export default function GameDetailModal({
  game,
  open,
  onClose,
}: GameDetailModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !game) return null;

  const homeWon = game.homeScore > game.awayScore;
  const label = resultLabel(game.resultIcon);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-sono-navy/45 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-xl ring-1 ring-sono-navy/10">
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-sono-navy/50 transition-colors hover:bg-sono-navy/10 hover:text-sono-navy"
        >
          <CloseIcon />
        </button>

        <p className="text-xs tracking-widest text-sono-navy/60">
          {game.date.slice(0, 2)}.{game.date.slice(2, 4)}.{game.date.slice(4, 6)}{" "}
          · {venueLabel(game, "long")}
        </p>
        <h2
          id="detail-modal-title"
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

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-sono-sky/20 px-2.5 py-1 text-xs font-medium text-sono-navy">
            {game.isHome ? "홈경기" : "원정경기"}
          </span>
          {label && (
            <span className="rounded-full bg-sono-sky/20 px-2.5 py-1 text-xs font-medium text-sono-navy">
              {game.resultIcon} {label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
