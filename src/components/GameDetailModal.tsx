"use client";

import { useEffect } from "react";
import type { GameSchedule } from "@/src/constants/schedule";
import { venueLabel } from "@/src/lib/venue";
import { MatchupTitle } from "@/src/components/Matchup";

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
  return ""; // 예정(⏳)이면 결과 칩 숨김 — 매치업에 "소노가 이겨주길"로 표시
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
      <div className="relative w-full max-w-md rounded-lg bg-white p-5 shadow-[0_24px_48px_-12px_rgba(33,61,101,0.45)] ring-1 ring-sono-navy/10">
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-sono-navy/50 transition-colors hover:bg-sono-navy/10 hover:text-sono-navy"
        >
          <CloseIcon />
        </button>

        <p className="text-xs tracking-widest text-sono-navy/60">
          {game.date.slice(0, 2)}.{game.date.slice(2, 4)}.
          {game.date.slice(4, 6)} · {venueLabel(game, "long")}
        </p>
        <MatchupTitle game={game} id="detail-modal-title" />

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full border-2 border-sono-sky/40 px-2.5 py-1 text-xs font-medium text-sono-navy">
            {game.isHome ? "홈경기" : "원정경기"}
          </span>
          {label && (
            <span className="rounded-full border-2 border-sono-sky/40 px-2.5 py-1 text-xs font-medium text-sono-navy">
              {game.resultIcon} {label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
