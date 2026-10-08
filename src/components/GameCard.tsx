"use client";

import { useEffect, useState } from "react";
import type { GameSchedule } from "@/src/constants/schedule";
import { formatCount } from "@/src/lib/format";
import { getHighlightSearchUrl } from "@/src/lib/highlight";
import { venueLabel } from "@/src/lib/venue";

interface GameCardProps {
  game: GameSchedule;
  likes: number;
  onLike?: () => void;
  onShowReasons?: () => void;
  onShowDetail?: () => void;
}

function dateLabel(yymmdd: string) {
  // 시즌이 여러 개라 연도까지 표시(yy.mm.dd) — 결과 이모지를 뺀 자리에 들어감.
  return `${yymmdd.slice(0, 2)}.${yymmdd.slice(2, 4)}.${yymmdd.slice(4, 6)}`;
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
  onShowDetail,
}: GameCardProps) {
  const highlightUrl = getHighlightSearchUrl(game);

  return (
    <article className="flex items-center justify-between gap-2 border-b border-sono-navy/15 bg-white/90 px-3 py-3 last:border-b-0 sm:gap-4 sm:px-4">
      {/* Tapping the info column opens the detail popup — users kept
          dead-clicking here expecting the score (Clarity 6월). */}
      {/* min-w-0 → 좁은 폭에선 이 info 칼럼이 먼저 줄어(구장명 말줄임)들어서
          오른쪽 액션 묶음(하이라이트 등)이 잘리지 않음. 액션이 justify-between으로
          우측 고정되므로 구장 고정폭 없이도 세로 정렬이 맞음. */}
      <button
        type="button"
        onClick={onShowDetail}
        aria-label="경기 상세 정보 보기"
        className="-my-1 -ml-1.5 flex min-w-0 items-center gap-1.5 rounded-sm px-1.5 py-1 text-left tabular-nums transition-colors hover:bg-sono-navy/5 active:bg-sono-navy/10"
      >
        {/* Date column — tune font here (size/weight/family). */}
        <span className="shrink-0 font-court text-sm text-zinc-700">
          {dateLabel(game.date)}
        </span>
        {/* 구장명: 좁으면 말줄임(…)으로 양보 — 날짜는 유지. */}
        <span className="truncate text-sm leading-none text-zinc-700">
          {venueLabel(game, "short")}
        </span>
        {/* 결과 이모지는 리스트에서 뺌(상세 팝업 카드에만 노출) — 탭하면 상세. */}
      </button>

      {/* 액션 묶음은 항상 우측 고정·전부 노출(shrink-0). 화면이 넓어도 여백은
          info와 이 묶음 사이로 분산되어 우측에 큰 빈 공간이 생기지 않음. */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        {/* Fixed-width slot keeps the badge horizontally centered so it grows
            symmetrically to both sides when the label gets longer. */}
        <div className="flex w-16 justify-center sm:w-20">
          <JerseyLikeBadge count={likes} onClick={onLike} />
        </div>
        <button
          type="button"
          onClick={onShowReasons}
          className="whitespace-nowrap rounded-sm px-1.5 py-1.5 text-[11px] font-semibold text-sono-navy ring-1 ring-sono-navy/30 transition-colors hover:bg-sono-navy/10 sm:px-3 sm:py-2 sm:text-xs"
        >
          추천 이유 보기
        </button>
        {/* Same-tab navigation on purpose: in-app browsers (KakaoTalk 등) drop
            target="_blank", turning the tap into a dead click (Clarity 6월).
            On mobile the YouTube app opens over the top anyway, so the user
            doesn't lose their place; desktop can use the back button. */}
        <a
          href={highlightUrl}
          aria-label="경기 하이라이트 보기"
          title="경기 하이라이트"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sono-navy ring-1 ring-sono-navy/30 transition-colors hover:bg-sono-navy/10 sm:h-9 sm:w-9"
        >
          <HighlightIcon />
        </a>
      </div>
    </article>
  );
}
