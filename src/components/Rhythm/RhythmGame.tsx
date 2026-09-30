"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SONGS, type Song } from "@/lib/rhythm/music";
import { DIFFICULTIES, makeChart, type Difficulty } from "@/lib/rhythm/chart";
import { renderMetronome, renderSong } from "@/lib/rhythm/synth";
import {
  drawHead,
  HIT_SOUNDS,
  laneColors,
  makeHitSound,
  SKINS,
  type HitSound,
  type Skin,
} from "@/lib/rhythm/fx";
import Stage, { KEY_CODES, type LiveSettings, type Result } from "./Stage";
import SongCarousel from "./SongCarousel";
import HoldButton from "./HoldButton";
import { RankingBoard, SubmitRanking } from "./RankingBoard";

const SETTINGS_KEY = "rhythm_settings";
const BEST_KEY = "rhythm_best";

interface Settings {
  speed: number;
  /** 음악 싱크(ms): 노트 화면+판정을 같이 옮김 */
  offset: number;
  /** 판정 싱크(ms): 판정만 옮김 (늘 늦게/빠르게 치는 버릇 보정) */
  judge: number;
  /** 타격음 볼륨 0~1 */
  hit: number;
  /** 음악 볼륨 0~1 */
  music: number;
  hitSound: HitSound;
  skin: Skin;
}
interface Best {
  score: number;
  acc: number;
  rank: string;
  fc: boolean;
  ap: boolean;
}

// 곡 렌더링은 한 번만 (페이지 안에서 재사용)
const buffers = new Map<string, Promise<AudioBuffer>>();
const loadSong = (s: Song) => {
  if (!buffers.has(s.id)) buffers.set(s.id, renderSong(s));
  return buffers.get(s.id)!;
};

let sharedCtx: AudioContext | null = null;
async function audio() {
  if (!sharedCtx) sharedCtx = new AudioContext({ latencyHint: "interactive" });
  if (sharedCtx.state !== "running") await sharedCtx.resume();
  return sharedCtx;
}
const latencyOf = (ctx: AudioContext) =>
  ((ctx as AudioContext & { outputLatency?: number }).outputLatency ?? 0) + (ctx.baseLatency ?? 0);

const mod = (n: number, m: number) => ((n % m) + m) % m;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const btn =
  "cursor-pointer rounded-full border border-white/15 px-3 py-1.5 font-mono text-xs whitespace-nowrap text-white/70 transition-colors hover:border-[#6C63FF]/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-30";
const stepBtn =
  "h-8 w-8 shrink-0 cursor-pointer rounded-full border border-white/15 font-mono text-sm text-white/70 hover:border-[#6C63FF]/60 hover:text-white";

const seg = (on: boolean) =>
  `cursor-pointer rounded-full px-2.5 py-1 font-mono text-[11px] whitespace-nowrap transition-colors ${
    on ? "bg-[#6C63FF] text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
  }`;

// 타격음 미리 듣기 (종류별로 한 번만 만들어 둠)
const hitCache = new Map<HitSound, AudioBuffer>();
async function previewHit(kind: HitSound, volume: number) {
  if (volume <= 0) return;
  try {
    const ctx = await audio();
    if (!hitCache.has(kind)) hitCache.set(kind, makeHitSound(ctx, kind));
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = volume * 0.9;
    src.buffer = hitCache.get(kind)!;
    src.connect(gain).connect(ctx.destination);
    src.start();
  } catch {}
}

type Screen = "select" | "play" | "result" | "calibrate";

