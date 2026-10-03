import { useEffect, useRef } from "react";
import { playPiece } from "@/lib/sfx";

/**
 * 수가 하나 늘 때마다 "탁" (기물 수가 줄었으면 잡는 소리).
 * ply < 0 = 아직 로딩 전. 여러 수가 한꺼번에 늘거나(첫 로딩) 줄면(무르기) 소리 없이 기준만 맞춤.
 */
export function useMoveSound(ply: number, pieces: number, silent = false) {
  const prev = useRef({ ply, pieces });
  useEffect(() => {
    const p = prev.current;
    if (p.ply >= 0 && ply === p.ply + 1 && !silent)
      playPiece(pieces < p.pieces ? "capture" : "move");
    prev.current = { ply, pieces };
  }, [ply, pieces, silent]);
}

/** 체스 FEN의 기물 수 */
export const chessPieces = (fen: string) => (fen.split(" ")[0].match(/[a-z]/gi) ?? []).length;

/** 장기 fen()("0,5,0,…,-3 w")의 기물 수 */
export const janggiPieces = (fen: string) =>
  fen
    .split(" ")[0]
    .split(",")
    .filter((v) => v && v !== "0").length;
