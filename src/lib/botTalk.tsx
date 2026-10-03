"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * AI 상대 대사 (체스·장기 공통).
 * 수가 오갈 때 상황(잡음·장군/체크·끝남 등)에 맞는 대사를 골라 말풍선으로 잠깐 보여줌.
 */
export type TalkEvent =
  | "greet"
  | "move" // 평범한 내 수 (가끔만)
  | "userCapture"
  | "userBigCapture"
  | "userCheck"
  | "aiCapture"
  | "aiCheck"
  | "undo"
  | "aiWin"
  | "aiLose"
  | "draw";

export type Lines = Partial<Record<TalkEvent, string[]>>;

const pick = (a: string[] | undefined) =>
  a?.length ? a[Math.floor(Math.random() * a.length)] : null;

/** 평범한 수에는 가끔만 말함 */
const MOVE_CHANCE = 0.35;

export function useBotTalk(lines: Lines) {
  const [speech, setSpeech] = useState<{ text: string; n: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const n = useRef(0);
  const linesRef = useRef(lines);
  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const say = useCallback((ev: TalkEvent, hold = 4200) => {
    if (ev === "move" && Math.random() > MOVE_CHANCE) return;
    const text = pick(linesRef.current[ev]);
    if (!text) return;
    if (timer.current) clearTimeout(timer.current);
    setSpeech({ text, n: ++n.current });
    timer.current = setTimeout(() => setSpeech(null), hold);
  }, []);

  return { speech, say };
}

/**
 * 상대 이름 아래에 뜨는 말풍선.
 * 판 위에 겹쳐 띄워서(높이 0인 자리) 말풍선이 생기고 사라져도 판이 밀리지 않게, 클릭은 통과.
 */
export function SpeechBubble({ speech }: { speech: { text: string; n: number } | null }) {
  return (
    <div className="pointer-events-none relative z-20 h-0">
      {speech && (
        <div
          key={speech.n}
          className="bot-speech absolute top-0 left-2 w-fit max-w-[calc(100%-1rem)] rounded-2xl rounded-tl-sm border border-white/15 bg-[#24262E]/95 px-3 py-1.5 font-['Nanum_Gothic',sans-serif] text-[13px] leading-snug text-white/90 shadow-xl backdrop-blur-sm"
        >
          {speech.text}
        </div>
      )}
    </div>
  );
}
