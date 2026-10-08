"use client";

import { useEffect, useState } from "react";
import type { GameSchedule } from "@/src/constants/schedule";
import { ALL_SONO_GAMES } from "@/src/constants/schedule-all";

/**
 * 접속 시 1일 1회 뜨는 안내 팝업.
 *  ① 오늘이 소노 경기일  → "오늘 경기 추천하세요" (시즌 내내)
 *  ② 경기 없는 날 + 10월 → 예전 시즌 탭 신설 안내 (2026-10 한정)
 * 경기일이면 10월이어도 ① 우선. 둘 다 아니면 안 띄움.
 */

type Variant = "gameday" | "october";

// 1일 1회 제어용. 값 = 마지막으로 띄운 날짜(yymmdd).
const SEEN_KEY = "gosoa_popup_seen";
// 예전 시즌 탭 신설 안내 노출 기간(2026-10 한 달).
const OCT_START = "261001";
const OCT_END = "261031";

/** KST(Asia/Seoul) 기준 오늘 날짜 yymmdd. 뷰어 타임존과 무관하게 계산. */
function todayYymmdd(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}${get("month")}${get("day")}`;
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

export default function WelcomeModal({
  onRecommendToday,
  onFocusSearch,
}: {
  // ① 경기일 CTA: 오늘 경기 추천이유 모달 열기.
  onRecommendToday?: (game: GameSchedule) => void;
  // ② 10월 CTA: 날짜 검색 입력칸으로 이동·포커스.
  onFocusSearch?: () => void;
}) {
  const [variant, setVariant] = useState<Variant | null>(null);
  const [todayGame, setTodayGame] = useState<GameSchedule | null>(null);

  // 마운트 후 결정(SSR 하이드레이션 불일치 방지 — 서버는 아무것도 렌더 안 함).
  useEffect(() => {
    const today = todayYymmdd();
    try {
      if (localStorage.getItem(SEEN_KEY) === today) return; // 오늘 이미 봄
    } catch {
      /* 프라이빗 모드 등 — 그냥 띄움 */
    }

    const game = ALL_SONO_GAMES.find((g) => g.date === today) ?? null;
    let v: Variant | null = null;
    if (game) {
      v = "gameday";
      setTodayGame(game);
    } else if (today >= OCT_START && today <= OCT_END) {
      v = "october";
    }
    if (!v) return;

    setVariant(v);
    // 띄운 시점에 '봄' 처리 — 새로고침해도 그날은 다시 안 뜸.
    try {
      localStorage.setItem(SEEN_KEY, today);
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    if (!variant) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVariant(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [variant]);

  if (!variant) return null;

  function dismiss() {
    setVariant(null);
  }

  // CTA: 변형별로 다르게 이동.
  //  ① 경기일 → 오늘 경기 추천이유 모달 열기(모달 내부에서 textarea 자동 포커스)
  //  ② 10월   → 날짜 검색 입력칸으로 포커스(클릭 제스처 내에서 동기 호출 →
  //            모바일 키보드 바로 올라옴)
  function goRecommend() {
    if (variant === "gameday" && todayGame) {
      onRecommendToday?.(todayGame);
    } else if (variant === "october") {
      onFocusSearch?.();
    }
    setVariant(null);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <button
        type="button"
        aria-label="닫기"
        onClick={dismiss}
        className="absolute inset-0 bg-sono-navy/45 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-sm rounded-lg bg-white p-6 text-center shadow-[0_24px_48px_-12px_rgba(33,61,101,0.45)] ring-1 ring-sono-navy/10">
        <button
          type="button"
          aria-label="닫기"
          onClick={dismiss}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-sono-navy/50 transition-colors hover:bg-sono-navy/10 hover:text-sono-navy"
        >
          <CloseIcon />
        </button>

        {variant === "gameday" ? (
          <>
            <p className="text-xs font-semibold tracking-widest text-sono-navy/50">
              오늘 경기 있는 날
            </p>
            {todayGame && (
              <h2
                id="welcome-modal-title"
                className="mt-2 font-court text-2xl leading-tight text-sono-navy"
              >
                {todayGame.homeTeamName}
                <span className="mx-1.5 align-middle text-lg text-sono-navy/40">
                  vs
                </span>
                {todayGame.awayTeamName}
              </h2>
            )}
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              오늘 경기, 추천을 남겨보세요!
            </p>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold tracking-widest text-sono-navy/50">
              새 소식
            </p>
            <h2
              id="welcome-modal-title"
              className="mt-2 font-court text-2xl leading-tight text-sono-navy"
            >
              예전 시즌 탭이 생겼어요!
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              신입 위너스들을 위해
              <br />
              예전 경기들도 추천해주세요.
            </p>
          </>
        )}

        <button
          type="button"
          onClick={goRecommend}
          className="mt-5 w-full rounded-md bg-sono-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sono-navy/90"
        >
          추천하러 가기
        </button>
      </div>
    </div>
  );
}
