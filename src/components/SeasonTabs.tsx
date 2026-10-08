"use client";

import { SEASONS } from "@/src/constants/schedule-all";

/**
 * 시즌 선택 탭 (최신→예전, 왼쪽부터). 정렬 토글과 같은 반투명 칩 배경 안에
 * 텍스트버튼으로 배치. shrink-0 → 좁은 화면에선 압축되지 않고 통째로 아랫줄로
 * 내려감(부모의 flex-wrap).
 */
export default function SeasonTabs({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white/60 px-3 py-1 ring-1 ring-white/40 backdrop-blur-sm">
      {SEASONS.map((s, i) => {
        const selected = value === s.id;
        return (
          <div key={s.id} className="flex items-center gap-2">
            {i > 0 && <span className="text-sono-navy/25">·</span>}
            <button
              type="button"
              onClick={() => onChange(s.id)}
              aria-pressed={selected}
              className={`whitespace-nowrap text-xs tabular-nums transition-colors ${
                selected
                  ? "font-extrabold text-sono-navy"
                  : "font-medium text-sono-navy/40 hover:text-sono-navy/70"
              }`}
            >
              {s.label}
            </button>
          </div>
        );
      })}
    </div>
  );
}
