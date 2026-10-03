"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SONGS, type Song } from "@/lib/rhythm/music";
import {
  DIFFICULTIES,
  finishChart,
  makeChart,
  type Chart,
  type Difficulty,
} from "@/lib/rhythm/chart";
import { renderMetronome, renderSong } from "@/lib/rhythm/synth";
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
  CAL_SKIP,
  COVERS_OPT,
  visibleSec,
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
const latencyOf = (ctx: AudioContext) =>
  ((ctx as AudioContext & { outputLatency?: number }).outputLatency ?? 0) + (ctx.baseLatency ?? 0);

/** 이보다 작은 쏠림은 그냥 둠 (PERFECT 판정 폭이 ±33ms라 10ms 안쪽은 체감 차이가 거의 없음) */
const AUTO_SYNC_MIN = 10;
const signed = (n: number) => `${n > 0 ? "+" : ""}${n}`;

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

type Screen = "select" | "play" | "result" | "calibrate" | "calplay";

// ───────── 싱크 맞추기 ─────────
const CAL_BEATS = 32;
const CAL_BPM = 100;
const CAL_MIN = 8;
/** 싱크 맞추기 단계: 노트 속도 → 타격 싱크(노트만 보고) → 음악 싱크(소리만 듣고) */
type CalStep = "speed" | "visual" | "audio";

