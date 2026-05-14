"use client";

import { useEffect, useState } from "react";
import type { GameSchedule } from "@/src/constants/schedule";
import { formatCount } from "@/src/lib/format";
import { getHighlightSearchUrl } from "@/src/lib/highlight";

interface GameCardProps {
  game: GameSchedule;
  likes: number;
  onLike?: () => void;
  onShowReasons?: () => void;
}

function mmdd(yymmdd: string) {
  return `${yymmdd.slice(2, 4)}.${yymmdd.slice(4, 6)}`;
}

export function JerseyLikeBadge({
  count,
  onClick,
}: {
  count: number;
  onClick?: () => void;
}) {
  const label = formatCount(count);
  const len = label.length;

  // Text size is unified across 1/2/3-digit and "k" labels (3-digit baseline).
  // Jersey width still stretches symmetrically for longer "k" labels so the
  // label never feels cramped inside the body cavity.
  const widthClass = len >= 6 ? "w-20" : len >= 4 ? "w-16" : "w-14";

  const sharedMask: React.CSSProperties = {
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskSize: "100% 100%",
    maskSize: "100% 100%",
  };

  // Flash state gives mobile taps an unmistakable, lingering acknowledgment —
  // ":active" alone disappears the instant the finger lifts on touch devices.
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(false), 280);
    return () => clearTimeout(t);
  }, [flash]);

  function handleClick() {
    setFlash(true);
    onClick?.();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`이 경기 추천 ${count}`}
      className={`group relative inline-flex h-12 ${widthClass} items-center justify-center`}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-jersey-sky transition-colors group-hover:bg-jersey-sky/85"
        style={{
          ...sharedMask,
          WebkitMaskImage: "url(/jersey-silhouette.png)",
          maskImage: "url(/jersey-silhouette.png)",
        }}
      />
      {/* Tap-flash tint, clipped to the jersey shape so the feedback covers
          the whole body and is impossible to miss on mobile. */}
      <span
        aria-hidden="true"
        className={`absolute inset-0 bg-sono-navy transition-opacity duration-200 ease-out ${
          flash ? "opacity-70" : "opacity-0"
        } group-hover:opacity-25`}
        style={{
          ...sharedMask,
          WebkitMaskImage: "url(/jersey-silhouette.png)",
          maskImage: "url(/jersey-silhouette.png)",
        }}
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-sono-navy"
        style={{
          ...sharedMask,
          WebkitMaskImage: "url(/jersey.png)",
          maskImage: "url(/jersey.png)",
        }}
      />
      <span className="relative mt-3 font-jump text-[13px] font-extrabold leading-none tracking-tight text-sono-navy tabular-nums">
        {label}
      </span>
    </button>
  );
}

function HighlightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
    </svg>
  );
}

export default function GameCard({
  game,
  likes,
  onLike,
  onShowReasons,
}: GameCardProps) {
  const highlightUrl = getHighlightSearchUrl(game);

  return (
    <article className="flex items-center justify-between gap-3 border-b border-sono-navy/15 bg-white/90 px-3 py-3 last:border-b-0 sm:gap-4 sm:px-4">
      <div className="flex shrink-0 flex-wrap items-center gap-2 tabular-nums">
        {/* Date column — tune font here (size/weight/family). */}
        <span className="font-court text-sm text-zinc-700">
          {mmdd(game.date)}
        </span>
        <span className="text-sm leading-none text-zinc-700">{game.venue}</span>

        <span className="text-base leading-none" aria-hidden="true">
          {game.resultIcon}
        </span>
      </div>

      {/* Single-row action cluster on every viewport. justify-between on the
          parent collapses to a small natural gap on phones because the action
          cluster takes most of the remaining width. */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        {/* Fixed-width slot keeps the badge horizontally centered so it grows
            symmetrically to both sides when the label gets longer. */}
        <div className="flex w-20 justify-center">
          <JerseyLikeBadge count={likes} onClick={onLike} />
        </div>
        <button
          type="button"
          onClick={onShowReasons}
          className="whitespace-nowrap rounded-lg px-2 py-1 text-[11px] font-semibold text-sono-navy ring-1 ring-sono-navy/30 transition-colors hover:bg-sono-navy/10 sm:px-3 sm:py-2 sm:text-xs"
        >
          추천 이유 보기
        </button>
        <a
          href={highlightUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="경기 하이라이트 보기"
          title="경기 하이라이트"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sono-navy ring-1 ring-sono-navy/30 transition-colors hover:bg-sono-navy/10 sm:h-9 sm:w-9"
        >
          <HighlightIcon />
        </a>
      </div>
    </article>
  );
}
