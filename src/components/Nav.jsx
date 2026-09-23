"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const navItemClass =
  "block px-3 py-3 font-mono text-sm text-white/60 transition-colors hover:text-white whitespace-nowrap";
const dropdownClass =
  "absolute left-0 top-full z-40 flex min-w-[180px] flex-col gap-0.5 rounded-md border border-white/10 bg-[#1C1E24] p-1.5 shadow-xl";
const dropdownLinkClass =
  "rounded px-3 py-2 font-mono text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white";

function ChevronIcon({ open }) {
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
function DropdownNavItem({ href, label, items }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative flex items-center">
      <Link href={href} className={navItemClass}>
        {label}
      </Link>
      <button
        type="button"
        aria-label={`${label} submenu`}
        onClick={() => setOpen((o) => !o)}
        className="px-1 py-3 text-white/40 transition-colors hover:text-white"
      >
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className={dropdownClass}>
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
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-1 gap-y-0 px-2 sm:px-6">
        <Link href="/about" className={navItemClass}>
          about
        </Link>

        <DropdownNavItem
          href="/project"
          label="project"
          items={[
            { href: "/project", label: "프로젝트" },
            { href: "/study", label: "개인공부" },
          ]}
        />

        <DropdownNavItem
          href="/melongame"
          label="games"
          items={[
            { href: "/melongame", label: "멜론 게임" },
            { href: "/rspeed", label: "반응속도 테스트" },
            { href: "/mine", label: "지뢰찾기" },
            { href: "/sketch", label: "스케치 퀴즈(미구현)" },
          ]}
        />

        <Link href="/guest" className={navItemClass}>
          guest box
        </Link>
        <Link href="/gallery" className={navItemClass}>
          gallery
        </Link>
      </div>
    </nav>
  );
}
