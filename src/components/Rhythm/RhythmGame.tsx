"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SONGS, type Song } from "@/lib/rhythm/music";
import { DIFFICULTIES, makeChart, type Chart, type Difficulty } from "@/lib/rhythm/chart";
import { renderSong } from "@/lib/rhythm/synth";
import { splitSync } from "@/lib/rhythm/autosync";
import {
  drawHead,
  HIT_SOUNDS,
  laneColors,
  makeHitSound,
  SKINS,
  type HitSound,
  type Skin,
} from "@/lib/rhythm/fx";
import Stage, {
  COVERS_OPT,
  PLAY_HISTORY_KEY,
  type Cover,
  type LiveSettings,
  type Result,
} from "./Stage";
import SongCarousel from "./SongCarousel";
import HoldButton from "./HoldButton";
import { RankingBoard, SubmitRanking } from "./RankingBoard";
import GameHeader from "@/components/GameHeader";
import { RHYTHM_GUIDE } from "@/data/gameGuides";
import CustomMusic, { type CustomTrack } from "./CustomMusic";
import { makeAutoCharts } from "@/lib/rhythm/autochart";
import { displayBpm } from "@/lib/rhythm/analyze";

const SETTINGS_KEY = "rhythm_settings";
const BEST_KEY = "rhythm_best";

interface Settings {
  speed: number;
  /** 음악 싱크(ms): 노트 화면+판정을 같이 옮김 — 소리가 화면보다 늦게 나오는 만큼 (블루투스 등) */
  offset: number;
  /** 타격 싱크(ms): 판정만 옮김 — 노트를 보고 누르는 손·입력 지연. 자동 싱크가 치는 동안 다듬음 */
  judge: number;
  /** 자동 싱크: 치는 동안 타격 싱크를 알아서 맞추고, 손 지연으로 보기 큰 몫은 판 끝에 음악 싱크로 옮김 */
  autoSync: boolean;
  /** 타격음 볼륨 0~1 */
  hit: number;
  /** 음악 볼륨 0~1 */
  music: number;
  hitSound: HitSound;
  skin: Skin;
  /** 레인 배치: 미러(좌우 반전) / 랜덤(판마다 레인 섞기) */
  lanes: LaneMod;
  /** 노트 가림: 페이드 / 서든 */
  cover: Cover;
}
type LaneMod = "none" | "mirror" | "random";
const LANE_MODS: { key: LaneMod; label: string; desc: string }[] = [
  { key: "none", label: "기본", desc: "" },
  { key: "mirror", label: "미러", desc: "좌우 반전 — 같은 채보를 반대 손으로" },
  { key: "random", label: "랜덤", desc: "판마다 레인을 섞어요 — 외워서 치는 걸 막아줘요" },
];

