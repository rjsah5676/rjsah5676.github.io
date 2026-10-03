"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type ModalCloseReason = "backdrop" | "escape" | "popstate";

export interface ModalProps {
  open: boolean;
  // reason이 "popstate"면 이미 뒤로가기로 히스토리가 소비된 상태
  onClose: (reason: ModalCloseReason) => void;
  title?: ReactNode;
  children?: ReactNode;
  // 하단 버튼 영역 (없으면 표시 안 함)
  footer?: ReactNode;
  // 배경 클릭으로 닫기 (기본 true)
  closeOnBackdrop?: boolean;
  // 열릴 때 포커스 줄 요소 (없으면 모달 자체)
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  // 패널 폭 (기본 sm). 내용이 길면 패널 안에서 스크롤
  size?: "sm" | "md" | "lg";
  // 오른쪽 위 닫기(×) 버튼
  closeButton?: boolean;
}

const SIZE = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-xl" } as const;

/**
 * 공통 모달.
 * - ESC / 배경 클릭 / 모바일·브라우저 뒤로가기로 닫힘
 * - 열려 있는 동안 body 스크롤 잠금, 닫히면 이전 포커스 복원
 *
 * 뒤로가기 처리: 열릴 때 같은 URL로 히스토리를 하나 쌓고(pushState), popstate가 오면 닫음.
 * 버튼 등으로 닫을 땐 쌓아둔 히스토리를 history.back()으로 소비해서 뒤로가기 한 번이 낭비되지 않게 함.
 * Next App Router는 window.history.pushState를 패치해서 내부 상태를 같이 복사하므로 라우터와 충돌 없음.
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  closeOnBackdrop = true,
  initialFocusRef,
  size = "sm",
  closeButton = false,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    // createPortal은 document가 필요 -> 마운트 후에만 렌더 (정적 export 빌드 대비)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // 뒤로가기로 닫기
  useEffect(() => {
    if (!open) return;
    let pushed = false;
    let closedByPop = false;

    const onPop = () => {
      closedByPop = true;
      onCloseRef.current("popstate");
    };

    // StrictMode(dev)에서 mount→cleanup→mount가 즉시 일어날 때 push/back이 꼬이지 않게 한 틱 미룸
    const timer = setTimeout(() => {
      window.history.pushState({ ...window.history.state, __modal: true }, "");
      pushed = true;
      window.addEventListener("popstate", onPop);
    }, 0);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("popstate", onPop);
      if (pushed && !closedByPop) window.history.back();
    };
  }, [open]);

  // ESC, 스크롤 잠금, 포커스
  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current("escape");
    };
    document.addEventListener("keydown", onKey);

    const focusTarget = initialFocusRef?.current ?? panelRef.current;
    focusTarget?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [open, initialFocusRef]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm [animation:modal-fade_150ms_ease-out]"
        onClick={closeOnBackdrop ? () => onCloseRef.current("backdrop") : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`thin-scroll relative max-h-[88dvh] w-full ${SIZE[size]} overflow-y-auto rounded-2xl border border-white/10 bg-[#1C1E24] p-6 shadow-2xl outline-none [animation:modal-pop_180ms_ease-out] sm:p-7`}
      >
        {closeButton && (
          <button
            type="button"
            aria-label="닫기"
            onClick={() => onCloseRef.current("backdrop")}
            className="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            ×
          </button>
        )}
        {title && (
          <h2
            id={titleId}
            className={`mb-3 font-mono text-base font-medium text-white ${closeButton ? "pr-8" : ""}`}
          >
            {title}
          </h2>
        )}
        {children && (
          <div className="font-['Nanum_Gothic',sans-serif] text-sm leading-relaxed break-keep text-white/70">
            {children}
          </div>
        )}
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
