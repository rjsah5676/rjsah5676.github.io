"use client";

/**
 * 오목판 크기 고르기 (작게·보통·크게) — 브라우저에 기억. 화면 높이가 모자라면 그만큼 줄어듦.
 */
import { useEffect, useState } from "react";

export type BoardSize = "s" | "m" | "l";
const KEY = "omok:board-size";
const PX: Record<BoardSize, number> = { s: 460, m: 560, l: 720 };
const LABEL: Record<BoardSize, string> = { s: "작게", m: "보통", l: "크게" };

export function useBoardSize() {
  const [size, setSize] = useState<BoardSize>("m");
  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 저장한 크기 복원 (마운트 1회)
      if (v === "s" || v === "m" || v === "l") setSize(v);
    } catch {}
  }, []);
  const choose = (v: BoardSize) => {
    setSize(v);
    try {
      localStorage.setItem(KEY, v);
    } catch {}
  };
  return [size, choose] as const;
}

/** 판을 감싸는 칸의 최대 폭 (heightGap: 화면 높이에서 판 위아래 막대·헤더 몫으로 뺄 px) */
export const boardMaxWidth = (size: BoardSize, heightGap: number) =>
  `max(300px, min(${PX[size]}px, calc(100dvh - ${heightGap}px)))`;

export function BoardSizePicker({
  size,
  onChange,
}: {
  size: BoardSize;
  onChange: (v: BoardSize) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#1C1E24] px-4 py-2 font-['Nanum_Gothic',sans-serif] text-xs text-white/50">
      판 크기
      <span className="flex gap-1">
        {(["s", "m", "l"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onChange(k)}
            className={`cursor-pointer rounded-full px-2.5 py-1 font-mono text-[11px] transition-colors ${
              size === k ? "bg-[#6C63FF] text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {LABEL[k]}
          </button>
        ))}
      </span>
    </div>
  );
}