/** 실제 게임 화면에서 쓰는 싱크 맞추기용 곡: 딸깍 소리 32번, D D D D F F F F J J J J K K K K × 2 */
let calCache: Promise<{ buffer: AudioBuffer; song: Song; chart: Chart }> | null = null;
function loadCalibration() {
  calCache ??= renderMetronome(CAL_BEATS, CAL_BPM).then(({ buffer, times }) => ({
    buffer,
    chart: finishChart(times.map((t, i) => ({ t, lane: Math.floor(i / 4) % 4 }))),
    song: {
      id: "calibrate",
      title: "싱크 맞추기",
      bpm: CAL_BPM,
      bars: CAL_BEATS / 4 + 1,
      duration: buffer.duration,
      events: [],
      sections: [[0, ""]],
      sound: { lead: "sine", arp: "sine", delaySteps: 0 },
      color: "#6C63FF",
      desc: "",
      beatOffset: times[0],
    },
  }));
  return calCache;
}

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
  const [result, setResult] = useState<
    | (Result & {
        newBest: boolean;
        /** 이번 판 타이밍으로 제안하는 타격 싱크 (물어보고 적용) */
        autoSync: { from: number; to: number } | null;
      })
    | null
  >(null);
  const [syncDecision, setSyncDecision] = useState<"yes" | "no" | null>(null);
  // 싱크 맞추기 2단계(타격 싱크): 실제 게임 화면을 음악 없이 돌리고, 끝나면 누른 타이밍을 받음
  const [cal, setCal] = useState<{
    ctx: AudioContext;
    buffer: AudioBuffer;
    song: Song;
    chart: Chart;
    round: number;
  } | null>(null);
  const [calTaps, setCalTaps] = useState<number[] | null>(null);
  const [calStep, setCalStep] = useState<CalStep>("speed");
  const startVisualCal = async () => {
    try {
      const ctx = await audio();
      const c = await loadCalibration();
      setCal((p) => ({ ctx, ...c, round: (p?.round ?? 0) + 1 }));
      setScreen("calplay");
    } catch {
      setErr("이 브라우저에서 오디오를 재생할 수 없습니다.");
    }
  };
  const leaveCalibration = () => {
    setCalTaps(null);
    setCalStep("speed");
    setScreen("select");
  };

  // 기본 곡 / 내 음악(직접 넣은 파일)
  const [mode, setMode] = useState<"builtin" | "custom">("builtin");
  const [track, setTrack] = useState<CustomTrack | null>(null);
  const customCharts = useMemo(
    () =>
      track
        ? (makeAutoCharts(
            track.analysis,
            DIFFICULTIES.map((d) => d.key),
            track.shiftMs
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
  // 고를 수 있는 난이도: 내 음악은 전부, 내장곡은 채보가 있는 것만 (나이트메어는 보스곡만)
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
      // 자동 싱크가 켜져 있으면 치는 동안 이미 맞췄으니 묻지 않음
      let autoSync: { from: number; to: number } | null = null;
      if (
        !settings.autoSync &&
        !r.failed &&
        r.steady &&
        r.avgMs !== null &&
        Math.abs(r.avgMs) >= AUTO_SYNC_MIN
      ) {
        const from = settings.judge;
        const to = clamp(from + clamp(r.avgMs, -120, 120), -400, 400);
        if (to !== from) autoSync = { from, to };
      }
      // 자동 싱크: 타격 싱크가 손 지연으로 보기 큰 범위를 넘었으면 넘는 몫을 음악 싱크로 (합은 그대로라 판정은 안 바뀜)
      setSettings((s) => {
        if (!s.autoSync) return s;
        const sp = splitSync(s.judge, s.offset);
        return sp.judge === s.judge ? s : { ...s, ...sp };
      });
      setResult({ ...r, newBest, autoSync });
      setSyncDecision(null);
      setScreen("result");
    },
    [best, settings.judge, settings.autoSync]
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

  if (screen === "calplay" && cal) {
    return (
      <Stage
        key={`cal${cal.round}`}
        calibration
        song={cal.song}
        diff="easy"
        chart={cal.chart}
        buffer={cal.buffer}
        ctx={cal.ctx}
        speed={settings.speed}
        offset={0}
        judgeOffset={0}
        hitVolume={settings.hit}
        musicVolume={0}
        onSettings={({ speed }) => speed !== undefined && onLiveSettings({ speed })}
        hitSound={settings.hitSound}
        skin={settings.skin}
        cover="none"
        onFinish={(r) => {
          setCalTaps(r.taps ?? []);
          setScreen("calibrate");
        }}
        onQuit={() => setScreen("calibrate")}
        onRestart={() => setCal((p) => p && { ...p, round: p.round + 1 })}
      />
    );
  }

  if (screen === "calibrate") {
    return (
      <Calibrate
        settings={settings}
        onChange={(p) => setSettings((s) => ({ ...s, ...p }))}
        skin={settings.skin}
        step={calStep}
        onStep={setCalStep}
        visualTaps={calTaps}
        onStartVisual={startVisualCal}
        onDone={leaveCalibration}
        onCancel={leaveCalibration}
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
          {result.autoSync && (
            <div className="mt-3 w-full rounded-xl border border-[#6C63FF]/30 bg-[#6C63FF]/10 px-3 py-2.5 text-left font-['Nanum_Gothic',sans-serif] text-xs leading-relaxed text-white/75">
              {syncDecision === "yes" ? (
                <>타격 싱크를 {signed(result.autoSync.to)}ms로 맞췄어요.</>
              ) : syncDecision === "no" ? (
                <>타격 싱크를 그대로({signed(result.autoSync.from)}ms) 뒀어요.</>
              ) : (
                <>
                  이번 판은 대부분 <b className="text-white">{signed(result.avgMs!)}ms</b>{" "}
                  {result.avgMs! > 0 ? "늦게" : "빠르게"} 쳤어요. 타격 싱크를{" "}
                  <b className="text-white">
                    {signed(result.autoSync.from)} → {signed(result.autoSync.to)}ms
                  </b>
                  로 맞출까요?
                  <span className="mt-2 flex gap-1.5">
                    <button
                      type="button"
                      className="cursor-pointer rounded-full bg-[#6C63FF] px-3 py-1 font-mono text-[11px] font-bold text-white hover:bg-[#5b52f0]"
                      onClick={() => {
                        setSettings((s) => ({ ...s, judge: result.autoSync!.to }));
                        setSyncDecision("yes");
                      }}
                    >
                      맞추기
                    </button>
                    <button
                      type="button"
                      className={`${btn} px-3 py-1 text-[11px]`}
                      onClick={() => setSyncDecision("no")}
                    >
                      그대로 두기
                    </button>
                  </span>
                </>
              )}
            </div>
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
                  : "꺼짐 · 아래 값을 직접 맞추거나 '수동으로 맞추기'를 써요."}
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
              {signed(settings.offset)}
            </span>
          </div>
          <label className="mt-3 block font-mono text-xs text-white/50">
            타격 싱크 (ms) · 늘 늦게 치면 +
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
              {signed(settings.judge)}
            </span>
          </div>
          <div className="mt-2 flex gap-1.5">
            <button type="button" className={btn} onClick={() => setScreen("calibrate")}>
              수동으로 맞추기
            </button>
            <button
              type="button"
              className={btn}
              disabled={settings.offset === 0 && settings.judge === 0}
              onClick={() => setSettings((s) => ({ ...s, offset: 0, judge: 0 }))}
            >
              초기화
            </button>
          </div>

          <p className="mt-2 font-['Nanum_Gothic',sans-serif] text-[11px] leading-relaxed text-white/35">
            {settings.autoSync ? (
              <>
                자동 싱크가 켜져 있으면 두 값은 알아서 채워져요. 블루투스처럼 소리가 많이 늦는 것도
                몇 마디 안에 따라잡아요.
              </>
            ) : (
              <>
                &apos;수동으로 맞추기&apos;에서 두 값을 차례로 맞춰요. 타격 싱크는 한 판이 끝날
                때마다 친 타이밍을 보고 맞출지 물어봐요.
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

// ───────────────────────── 싱크 맞추기 ─────────────────────────

const medianOf = (list: number[]) => {
  const used = list.filter((d) => Math.abs(d) <= 150);
  return used.length >= CAL_MIN
    ? { med: [...used].sort((a, b) => a - b)[Math.floor(used.length / 2)], used }
    : { med: null, used };
};

/** 입력 분포 막대: 가운데 선이 딱 맞은 것 */
function TapStrip({ taps }: { taps: number[] }) {
  return (
    <div className="relative mx-auto mt-4 h-7 w-full max-w-sm rounded bg-white/5">
      <div className="absolute inset-y-0 left-1/2 w-px bg-white/40" />
      {taps.map((d, i) => (
        <div
          key={i}
          className="absolute top-1.5 h-4 w-0.5 rounded bg-[#7DF9FF]/70"
          style={{ left: `${50 + (Math.max(-150, Math.min(150, d)) / 150) * 50}%` }}
        />
      ))}
      <span className="absolute -bottom-4 left-0 text-[9px] text-white/30">빠름</span>
      <span className="absolute right-0 -bottom-4 text-[9px] text-white/30">늦음</span>
    </div>
  );
}

/** 1단계: 노트 속도 미리보기 — 고른 속도로 노트가 계속 내려옴 (게임과 같은 2.4초/속도 공식) */
function SpeedPreview({
  speed,
  skin,
  large = false,
}: {
  speed: number;
  skin: Skin;
  /** PC: 실제 플레이 기어와 같은 크기(폭 440) */
  large?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const speedRef = useRef(speed);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    // 큰 쪽은 Stage와 같은 공식 (기어 폭 440, 높이는 화면에 맞춰 420~760)
    const W = large ? 440 : 240;
    const H = large ? Math.max(420, Math.min(window.innerHeight - 170, 760)) : 300;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = W * dpr;
    c.height = H * dpr;
    c.style.width = `${W}px`;
    c.style.height = `${H}px`;
    const g = c.getContext("2d")!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const lw = W / 4;
    const judgeY = large ? H - 92 : H - 36;
    const cols = laneColors(skin, "#6C63FF");
    // 100BPM 8분음표마다 노트, 레인은 0 1 2 3 2 1 반복
    const gap = 0.3;
    const laneOf = (k: number) => [0, 1, 2, 3, 2, 1][((k % 6) + 6) % 6];
    const t0 = performance.now() / 1000;
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const t = performance.now() / 1000 - t0;
      const vis = visibleSec(speedRef.current);
      g.fillStyle = "#0E1015";
      g.fillRect(0, 0, W, H);
      g.fillStyle = "rgba(255,255,255,0.05)";
      for (let l = 1; l < 4; l++) g.fillRect(l * lw, 0, 1, H);
      g.fillStyle = "rgba(255,255,255,0.8)";
      g.fillRect(0, judgeY - 1, W, 2);
      const first = Math.floor(t / gap);
      for (let k = first; k * gap < t + vis + 0.2; k++) {
        const y = judgeY - ((k * gap - t) / vis) * judgeY;
        if (y > judgeY + 10) continue;
        drawHead(g, skin, laneOf(k) * lw, y, lw, cols[laneOf(k)]);
      }
      if (large) {
        // 키 바닥 (Stage와 같은 모양)
        g.fillStyle = "#0B0C10";
        g.fillRect(0, judgeY + 2, W, H - judgeY - 2);
        for (let l = 0; l < 4; l++) {
          g.fillStyle = "#15171D";
          g.fillRect(l * lw + 3, judgeY + 14, lw - 6, H - judgeY - 20);
        }
      }
      g.font = `${large ? 16 : 11}px monospace`;
      g.textAlign = "center";
      g.fillStyle = "rgba(255,255,255,0.35)";
      ["D", "F", "J", "K"].forEach((k, l) =>
        g.fillText(k, l * lw + lw / 2, large ? judgeY + 52 : H - 14)
      );
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [skin, large]);
  return <canvas ref={ref} className="mx-auto block rounded-xl border border-white/10" />;
}

/**
 * 3단계: 소리와 노트 맞추기 — 딸깍 소리가 반복되고, 같은 시각에 노트가 판정선에 닿게 그린다.
 * 화면은 게임과 같은 공식(오디오 시계 − 출력 지연 − 음악 싱크)으로 그리므로, 소리와 노트가
 * 맞아 보이는 음악 싱크 값이 곧 게임에서 맞는 값. 손으로 치지 않으니 반응 속도 버릇이 섞이지 않음.
 */
function AvSyncCal({
  offset,
  onChange,
  speed,
  skin,
}: {
  offset: number;
  onChange: (ms: number) => void;
  speed: number;
  skin: Skin;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const offsetRef = useRef(offset);
  const speedRef = useRef(speed);
  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let raf = 0;
    let src: AudioBufferSourceNode | null = null;
    let alive = true;
    (async () => {
      const ctx = await audio();
      const { buffer, times } = await renderMetronome(16, CAL_BPM);
      if (!alive) return;
      const dur = buffer.duration;
      src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      src.connect(ctx.destination);
      const t0 = ctx.currentTime + 0.1;
      src.start(t0);
      setPlaying(true);

      const W = 240;
      const H = 300;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = W * dpr;
      c.height = H * dpr;
      c.style.width = `${W}px`;
      c.style.height = `${H}px`;
      const g = c.getContext("2d")!;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const lw = W / 4;
      const judgeY = H - 36;
      const cols = laneColors(skin, "#6C63FF");
      const laneOf = (k: number) => ((k % 4) + 4) % 4;
      const draw = () => {
        raf = requestAnimationFrame(draw);
        // 게임의 now()와 같은 공식
        const now = ctx.currentTime - t0 - latencyOf(ctx) - offsetRef.current / 1000;
        const vis = visibleSec(speedRef.current);
        g.fillStyle = "#0E1015";
        g.fillRect(0, 0, W, H);
        g.fillStyle = "rgba(255,255,255,0.05)";
        for (let l = 1; l < 4; l++) g.fillRect(l * lw, 0, 1, H);
        // 소리 나는 순간 판정선이 번쩍 (소리 시각 = 화면 시각이 맞을 때 노트가 선에 닿는 순간)
        let flash = 0;
        const loopT = ((now % dur) + dur) % dur;
        for (const ti of times) {
          const d = Math.min(
            Math.abs(loopT - ti),
            Math.abs(loopT - ti - dur),
            Math.abs(loopT - ti + dur)
          );
          if (d < 0.08) flash = Math.max(flash, 1 - d / 0.08);
        }
        g.fillStyle = `rgba(255,255,255,${0.6 + 0.4 * flash})`;
        g.fillRect(0, judgeY - 1 - flash * 2, W, 2 + flash * 4);
        // 노트: 소리 시각마다 (루프라서 앞뒤 한 바퀴씩)
        for (let k = -1; k <= 1; k++)
          times.forEach((ti, i) => {
            const t = ti + k * dur;
            if (t < now - 0.3 || t > now + vis + 0.2) return;
            const y = judgeY - ((t - now) / vis) * judgeY;
            drawHead(g, skin, laneOf(i) * lw, y, lw, cols[laneOf(i)]);
          });
        g.font = "11px monospace";
        g.textAlign = "center";
        g.fillStyle = "rgba(255,255,255,0.35)";
        ["D", "F", "J", "K"].forEach((kname, l) => g.fillText(kname, l * lw + lw / 2, H - 14));
      };
      draw();
    })();
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      try {
        src?.stop();
      } catch {}
    };
  }, [skin]);

  const set = (v: number) => onChange(clamp(Math.round(v), -400, 400));
  return (
    <div className="mt-5 flex flex-col items-center gap-4">
      <canvas ref={ref} className="rounded-xl border border-white/10" />
      <div className="flex items-center gap-2">
        <button type="button" className={stepBtn} onClick={() => set(offset - 10)}>
          −10
        </button>
        <HoldButton className={stepBtn} onStep={() => set(offsetRef.current - 1)}>
          −
        </HoldButton>
        <span className="w-24 text-center font-mono text-2xl font-bold text-white tabular-nums">
          {signed(offset)}
          <span className="text-sm text-white/40">ms</span>
        </span>
        <HoldButton className={stepBtn} onStep={() => set(offsetRef.current + 1)}>
          +
        </HoldButton>
        <button type="button" className={stepBtn} onClick={() => set(offset + 10)}>
          +10
        </button>
      </div>
      <p className="font-['Nanum_Gothic',sans-serif] text-xs text-white/40">
        {playing ? "소리가 노트보다 늦게 들리면 + · 먼저 들리면 −" : "소리 준비 중…"}
      </p>
    </div>
  );
}

/**
 * 싱크 맞추기 — 노트 속도 → 타격 싱크 → 음악 싱크 순서.
 *  2단계는 실제 게임 화면(Stage calibration 모드)에서 음악 없이 노트만 보고 침 → 눈·손·입력 지연
 *  3단계는 노트 없이 딸깍 소리만 듣고 침 → 2단계 값을 뺀 나머지가 소리 지연
 */
function Calibrate({
  settings,
  onChange,
  skin,
  step,
  onStep,
  visualTaps,
  onStartVisual,
  onDone,
  onCancel,
}: {
  settings: Settings;
  onChange: (p: Partial<Settings>) => void;
  skin: Skin;
  step: CalStep;
  onStep: (s: CalStep) => void;
  visualTaps: number[] | null;
  onStartVisual: () => void;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { speed, offset, judge } = settings;
  /** 2단계: 이 값으로 타격 싱크를 적용했음 */
  const [judgeApplied, setJudgeApplied] = useState(false);

  const vis = medianOf(visualTaps ?? []);
  const judgeSuggest = vis.med === null ? null : clamp(vis.med, -400, 400);
  // 들린 시각 기준 지연 − 손 지연 = 소리 지연. 현재 음악 싱크와 무관하게 절대값으로 나옴

  const primary =
    "cursor-pointer rounded-full bg-[#6C63FF] px-5 py-2 font-mono text-sm font-bold text-white hover:bg-[#5b52f0] disabled:cursor-not-allowed disabled:opacity-40";
  const STEPS: [CalStep, string][] = [
    ["speed", "1 노트 속도"],
    ["visual", "2 타격 싱크"],
    ["audio", "3 음악 싱크"],
  ];

  const stepsBar = (
    <div className="mb-5 flex flex-wrap items-center justify-center gap-2 font-mono text-xs">
      {STEPS.map(([k, t], i) => (
        <span key={k} className="flex items-center gap-2">
          {i > 0 && <span className="text-white/20">→</span>}
          <span
            className={`rounded-full px-3 py-1 ${
              step === k ? "bg-[#6C63FF] text-white" : "bg-white/5 text-white/40"
            }`}
          >
            {t}
          </span>
        </span>
      ))}
    </div>
  );

  // 1단계는 PC에서 실제 플레이 크기 미리보기를 오른쪽에 따로 둠 (모바일은 작은 미리보기)
  if (step === "speed")
    return (
      <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-[#1C1E24] p-6 text-center select-none sm:p-8">
        {stepsBar}
        <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_440px] md:text-left">
          <div>
            <p className="font-mono text-lg font-bold text-white">1단계 · 노트 속도</p>
            <p className="mt-3 font-['Nanum_Gothic',sans-serif] text-sm leading-relaxed text-white/60">
              노트가 내려오는 속도를 먼저 정해요. 속도가 바뀌면 보이는 타이밍도 달라져서, 싱크는 이
              속도 기준으로 맞춰요. <b className="text-white/85">눈으로 따라가기 편한 속도</b>로
              고르세요 (보통 x3~x4).
            </p>
            <div className="my-6 md:hidden">
              <SpeedPreview speed={speed} skin={skin} />
            </div>
            <div className="mx-auto mt-6 flex max-w-sm items-center gap-2 md:mx-0">
              <button
                type="button"
                className={stepBtn}
                onClick={() =>
                  onChange({ speed: clamp(Math.round((speed - 0.5) * 10) / 10, 1, 8) })
                }
              >
                −
              </button>
              <input
                type="range"
                min={1}
                max={8}
                step={0.1}
                value={speed}
                onChange={(e) => onChange({ speed: Number(e.target.value) })}
                aria-label="노트 속도"
                className="min-w-0 flex-1 accent-[#6C63FF]"
              />
              <button
                type="button"
                className={stepBtn}
                onClick={() =>
                  onChange({ speed: clamp(Math.round((speed + 0.5) * 10) / 10, 1, 8) })
                }
              >
                +
              </button>
              <span className="w-10 text-right font-mono text-sm text-white">
                x{speed.toFixed(1)}
              </span>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2 md:justify-start">
              <button type="button" className={primary} onClick={() => onStep("visual")}>
                이 속도로 다음 →
              </button>
              <button type="button" className={`${btn} px-5 py-2 text-sm`} onClick={onCancel}>
                취소
              </button>
            </div>
          </div>
          <div className="hidden md:block">
            <SpeedPreview speed={speed} skin={skin} large />
          </div>
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-[#1C1E24] p-6 text-center select-none sm:p-8">
      {stepsBar}

      {step === "visual" && (
        <>
          <p className="font-mono text-lg font-bold text-white">2단계 · 화면만 보고 치기</p>
          <p className="mt-3 font-['Nanum_Gothic',sans-serif] text-sm leading-relaxed text-white/60">
            <b className="text-white/85">음악 없이</b> 실제 게임 화면에서 노트만 내려와요. 노트가{" "}
            <b className="text-white/85">판정선에 닿는 순간</b> 그 키를 누르세요. 노트 {CAL_BEATS}
            개가 D D D D · F F F F · J J J J · K K K K 순서로 두 번 내려와요.
          </p>
          <p className="mt-2 font-['Nanum_Gothic',sans-serif] text-xs text-white/35">
            처음 {CAL_SKIP}개는 박자 잡는 용도라 빼고 계산해요 · HP가 0이 돼도 안 끝나요
          </p>
          {visualTaps && (
            <div className="my-6 font-mono">
              {judgeSuggest === null ? (
                <p className="font-['Nanum_Gothic',sans-serif] text-sm text-amber-200/80">
                  입력이 너무 적어요 ({vis.used.length}개). 노트마다 눌러주세요.
                </p>
              ) : (
                <>
                  <div className="text-xs text-white/40">추천 타격 싱크</div>
                  <div className="text-5xl font-bold text-white">{signed(judgeSuggest)}ms</div>
                  <div className="mt-1 text-xs text-white/40">
                    노트보다 평균 {signed(vis.med!)}ms {vis.med! >= 0 ? "늦게" : "빠르게"} 쳤어요 ·
                    입력 {vis.used.length}개
                  </div>
                  {judgeApplied && (
                    <div className="mt-2 font-['Nanum_Gothic',sans-serif] text-sm text-emerald-300">
                      타격 싱크 {signed(judge)}ms 적용됨
                    </div>
                  )}
                </>
              )}
              <TapStrip taps={vis.used} />
            </div>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {!visualTaps ? (
              <button type="button" className={primary} onClick={onStartVisual}>
                시작
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className={primary}
                  disabled={judgeSuggest === null}
                  onClick={() => {
                    onChange({ judge: judgeSuggest! });
                    setJudgeApplied(true);
                    onStep("audio");
                  }}
                >
                  적용하고 다음 →
                </button>
                <button
                  type="button"
                  className={`${btn} px-5 py-2 text-sm`}
                  onClick={onStartVisual}
                >
                  다시 측정
                </button>
              </>
            )}
            <button
              type="button"
              className={`${btn} px-5 py-2 text-sm`}
              onClick={() => onStep("speed")}
            >
              ← 1단계
            </button>
            <button type="button" className={`${btn} px-5 py-2 text-sm`} onClick={onCancel}>
              취소
            </button>
          </div>
        </>
      )}

      {step === "audio" && (
        <>
          <p className="font-mono text-lg font-bold text-white">3단계 · 소리와 노트 맞추기</p>
          <p className="mt-3 font-['Nanum_Gothic',sans-serif] text-sm leading-relaxed text-white/60">
            노트가 <b className="text-white/85">선에 닿는 순간</b>과{" "}
            <b className="text-white/85">딸깍 소리</b>가 딱 맞게 들릴 때까지 −/+를 눌러 맞추세요.
            블루투스 이어폰처럼 소리가 늦게 나오면 +쪽으로. 치는 게 아니라{" "}
            <b className="text-white/85">보고 듣기만</b> 하면 돼요.
          </p>
          <AvSyncCal
            offset={offset}
            onChange={(v) => onChange({ offset: v })}
            speed={speed}
            skin={skin}
          />
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button type="button" className={primary} onClick={onDone}>
              이대로 완료
            </button>
            <button
              type="button"
              className={`${btn} px-5 py-2 text-sm`}
              onClick={() => onStep("visual")}
            >
              ← 2단계
            </button>
            <button type="button" className={`${btn} px-5 py-2 text-sm`} onClick={onCancel}>
              취소
            </button>
          </div>
        </>
      )}
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
