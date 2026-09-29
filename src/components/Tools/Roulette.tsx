"use client";

import { useEffect, useRef, useState } from "react";
import { rand, randInt, splitItems } from "@/lib/random";
import "@/css/tools.css";

const MIN = 2;
const MAX = 30;
const SPIN_MS = 5200;
const STORAGE_KEY = "tools_roulette";
const DEFAULT_ITEMS = ["참가자 1", "참가자 2", "참가자 3", "참가자 4"];

// 칸 색 (밝은 색은 글자를 어둡게)
const SLICE = [
  { bg: "#6C63FF", fg: "#fff" },
  { bg: "#F4E6A6", fg: "#2b2833" },
  { bg: "#2EC4B6", fg: "#0f2b28" },
  { bg: "#F3CCD9", fg: "#2b2833" },
  { bg: "#EF476F", fg: "#fff" },
  { bg: "#C8DDF3", fg: "#2b2833" },
  { bg: "#F4A261", fg: "#2b2833" },
  { bg: "#C3E7D3", fg: "#2b2833" },
];

const btn =
  "cursor-pointer rounded-full border border-white/15 px-4 py-2 font-mono text-xs whitespace-nowrap text-white/75 transition-colors hover:border-[#6C63FF]/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-30";
const primaryBtn =
  "cursor-pointer rounded-full bg-[#6C63FF] px-6 py-2.5 font-mono text-sm whitespace-nowrap text-white transition-colors hover:bg-[#5b52f0] disabled:cursor-not-allowed disabled:opacity-40";

const R = 96; // viewBox 200 기준 반지름
const polar = (deg: number, r: number) => {
  // 0도 = 12시 방향, 시계방향
  const rad = ((deg - 90) * Math.PI) / 180;
  return [100 + r * Math.cos(rad), 100 + r * Math.sin(rad)] as const;
};

function slicePath(i: number, n: number) {
  const seg = 360 / n;
  const [x1, y1] = polar(i * seg, R);
  const [x2, y2] = polar((i + 1) * seg, R);
  return `M100 100 L${x1} ${y1} A${R} ${R} 0 ${seg > 180 ? 1 : 0} 1 ${x2} ${y2} Z`;
}

const short = (s: string, max: number) => (s.length > max ? s.slice(0, max - 1) + "…" : s);

// 칸 색: 이웃·첫칸과 같은 색이 붙지 않게
const colorOf = (i: number, n: number) => {
  const k = i % SLICE.length;
  return i === n - 1 && k === 0 && n > 1 ? SLICE[3] : SLICE[k];
};

