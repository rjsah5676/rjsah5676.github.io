"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS } from "@/data/navMenu";
import HintBubble, { markHintSeen } from "@/components/HintBubble";

const NAV_HINT_KEY = "hint:nav-chevron";

// 모바일(좁은 폭)에서도 한 줄에 들어가도록 여백·글자 크기를 줄임
const navItemClass =
  "block px-1.5 py-3 font-mono text-[13px] text-white/60 transition-colors hover:text-white whitespace-nowrap min-[360px]:px-2 min-[400px]:px-2.5 sm:px-3 sm:text-sm";
// 모바일: 메뉴 바 전체 폭 아래로 펼쳐지는 카드(2열) → 오른쪽 항목이 화면 밖으로 잘리지 않음
// 데스크톱: 기존처럼 해당 항목 아래에 붙는 드롭다운
const dropdownClass =
  "absolute inset-x-3 top-full z-40 mt-1 grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-[#1C1E24] p-2 shadow-xl sm:inset-x-auto sm:left-0 sm:mt-0 sm:flex sm:min-w-[180px] sm:flex-col sm:gap-0.5 sm:rounded-md sm:p-1.5";
const dropdownLinkClass =
  "rounded px-3 py-2.5 text-center font-mono text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white sm:py-2 sm:text-left sm:whitespace-nowrap";

interface NavLinkItem {
  href: string;
  label: string;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M2.5 4.5L6 8L9.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 마우스 hover가 없는 터치 기기에서도 서브메뉴를 열 수 있게 클릭/탭 토글 방식으로 구현.
function DropdownNavItem({
  href,
  label,
  items,
}: {
  href: string;
  label: string;
  items: NavLinkItem[];
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname().replace(/\/+$/, "");
  // 현재 페이지가 이 메뉴 그룹(목록 페이지 포함) 안이면 강조 (헤더 archive/about 처럼)
  const active = pathname === href || items.some((i) => pathname === i.href.replace(/\/+$/, ""));
  const labelColor = active ? "!text-[#8B84FF]" : "";

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  return (
    // 모바일에선 드롭다운이 nav(sticky) 기준으로 펼쳐지도록 relative를 sm 이상에서만
    <div ref={wrapRef} className="flex items-center sm:relative">
      {/* 이름은 하위 메뉴 목록(격자) 페이지 링크, 화살표로 드롭다운 펼침 */}
      <Link
        href={href}
        onClick={() => setOpen(false)}
        className={`${navItemClass} ${labelColor} !pr-0.5 sm:!pr-1`}
      >
        {label}
      </Link>
      <button
        type="button"
        aria-label={`${label} submenu`}
        onClick={() => {
          setOpen((o) => !o);
          markHintSeen(NAV_HINT_KEY); // 한 번 펼쳐봤으면 안내 그만
        }}
        aria-expanded={open}
        className="cursor-pointer py-3 pr-1.5 pl-0.5 text-white/40 transition-colors hover:text-white sm:px-1"
      >
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className={`${dropdownClass} ${items.length === 1 ? "grid-cols-1" : ""}`}>
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={dropdownLinkClass}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Nav() {
  return (
    <nav className="sticky top-14 z-30 border-b border-white/10 bg-[#121212]">
      <div className="mx-auto flex max-w-4xl flex-nowrap items-center justify-center gap-x-0 px-1 sm:gap-x-1 sm:px-6">
        {NAV_GROUPS.map((g) => (
          <DropdownNavItem
            key={g.key}
            href={g.href}
            label={g.label}
            items={g.items.map(({ href, label }) => ({ href, label }))}
          />
        ))}
      </div>
      <HintBubble
        storageKey={NAV_HINT_KEY}
        tail="top"
        maxShows={2}
        delay={1500}
        duration={5000}
        className="absolute top-full left-1/2 mt-2 -translate-x-1/2"
      >
        이름을 누르면 <b className="text-white">전체 목록</b>, <b className="text-white">▾</b>를
        누르면 하위 메뉴가 펼쳐져요
      </HintBubble>
    </nav>
  );
}
