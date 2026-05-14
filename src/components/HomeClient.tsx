"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import GameCard from "@/src/components/GameCard";
import GameSearchInput from "@/src/components/GameSearchInput";
import ReasonModal from "@/src/components/ReasonModal";
import ReasonsListModal from "@/src/components/ReasonsListModal";
import {
  SONO_SCHEDULE_2526,
  type GameSchedule,
} from "@/src/constants/schedule";
import {
  addGameWithReason,
  getGamesWithTopReason,
  getReasonsForGame,
  isoDateToYymmdd,
  toggleGameLike,
  updateLike,
  type Reason as DbReason,
} from "@/src/services/gameService";

type SortMode = "likes" | "latest";

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
  const [sortMode, setSortMode] = useState<SortMode>("likes");
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
    const filtered = SONO_SCHEDULE_2526.filter(
      (g) => totalLikesByDate(g.date) >= 1,
    );
    if (sortMode === "likes") {
      return [...filtered].sort((a, b) => {
        const diff = totalLikesByDate(b.date) - totalLikesByDate(a.date);
        return diff !== 0 ? diff : b.date.localeCompare(a.date);
      });
    }
    return [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  }, [totalLikesByDate, sortMode]);

  async function handleSubmit(game: GameSchedule, content: string) {
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
        <SortToggle value={sortMode} onChange={setSortMode} />
        <div className="mt-3 overflow-hidden rounded-2xl bg-white/95 ring-1 ring-white/40">
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
              />
            ))
          )}
        </div>
      </section>

      <ReasonModal
        game={submitGame ?? SONO_SCHEDULE_2526[0]}
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
    </>
  );
}

function SortToggle({
  value,
  onChange,
}: {
  value: SortMode;
  onChange: (v: SortMode) => void;
}) {
  const options: { value: SortMode; label: string }[] = [
    { value: "likes", label: "좋아요순" },
    { value: "latest", label: "최신순" },
  ];
  return (
    <div className="inline-flex rounded-full bg-white/60 p-0.5 ring-1 ring-white/40 backdrop-blur-sm">
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={selected}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              selected
                ? "bg-sono-navy text-white"
                : "text-sono-navy/70 hover:text-sono-navy"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