/** 레인 옵션 적용: 미러는 3-lane, 랜덤은 판마다 다른 순열 (동시치기는 그대로 동시치기) */
function applyLaneMod(chart: Chart, mod: LaneMod, seed: number): Chart {
  if (mod === "none") return chart;
  let perm = [3, 2, 1, 0];
  if (mod === "random") {
    perm = [0, 1, 2, 3];
    let a = seed >>> 0 || 1;
    for (let i = 3; i > 0; i--) {
      a = (a * 1103515245 + 12345) & 0x7fffffff;
      const j = a % (i + 1);
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
  }
  return { ...chart, notes: chart.notes.map((n) => ({ ...n, lane: perm[n.lane] })) };
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
  if (!buffers.has(s.id))
    buffers.set(
      s.id,
      s.audio
        ? // 음원 곡: 파일을 받아서 디코딩 (신스 곡은 직접 렌더)
          fetch(s.audio)
            .then((r) => {
              if (!r.ok) throw new Error(`audio ${r.status}`);
              return r.arrayBuffer();
            })
            .then((ab) => audio().then((ctx) => ctx.decodeAudioData(ab)))
        : renderSong(s)
    );
  const p = buffers.get(s.id)!;
  p.catch(() => buffers.delete(s.id)); // 실패하면 다음에 다시 시도
  return p;
};

let sharedCtx: AudioContext | null = null;
async function audio() {
  if (!sharedCtx) sharedCtx = new AudioContext({ latencyHint: "interactive" });
  if (sharedCtx.state !== "running") await sharedCtx.resume();
  return sharedCtx;
}
const signed = (n: number) => `${n > 0 ? "+" : ""}${n}`;

const mod = (n: number, m: number) => ((n % m) + m) % m;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const btn =
  "cursor-pointer rounded-full border border-white/15 px-3 py-1.5 font-mono text-xs whitespace-nowrap text-white/70 transition-colors hover:border-[#6C63FF]/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-30";
const stepBtn =
  "h-8 w-8 shrink-0 cursor-pointer rounded-full border border-white/15 font-mono text-sm text-white/70 hover:border-[#6C63FF]/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-30";

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

type Screen = "select" | "play" | "result";

export default function RhythmGame() {
  const [screen, setScreen] = useState<Screen>("select");
  // 캐러셀 가상 위치 (곡 번호 = pos mod 곡 수)
  const [pos, setPos] = useState(0);
  const songIdx = mod(pos, SONGS.length);
  const [diffSel, setDiff] = useState<Difficulty>("normal");
  const [settings, setSettings] = useState<Settings>({
    speed: 3,
    offset: 0,
    judge: 0,
    autoSync: true,
    hit: 0.3,
    music: 1,
    hitSound: "thump",
    skin: "bar",
    lanes: "none",
    cover: "none",
  });
  const [best, setBest] = useState<Record<string, Best>>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [play, setPlay] = useState<{
    ctx: AudioContext;
    buffer: AudioBuffer;
    round: number;
    /** 랜덤 레인 배치용 (판마다 새로) */
    seed: number;
  } | null>(null);
  const [result, setResult] = useState<(Result & { newBest: boolean }) | null>(null);

  // 기본 곡 / 내 음악(직접 넣은 파일)
  const [mode, setMode] = useState<"builtin" | "custom">("builtin");
  const [track, setTrack] = useState<CustomTrack | null>(null);
  const customCharts = useMemo(
    () =>
      track
        ? (makeAutoCharts(
            track.analysis,
            DIFFICULTIES.map((d) => d.key)
          ) as Record<Difficulty, ReturnType<typeof makeChart>>)
        : null,
    [track]
  );
  const customSong = useMemo<Song | null>(() => {
    if (!track) return null;
    const a = track.analysis;
    return {
      id: `custom:${track.key}`,
      title: track.name,
      bpm: a.bpm,
      bpmLabel: displayBpm(a),
      bars: Math.ceil(a.duration / ((60 / a.bpm) * 4)),
      duration: a.duration,
      events: [],
      sections: [[0, ""]],
      sound: { lead: "sine", arp: "sine", delaySteps: 0 },
      color: "#22D3EE",
      desc: "내 음악",
      beatOffset: a.beats[0] ?? 0,
      custom: true,
    };
  }, [track]);
  const isCustom = mode === "custom" && !!customSong && !!customCharts;

  const builtinSong = SONGS[songIdx];

  // ── 곡 미리 듣기: 선택 화면에서 커서가 곡에 머물면 하이라이트 구간을 잠깐 틀어 줌 ──
  const previewRef = useRef<{ src: AudioBufferSourceNode; gain: GainNode; ctx: AudioContext } | null>(null);
  const stopPreview = useCallback((fade = 0.25) => {
    const p = previewRef.current;
    if (!p) return;
    previewRef.current = null;
    const t = p.ctx.currentTime;
    try {
      p.gain.gain.cancelScheduledValues(t);
      p.gain.gain.setValueAtTime(p.gain.gain.value, t);
      p.gain.gain.linearRampToValueAtTime(0, t + fade);
      p.src.stop(t + fade + 0.02);
    } catch {}
  }, []);
  const previewVol = settings.music;
  useEffect(() => {
    if (screen !== "select" || mode !== "builtin") return;
    let alive = true;
    // 커서가 멈춘 뒤 잠깐 있다가 (빠르게 넘길 땐 안 틀음)
    const timer = setTimeout(async () => {
      try {
        const ctx = await audio();
        if (ctx.state === "suspended") await ctx.resume().catch(() => {});
        if (ctx.state !== "running") return; // 아직 클릭·키 입력 전이면 소리 못 냄 → 다음 조작 때
        const buffer = await loadSong(builtinSong);
        if (!alive) return;
        stopPreview(0.1);
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const gain = ctx.createGain();
        src.connect(gain).connect(ctx.destination);
        // 하이라이트: 곡의 1/3 지점 근처 마디 시작부터 18초
        const beat = 60 / builtinSong.bpm;
        const barSec = beat * 4;
        const from = Math.max(0, Math.floor((buffer.duration / 3) / barSec) * barSec + (builtinSong.beatOffset ?? 0));
        const len = Math.min(18, Math.max(4, buffer.duration - from - 0.5));
        const t = ctx.currentTime;
        const v = previewVol * 0.55;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(v, t + 0.6);
        gain.gain.setValueAtTime(v, t + len - 1.2);
        gain.gain.linearRampToValueAtTime(0, t + len);
        src.start(t, from, len);
        previewRef.current = { src, gain, ctx };
        src.onended = () => {
          if (previewRef.current?.src === src) previewRef.current = null;
        };
      } catch {}
    }, 450);
    return () => {
      alive = false;
      clearTimeout(timer);
      stopPreview();
    };
  }, [screen, mode, builtinSong, previewVol, stopPreview]);
  const charts = useMemo(
    () =>
      Object.fromEntries(
        SONGS.map((s) => [
          s.id,
          s.charts ?? Object.fromEntries(DIFFICULTIES.map((d) => [d.key, makeChart(s, d.key)])),
        ])
      ),
    []
  );
  const song = isCustom ? customSong! : builtinSong;
  // 고를 수 있는 난이도: 내 음악은 전부, 내장곡은 채보가 있는 것만 (나이트메어는 일부 곡만)
  const diffs = useMemo(
    () => (isCustom ? DIFFICULTIES : DIFFICULTIES.filter((d) => !!charts[builtinSong.id][d.key])),
    [isCustom, charts, builtinSong.id]
  );
  // 나이트메어가 없는 곡으로 넘어오면 매우 어려움으로
  const diff: Difficulty = diffs.some((d) => d.key === diffSel)
    ? diffSel
    : diffs[diffs.length - 1].key;
  const chart = isCustom ? customCharts![diff] : charts[builtinSong.id][diff]!;

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
          autoSync: s.autoSync !== false,
          hit: typeof s.hit === "number" ? clamp(s.hit, 0, 1) : 0.3,
          music: typeof s.music === "number" ? clamp(s.music, 0, 1) : 1,
          hitSound: HIT_SOUNDS.some((h) => h.key === s.hitSound) ? s.hitSound : "thump",
          skin: SKINS.some((k) => k.key === s.skin) ? s.skin : "bar",
          lanes: LANE_MODS.some((k) => k.key === s.lanes) ? s.lanes : "none",
          cover: COVERS_OPT.some((k) => k.key === s.cover) ? s.cover : "none",
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
    loadSong(builtinSong).catch(() => {});
  }, [builtinSong]);

  const start = useCallback(async () => {
    if (loading) return;
    setErr("");
    setLoading(true);
    try {
      if (mode === "custom" && !isCustom) return;
      const ctx = await audio();
      const buffer = isCustom ? track!.buffer : await loadSong(song);
      setPlay((p) => ({ ctx, buffer, round: (p?.round ?? 0) + 1, seed: Math.random() * 1e9 }));
      setScreen("play");
    } catch (e) {
      console.error(e);
      setErr("이 브라우저에서 오디오를 재생할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [loading, song, mode, isCustom, track]);

  const finish = useCallback(
    (r: Result) => {
      const key = `${r.songId}:${r.diff}`;
      const prev = best[key];
      // 중간에 죽은 판은 기록에 안 남김
      const newBest = !r.failed && (!prev || r.score > prev.score);
      if (!r.failed && (newBest || (r.fc && !prev?.fc) || (r.ap && !prev?.ap))) {
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
      // 늘 비슷하게 늦거나 빠르면(steady) 그만큼 타격 싱크를 옮기자고 제안 — 한 번에 최대 ±120ms
      // (죽은 판은 타이밍이 엉망이라 제안 안 함)
      // 자동 싱크: 타격 싱크가 손 지연으로 보기 큰 범위를 넘었으면 넘는 몫을 음악 싱크로 (합은 그대로라 판정은 안 바뀜)
      setSettings((s) => {
        if (!s.autoSync) return s;
        const sp = splitSync(s.judge, s.offset);
        return sp.judge === s.judge ? s : { ...s, ...sp };
      });
      setResult({ ...r, newBest });
      setScreen("result");
    },
    [best]
  );

  // 플레이 화면 동안 같은 주소로 기록을 하나 쌓아 둠 → 모바일 뒤로가기가 페이지를 떠나지 않고
  // Stage의 popstate(일시정지)로 감. 화면을 나갈 때 그 기록이 아직 맨 위면 back()으로 소비
  useEffect(() => {
    if (screen !== "play") return;
    // StrictMode(dev)에서 mount→cleanup→mount가 바로 일어날 때 꼬이지 않게 한 틱 미룸
    const timer = setTimeout(() => {
      window.history.pushState({ ...window.history.state, [PLAY_HISTORY_KEY]: true }, "");
    }, 0);
    return () => {
      clearTimeout(timer);
      if (window.history.state?.[PLAY_HISTORY_KEY]) window.history.back();
    };
  }, [screen]);

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
        if (mode === "custom" && (e.code === "ArrowLeft" || e.code === "ArrowRight")) return;
        const di = diffs.findIndex((d) => d.key === diff);
        if (e.code === "ArrowLeft" || e.code === "ArrowRight") {
          e.preventDefault();
          setPos((p) => p + (e.code === "ArrowLeft" ? -1 : 1));
        } else if (e.code === "ArrowUp" || e.code === "ArrowDown") {
          e.preventDefault();
          setDiff(diffs[clamp(di + (e.code === "ArrowUp" ? -1 : 1), 0, diffs.length - 1)].key);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, start, diff, diffs, mode]);

  if (screen === "play" && play) {
    return (
      <Stage
        key={play.round}
        song={song}
        diff={diff}
        chart={applyLaneMod(chart, settings.lanes, play.seed)}
        cover={settings.cover}
        buffer={play.buffer}
        ctx={play.ctx}
        speed={settings.speed}
        offset={settings.offset}
        judgeOffset={settings.judge}
        autoSync={settings.autoSync}
        hitVolume={settings.hit}
        musicVolume={settings.music}
        onSettings={onLiveSettings}
        hitSound={settings.hitSound}
        skin={settings.skin}
        onFinish={finish}
        onQuit={() => setScreen("select")}
        onRestart={() =>
          setPlay((p) => p && { ...p, round: p.round + 1, seed: Math.random() * 1e9 })
        }
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
            {result.failed ? (
              <span className="text-[#F43F5E]">FAILED · HP가 바닥났어요</span>
            ) : result.ap ? (
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
          {settings.autoSync && result.autoJudge !== 0 && (
            <p className="mt-3 w-full rounded-xl border border-[#6C63FF]/30 bg-[#6C63FF]/10 px-3 py-2 font-['Nanum_Gothic',sans-serif] text-xs leading-relaxed text-white/75">
              치는 동안 싱크를 자동으로 <b className="text-white">{signed(result.autoJudge)}ms</b>{" "}
              맞췄어요 · 지금 음악 {signed(settings.offset)} / 타격 {signed(settings.judge)}ms
            </p>
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
        {song.custom ? (
          <div className="rounded-2xl border border-white/10 bg-[#1C1E24] p-6 text-center font-['Nanum_Gothic',sans-serif] text-sm leading-relaxed text-white/50">
            직접 넣은 곡은 랭킹에 올라가지 않아요.
            <br />
            최고 기록은 이 브라우저에만 저장돼요.
          </div>
        ) : result.failed ? (
          <div className="rounded-2xl border border-white/10 bg-[#1C1E24] p-6 text-center font-['Nanum_Gothic',sans-serif] text-sm text-white/50">
            끝까지 살아남아야 랭킹에 올릴 수 있어요.
          </div>
        ) : (
          <SubmitRanking result={result} label={`${song.title} ${d.label}`} />
        )}
      </div>
    );
  }

  // ─── 곡 선택 ───
  const diffLabel = DIFFICULTIES.find((x) => x.key === diff)!.label;
  return (
    <div>
      <GameHeader
        icon="🎹"
        title="리듬게임"
        en="Rhythm"
        accent="#A78BFA"
        desc="DFJK 4키 리듬게임 · 내 mp3도 자동 채보"
        guide={RHYTHM_GUIDE}
      />
      <div className="mx-auto mb-6 flex w-fit overflow-hidden rounded-full border border-white/10 font-['Nanum_Gothic',sans-serif] text-sm">
        {(
          [
            ["builtin", "기본 곡"],
            ["custom", "🎵 내 음악으로 플레이"],
          ] as const
        ).map(([k, t]) => (
          <button
            key={k}
            type="button"
            onClick={() => setMode(k)}
            className={`cursor-pointer px-5 py-2 transition-colors ${
              mode === k ? "bg-[#6C63FF] text-white" : "text-white/55 hover:text-white/85"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {mode === "builtin" && (
        <SongCarousel songs={SONGS} pos={pos} onMove={(dlt) => setPos((p) => p + dlt)} />
      )}
      <div
        className={`grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] ${mode === "builtin" ? "mt-8" : ""}`}
      >
        {mode === "custom" ? (
          <div className="min-w-0">
            <CustomMusic
              track={track}
              onTrack={setTrack}
              charts={customCharts}
              diff={diff}
              onDiff={setDiff}
              best={best}
              getCtx={audio}
              onStart={start}
              starting={loading}
            />
            {err && <p className="mt-2 text-center font-mono text-xs text-red-300">{err}</p>}
          </div>
        ) : (
          <div className="min-w-0">
            <div
              className={`grid grid-cols-2 gap-2 ${diffs.length > 4 ? "sm:grid-cols-3" : "sm:grid-cols-4"}`}
            >
              {diffs.map((d) => {
                const c = charts[song.id][d.key]!;
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
        )}

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

          <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-[#6C63FF]/25 bg-[#6C63FF]/[0.08] px-3 py-2.5">
            <div className="min-w-0">
              <div className="font-mono text-xs font-bold text-white">자동 싱크</div>
              <div className="mt-0.5 font-['Nanum_Gothic',sans-serif] text-[11px] leading-snug text-white/50">
                {settings.autoSync
                  ? "치는 동안 타이밍을 보고 알아서 맞춰요. 그냥 플레이하면 돼요."
                  : "꺼짐 · 아래 두 값을 직접 맞춰요."}
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.autoSync}
              aria-label="자동 싱크"
              onClick={() => setSettings((s) => ({ ...s, autoSync: !s.autoSync }))}
              className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                settings.autoSync ? "bg-[#6C63FF]" : "bg-white/15"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-[left] ${
                  settings.autoSync ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          <label className="mt-3 block font-mono text-xs text-white/50">
            음악 싱크 (ms) · 소리가 늦게 나오는 만큼 +
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <HoldButton
              className={stepBtn}
              disabled={settings.autoSync}
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
              disabled={settings.autoSync}
              onChange={(e) => setSettings((s) => ({ ...s, offset: Number(e.target.value) }))}
              className="min-w-0 flex-1 accent-[#6C63FF] disabled:opacity-40"
            />
            <HoldButton
              className={stepBtn}
              disabled={settings.autoSync}
              onStep={() => setSettings((s) => ({ ...s, offset: clamp(s.offset + 1, -400, 400) }))}
            >
              +
            </HoldButton>
            <span className="w-10 text-right font-mono text-sm text-white">
              {signed(settings.offset)}
            </span>
          </div>
          <label className="mt-3 block font-mono text-xs text-white/50">
            타격 싱크 (ms) · 늘 늦게 치면 +
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <HoldButton
              className={stepBtn}
              disabled={settings.autoSync}
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
              disabled={settings.autoSync}
              onChange={(e) => setSettings((s) => ({ ...s, judge: Number(e.target.value) }))}
              className="min-w-0 flex-1 accent-[#6C63FF] disabled:opacity-40"
            />
            <HoldButton
              className={stepBtn}
              disabled={settings.autoSync}
              onStep={() => setSettings((s) => ({ ...s, judge: clamp(s.judge + 1, -400, 400) }))}
            >
              +
            </HoldButton>
            <span className="w-10 text-right font-mono text-sm text-white">
              {signed(settings.judge)}
            </span>
          </div>
          <div className="mt-2 flex gap-1.5">
            <button
              type="button"
              className={btn}
              disabled={settings.autoSync || (settings.offset === 0 && settings.judge === 0)}
              onClick={() => setSettings((s) => ({ ...s, offset: 0, judge: 0 }))}
            >
              초기화
            </button>
          </div>

          <p className="mt-2 font-['Nanum_Gothic',sans-serif] text-[11px] leading-relaxed text-white/35">
            {settings.autoSync ? (
              <>
                자동 싱크가 켜져 있으면 두 값은 알아서 채워져요. 블루투스처럼 소리가 많이 늦는 것도
                몇 마디 안에 따라잡아요. 직접 만지려면 자동 싱크를 끄세요.
              </>
            ) : (
              <>
                음악 싱크: 소리가 화면보다 늦게 들리면 +. 타격 싱크: 늘 늦게 친다 싶으면 +. 일시정지
                화면에서 지금까지 평균을 볼 수 있어요.
              </>
            )}
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
                  setSettings((s) => ({ ...s, hitSound: h.key, hit: s.hit || 0.3 }));
                  previewHit(h.key, settings.hit || 0.3);
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

          <label className="mt-4 block font-mono text-xs text-white/50">레인 배치</label>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {LANE_MODS.map((m) => (
              <button
                key={m.key}
                type="button"
                title={m.desc}
                className={seg(settings.lanes === m.key)}
                onClick={() => setSettings((s) => ({ ...s, lanes: m.key }))}
              >
                {m.label}
              </button>
            ))}
          </div>
          {settings.lanes !== "none" && (
            <p className="mt-1 font-['Nanum_Gothic',sans-serif] text-[10px] text-white/30">
              {LANE_MODS.find((m) => m.key === settings.lanes)!.desc}
            </p>
          )}

          <label className="mt-4 block font-mono text-xs text-white/50">노트 가림</label>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {COVERS_OPT.map((m) => (
              <button
                key={m.key}
                type="button"
                title={m.desc}
                className={seg(settings.cover === m.key)}
                onClick={() => setSettings((s) => ({ ...s, cover: m.key }))}
              >
                {m.label}
              </button>
            ))}
          </div>
          {settings.cover !== "none" && (
            <p className="mt-1 font-['Nanum_Gothic',sans-serif] text-[10px] text-white/30">
              {COVERS_OPT.find((m) => m.key === settings.cover)!.desc}
            </p>
          )}

          <div className="mt-5 space-y-1 border-t border-white/5 pt-4 font-['Nanum_Gothic',sans-serif] text-xs leading-relaxed text-white/45">
            <p>
              <b className="font-mono text-white/70">D F J K</b> 로 치고, 긴 노트는 끝까지 꾹
              누르세요. 누르는 동안 틱마다 점수가 오르고, 일찍 떼면 뗀 만큼 깎여요.
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
