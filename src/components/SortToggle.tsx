"use client";

export type SortMode = "likes" | "latest";

/**
 * 추천 리스트 정렬 토글 (좋아요순 / 최신순).
 * 경기장 사진 위 가독성을 위해 반투명 칩 배경 + 선택 시 네이비 pill.
 */
export default function SortToggle({
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
    <div className="inline-flex shrink-0 rounded-full bg-white/60 p-0.5 ring-1 ring-white/40 backdrop-blur-sm">
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={selected}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
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
