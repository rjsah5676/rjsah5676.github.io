"use client";

import { useEffect, useRef, useState } from "react";
import type { Song } from "@/lib/rhythm/music";
import { DIFFICULTIES, type Chart, type Difficulty } from "@/lib/rhythm/chart";
import { audio, sfx } from "@/lib/rhythm/sfx";
import { COVERS } from "./SongCarousel";
import CustomMusic, { type CustomTrack } from "./CustomMusic";
import { RankingBoard } from "./RankingBoard";
import { RankEmblem } from "./Stage";
import type { Best } from "./RhythmGame";

const DISP = "font-['Arial_Black','Segoe_UI_Black',Impact,sans-serif] font-black italic";
const KR = "font-['Nanum_Gothic',sans-serif]";
const fmtTime = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const CUSTOM_COLOR = "#22D3EE";

export default function SongSelect({
  songs,
  sel,
  onSel,
  charts,
  diffs,
  diff,
  onDiff,
  best,
  track,
  onTrack,
  customCharts,
  song,
  onStart,
  starting,
  launching,
  canStart,
  err,
  onBack,
  onSettings,
  blocked,
  fs,
  onToggleFs,
}: {
  songs: Song[];
  sel: number;
  onSel: (i: number) => void;
  charts: Record<string, Partial<Record<Difficulty, Chart>>>;
  diffs: typeof DIFFICULTIES;
  diff: Difficulty;
  onDiff: (d: Difficulty) => void;
  best: Record<string, Best>;
  track: CustomTrack | null;
  onTrack: (t: CustomTrack | null) => void;
  customCharts: Record<Difficulty, Chart> | null;
  /** 지금 고른 곡 (내 음악인데 파일이 없으면 null) */
  song: Song | null;
  onStart: () => void;
  starting: boolean;
  launching: boolean;
  canStart: boolean;
  err: string;
  onBack: () => void;
  onSettings: () => void;
  blocked: boolean;
  fs: boolean;
  onToggleFs: () => void;
}) {
  const n = songs.length + 1;
  const custom = sel === songs.length;
  const color = custom ? CUSTOM_COLOR : (song?.color ?? CUSTOM_COLOR);
  const [ranking, setRanking] = useState(false);
  const chartOf = (d: Difficulty): Chart | null =>
    custom ? (customCharts?.[d] ?? null) : (charts[songs[sel].id][d] ?? null);
  const bestKey = (d: Difficulty) => (song ? `${song.id}:${d}` : "");
  const b = song ? best[bestKey(diff)] : undefined;
  const diffInfo = DIFFICULTIES.find((d) => d.key === diff)!;
  const curChart = chartOf(diff);

  const move = (dir: number) => {
    onSel((sel + dir + n) % n);
    sfx("ui-move", 0.6);
  };
  const moveDiff = (dir: number) => {
    const i = diffs.findIndex((d) => d.key === diff);
    const j = Math.max(0, Math.min(diffs.length - 1, i + dir));
    if (j !== i) {
      onDiff(diffs[j].key);
      sfx("ui-move", 0.6);
    }
  };

  useEffect(() => {
    if (blocked || launching) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.("input, textarea")) return;
      if (ranking) {
        if (e.code === "Escape" || e.code === "KeyR") {
          e.preventDefault();
          sfx("ui-back", 0.7);
          setRanking(false);
        }
        return;
      }
      if (e.code === "ArrowUp" || e.code === "ArrowDown") {
        e.preventDefault();
        move(e.code === "ArrowUp" ? -1 : 1);
      } else if (e.code === "ArrowLeft" || e.code === "ArrowRight") {
        e.preventDefault();
        moveDiff(e.code === "ArrowLeft" ? -1 : 1);
      } else if (e.code === "Enter") {
        e.preventDefault();
        if (canStart && !starting) onStart();
      } else if (e.code === "Escape") {
        e.preventDefault();
        sfx("ui-back", 0.7);
        onBack();
      } else if (e.code === "KeyS") {
        e.preventDefault();
        onSettings();
      } else if (e.code === "KeyR" && !custom) {
        e.preventDefault();
        sfx("ui-open", 0.7);
        setRanking(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // 고른 곡이 목록 가운데 오게
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-i="${sel}"]`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [sel]);

  const cover = !custom && song ? COVERS[song.id]?.src : undefined;

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#06041a]">
      {/* 배경: 고른 곡 커버를 크게 흐리게 */}
      {cover ? (
        <img
          key={cover}
          src={cover}
          alt=""
          className="absolute inset-0 h-full w-full scale-125 object-cover opacity-45 blur-[2.4cqw] [animation:modal-fade_400ms_ease-out]"
        />
      ) : (
        <img
          src="/rhythm/play-blue.webp"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(6,4,26,0.55)_0%,rgba(6,4,26,0.35)_45%,rgba(6,4,26,0.85)_60%)]" />
      <div
        className="absolute -left-[10cqw] top-[10cqw] h-[40cqw] w-[40cqw] rounded-full opacity-30 blur-[6cqw]"
        style={{ background: color }}
      />

      {/* 위 */}
      <div className="absolute inset-x-0 top-0 flex h-[5.4cqw] items-center justify-between border-b border-white/10 bg-black/35 px-[2.4cqw] backdrop-blur-[2px]">
        <div className="flex items-baseline gap-[1.2cqw]">
          <span className={`${DISP} text-[2.2cqw] tracking-[0.06em] text-white`}>SELECT MUSIC</span>
          <span className={`${KR} text-[1.1cqw] text-white/45`}>곡 선택</span>
        </div>
        <div className="flex items-center gap-[0.6cqw]">
          {!custom && (
            <TopBtn
              onClick={() => {
                sfx("ui-open", 0.7);
                setRanking(true);
              }}
            >
              🏆 랭킹 <K>R</K>
            </TopBtn>
          )}
          <TopBtn onClick={onSettings}>
            ⚙ 설정 <K>S</K>
          </TopBtn>
          <TopBtn onClick={onToggleFs}>{fs ? "✕ 창모드" : "⛶ 전체화면"}</TopBtn>
        </div>
      </div>

      {/* 왼쪽: 재킷 + 정보 + 난이도 */}
      <div className="absolute top-[7.4cqw] left-[2.6cqw] flex w-[44cqw] flex-col gap-[1.4cqw]">
        <div className="flex gap-[1.8cqw]">
          <div
            key={sel}
            className="relative h-[22cqw] w-[22cqw] shrink-0 overflow-hidden rounded-[1cqw] border-[0.2cqw] [animation:bd-slam_380ms_cubic-bezier(.2,.9,.3,1.1)]"
            style={{ borderColor: color, boxShadow: `0 0 2.4cqw ${color}88` }}
          >
            {cover ? (
              <img src={cover} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-[0.6cqw] bg-[linear-gradient(135deg,#0e3a4a,#1e1b4b)]">
                <span className="text-[6cqw]">🎵</span>
                <span className={`${DISP} text-[1.8cqw] text-white`}>MY MUSIC</span>
              </div>
            )}
            <span className="pointer-events-none absolute inset-y-0 left-0 w-[5cqw] bg-white/15 [animation:bd-sweep_3s_ease-in-out_infinite]" />
          </div>
          <div
            key={`i${sel}`}
            className="flex min-w-0 flex-1 flex-col justify-center [animation:bd-slide-left_300ms_ease-out]"
          >
            {custom ? (
              <div className="flex h-[22cqw] flex-col gap-[0.5cqw]">
                <div className="font-mono text-[1cqw] tracking-[0.25em]" style={{ color }}>
                  MY MUSIC
                </div>
                <div className="min-h-0 flex-1">
                  <CustomMusic track={track} onTrack={onTrack} getCtx={audio} />
                </div>
              </div>
            ) : (
              song && (
                <>
                  <div className="font-mono text-[1cqw] tracking-[0.25em]" style={{ color }}>
                    No.{String(sel + 1).padStart(2, "0")}
                  </div>
                  <div
                    className={`${KR} mt-[0.3cqw] text-[2.6cqw] leading-tight font-extrabold break-keep text-white drop-shadow-[0_0.2cqw_0_#000]`}
                  >
                    {song.title}
                  </div>
                  <div
                    className={`${KR} mt-[0.5cqw] line-clamp-2 text-[1.15cqw] leading-snug text-white/60`}
                  >
                    {song.desc}
                  </div>
                  <div className="mt-[0.9cqw] flex gap-[1.2cqw] font-mono text-[1.15cqw] text-white/75">
                    <span>
                      <span className="text-white/40">BPM </span>
                      {Math.round(song.bpmLabel ?? song.bpm)}
                    </span>
                    <span>
                      <span className="text-white/40">TIME </span>
                      {fmtTime(song.duration)}
                    </span>
                  </div>
                </>
              )
            )}
          </div>
        </div>

        {/* 난이도 */}
        <div className="flex gap-[0.6cqw]">
          {DIFFICULTIES.map((d) => {
            const has = diffs.some((x) => x.key === d.key);
            const c = has ? chartOf(d.key) : null;
            const on = d.key === diff;
            const bb = song ? best[bestKey(d.key)] : undefined;
            return (
              <button
                key={d.key}
                type="button"
                disabled={!has || !c}
                onClick={() => {
                  onDiff(d.key);
                  sfx("ui-move", 0.6);
                }}
                className={`relative flex flex-1 cursor-pointer flex-col items-center rounded-[0.7cqw] border py-[0.8cqw] transition-all disabled:cursor-not-allowed disabled:opacity-25 ${
                  on
                    ? "-translate-y-[0.3cqw] bg-black/60"
                    : "border-white/10 bg-black/35 hover:border-white/30"
                }`}
                style={
                  on ? { borderColor: d.color, boxShadow: `0 0 1.4cqw ${d.color}77` } : undefined
                }
              >
                <span
                  className={`${KR} text-[1.05cqw] font-bold whitespace-nowrap`}
                  style={{ color: d.color }}
                >
                  {d.label}
                </span>
                <span className={`${DISP} text-[2cqw] leading-tight text-white`}>
                  {c ? c.level : "-"}
                </span>
                {bb && (
                  <span className="absolute -top-[0.7cqw] -right-[0.5cqw] font-mono text-[0.8cqw] font-bold">
                    {bb.ap ? (
                      <span className="rounded bg-[#7DF9FF] px-[0.3cqw] text-black">AP</span>
                    ) : bb.fc ? (
                      <span className="rounded bg-[#FDE047] px-[0.3cqw] text-black">FC</span>
                    ) : null}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 기록 */}
        <div className="flex h-[6.4cqw] items-center gap-[1.4cqw] rounded-[0.9cqw] border border-white/10 bg-black/45 px-[1.4cqw]">
          {b ? (
            <>
              <RankEmblem rank={b.rank} className="h-[5cqw] w-[5cqw]" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-mono text-[0.95cqw] tracking-[0.2em] text-white/45">
                  BEST SCORE
                </span>
                <span className={`${DISP} text-[2.2cqw] leading-none text-white tabular-nums`}>
                  {b.score.toLocaleString("en-US")}
                </span>
              </div>
              <div className="flex flex-col items-end font-mono text-[1.1cqw] text-white/70">
                <span>{b.acc.toFixed(2)}%</span>
                <span className="font-bold">
                  {b.ap ? (
                    <span className="text-[#7DF9FF]">ALL PERFECT</span>
                  ) : b.fc ? (
                    <span className="text-[#FDE047]">FULL COMBO</span>
                  ) : (
                    <span className="text-white/35">CLEAR</span>
                  )}
                </span>
              </div>
            </>
          ) : (
            <span className={`${KR} text-[1.2cqw] text-white/40`}>
              {curChart
                ? `아직 기록이 없어요 · 노트 ${curChart.notes.length}개`
                : "파일을 넣으면 채보가 만들어져요"}
            </span>
          )}
        </div>
      </div>

      {/* 오른쪽: 곡 목록 */}
      <div
        ref={listRef}
        className="absolute top-[5.4cqw] right-0 bottom-[5cqw] w-[48cqw] overflow-y-auto py-[12cqw] pr-[2.4cqw] pl-[3cqw] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {[...songs, null].map((s, i) => {
          const on = i === sel;
          const c = s ? s.color : CUSTOM_COLOR;
          const lv = s ? charts[s.id][diff]?.level : customCharts?.[diff]?.level;
          const bb = s
            ? best[`${s.id}:${diff}`]
            : track
              ? best[`custom:${track.key}:${diff}`]
              : undefined;
          return (
            <button
              key={s?.id ?? "custom"}
              data-i={i}
              type="button"
              onClick={() => {
                if (on) {
                  if (canStart && !starting) onStart();
                } else {
                  onSel(i);
                  sfx("ui-move", 0.6);
                }
              }}
              className={`relative mb-[0.7cqw] flex w-full cursor-pointer items-center gap-[1.2cqw] overflow-hidden rounded-[0.7cqw] border text-left transition-all duration-200 ${
                on
                  ? "-ml-[2cqw] w-[calc(100%+2cqw)] border-white/60 py-[0.9cqw] pr-[1.4cqw] pl-[1cqw]"
                  : "border-white/10 bg-black/45 py-[0.55cqw] pr-[1.2cqw] pl-[0.8cqw] opacity-80 hover:opacity-100"
              }`}
              style={
                on
                  ? {
                      background: `linear-gradient(90deg, ${c}e0, ${c}55 70%, #0b0820cc)`,
                      boxShadow: `0 0 2cqw ${c}66`,
                    }
                  : undefined
              }
            >
              <div
                className={`shrink-0 overflow-hidden rounded-[0.5cqw] border border-white/20 bg-[#0e3a4a] ${on ? "h-[5cqw] w-[5cqw]" : "h-[3.6cqw] w-[3.6cqw]"}`}
              >
                {s ? (
                  <img src={COVERS[s.id]?.src} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[1.8cqw]">
                    🎵
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={`${KR} truncate font-extrabold text-white ${on ? "text-[1.7cqw] drop-shadow-[0_0.15cqw_0_rgba(0,0,0,0.6)]" : "text-[1.35cqw]"}`}
                >
                  {s ? s.title : track ? track.name : "내 음악으로 플레이"}
                </div>
                <div
                  className={`truncate font-mono text-[0.95cqw] ${on ? "text-white/85" : "text-white/40"}`}
                >
                  {s ? s.desc : "MY MUSIC · mp3 자동 채보"}
                </div>
              </div>
              {bb && <RankEmblem rank={bb.rank} className="h-[3cqw] w-[3cqw] shrink-0" />}
              <div className="flex w-[4.2cqw] shrink-0 flex-col items-center">
                <span className="font-mono text-[0.8cqw] text-white/60">Lv</span>
                <span className={`${DISP} text-[1.8cqw] leading-none text-white`}>{lv ?? "-"}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 아래 */}
      <div className="absolute inset-x-0 bottom-0 flex h-[5cqw] items-center justify-between border-t border-white/10 bg-black/55 px-[2.4cqw]">
        <div className="flex items-center gap-[1.4cqw] font-mono text-[1cqw] text-white/50">
          <span>
            <K>↑</K>
            <K>↓</K> 곡
          </span>
          <span>
            <K>←</K>
            <K>→</K> 난이도
          </span>
          <span>
            <K>Enter</K> 시작
          </span>
          <span>
            <K>Esc</K> 타이틀
          </span>
          {err && <span className="text-red-300">{err}</span>}
        </div>
        <button
          type="button"
          disabled={!canStart || starting}
          onClick={onStart}
          className={`${DISP} relative -skew-x-12 cursor-pointer overflow-hidden rounded-[0.6cqw] px-[3.4cqw] py-[0.7cqw] text-[1.9cqw] tracking-[0.12em] text-white transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40`}
          style={{
            background: `linear-gradient(90deg, ${diffInfo.color}, ${color})`,
            boxShadow: `0 0 1.6cqw ${color}99`,
          }}
        >
          <span className="pointer-events-none absolute inset-y-0 left-0 w-[4cqw] bg-white/30 [animation:bd-sweep_1.8s_ease-in-out_infinite]" />
          <span className="inline-block skew-x-12">{starting ? "LOADING…" : "START"}</span>
        </button>
      </div>

      {/* 랭킹 */}
      {ranking && song && !custom && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-[3px] [animation:modal-fade_180ms_ease-out]"
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) {
              sfx("ui-back", 0.7);
              setRanking(false);
            }
          }}
        >
          <div className="flex max-h-[48cqw] w-[min(560px,64cqw)] flex-col overflow-hidden rounded-[1.2cqw] border border-white/15 bg-[#120f26] shadow-2xl [animation:modal-pop_220ms_ease-out]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <span className="font-mono text-sm font-bold text-white">
                🏆 랭킹{" "}
                <span className="font-normal text-white/45">
                  · {song.title} {diffInfo.label} TOP 10
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  sfx("ui-back", 0.7);
                  setRanking(false);
                }}
                className="cursor-pointer rounded-full px-2 font-mono text-sm text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
              <RankingBoard songId={song.id} diff={diff} label="" bare />
            </div>
          </div>
        </div>
      )}

      {/* 시작 연출: 재킷이 들어오고 GET READY */}
      {launching && song && (
        <div className="absolute inset-0 z-50 flex items-center overflow-hidden bg-[#05030f]/90 [animation:bd-launch_1.5s_ease-out]">
          <div
            className="absolute inset-x-0 top-1/2 h-[18cqw] -translate-y-1/2 -skew-y-3"
            style={{ background: `linear-gradient(90deg, transparent, ${color}55, transparent)` }}
          />
          <div className="relative ml-[12cqw] flex items-center gap-[3cqw]">
            <div
              className="h-[22cqw] w-[22cqw] overflow-hidden rounded-[1cqw] border-[0.25cqw] [animation:bd-slam_500ms_cubic-bezier(.2,.9,.3,1.1)]"
              style={{ borderColor: color, boxShadow: `0 0 4cqw ${color}` }}
            >
              {cover ? (
                <img src={cover} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#0e3a4a,#1e1b4b)] text-[8cqw]">
                  🎵
                </div>
              )}
            </div>
            <div className="[animation:bd-slide-left_500ms_150ms_ease-out_backwards]">
              <div
                className="font-mono text-[1.3cqw] tracking-[0.3em]"
                style={{ color: diffInfo.color }}
              >
                {diffInfo.label} · Lv.{curChart?.level ?? "-"}
              </div>
              <div
                className={`${KR} mt-[0.4cqw] max-w-[44cqw] text-[3.6cqw] leading-tight font-extrabold text-white`}
              >
                {song.title}
              </div>
              <div
                className={`${DISP} mt-[1.6cqw] text-[3cqw] tracking-[0.3em] text-white [animation:bd-blink_0.6s_ease-in-out_infinite]`}
              >
                GET READY
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function K({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="mx-[0.15cqw] inline-flex min-w-[1.7cqw] items-center justify-center rounded-[0.35cqw] border border-white/25 border-b-[0.2cqw] bg-white/10 px-[0.35cqw] font-mono text-[0.9cqw] leading-tight text-white/85">
      {children}
    </kbd>
  );
}

function TopBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex cursor-pointer items-center gap-[0.4cqw] rounded-[0.6cqw] border border-white/15 bg-white/5 px-[1cqw] py-[0.35cqw] font-['Nanum_Gothic',sans-serif] text-[1.1cqw] font-bold text-white/75 transition-colors hover:border-white/40 hover:text-white"
    >
      {children}
    </button>
  );
}
