import { rankDateLabel } from "@/lib/rankDate";

export interface RankRow {
  name: string;
  /** 표시할 기록 (예: "123ms", "45.2s") */
  value: string;
  date?: Date | null;
}

/**
 * 랭킹 목록 공통 (순위 · 이름 · 기록 · 달성일 열 정렬).
 * 예전 기록은 날짜가 없어서 칸만 비워 둠.
 */
export default function RankList({
  rows,
  highlight,
  empty = "아직 기록이 없어요",
}: {
  rows: RankRow[];
  highlight?: number;
  empty?: string;
}) {
  if (!rows.length) return <p className="py-3 font-mono text-xs text-white/30">{empty}</p>;
  return (
    <ol className="flex flex-col">
      {rows.map((r, i) => (
        <li
          key={i}
          className={`grid grid-cols-[1.5rem_minmax(0,1fr)_auto_3.75rem] items-center gap-2 rounded-md px-1.5 py-1 font-mono text-[13px] ${
            i === highlight ? "bg-[#6C63FF]/20" : ""
          }`}
        >
          <span
            className={`text-right tabular-nums ${i === 0 ? "text-[#FDE047]" : i < 3 ? "text-white/80" : "text-white/35"}`}
          >
            {i + 1}
          </span>
          <span className="truncate text-left font-['Nanum_Gothic',sans-serif] text-white/85">
            {r.name}
          </span>
          <span className="text-right text-white tabular-nums">{r.value}</span>
          <span className="text-right text-[11px] text-white/30 tabular-nums">
            {rankDateLabel(r.date)}
          </span>
        </li>
      ))}
    </ol>
  );
}