export default function Roulette() {
  const [items, setItems] = useState<string[]>(DEFAULT_ITEMS);
  const [text, setText] = useState("");
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const pendingWinner = useRef<number | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      if (Array.isArray(saved) && saved.length >= MIN)
        // eslint-disable-next-line react-hooks/set-state-in-effect -- 저장된 항목 복원(마운트 1회)
        setItems(saved.slice(0, MAX).map(String));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const n = items.length;
  const seg = 360 / n;
  const canSpin = n >= MIN && !spinning;

  const add = () => {
    const list = splitItems(text);
    if (!list.length) return;
    setItems((prev) => [...prev, ...list].slice(0, MAX));
    setText("");
    setWinner(null);
  };
  const remove = (i: number) => {
    setItems((prev) => prev.filter((_, k) => k !== i));
    setWinner(null);
  };

  const spin = () => {
    if (!canSpin) return;
    // 결과를 먼저 공정하게 뽑고, 그 칸 안의 임의 지점이 12시에 오도록 회전량 계산
    const w = randInt(n);
    const target = (w + 0.15 + rand() * 0.7) * seg; // 칸 경계에 걸리지 않게 가운데 70% 안
    const current = ((rotation % 360) + 360) % 360;
    const delta = (360 - target - current + 720) % 360;
    pendingWinner.current = w;
    setWinner(null);
    setSpinning(true);
    setRotation(rotation + 360 * 7 + delta);
  };

  const onSpinEnd = () => {
    if (!spinning) return;
    setSpinning(false);
    const w = pendingWinner.current;
    if (w === null) return;
    setWinner(w);
    setHistory((h) => [items[w], ...h].slice(0, 10));
  };

  const removeWinnerAndReset = () => {
    if (winner === null) return;
    remove(winner);
  };

  const fontSize = n <= 6 ? 10 : n <= 10 ? 8.5 : n <= 16 ? 7 : 5.5;
  const maxChars = n <= 6 ? 8 : n <= 12 ? 7 : 6;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
      {/* 룰렛 */}
      <div className="flex flex-col items-center">
        <div className="relative w-full max-w-[440px]">
          {/* 12시 방향 바늘 */}
          <div className="absolute top-[-6px] left-1/2 z-10 -translate-x-1/2 drop-shadow-[0_2px_3px_rgba(0,0,0,.6)]">
            <svg width="30" height="34" viewBox="0 0 30 34" aria-hidden>
              <path d="M15 34 L2 6 Q0 0 7 0 L23 0 Q30 0 28 6 Z" fill="#fff" />
            </svg>
          </div>

          <div className="aspect-square w-full rounded-full p-2 shadow-[0_20px_50px_-15px_rgba(0,0,0,.8)] [background:radial-gradient(circle,#2a2d36,#1C1E24)]">
            <svg
              viewBox="0 0 200 200"
              className="h-full w-full"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning
                  ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.72, 0.08, 1)`
                  : "none",
              }}
              onTransitionEnd={onSpinEnd}
              aria-label="룰렛"
            >
              {items.map((item, i) => {
                const c = colorOf(i, n);
                const mid = (i + 0.5) * seg;
                const [tx, ty] = polar(mid, R * 0.6);
                const hit = winner === i;
                return (
                  <g key={i}>
                    <path
                      d={n === 1 ? "" : slicePath(i, n)}
                      fill={c.bg}
                      stroke="#15171c"
                      strokeWidth={0.8}
                      opacity={winner === null || hit ? 1 : 0.35}
                      style={{ transition: "opacity .3s" }}
                    />
                    <text
                      x={tx}
                      y={ty}
                      fill={c.fg}
                      fontSize={fontSize}
                      fontWeight={700}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${mid} ${tx} ${ty})`}
                      style={{ fontFamily: "'Nanum Gothic', sans-serif" }}
                    >
                      {short(item, maxChars)}
                    </text>
                  </g>
                );
              })}
              <circle
                cx="100"
                cy="100"
                r={R}
                fill="none"
                stroke="rgba(255,255,255,.12)"
                strokeWidth={1.5}
              />
            </svg>
          </div>

          {/* 가운데 돌리기 버튼 */}
          <button
            type="button"
            onClick={spin}
            disabled={!canSpin}
            className="absolute top-1/2 left-1/2 flex h-[22%] w-[22%] -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-4 border-[#1C1E24] bg-white font-mono text-xs font-bold text-[#2b2833] shadow-lg transition-transform hover:scale-105 disabled:cursor-not-allowed sm:text-sm"
          >
            {spinning ? "…" : "START"}
          </button>
        </div>

        <div className="mt-6 flex min-h-[72px] flex-col items-center justify-center text-center">
          {winner !== null ? (
            <div className="roulette-pop">
              <div className="font-mono text-xs text-[#8B84FF]">당첨</div>
              <div className="mt-1 font-['Nanum_Gothic',sans-serif] text-3xl font-bold break-all text-white">
                {items[winner]}
              </div>
            </div>
          ) : (
            <p className="font-['Nanum_Gothic',sans-serif] text-sm text-white/40">
              {spinning
                ? "두구두구…"
                : n < MIN
                  ? "항목을 2개 이상 넣어주세요"
                  : "START를 눌러 돌려보세요"}
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button type="button" className={primaryBtn} onClick={spin} disabled={!canSpin}>
            {winner !== null ? "다시 돌리기" : "돌리기"}
          </button>
          {winner !== null && (
            <button
              type="button"
              className={btn}
              onClick={removeWinnerAndReset}
              disabled={spinning || n <= MIN}
            >
              당첨 항목 빼고 다시
            </button>
          )}
        </div>
      </div>

      {/* 항목 편집 */}
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-white/10 bg-[#1C1E24] p-4">
          <div className="mb-3 flex items-center justify-between font-mono text-xs text-white/45">
            <span>
              항목 {n}/{MAX}
            </span>
            <button
              type="button"
              disabled={spinning}
              onClick={() => {
                setItems(DEFAULT_ITEMS);
                setWinner(null);
              }}
              className="cursor-pointer text-white/35 hover:text-white disabled:opacity-30"
            >
              초기화
            </button>
          </div>
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && add()}
              disabled={spinning || n >= MAX}
              placeholder="이름 입력 (쉼표로 여러 개)"
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#15171c] px-3 py-2 font-['Nanum_Gothic',sans-serif] text-sm text-white placeholder:text-white/25 focus:border-[#6C63FF]/60 focus:outline-none"
            />
            <button
              type="button"
              className={btn}
              onClick={add}
              disabled={spinning || !text.trim() || n >= MAX}
            >
              추가
            </button>
          </div>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {items.map((item, i) => (
              <li
                key={`${item}-${i}`}
                className="flex items-center gap-1 rounded-full py-1 pr-1 pl-3 font-['Nanum_Gothic',sans-serif] text-xs"
                style={{ background: colorOf(i, n).bg, color: colorOf(i, n).fg }}
              >
                <span className="max-w-[9rem] truncate">{item}</span>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  disabled={spinning}
                  aria-label={`${item} 삭제`}
                  className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full opacity-60 hover:bg-black/15 hover:opacity-100 disabled:cursor-not-allowed"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>

        {history.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-[#1C1E24] p-4">
            <div className="mb-2 font-mono text-xs text-white/45">최근 결과</div>
            <ol className="flex flex-col gap-1 font-['Nanum_Gothic',sans-serif] text-sm">
              {history.map((h, k) => (
                <li key={k} className="flex gap-2 text-white/70">
                  <span className="w-5 font-mono text-xs text-white/30">{k + 1}</span>
                  <span className="truncate">{h}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
