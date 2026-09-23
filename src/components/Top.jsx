"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDraggableContactModal, openContactModal } from "../hooks/useDraggableContactModal";
import logoMark from "@/img/logo-mark.svg";

export default function Top() {
  const pathname = usePathname();
  useDraggableContactModal();

  const isHome = pathname === "/";
  const isArchive = pathname === "/archive";

  const linkClass = (active) =>
    `transition-colors ${active ? "text-[#8B84FF]" : "text-white/60 hover:text-white"}`;

  return (
    <div className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#121212]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-sm font-medium tracking-tight text-white/90 transition-colors hover:text-[#8B84FF]"
        >
          <img src={logoMark.src} alt="" className="h-6 w-6 rounded-md" />
          <span className="hidden sm:inline">gunmo.dev</span>
        </Link>
        <div className="flex items-center gap-3 font-mono text-xs sm:gap-6 sm:text-sm">
          <Link href="/" className={linkClass(isHome)}>
            home
          </Link>
          <Link href="/archive" className={linkClass(isArchive)}>
            archive
          </Link>
          <button
            type="button"
            onClick={() => openContactModal(1)}
            className="cursor-pointer text-white/60 transition-colors hover:text-white"
          >
            contact
          </button>
        </div>
      </div>
    </div>
  );
}
