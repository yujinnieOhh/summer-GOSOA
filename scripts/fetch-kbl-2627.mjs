import { normalizeScheduleResponse } from "kbl-results/src/parse.js";
import fs from "node:fs";

// 26-27 정규시즌 개막 10/3 ~ 플레이오프(~5월)까지 한 번에. 9월 프리시즌(OPEN
// MATCH DAY)은 제외하려고 10/1부터 시작한다.
const SEASON_START = "20261001";
const SEASON_END = "20270531";
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

// EASL(동아시아 슈퍼리그) 상대팀 메타 — API가 내려주는 한글명 부분일치로 매칭.
// 원정 경기 장소는 상대팀 기준 국가/도시로 표시(홈은 고양). 소노 첫 EASL = 26-27.
const EASL_TEAMS = [
  { key: "TSG", nameEn: "TSG GhostHawks", flag: "🇹🇼", country: "대만", city: "가오슝" },
  { key: "알바크", nameEn: "Alvark Tokyo", flag: "🇯🇵", country: "일본", city: "다치카와" },
  { key: "고비", nameEn: "South Gobi Broncos", flag: "🇲🇳", country: "몽골", city: "울란바토르" },
];

async function saveSchedule() {
  console.log("🏀 KBL 26-27 시즌 전체 일정을 가져옵니다...");
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

    // EASL 상대면 영문명+국기/국가/도시로 보강(KBL 경기는 그대로 → 기존 출력과 동일).
    const easl = EASL_TEAMS.find((e) => opponent.name.includes(e.key));
    const easlName = easl ? `${easl.nameEn} ${easl.flag}` : null;

    const game = {
      date: match.date ? match.date.replace(/-/g, "").slice(2) : "",
      opponentName: easlName ?? opponent.name,
      opponentCity: easl ? easl.city : opponent.city,
      sonoScore: isSonoHome ? hScore : aScore,
      opponentScore: isSonoHome ? aScore : hScore,
      venue: easl
        ? isSonoHome
          ? "고양"
          : easl.country
        : venueName.includes("고양")
          ? "고양"
          : opponent.city,
      resultIcon: !finished ? "⏳" : isWin ? "🩵" : "💔",
      isHome: isSonoHome,
      homeTeamName: easlName && !isSonoHome ? easlName : home.name,
      awayTeamName: easlName && isSonoHome ? easlName : away.name,
      homeScore: hScore,
      awayScore: aScore,
    };

    if (easl) {
      game.competition = "EASL";
      game.opponentFlag = easl.flag;
      game.opponentCountry = easl.country;
    }

    return game;
  });

  if (allMatches.length === 0) {
    console.log("❌ 경기를 하나도 찾지 못했습니다. API 응답을 확인해야 할 것 같아요.");
    return;
  }

  const fileContent = `// 이 파일은 scripts/fetch-kbl-2627.mjs에 의해 자동 생성되었습니다.
import type { GameSchedule } from "./schedule";

export const SONO_SCHEDULE_2627: GameSchedule[] = ${JSON.stringify(allMatches, null, 2)};
`;

  fs.writeFileSync("./src/constants/schedule-2627.ts", fileContent);
  const scored = allMatches.filter((m) => m.resultIcon !== "⏳").length;
  console.log(
    `✅ 총 ${allMatches.length}경기 저장 (종료 ${scored}건 · 예정 ${allMatches.length - scored}건) → src/constants/schedule-2627.ts`
  );
}

saveSchedule().catch((err) => {
  console.error("❌ 실패:", err);
  process.exit(1);
});
