"use client";

import { SEASONS } from "@/src/constants/schedule-all";

/**
 * 시즌 선택 탭 — 밑줄 텍스트 스타일(배경/칩 없음).
 * 레이아웃: 디폴트(최신) 시즌이 가운데, 나머지(예전)는 오른쪽으로 나열.
 * 넘치면 가로 스크롤 — 스크롤하면 정렬 버튼 쪽(왼쪽)으로 길어지고,
 * 디폴트가 제자리(가운데)로 돌아오면 더 스크롤 안 됨(scrollLeft=0이 왼쪽 경계).
 *
 * 구현: 왼쪽에 "컨테이너 절반 − 디폴트 탭 절반" 폭의 스페이서를 둬서 rest 상태
 * (scrollLeft=0)에서 첫(디폴트) 탭이 가운데 오게 함. 스크롤은 오른쪽으로만 가능.
 */
export default function SeasonTabs({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex items-center whitespace-nowrap">
        {/* 디폴트 탭을 가운데로 미는 스페이서. 디폴트 탭 폭의 절반(~1.75rem)만큼 뺌. */}
        <span
          aria-hidden="true"
          className="shrink-0"
          style={{ minWidth: "calc(50% - 1.75rem)" }}
        />
        {SEASONS.map((s) => {
          const selected = value === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange(s.id)}
              aria-pressed={selected}
              className={`shrink-0 px-3 py-1 text-xs tabular-nums transition-colors ${
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
    </div>
  );
}
