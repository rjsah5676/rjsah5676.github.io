"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Modal from "@/components/Modal/Modal";
import GuideView, { type GuideDoc } from "@/components/GuideView";

export interface RankSpec {
  /** 버튼 옆 한 줄 (예: "1위 건모 · 132점") — PC에서만 보임 */
  teaser?: string | null;
  /** 모달 제목 뒤에 붙는 말 (예: 곡 이름) */
  sub?: string;
  /** 모달 내용 (열릴 때만 그림) */
  render: () => ReactNode;
  /** 밖에서 열고 닫기 (결과 화면의 "랭킹 보기" 등) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** 게임 머리말이 화면 맨 위에 오게 (대국 시작 등 화면이 바뀔 때) */
export function scrollToGameTop() {
  document
    .querySelector("[data-game-header]")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * 게임 페이지 공통 머리말: 아이콘 · 이름 · 한 줄 설명 + [게임 가이드] [랭킹] 버튼.
 * 처음 들어오면 이 머리말이 화면 맨 위에 오게 스크롤해서, 바로 아래 게임 판이 한눈에 보이게 함.
 */
export default function GameHeader({
  icon,
  title,
  en,
  desc,
  accent = "#8B84FF",
  guide,
  rank,
  scroll = true,
  className = "",
}: {
  icon: string;
  title: string;
  en: string;
  desc: string;
  accent?: string;
  guide?: GuideDoc;
  rank?: RankSpec;
  /** 처음 들어올 때 게임 위치로 스크롤 */
  scroll?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [rankOpenSelf, setRankOpenSelf] = useState(false);
  const rankOpen = rank?.open ?? rankOpenSelf;
  const setRankOpen = (o: boolean) => {
    if (rank?.onOpenChange) rank.onOpenChange(o);
    else setRankOpenSelf(o);
  };

  useEffect(() => {
    if (!scroll) return;
    const id = setTimeout(
      () => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      350
    );
    return () => clearTimeout(id);
  }, [scroll]);

  const pill =
    "flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 font-['Nanum_Gothic',sans-serif] text-[13px] whitespace-nowrap transition-colors";

  return (
    <header
      ref={ref}
      data-game-header
      className={`@container mb-4 scroll-mt-[114px] text-left sm:mb-5 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-2xl text-white sm:h-12 sm:w-12"
          style={{
            background: `linear-gradient(145deg, ${accent}33, ${accent}0d)`,
            borderColor: `${accent}55`,
          }}
          aria-hidden
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <h1 className="truncate font-['Nanum_Gothic',sans-serif] text-lg font-bold text-white sm:text-xl">
              {title}
            </h1>
            <span
              className="hidden shrink-0 font-mono text-[10px] tracking-[0.2em] uppercase @lg:inline"
              style={{ color: accent }}
            >
              {en}
            </span>
          </div>
          <p className="truncate font-['Nanum_Gothic',sans-serif] text-xs text-white/45 sm:text-[13px]">
            {desc}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {guide && (
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className={`${pill} border-white/12 bg-white/[0.04] text-white/80 hover:border-white/30 hover:text-white`}
            >
              <span aria-hidden>📖</span>
              <span className="@2xl:hidden">가이드</span>
              <span className="hidden @2xl:inline">게임 가이드</span>
              <span className="hidden text-white/35 @2xl:inline" aria-hidden>
                ›
              </span>
            </button>
          )}
          {rank && (
            <button
              type="button"
              onClick={() => setRankOpen(true)}
              aria-label="랭킹 보기"
              className={`${pill} border-[#FDE047]/30 bg-[#FDE047]/[0.07] text-[#FDE68A] hover:border-[#FDE047]/60`}
            >
              <span aria-hidden>🏆</span>
              <span className="hidden @sm:inline">랭킹</span>
              {rank.teaser && (
                <span className="hidden max-w-[11rem] truncate text-[11px] text-[#FDE68A]/60 @4xl:inline">
                  {rank.teaser}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
      <div
        className="mt-3 h-px"
        style={{
          background: `linear-gradient(90deg, ${accent}66, rgba(255,255,255,0.08) 40%, transparent)`,
        }}
      />

      {guide && (
        <Modal
          open={guideOpen}
          onClose={() => setGuideOpen(false)}
          size="lg"
          closeButton
          title={
            <span className="flex items-center gap-2">
              <span aria-hidden>{icon}</span> {title} 가이드
            </span>
          }
        >
          <GuideView doc={guide} accent={accent} onDone={() => setGuideOpen(false)} />
        </Modal>
      )}
      {rank && (
        <Modal
          open={rankOpen}
          onClose={() => setRankOpen(false)}
          size="md"
          closeButton
          title={
            <span className="flex flex-wrap items-baseline gap-x-2">
              <span>🏆 {title} 랭킹</span>
              {rank.sub && <span className="text-xs text-white/40">{rank.sub}</span>}
            </span>
          }
        >
          {rankOpen && rank.render()}
        </Modal>
      )}
    </header>
  );
}
