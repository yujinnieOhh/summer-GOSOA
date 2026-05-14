"use client";

import { useEffect, useRef, useState } from "react";
import type { GameSchedule } from "@/src/constants/schedule";

interface ReasonModalProps {
  game: GameSchedule;
  open: boolean;
  onClose: () => void;
  onSubmit: (content: string) => void;
}

const MAX = 140;

export default function ReasonModal({
  game,
  open,
  onClose,
  onSubmit,
}: ReasonModalProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (open) {
      setValue("");
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const trimmed = value.trim();
  const canSubmit = trimmed.length > 0;
  const homeWon = game.homeScore > game.awayScore;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reason-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-sono-navy/45 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-xl ring-1 ring-sono-navy/10">
        <div className="mb-3">
          <p className="text-xs tracking-widest text-sono-navy/60">
            {game.date.slice(0, 2)}.{game.date.slice(2, 4)}.{game.date.slice(4, 6)} · {game.venue}
          </p>
          <h2
            id="reason-modal-title"
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

        <label className="block text-sm font-medium text-sono-navy">
          이 경기를 추천하는 이유
        </label>
        <textarea
          ref={textareaRef}
          value={value}
          maxLength={MAX}
          onChange={(e) => setValue(e.target.value)}
          rows={4}
          placeholder="명장면, 인상 깊었던 플레이, 응원하고 싶은 선수 등"
          className="mt-1.5 block w-full resize-none rounded-lg bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800 outline-none ring-1 ring-zinc-200 focus:ring-2 focus:ring-sono-navy"
        />
        <div className="mt-1 text-right text-xs text-zinc-400 tabular-nums">
          {value.length}/{MAX}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100"
          >
            취소
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              if (!canSubmit) return;
              onSubmit(trimmed);
            }}
            className="rounded-lg bg-sono-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sono-navy/90 disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            완료
          </button>
        </div>
      </div>
    </div>
  );
}
