import { normalizeScheduleResponse } from "kbl-results/src/parse.js";
import fs from "node:fs";

// 이미 끝난 과거 시즌(23-24, 24-25) 일정·결과를 한 번에 생성한다.
// 결과가 더는 바뀌지 않으므로 cron 대상이 아니고, 필요할 때 수동 실행용.
// 현재 진행 시즌(26-27)은 scripts/fetch-kbl-2627.mjs + update-scores 워크플로 담당.

const SONO_CODE = "66";

const SEASONS = [
  {
    start: "20231001",
    end: "20240531",
    exportName: "SONO_SCHEDULE_2324",
    outFile: "./src/constants/schedule-2324.ts",
  },
  {
    start: "20241001",
    end: "20250531",
    exportName: "SONO_SCHEDULE_2425",
    outFile: "./src/constants/schedule-2425.ts",
  },
];

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

async function fetchSeasonMatches(start, end) {
  const url = new URL("https://api.kbl.or.kr/match/list");
  url.searchParams.set("fromDate", start);
  url.searchParams.set("toDate", end);
  url.searchParams.set("tcodeList", "all");
  url.searchParams.set("seasonGrade", "1");

  const response = await fetch(url.toString(), { headers: DEFAULT_HEADERS });
  if (!response.ok) {
    throw new Error(`KBL request failed: ${response.status}`);
  }
  return response.json();
}

async function saveSeason({ start, end, exportName, outFile }) {
  const payload = await fetchSeasonMatches(start, end);
  const parsed = normalizeScheduleResponse(payload, { seasonGrade: 1 });

  const sonoMatches = parsed.matches.filter(
    (m) => m.homeTeam.code === SONO_CODE || m.awayTeam.code === SONO_CODE
  );

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
    console.log(`❌ ${exportName}: 경기를 찾지 못했습니다.`);
    return;
  }

  const unknown = allMatches.filter((m) => m.opponentName === "미정" || m.opponentCity === "기타");
  if (unknown.length) {
    console.log(`⚠️  ${exportName}: 매핑 안 된 상대팀 ${unknown.length}건 — TEAM_MAP 확인 필요`);
  }

  const fileContent = `// 이 파일은 scripts/fetch-kbl-history.mjs에 의해 자동 생성되었습니다.
import type { GameSchedule } from "./schedule";

export const ${exportName}: GameSchedule[] = ${JSON.stringify(allMatches, null, 2)};
`;

  fs.writeFileSync(outFile, fileContent);
  const scored = allMatches.filter((m) => m.resultIcon !== "⏳").length;
  console.log(
    `✅ ${exportName}: ${allMatches.length}경기 (종료 ${scored}) → ${outFile}`
  );
}

async function main() {
  console.log("🏀 과거 시즌(23-24, 24-25) 일정을 가져옵니다...");
  for (const season of SEASONS) {
    await saveSeason(season);
  }
}

main().catch((err) => {
  console.error("❌ 실패:", err);
  process.exit(1);
});
