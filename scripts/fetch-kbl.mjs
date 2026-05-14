import { normalizeScheduleResponse } from "kbl-results/src/parse.js";
import fs from "node:fs";

const SEASON_START = "20250920";
const SEASON_END = "20260513";
const SONO_CODE = "66";

const TEAM_MAP = {
  소노: { city: "고양", name: "소노" },
  DB: { city: "원주", name: "DB" },
  삼성: { city: "서울", name: "삼성" },
  SK: { city: "서울", name: "SK" },
  LG: { city: "창원", name: "LG" },
  정관장: { city: "안양", name: "정관장" },
  KCC: { city: "부산", name: "KCC" },
  KT: { city: "수원", name: "KT" },
  가스공사: { city: "대구", name: "가스공사" },
  현대모비스: { city: "울산", name: "현대모비스" },
};

const DEFAULT_HEADERS = {
  accept: "application/json, text/plain, */*",
  "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
  "user-agent": "summer-gosoa/fetch-kbl",
  "x-requested-with": "XMLHttpRequest",
  channel: "WEB",
  teamcode: "XX",
  lang: "ko",
};

function getTeamDetail(teamName) {
  if (!teamName) return { city: "기타", name: "미정" };
  for (const key in TEAM_MAP) {
    if (teamName.includes(key)) return TEAM_MAP[key];
  }
  return { city: "기타", name: teamName };
}

async function fetchSeasonMatches() {
  const url = new URL("https://api.kbl.or.kr/match/list");
  url.searchParams.set("fromDate", SEASON_START);
  url.searchParams.set("toDate", SEASON_END);
  url.searchParams.set("tcodeList", "all");
  url.searchParams.set("seasonGrade", "1");

  const response = await fetch(url.toString(), { headers: DEFAULT_HEADERS });
  if (!response.ok) {
    throw new Error(`KBL request failed: ${response.status}`);
  }
  return response.json();
}

async function saveSchedule() {
  console.log("🏀 KBL 시즌 전체 일정을 한 번에 가져옵니다...");
  const payload = await fetchSeasonMatches();
  const parsed = normalizeScheduleResponse(payload, { seasonGrade: 1 });

  const sonoMatches = parsed.matches.filter(
    (m) => m.homeTeam.code === SONO_CODE || m.awayTeam.code === SONO_CODE
  );

  console.log(`📦 전체 ${parsed.matches.length}경기 중 소노 경기 ${sonoMatches.length}건 발견.`);

  const allMatches = sonoMatches.map((match) => {
    const home = getTeamDetail(match.homeTeam.name);
    const away = getTeamDetail(match.awayTeam.name);
    const isSonoHome = home.name === "소노";
    const opponent = isSonoHome ? away : home;

    const hScore = match.score.home ?? 0;
    const aScore = match.score.away ?? 0;
    const finished = match.status.finished;
    const isWin = finished && (isSonoHome ? hScore > aScore : aScore > hScore);

    const venueName = match.venue?.shortName || match.venue?.name || "";

    return {
      date: match.date ? match.date.replace(/-/g, "").slice(2) : "",
      opponentName: opponent.name,
      opponentCity: opponent.city,
      sonoScore: isSonoHome ? hScore : aScore,
      opponentScore: isSonoHome ? aScore : hScore,
      venue: venueName.includes("고양") ? "고양" : opponent.city,
      resultIcon: !finished ? "⏳" : isWin ? "🩵" : "💔",
      isHome: isSonoHome,
      homeTeamName: home.name,
      awayTeamName: away.name,
      homeScore: hScore,
      awayScore: aScore,
    };
  });

  if (allMatches.length === 0) {
    console.log("❌ 경기를 하나도 찾지 못했습니다. API 응답을 확인해야 할 것 같아요.");
    return;
  }

  const fileContent = `// 이 파일은 scripts/fetch-kbl.mjs에 의해 자동 생성되었습니다.
export interface GameSchedule {
  date: string;
  opponentName: string;
  opponentCity: string;
  sonoScore: number;
  opponentScore: number;
  venue: string;
  resultIcon: string;
  isHome: boolean;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
}

export const SONO_SCHEDULE_2526: GameSchedule[] = ${JSON.stringify(allMatches, null, 2)};
`;

  fs.writeFileSync("./src/constants/schedule.ts", fileContent);
  const scored = allMatches.filter((m) => m.homeScore + m.awayScore > 0).length;
  console.log(`✅ 총 ${allMatches.length}경기 저장 (점수 채워진 경기: ${scored}건).`);
}

saveSchedule().catch((err) => {
  console.error("❌ 실패:", err);
  process.exit(1);
});
