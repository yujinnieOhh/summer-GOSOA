"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import GameCard from "@/src/components/GameCard";
import GameSearchInput from "@/src/components/GameSearchInput";
import GameDetailModal from "@/src/components/GameDetailModal";
import ReasonModal from "@/src/components/ReasonModal";
import ReasonsListModal from "@/src/components/ReasonsListModal";
import SeasonTabs from "@/src/components/SeasonTabs";
import SortToggle, { type SortMode } from "@/src/components/SortToggle";
import WelcomeModal from "@/src/components/WelcomeModal";
import type { GameSchedule } from "@/src/constants/schedule";
import { ALL_SONO_GAMES, SEASONS, seasonIdOf } from "@/src/constants/schedule-all";
import {
  addGameWithReason,
  getGamesWithTopReason,
  getReasonsForGame,
  isoDateToYymmdd,
  toggleGameLike,
  updateLike,
  type Reason as DbReason,
} from "@/src/services/gameService";

interface UiReason {
  id: string;
  content: string;
  likes: number;
}

interface GameState {
  gameId: string;
  anonLikes: number;
  reasons: UiReason[];
}

function dbReasonToUi(r: DbReason): UiReason {
  return { id: r.id, content: r.content, likes: r.likes };
}

export default function HomeClient() {
  const [statesByDate, setStatesByDate] = useState<Record<string, GameState>>(
    {},
  );
  const [likedGameDates, setLikedGameDates] = useState<Set<string>>(new Set());
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [submitGame, setSubmitGame] = useState<GameSchedule | null>(null);
  const [reasonsGame, setReasonsGame] = useState<GameSchedule | null>(null);
  const [detailGame, setDetailGame] = useState<GameSchedule | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("likes");
  // 최신 시즌(SEASONS[0] = 26-27)이 기본 선택.
  const [activeSeason, setActiveSeason] = useState<string>(SEASONS[0].id);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Initial load — pull every game that has at least one reason or anon like
  // and seed local state. The list filter further narrows to total >= 1.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await getGamesWithTopReason();
        if (cancelled) return;
        const next: Record<string, GameState> = {};
        for (const { game } of rows) {
          const yymmdd = isoDateToYymmdd(game.game_date);
          // Pull all reasons for each game in parallel so the modal opens
          // instantly without a second round-trip per click.
          next[yymmdd] = {
            gameId: game.id,
            anonLikes: game.likes ?? 0,
            reasons: [],
          };
        }
        const allReasons = await Promise.all(
          rows.map((r) => getReasonsForGame(r.game.id)),
        );
        if (cancelled) return;
        rows.forEach(({ game }, i) => {
          const yymmdd = isoDateToYymmdd(game.game_date);
          next[yymmdd].reasons = allReasons[i].map(dbReasonToUi);
        });
        setStatesByDate(next);
      } catch (err) {
        if (cancelled) return;
        console.error("[HomeClient] initial load failed", err);
        setLoadError(err instanceof Error ? err.message : "데이터를 불러오지 못했어요");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalLikesByDate = useCallback(
    (date: string) => {
      const s = statesByDate[date];
      if (!s) return 0;
      return s.anonLikes + s.reasons.reduce((sum, r) => sum + r.likes, 0);
    },
    [statesByDate],
  );

  const recommendedGames = useMemo(() => {
    // 리스트는 선택된 시즌 경기만 (검색은 전 시즌 통합 그대로).
    const seasonGames =
      SEASONS.find((s) => s.id === activeSeason)?.games ?? ALL_SONO_GAMES;
    const filtered = seasonGames.filter((g) => totalLikesByDate(g.date) >= 1);
    if (sortMode === "likes") {
      return [...filtered].sort((a, b) => {
        const diff = totalLikesByDate(b.date) - totalLikesByDate(a.date);
        return diff !== 0 ? diff : b.date.localeCompare(a.date);
      });
    }
    return [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  }, [totalLikesByDate, sortMode, activeSeason]);

  async function handleSubmit(game: GameSchedule, content: string) {
    // 추천한 경기가 속한 시즌 탭으로 자동 전환 — 다른 시즌 탭에서 검색·추천해도
    // 리스트에서 바로 보이도록(안 그러면 "추천했는데 안 보이는" 상태가 됨).
    setActiveSeason(seasonIdOf(game.date));

    // Optimistic insert — keep the modal close instant; reconcile if the
    // server returns a different id/likes count.
    const tempId = `tmp-${game.date}-${Date.now()}`;
    setStatesByDate((prev) => {
      const existing = prev[game.date] ?? {
        gameId: "",
        anonLikes: 0,
        reasons: [],
      };
      return {
        ...prev,
        [game.date]: {
          ...existing,
          reasons: [{ id: tempId, content, likes: 1 }, ...existing.reasons],
        },
      };
    });
    setSubmitGame(null);

    try {
      const { game: savedGame, reason } = await addGameWithReason(
        game.date,
        content,
      );
      setStatesByDate((prev) => {
        const cur = prev[game.date] ?? {
          gameId: savedGame.id,
          anonLikes: savedGame.likes ?? 0,
          reasons: [],
        };
        return {
          ...prev,
          [game.date]: {
            ...cur,
            gameId: savedGame.id,
            reasons: cur.reasons.map((r) =>
              r.id === tempId ? dbReasonToUi(reason) : r,
            ),
          },
        };
      });
    } catch (err) {
      console.error("[HomeClient] addGameWithReason failed", err);
      // Roll back the optimistic insert.
      setStatesByDate((prev) => {
        const cur = prev[game.date];
        if (!cur) return prev;
        return {
          ...prev,
          [game.date]: {
            ...cur,
            reasons: cur.reasons.filter((r) => r.id !== tempId),
          },
        };
      });
    }
  }

  function handleAnonLike(date: string) {
    // Toggle: 1st click +1, 2nd -1, 3rd +1. Liked state stays internal — the
    // count is the only user-facing signal.
    const wasLiked = likedGameDates.has(date);
    const delta: 1 | -1 = wasLiked ? -1 : 1;

    setLikedGameDates((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(date);
      else next.add(date);
      return next;
    });
    setStatesByDate((prev) => {
      const cur = prev[date] ?? { gameId: "", anonLikes: 0, reasons: [] };
      return {
        ...prev,
        [date]: { ...cur, anonLikes: Math.max(0, cur.anonLikes + delta) },
      };
    });

    toggleGameLike(date, delta).catch((err) => {
      console.error("[HomeClient] toggleGameLike failed", err);
      // Roll back optimistic UI on failure.
      setLikedGameDates((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(date);
        else next.delete(date);
        return next;
      });
      setStatesByDate((prev) => {
        const cur = prev[date];
        if (!cur) return prev;
        return {
          ...prev,
          [date]: { ...cur, anonLikes: Math.max(0, cur.anonLikes - delta) },
        };
      });
    });
  }

  function handleToggleReasonLike(reasonId: string) {
    const wasLiked = likedIds.has(reasonId);
    const delta = wasLiked ? -1 : 1;

    // Find which date this reason belongs to so we can compute the new likes.
    let owningDate: string | null = null;
    let nextLikes = 0;
    for (const [date, state] of Object.entries(statesByDate)) {
      const r = state.reasons.find((r) => r.id === reasonId);
      if (r) {
        owningDate = date;
        nextLikes = Math.max(0, r.likes + delta);
        break;
      }
    }
    if (!owningDate) return;

    setLikedIds((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(reasonId);
      else next.add(reasonId);
      return next;
    });
    setStatesByDate((prev) => {
      const cur = prev[owningDate!];
      if (!cur) return prev;
      return {
        ...prev,
        [owningDate!]: {
          ...cur,
          reasons: cur.reasons.map((r) =>
            r.id === reasonId ? { ...r, likes: nextLikes } : r,
          ),
        },
      };
    });

    updateLike(reasonId, nextLikes).catch((err) => {
      console.error("[HomeClient] updateLike failed", err);
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(reasonId);
        else next.delete(reasonId);
        return next;
      });
      setStatesByDate((prev) => {
        const cur = prev[owningDate!];
        if (!cur) return prev;
        return {
          ...prev,
          [owningDate!]: {
            ...cur,
            reasons: cur.reasons.map((r) =>
              r.id === reasonId
                ? { ...r, likes: Math.max(0, r.likes - delta) }
                : r,
            ),
          },
        };
      });
    });
  }

  const reasonsForOpenGame = reasonsGame
    ? (statesByDate[reasonsGame.date]?.reasons ?? [])
    : [];

  return (
    <>
      <section className="relative z-20 rounded-2xl bg-white/15 p-5 ring-1 ring-white/30 backdrop-blur-sm">
        <GameSearchInput onRecommend={(g) => setSubmitGame(g)} />
      </section>

      <section className="mt-8">
        {/* 정렬 토글(왼쪽) + 시즌 탭(바로 오른쪽에 왼쪽정렬 고정). 한 줄 유지. */}
        <div className="flex items-center gap-3">
          <SortToggle value={sortMode} onChange={setSortMode} />
          <SeasonTabs value={activeSeason} onChange={setActiveSeason} />
        </div>
        <div className="mt-3 overflow-hidden rounded-md bg-white/95 ring-1 ring-white/40">
          {loadError ? (
            <p className="px-4 py-8 text-center text-sm text-rose-500">
              {loadError}
            </p>
          ) : recommendedGames.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-500">
              아직 추천된 경기가 없어요. 위에서 날짜를 검색해서 첫 추천을 남겨보세요.
            </p>
          ) : (
            recommendedGames.map((game) => (
              <GameCard
                key={game.date}
                game={game}
                likes={totalLikesByDate(game.date)}
                onLike={() => handleAnonLike(game.date)}
                onShowReasons={() => setReasonsGame(game)}
                onShowDetail={() => setDetailGame(game)}
              />
            ))
          )}
        </div>
      </section>

      <ReasonModal
        game={submitGame ?? ALL_SONO_GAMES[0]}
        open={submitGame !== null}
        onClose={() => setSubmitGame(null)}
        onSubmit={(content) => submitGame && handleSubmit(submitGame, content)}
      />

      <ReasonsListModal
        game={reasonsGame}
        reasons={reasonsForOpenGame}
        likedIds={likedIds}
        open={reasonsGame !== null}
        onClose={() => setReasonsGame(null)}
        onToggleLike={handleToggleReasonLike}
      />

      <GameDetailModal
        game={detailGame}
        open={detailGame !== null}
        onClose={() => setDetailGame(null)}
      />

      {/* 접속 팝업. ① 경기일 CTA → 오늘 경기 추천이유 모달 열기,
          ② 10월 CTA → 날짜 검색칸 포커스. */}
      <WelcomeModal
        onRecommendToday={(game) => setSubmitGame(game)}
        onFocusSearch={() => {
          document.getElementById("game-date-search")?.focus();
        }}
      />
    </>
  );
}
