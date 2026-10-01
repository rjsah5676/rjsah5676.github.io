"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * 처음 보는 UI 옆에 잠깐 뜨는 안내 말풍선 (공통).
 * - 마운트 후 delay 뒤에 나타나서 duration 동안 보였다가 사라짐
 * - storageKey로 "이미 써봤음"이 기록되면(markHintSeen) 다시 안 뜸
 * - 위치는 부모가 className으로 잡음 (fixed/absolute)
 */
export function markHintSeen(storageKey: string) {
  try {
    localStorage.setItem(storageKey, "1");
  } catch {
    // 시크릿 모드 등 저장 불가 — 무시
  }
}

export default function HintBubble({
  storageKey,
  children,
  delay = 900,
  duration = 4500,
  className = "",
  hidden = false,
}: {
  storageKey: string;
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  /** 부모 쪽 사정으로 지금 숨겨야 할 때 (예: 메뉴가 열림) */
  hidden?: boolean;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(storageKey) === "1";
    } catch {
      seen = false;
    }
    if (seen) return;
    const t1 = setTimeout(() => setShow(true), delay);
    const t2 = setTimeout(() => setShow(false), delay + duration);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [storageKey, delay, duration]);

  const visible = show && !hidden;

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={() => setShow(false)}
      className={`hint-bubble pointer-events-auto cursor-pointer rounded-xl border border-[#6C63FF]/40 bg-[#1C1E24] px-3 py-2 font-['Nanum_Gothic',sans-serif] text-xs whitespace-nowrap text-white/85 shadow-[0_8px_30px_-6px_rgba(108,99,255,0.5)] transition-all duration-500 ${
        visible ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-2 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
