"use client";

import { useRef } from "react";
import type { StaticImageData } from "next/image";
import type { Song } from "@/lib/rhythm/music";
import neonCover from "@/img/rhythm/neon-drive.svg";
import pixelCover from "@/img/rhythm/pixel-rush.svg";
import starCover from "@/img/rhythm/starlight-run.svg";
import crimsonCover from "@/img/rhythm/crimson-blade.svg";
import moonCover from "@/img/rhythm/moonlight.svg";

export const COVERS: Record<string, StaticImageData> = {
  "neon-drive": neonCover,
  "pixel-rush": pixelCover,
  "starlight-run": starCover,
  "crimson-blade": crimsonCover,
  moonlight: moonCover,
};

const mod = (n: number, m: number) => ((n % m) + m) % m;
const fmtTime = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

/**
 * < [옆] [가운데] [옆] > 형태로 돌려 고르는 곡 선택.
 * pos는 끝없이 늘어나는 가상 위치라서 한쪽으로 계속 돌려도 카드가 자연스럽게 밀려 들어온다.
 */
export default function SongCarousel({
  songs,
  pos,
  onMove,
}: {
  songs: Song[];
  pos: number;
  onMove: (delta: number) => void;
}) {
  const drag = useRef<{ x: number; id: number } | null>(null);
  const current = songs[mod(pos, songs.length)];

  const arrow =
    "absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-[#1C1E24]/80 font-mono text-lg text-white/70 backdrop-blur transition-colors hover:border-white/40 hover:text-white";

  return (
    <div className="-mx-4 overflow-hidden px-4 py-4 select-none sm:mx-0">
      <div
        className="relative mx-auto h-[min(64vw,260px)] max-w-3xl touch-pan-y [perspective:1100px]"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, id: e.pointerId };
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          drag.current = null;
          if (!d || d.id !== e.pointerId) return;
          const dx = e.clientX - d.x;
          if (Math.abs(dx) > 40) onMove(dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => (drag.current = null)}
      >
        {[-2, -1, 0, 1, 2].map((k) => {
          const v = pos + k;
          const s = songs[mod(v, songs.length)];
          const a = Math.abs(k);
          const style: React.CSSProperties = {
            transform: `translateX(calc(-50% + ${k * 78}%)) translateZ(${-a * 140}px) rotateY(${-k * 28}deg) scale(${1 - a * 0.08})`,
            opacity: a === 0 ? 1 : a === 1 ? 0.55 : 0,
            filter: a === 0 ? "none" : "brightness(0.45) saturate(0.7)",
            zIndex: 5 - a,
            pointerEvents: a === 2 ? "none" : "auto",
          };
          return (
            <button
              key={v}
              type="button"
              tabIndex={k === 0 ? 0 : -1}
              aria-label={s.title}
              onClick={() => k !== 0 && onMove(k)}
              className={`absolute top-0 left-1/2 aspect-square h-full overflow-hidden rounded-2xl border transition-[transform,opacity,filter] duration-500 ease-out ${
                k === 0
                  ? "cursor-default border-white/30 shadow-2xl"
                  : "cursor-pointer border-white/10"
              }`}
              style={{
                ...style,
                boxShadow: k === 0 ? `0 18px 60px -12px ${s.color}88` : undefined,
              }}
            >
              <img
                src={COVERS[s.id]?.src}
                alt=""
                draggable={false}
                className="h-full w-full object-cover"
              />
            </button>
          );
        })}
        <button
          type="button"
          aria-label="이전 곡"
          className={`${arrow} left-0 sm:left-2`}
          onClick={() => onMove(-1)}
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="다음 곡"
          className={`${arrow} right-0 sm:right-2`}
          onClick={() => onMove(1)}
        >
          ›
        </button>
      </div>
      <div className="mt-4 text-center">
        <div className="font-mono text-xl font-bold text-white">{current.title}</div>
        <div className="mt-1 font-mono text-xs text-white/45">
          {current.desc} · {fmtTime(current.duration - 2.5)}
        </div>
        <div className="mt-2 flex justify-center gap-1.5">
          {songs.map((s, i) => (
            <span
              key={s.id}
              className="h-1.5 w-1.5 rounded-full transition-colors"
              style={{
                background: i === mod(pos, songs.length) ? current.color : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
