import { useEffect, type RefObject } from "react";

/**
 * 게임 페이지에 처음 들어왔을 때 사이트 헤더(소개 영역) 아래에 게임이 묻히지 않게
 * 게임 영역 맨 위로 부드럽게 내려줌. 대상 요소에 scroll-mt로 고정 메뉴 높이만큼 여백을 줄 것.
 */
export function useScrollToGame(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const id = setTimeout(
      () => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      350
    );
    return () => clearTimeout(id);
  }, [ref]);
}
