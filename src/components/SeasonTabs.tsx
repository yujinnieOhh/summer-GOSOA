"use client";

import { SEASONS } from "@/src/constants/schedule-all";

/**
 * 시즌 선택 탭 — 밑줄 텍스트 스타일(배경/칩 없음).
 * 정렬 토글 오른쪽에 왼쪽정렬로 고정(스크롤·센터링 없음). 디폴트(최신) 시즌이
 * 맨 왼쪽, 나머지(예전)가 오른쪽으로 나열됨.
 */
export default function SeasonTabs({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      {SEASONS.map((s) => {
        const selected = value === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            aria-pressed={selected}
            className={`shrink-0 py-1 text-xs tabular-nums transition-colors ${
              selected
                ? "font-extrabold text-sono-navy underline decoration-2 underline-offset-4"
                : "font-medium text-sono-navy/40 hover:text-sono-navy/70"
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