export default function RhythmGame() {
  const [screen, setScreen] = useState<Screen>("select");
  // 캐러셀 가상 위치 (곡 번호 = pos mod 곡 수)
  const [pos, setPos] = useState(0);
  const songIdx = mod(pos, SONGS.length);
  const [diff, setDiff] = useState<Difficulty>("normal");
  const [settings, setSettings] = useState<Settings>({
    speed: 3,
    offset: 0,
    judge: 0,
    hit: 0.6,
    music: 1,
    hitSound: "thud",
    skin: "bar",
  });
  const [best, setBest] = useState<Record<string, Best>>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [play, setPlay] = useState<{
    ctx: AudioContext;
    buffer: AudioBuffer;
    round: number;
  } | null>(null);
  const [judgeApplied, setJudgeApplied] = useState(false);
  const [result, setResult] = useState<(Result & { newBest: boolean }) | null>(null);

  const song = SONGS[songIdx];
  const charts = useMemo(
    () =>
      Object.fromEntries(
        SONGS.map((s) => [
          s.id,
          Object.fromEntries(DIFFICULTIES.map((d) => [d.key, makeChart(s, d.key)])),
        ])
      ),
    []
  );
  const chart = charts[song.id][diff];

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "null");
      const b = JSON.parse(localStorage.getItem(BEST_KEY) ?? "null");
      /* eslint-disable react-hooks/set-state-in-effect -- 저장된 설정·기록 복원(마운트 1회) */
      if (s) {
        setSettings({
          speed: clamp(Number(s.speed) || 3, 1, 8),
          offset: clamp(Number(s.offset) || 0, -400, 400),
          judge: clamp(Number(s.judge) || 0, -400, 400),
          hit: typeof s.hit === "number" ? clamp(s.hit, 0, 1) : 0.6,
          music: typeof s.music === "number" ? clamp(s.music, 0, 1) : 1,
          hitSound: HIT_SOUNDS.some((h) => h.key === s.hitSound) ? s.hitSound : "thud",
          skin: SKINS.some((k) => k.key === s.skin) ? s.skin : "bar",
        });
        if (typeof s.songIdx === "number" && SONGS[s.songIdx]) setPos(s.songIdx);
        if (DIFFICULTIES.some((d) => d.key === s.diff)) setDiff(s.diff);
      }
      if (b) setBest(b);
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch {}
    // 저장된 값을 불러온 뒤부터 저장 (개발 모드에서 effect가 두 번 돌 때 기본값이 덮어쓰는 것 방지)
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settings, songIdx, diff }));
    } catch {}
  }, [hydrated, settings, songIdx, diff]);

  // 고른 곡은 미리 렌더링해 둬서 시작을 빠르게
  useEffect(() => {
    loadSong(song).catch(() => {});
  }, [song]);

  const start = useCallback(async () => {
    if (loading) return;
    setErr("");
    setLoading(true);
    try {
      const ctx = await audio();
      const buffer = await loadSong(song);
      setPlay((p) => ({ ctx, buffer, round: (p?.round ?? 0) + 1 }));
      setScreen("play");
    } catch (e) {
      console.error(e);
      setErr("이 브라우저에서 오디오를 재생할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [loading, song]);

  const finish = useCallback(
    (r: Result) => {
      const key = `${r.songId}:${r.diff}`;
      const prev = best[key];
      const newBest = !prev || r.score > prev.score;
      if (newBest || (r.fc && !prev?.fc) || (r.ap && !prev?.ap)) {
        const next = {
          ...best,
          [key]: {
            score: Math.max(r.score, prev?.score ?? 0),
            acc: newBest ? r.acc : prev.acc,
            rank: newBest ? r.rank : prev.rank,
            fc: r.fc || !!prev?.fc,
            ap: r.ap || !!prev?.ap,
          },
        };
        setBest(next);
        try {
          localStorage.setItem(BEST_KEY, JSON.stringify(next));
        } catch {}
      }
      setResult({ ...r, newBest });
      setJudgeApplied(false);
      setScreen("result");
    },
    [best]
  );

  // 플레이 중(일시정지 화면·속도 단축키)에 바꾼 설정 저장
  const onLiveSettings = useCallback(
    (p: Partial<LiveSettings>) => setSettings((s) => ({ ...s, ...p })),
    []
  );

  // 선택·결과 화면 단축키
  useEffect(() => {
    if (screen !== "select" && screen !== "result") return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.("input, textarea")) return;
      if (e.code === "Enter") {
        e.preventDefault();
        start();
      } else if (screen === "result" && e.code === "Escape") setScreen("select");
      else if (screen === "select") {
        const di = DIFFICULTIES.findIndex((d) => d.key === diff);
        if (e.code === "ArrowLeft" || e.code === "ArrowRight") {
          e.preventDefault();
          setPos((p) => p + (e.code === "ArrowLeft" ? -1 : 1));
        } else if (e.code === "ArrowUp" || e.code === "ArrowDown") {
          e.preventDefault();
          setDiff(DIFFICULTIES[clamp(di + (e.code === "ArrowUp" ? -1 : 1), 0, 3)].key);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, start, diff]);

  if (screen === "play" && play) {
    return (
      <Stage
        key={play.round}
        song={song}
        diff={diff}
        chart={chart}
        buffer={play.buffer}
        ctx={play.ctx}
        speed={settings.speed}
        offset={settings.offset}
        judgeOffset={settings.judge}
        hitVolume={settings.hit}
        musicVolume={settings.music}
        onSettings={onLiveSettings}
        hitSound={settings.hitSound}
        skin={settings.skin}
        onFinish={finish}
        onQuit={() => setScreen("select")}
        onRestart={() => setPlay((p) => p && { ...p, round: p.round + 1 })}
      />
    );
  }

  if (screen === "calibrate") {
    return (
      <Calibrate
        current={settings.offset}
        onApply={(ms) => {
          setSettings((s) => ({ ...s, offset: ms }));
          setScreen("select");
        }}
        onCancel={() => setScreen("select")}
      />
    );
  }

  if (screen === "result" && result) {
    const d = DIFFICULTIES.find((x) => x.key === result.diff)!;
    const rankColor = result.rank.startsWith("S")
      ? "#FDE047"
      : result.rank === "A"
        ? "#4ADE80"
        : result.rank === "B"
          ? "#60A5FA"
          : "#F87171";
    return (
      <div className="mx-auto grid max-w-4xl items-start gap-4 md:grid-cols-2">
        <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-[#1C1E24] p-6 text-center sm:p-8">
          <p className="font-mono text-xs text-white/40">
            {song.title} · <span style={{ color: d.color }}>{d.label}</span>
          </p>
          <p className="mt-3 font-mono text-7xl font-black" style={{ color: rankColor }}>
            {result.rank}
          </p>
          <div className="mt-2 flex h-5 gap-2 font-mono text-[11px] font-bold">
            {result.ap ? (
              <span className="text-[#7DF9FF]">ALL PERFECT</span>
            ) : result.fc ? (
              <span className="text-[#4ADE80]">FULL COMBO</span>
            ) : null}
            {result.newBest && <span className="text-[#FDE047]">NEW BEST</span>}
          </div>
          <p className="mt-3 font-mono text-3xl font-bold text-white">
            {result.score.toLocaleString("en-US")}
          </p>
          <p className="mt-1 font-mono text-sm text-white/50">
            정확도 {result.acc.toFixed(2)}% · 최대 콤보 {result.maxCombo}
          </p>
          <p className="mt-2 font-mono text-xs">
            <span className="text-[#60A5FA]">FAST {result.fast}</span>
            <span className="mx-2 text-white/20">·</span>
            <span className="text-[#FB923C]">SLOW {result.slow}</span>
            {result.avgMs !== null && (
              <span className="ml-2 text-white/45">
                · 평균 {result.avgMs > 0 ? "+" : ""}
                {result.avgMs}ms {result.avgMs > 0 ? "늦음" : result.avgMs < 0 ? "빠름" : ""}
              </span>
            )}
          </p>
          {result.avgMs !== null && Math.abs(result.avgMs) >= 8 && (
            <button
              type="button"
              className={`${btn} mt-2`}
              disabled={judgeApplied}
              onClick={() => {
                setSettings((s) => ({ ...s, judge: clamp(s.judge + result.avgMs!, -400, 400) }));
                setJudgeApplied(true);
              }}
            >
              {judgeApplied
                ? `판정 싱크 ${settings.judge > 0 ? "+" : ""}${settings.judge}ms로 맞춤`
                : `판정 싱크에 반영 (${result.avgMs > 0 ? "+" : ""}${result.avgMs}ms)`}
            </button>
          )}
          <div className="mt-5 grid w-full grid-cols-4 gap-2 font-mono text-xs">
            {(
              [
                ["PERFECT", result.counts.perfect, "#7DF9FF"],
                ["GREAT", result.counts.great, "#4ADE80"],
                ["GOOD", result.counts.good, "#FBBF24"],
                ["MISS", result.counts.miss, "#F87171"],
              ] as const
            ).map(([label, n, c]) => (
              <div key={label} className="rounded-lg bg-white/5 py-2">
                <div className="text-[10px]" style={{ color: c }}>
                  {label}
                </div>
                <div className="mt-0.5 text-sm text-white">{n}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-2">
            <button
              type="button"
              className="cursor-pointer rounded-full bg-[#6C63FF] px-5 py-2 font-mono text-sm text-white hover:bg-[#5b52f0]"
              onClick={start}
            >
              다시하기 (Enter)
            </button>
            <button
              type="button"
              className={`${btn} px-5 py-2 text-sm`}
              onClick={() => setScreen("select")}
            >
              곡 선택 (Esc)
            </button>
          </div>
        </div>
        <SubmitRanking result={result} label={`${song.title} ${d.label}`} />
      </div>
    );
  }

  // ─── 곡 선택 ───
  const diffLabel = DIFFICULTIES.find((x) => x.key === diff)!.label;
  return (
    <div>
      <SongCarousel songs={SONGS} pos={pos} onMove={(dlt) => setPos((p) => p + dlt)} />
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {DIFFICULTIES.map((d) => {
              const c = charts[song.id][d.key];
              const b = best[`${song.id}:${d.key}`];
              const on = d.key === diff;
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setDiff(d.key)}
                  className={`cursor-pointer rounded-xl border px-3 py-3 text-left transition-colors ${
                    on ? "bg-white/[0.07]" : "border-white/10 bg-[#1C1E24] hover:border-white/25"
                  }`}
                  style={on ? { borderColor: d.color } : undefined}
                >
                  <div className="flex items-baseline justify-between gap-1">
                    <span
                      className="font-['Nanum_Gothic',sans-serif] text-sm font-bold"
                      style={{ color: d.color }}
                    >
                      {d.label}
                    </span>
                    <span className="font-mono text-xs text-white/60">Lv.{c.level}</span>
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-white/35">
                    노트 {c.notes.length}
                  </div>
                  <div className="mt-1 h-4 font-mono text-[11px] text-white/60">
                    {b && (
                      <>
                        {b.rank} · {b.score.toLocaleString("en-US")}
                        {b.ap ? (
                          <span className="ml-1 text-[#7DF9FF]">AP</span>
                        ) : b.fc ? (
                          <span className="ml-1 text-[#4ADE80]">FC</span>
                        ) : null}
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={start}
            disabled={loading}
            className="mt-5 w-full cursor-pointer rounded-full py-3 font-mono text-base font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
            style={{ background: song.color }}
          >
            {loading ? "곡 준비 중…" : "시작 (Enter)"}
          </button>
          {err && <p className="mt-2 text-center font-mono text-xs text-red-300">{err}</p>}
          <div className="mt-5">
            <RankingBoard songId={song.id} diff={diff} label={`${song.title} ${diffLabel}`} />
          </div>
        </div>

        {/* 설정 */}
        <div className="rounded-xl border border-white/10 bg-[#1C1E24] p-4">
          <p className="mb-3 font-mono text-sm font-bold text-white">설정</p>

          <label className="font-mono text-xs text-white/50">노트 속도</label>
          <div className="mt-1.5 mb-4 flex items-center gap-2">
            <button
              type="button"
              className={stepBtn}
              onClick={() =>
                setSettings((s) => ({
                  ...s,
                  speed: clamp(Math.round((s.speed - 0.5) * 10) / 10, 1, 8),
                }))
              }
            >
              −
            </button>
            <input
              type="range"
              min={1}
              max={8}
              step={0.1}
              value={settings.speed}
              onChange={(e) => setSettings((s) => ({ ...s, speed: Number(e.target.value) }))}
              className="min-w-0 flex-1 accent-[#6C63FF]"
            />
            <button
              type="button"
              className={stepBtn}
              onClick={() =>
                setSettings((s) => ({
                  ...s,
                  speed: clamp(Math.round((s.speed + 0.5) * 10) / 10, 1, 8),
                }))
              }
            >
              +
            </button>
            <span className="w-10 text-right font-mono text-sm text-white">
              x{settings.speed.toFixed(1)}
            </span>
          </div>

          <label className="font-mono text-xs text-white/50">
            음악 싱크 (ms) · +면 노트가 늦게 옴
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <HoldButton
              className={stepBtn}
              onStep={() => setSettings((s) => ({ ...s, offset: clamp(s.offset - 1, -400, 400) }))}
            >
              −
            </HoldButton>
            <input
              type="range"
              min={-400}
              max={400}
              step={1}
              value={settings.offset}
              onChange={(e) => setSettings((s) => ({ ...s, offset: Number(e.target.value) }))}
              className="min-w-0 flex-1 accent-[#6C63FF]"
            />
            <HoldButton
              className={stepBtn}
              onStep={() => setSettings((s) => ({ ...s, offset: clamp(s.offset + 1, -400, 400) }))}
            >
              +
            </HoldButton>
            <span className="w-10 text-right font-mono text-sm text-white">
              {settings.offset > 0 ? "+" : ""}
              {settings.offset}
            </span>
          </div>
          <div className="mt-2 flex gap-1.5">
            <button type="button" className={btn} onClick={() => setScreen("calibrate")}>
              싱크 맞추기
            </button>
            <button
              type="button"
              className={btn}
              disabled={settings.offset === 0}
              onClick={() => setSettings((s) => ({ ...s, offset: 0 }))}
            >
              초기화
            </button>
          </div>

          <label className="mt-4 block font-mono text-xs text-white/50">
            판정 싱크 (ms) · +면 늦게 쳐도 맞음
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <HoldButton
              className={stepBtn}
              onStep={() => setSettings((s) => ({ ...s, judge: clamp(s.judge - 1, -400, 400) }))}
            >
              −
            </HoldButton>
            <input
              type="range"
              min={-400}
              max={400}
              step={1}
              value={settings.judge}
              onChange={(e) => setSettings((s) => ({ ...s, judge: Number(e.target.value) }))}
              className="min-w-0 flex-1 accent-[#6C63FF]"
            />
            <HoldButton
              className={stepBtn}
              onStep={() => setSettings((s) => ({ ...s, judge: clamp(s.judge + 1, -400, 400) }))}
            >
              +
            </HoldButton>
            <span className="w-10 text-right font-mono text-sm text-white">
              {settings.judge > 0 ? "+" : ""}
              {settings.judge}
            </span>
          </div>
          <p className="mt-1 font-mono text-[10px] text-white/30">
            한 판 끝나면 결과 화면에서 평균 타이밍으로 맞출 수 있어요
          </p>

          <label className="mt-4 block font-mono text-xs text-white/50">음악 볼륨</label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.music}
              onChange={(e) => setSettings((s) => ({ ...s, music: Number(e.target.value) }))}
              className="min-w-0 flex-1 accent-[#6C63FF]"
            />
            <span className="w-10 text-right font-mono text-sm text-white">
              {settings.music === 0 ? "끔" : Math.round(settings.music * 100)}
            </span>
          </div>

          <label className="mt-4 block font-mono text-xs text-white/50">타격음</label>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {HIT_SOUNDS.map((h) => (
              <button
                key={h.key}
                type="button"
                className={seg(settings.hitSound === h.key)}
                onClick={() => {
                  setSettings((s) => ({ ...s, hitSound: h.key, hit: s.hit || 0.6 }));
                  previewHit(h.key, settings.hit || 0.6);
                }}
              >
                {h.label}
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.hit}
              onChange={(e) => setSettings((s) => ({ ...s, hit: Number(e.target.value) }))}
              onPointerUp={() => previewHit(settings.hitSound, settings.hit)}
              className="min-w-0 flex-1 accent-[#6C63FF]"
            />
            <span className="w-10 text-right font-mono text-sm text-white">
              {settings.hit === 0 ? "끔" : Math.round(settings.hit * 100)}
            </span>
          </div>

          <label className="mt-4 block font-mono text-xs text-white/50">노트 스킨</label>
          <div className="mt-1.5 grid grid-cols-5 gap-1.5">
            {SKINS.map((k) => (
              <button
                key={k.key}
                type="button"
                onClick={() => setSettings((s) => ({ ...s, skin: k.key }))}
                className={`cursor-pointer overflow-hidden rounded-lg border transition-colors ${
                  settings.skin === k.key
                    ? "border-[#6C63FF] bg-[#6C63FF]/10"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <SkinPreview skin={k.key} color={song.color} />
                <div className="pb-1 font-mono text-[10px] text-white/60">{k.label}</div>
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-1 border-t border-white/5 pt-4 font-['Nanum_Gothic',sans-serif] text-xs leading-relaxed text-white/45">
            <p>
              <b className="font-mono text-white/70">D F J K</b> 로 치고, 긴 노트는 끝까지 꾹
              누르세요.
            </p>
            <p>모바일은 레인을 터치하면 됩니다.</p>
            <p>
              <b className="font-mono text-white/70">← →</b> 곡 ·{" "}
              <b className="font-mono text-white/70">↑ ↓</b> 난이도
            </p>
            <p>
              플레이 중 <b className="font-mono text-white/70">↑ ↓</b> 노트 속도 ·{" "}
              <b className="font-mono text-white/70">Esc</b> 일시정지 (싱크·볼륨 조절)
            </p>
            <p>블루투스 이어폰은 지연이 있어서 싱크 맞추기를 권장해요.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── 싱크 맞추기 ─────────────────────────

function Calibrate({
  current,
  onApply,
  onCancel,
}: {
  current: number;
  onApply: (ms: number) => void;
  onCancel: () => void;
}) {
  const [state, setState] = useState<"idle" | "playing" | "done">("idle");
  const [diffs, setDiffs] = useState<number[]>([]);
  const run = useRef<{
    ctx: AudioContext;
    t0: number;
    times: number[];
    src: AudioBufferSourceNode;
  } | null>(null);

  const begin = async () => {
    const ctx = await audio();
    const { buffer, times } = await renderMetronome(16, 120);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    const t0 = ctx.currentTime + 0.1;
    src.start(t0);
    src.onended = () => setState("done");
    run.current = { ctx, t0, times, src };
    setDiffs([]);
    setState("playing");
  };

  useEffect(() => {
    const tap = () => {
      const r = run.current;
      if (!r) return;
      const t = r.ctx.currentTime - r.t0 - latencyOf(r.ctx);
      const near = r.times.reduce((a, b) => (Math.abs(b - t) < Math.abs(a - t) ? b : a));
      const d = t - near;
      if (Math.abs(d) < 0.25) setDiffs((l) => [...l, d * 1000]);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.code === "Escape" || e.code === "Tab") return;
      if (KEY_CODES.includes(e.code) || e.code === "Space") e.preventDefault();
      tap();
    };
    const onPointer = (e: PointerEvent) => {
      if ((e.target as HTMLElement)?.closest?.("button")) return;
      tap();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
      try {
        run.current?.src.stop();
      } catch {}
      run.current = null;
    };
  }, []);

  // 처음 2번은 박자 잡는 중이라 빼고, 튀는 값은 중앙값 근처만 평균
  const used = diffs.slice(2);
  const suggest = (() => {
    if (used.length < 4) return null;
    const sorted = [...used].sort((a, b) => a - b);
    const med = sorted[Math.floor(sorted.length / 2)];
    const near = used.filter((d) => Math.abs(d - med) < 60);
    return Math.round(near.reduce((s, d) => s + d, 0) / near.length);
  })();

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-[#1C1E24] p-6 text-center select-none">
      <p className="font-mono text-lg font-bold text-white">싱크 맞추기</p>
      <p className="mt-2 font-['Nanum_Gothic',sans-serif] text-sm leading-relaxed text-white/55">
        딸깍 소리가 16번 납니다. 화면은 보지 말고 소리에 맞춰 아무 키나(모바일은 화면을) 눌러주세요.
      </p>
      <div className="my-6 font-mono">
        <div className="text-4xl font-bold text-white">
          {suggest === null ? "—" : `${suggest > 0 ? "+" : ""}${suggest}ms`}
        </div>
        <div className="mt-1 text-xs text-white/40">
          입력 {diffs.length}회 · 현재 설정 {current > 0 ? "+" : ""}
          {current}ms
        </div>
      </div>
      <div className="flex justify-center gap-2">
        {state !== "playing" && (
          <button
            type="button"
            className="cursor-pointer rounded-full bg-[#6C63FF] px-5 py-2 font-mono text-sm text-white hover:bg-[#5b52f0]"
            onClick={begin}
          >
            {state === "idle" ? "시작" : "다시 측정"}
          </button>
        )}
        <button
          type="button"
          className={`${btn} px-5 py-2 text-sm`}
          disabled={suggest === null}
          onClick={() => suggest !== null && onApply(suggest)}
        >
          적용
        </button>
        <button type="button" className={`${btn} px-5 py-2 text-sm`} onClick={onCancel}>
          취소
        </button>
      </div>
    </div>
  );
}

/** 설정에서 스킨 고를 때 보이는 작은 미리보기 (레인 4개 + 노트) */
function SkinPreview({ skin, color }: { skin: Skin; color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const W = 96;
    const H = 72;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = W * dpr;
    c.height = H * dpr;
    const g = c.getContext("2d")!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = "#0E1015";
    g.fillRect(0, 0, W, H);
    const lw = W / 4;
    const cols = laneColors(skin, color);
    const judgeY = H - 12;
    g.fillStyle = "rgba(255,255,255,0.7)";
    g.fillRect(0, judgeY - 0.5, W, 1);
    // 작게 그리려고 전체를 줄여서 그림
    g.save();
    g.scale(0.5, 0.5);
    const ys = [22, 52, 36, 12];
    for (let l = 0; l < 4; l++) drawHead(g, skin, l * lw * 2, ys[l] * 2, lw * 2, cols[l]);
    g.restore();
  }, [skin, color]);
  return <canvas ref={ref} className="block h-auto w-full" />;
}
