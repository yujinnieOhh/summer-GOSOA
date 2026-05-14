import { supabase } from "@/src/lib/supabase";

export interface Game {
  id: string;
  game_date: string; // ISO date "YYYY-MM-DD" (Postgres DATE)
  season: string; // e.g. "2025-26"
  likes: number;
  created_at: string;
}

// Schedule yymmdd starts with "25" (Sep–Dec 2025) or "26" (Jan–May 2026) — the
// season runs Sep→May. Months 9–12 belong to the start year, 1–5 to the end.
function seasonFromYymmdd(yymmdd: string): string {
  const yy = parseInt(yymmdd.slice(0, 2), 10);
  const mm = parseInt(yymmdd.slice(2, 4), 10);
  const startYy = mm >= 9 ? yy : yy - 1;
  const endYy = (startYy + 1) % 100;
  return `20${String(startYy).padStart(2, "0")}-${String(endYy).padStart(2, "0")}`;
}

export interface Reason {
  id: string;
  game_id: string;
  content: string;
  likes: number;
  created_at: string;
}

export interface GameWithTopReason {
  game: Game;
  topReason: Reason | null;
}

// Schedule data uses yymmdd ("250920"); DB stores DATE ("2025-09-20").
// Season runs Sep 2025 → May 2026 so the leading "yy" is always 20yy.
function yymmddToIso(yymmdd: string): string {
  return `20${yymmdd.slice(0, 2)}-${yymmdd.slice(2, 4)}-${yymmdd.slice(4, 6)}`;
}

export function isoDateToYymmdd(iso: string): string {
  return iso.slice(2, 4) + iso.slice(5, 7) + iso.slice(8, 10);
}

/**
 * Fetch every game that has at least one stored reason, joined with its
 * highest-liked reason. The caller is expected to merge this with the static
 * SONO_SCHEDULE_2526 for matchup metadata (teams, scores, venue).
 */
export async function getGamesWithTopReason(): Promise<GameWithTopReason[]> {
  const { data, error } = await supabase
    .from("games")
    .select("id, game_date, season, likes, created_at, reasons(*)")
    .order("game_date", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const reasons = (row.reasons ?? []) as Reason[];
    const topReason =
      reasons.length === 0
        ? null
        : reasons.reduce(
            (top, r) => (r.likes > top.likes ? r : top),
            reasons[0],
          );
    const { reasons: _reasons, ...game } = row as Game & { reasons: Reason[] };
    return { game, topReason };
  });
}

/** All reasons for a single game, ordered by likes desc — feeds the modal. */
export async function getReasonsForGame(gameId: string): Promise<Reason[]> {
  const { data, error } = await supabase
    .from("reasons")
    .select("*")
    .eq("game_id", gameId)
    .order("likes", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Reason[];
}

/**
 * Upsert the game row by yymmdd date, then insert a new reason with likes=1.
 * Returns the created reason so the caller can plug it into local state.
 */
export async function addGameWithReason(
  yymmdd: string,
  content: string,
): Promise<{ game: Game; reason: Reason }> {
  const isoDate = yymmddToIso(yymmdd);
  const season = seasonFromYymmdd(yymmdd);

  const { data: game, error: gameErr } = await supabase
    .from("games")
    .upsert(
      { game_date: isoDate, season },
      { onConflict: "game_date" },
    )
    .select("id, game_date, season, likes, created_at")
    .single();
  if (gameErr) throw gameErr;

  const { data: reason, error: reasonErr } = await supabase
    .from("reasons")
    .insert({ game_id: game.id, content, likes: 1 })
    .select()
    .single();
  if (reasonErr) throw reasonErr;

  return { game: game as Game, reason: reason as Reason };
}

/**
 * Push the optimistic new likes value to Postgres. The caller is responsible
 * for computing `newLikes` (prev + 1 / prev - 1) so this is a flat write —
 * matches the CLAUDE_TASK.md spec of "updateLike(reasonId, currentLikes)".
 */
export async function updateLike(
  reasonId: string,
  newLikes: number,
): Promise<void> {
  const { error } = await supabase
    .from("reasons")
    .update({ likes: newLikes })
    .eq("id", reasonId);
  if (error) throw error;
}

/**
 * Anonymous game-level like (jersey badge clicks). +1 on first click, -1 on
 * the next, and so on — the caller's toggled `delta` controls direction.
 * Creates the game row if it doesn't exist yet.
 *
 * NOTE: read-then-write is race-prone under contention. For production,
 * replace the second statement with a Postgres RPC that does
 *   `update games set likes = greatest(likes + $delta, 0) where id = $id`
 * to make the bump atomic.
 */
export async function toggleGameLike(
  yymmdd: string,
  delta: 1 | -1,
): Promise<{ likes: number }> {
  const isoDate = yymmddToIso(yymmdd);
  const season = seasonFromYymmdd(yymmdd);

  const { data: game, error: upsertErr } = await supabase
    .from("games")
    .upsert(
      { game_date: isoDate, season },
      { onConflict: "game_date" },
    )
    .select("id, likes")
    .single();
  if (upsertErr) throw upsertErr;

  const next = Math.max(0, (game.likes ?? 0) + delta);
  const { error: updErr } = await supabase
    .from("games")
    .update({ likes: next })
    .eq("id", game.id);
  if (updErr) throw updErr;

  return { likes: next };
}
