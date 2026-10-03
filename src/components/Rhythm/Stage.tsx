"use client";

import { useEffect, useRef, useState } from "react";
import type { Song } from "@/lib/rhythm/music";
import type { Chart, Difficulty } from "@/lib/rhythm/chart";
import { Engine, HP_MAX, rankOf, type Judge } from "@/lib/rhythm/engine";
import { DIFFICULTIES } from "@/lib/rhythm/chart";
import { COVERS } from "./SongCarousel";
import HoldButton from "./HoldButton";
import {
  drawHead,
  drawHoldBody,
  laneColors,
  makeHitSound,
  type HitSound,
  type Skin,
} from "@/lib/rhythm/fx";

export const KEY_CODES = ["KeyD", "KeyF", "KeyJ", "KeyK"];

export type Cover = "none" | "fade" | "sudden";
export const COVERS_OPT: { key: Cover; label: string; desc: string }[] = [
  { key: "none", label: "없음", desc: "" },
  { key: "fade", label: "페이드", desc: "판정선 가까이에서 노트가 사라져요 — 박자감으로 치기" },
  { key: "sudden", label: "서든", desc: "위쪽 30%가 가려져 노트를 미리 읽을 수 없어요" },
];
export const KEY_LABELS = ["D", "F", "J", "K"];

export interface Result {
  songId: string;
  diff: Difficulty;
  score: number;
  acc: number;
  rank: string;
  counts: Record<Judge, number>;
  maxCombo: number;
  fc: boolean;
  ap: boolean;
  /** 판정 창 안에서 빠르게/늦게 친 횟수 (±FAST_SLOW_MS 넘는 것만) */
  fast: number;
  slow: number;
  /** 친 노트들의 타이밍 중앙값(ms, +면 늦게 침). 싱크 자동 보정용 */
  avgMs: number | null;
  /** 타이밍이 한쪽으로 고르게 쏠려 있는지 (들쭉날쭉이 아니라 늘 비슷하게 늦거나 빠름) */
  steady: boolean;
  /** HP가 바닥나서 중간에 끝남 */
  failed: boolean;
  /** 싱크 맞추기: 누를 때마다 가장 가까운 노트와의 차이(ms, 판정과 무관하게 ±250ms 안) */
  taps?: number[];
}

/** 싱크 맞추기에서 처음 몇 개는 박자 잡는 중이라 뺌 */
export const CAL_SKIP = 4;

/**
 * 친 타이밍(초) 목록 → 중앙값(ms)과 "고르게 쏠렸는지".
 * 20개 이상 쳤고, 중앙값 주변으로 절반 이상이 ±25ms 안에 모여 있으면(MAD ≤ 25ms)
 * 실수로 흔들린 게 아니라 기기·손 버릇으로 늘 그만큼 어긋난 것으로 봄.
 */
/** 랭크 글자색 (결과 화면과 같은 색) */
export const rankColorOf = (rank: string) =>
  rank.startsWith("S")
    ? "#FDE047"
    : rank === "A"
      ? "#4ADE80"
      : rank === "B"
        ? "#60A5FA"
        : "#F87171";

const SCROLL_KEYS = new Set(["Space", "PageUp", "PageDown", "Home", "End"]);

function timingOf(diffs: number[]): { avgMs: number | null; steady: boolean } {
  if (diffs.length < 10) return { avgMs: null, steady: false };
  const ms = diffs.map((d) => d * 1000).sort((a, b) => a - b);
  const med = ms[Math.floor(ms.length / 2)];
  const dev = ms.map((v) => Math.abs(v - med)).sort((a, b) => a - b);
  const mad = dev[Math.floor(dev.length / 2)];
  return { avgMs: Math.round(med), steady: ms.length >= 20 && mad <= 25 };
}

/** 이보다 크게 어긋나면 FAST/SLOW 표시 (퍼펙트 안이어도) */
const FAST_SLOW_MS = 20;

const JUDGE_STYLE: Record<Judge, { text: string; color: string }> = {
  perfect: { text: "PERFECT", color: "#7DF9FF" },
  great: { text: "GREAT", color: "#4ADE80" },
  good: { text: "GOOD", color: "#FBBF24" },
  miss: { text: "MISS", color: "#F87171" },
};

/** 스크롤 속도 1.0 → 노트가 2.4초 동안 내려옴 */
export const visibleSec = (speed: number) => 2.4 / speed;

/** 플레이 중에도 바꿀 수 있는 설정 */
export interface LiveSettings {
  speed: number;
  offset: number;
  judge: number;
  music: number;
  hit: number;
}

interface Props {
  song: Song;
  diff: Difficulty;
  chart: Chart;
  buffer: AudioBuffer;
  ctx: AudioContext;
  speed: number;
  /** ms, +면 노트가 늦게 옴 */
  offset: number;
  /** 타격음 볼륨 0~1 (0이면 끔) */
  hitVolume: number;
  hitSound: HitSound;
  skin: Skin;
  /** 노트 가림: fade = 판정선 가까이에서 흐려짐, sudden = 아래쪽에 와서야 보임 */
  cover: Cover;
  /** 음악 볼륨 0~1 */
  musicVolume: number;
  /** 플레이 중(일시정지 화면·속도 단축키)에 바꾼 설정을 부모에 저장 */
  onSettings: (patch: Partial<LiveSettings>) => void;
  onFinish: (result: Result) => void;
  onQuit: () => void;
  onRestart: () => void;
  /** ms, 판정만 옮김(+면 늦게 쳐도 맞게). 노트가 보이는 위치는 그대로 */
  judgeOffset: number;
  /** 타격 싱크 맞추기 모드: 음악 없이 노트만 보고 침. HP로 안 죽고, 누른 타이밍(타격 싱크 적용 전)을 모아서 돌려줌 */
  calibration?: boolean;
}

export default function Stage({
  song,
  diff,
  chart,
  buffer,
  ctx,
  speed,
  offset,
  hitVolume,
  hitSound,
  skin,
  cover: coverMode,
  musicVolume,
  onSettings,
  onFinish,
  onQuit,
  onRestart,
  calibration = false,
  judgeOffset,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paused, setPaused] = useState(false);
  // 일시정지 화면에 보여줄 지금까지의 타이밍 (결과 화면과 같은 계산)
  const [pauseTiming, setPauseTiming] = useState<{
    avgMs: number | null;
    n: number;
    applied?: number;
  }>({
    avgMs: null,
    n: 0,
  });
  // 일시정지 화면의 지금까지 점수·정확도·랭크
  const [pauseStats, setPauseStats] = useState<{ score: number; acc: number; combo: number }>({
    score: 0,
    acc: 100,
    combo: 0,
  });
  /** 일시정지 화면의 '싱크 적용': 결과 화면 자동 보정과 같은 규칙 (한 번에 최대 ±120ms) */
  const applyPauseSync = () => {
    if (pauseTiming.avgMs === null) return;
    const to = clamp(liveUi.judge + clamp(pauseTiming.avgMs, -120, 120), -400, 400);
    change({ judge: to });
    ctrl.current.resetTiming();
    setPauseTiming({ avgMs: null, n: 0, applied: to });
  };
  // 일시정지·재개를 effect 밖(버튼)에서도 부르기 위해
  const ctrl = useRef<{
    pause: () => void;
    resume: () => void;
    apply: (p: Partial<LiveSettings>) => void;
    /** 지금까지 친 타이밍 기록 비우기 (싱크를 바꾼 뒤 새로 재려고) */
    resetTiming: () => void;
  }>({
    pause: () => {},
    resume: () => {},
    apply: () => {},
    resetTiming: () => {},
  });
  // 일시정지 화면에서 보여줄 현재 설정값
  const [liveUi, setLiveUi] = useState<LiveSettings>({
    speed,
    offset,
    judge: judgeOffset,
    music: musicVolume,
    hit: hitVolume,
  });
  const change = (p: Partial<LiveSettings>) => {
    setLiveUi((v) => ({ ...v, ...p }));
    ctrl.current.apply(p);
    onSettings(p);
  };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    // desynchronized는 쓰지 않음: 모바일(특히 안드로이드)에서 화면이 찢어지고 깜빡임
    const g = canvas.getContext("2d", { alpha: false })!;
    const beatSec = 60 / song.bpm;
    // 롱노트 누르는 동안 8분음표마다 콤보가 오름
    const engine = new Engine(chart, beatSec / 2);
    // 플레이 중에 바뀔 수 있는 값들 (일시정지 화면·속도 단축키)
    const live: LiveSettings = {
      speed,
      offset,
      judge: judgeOffset,
      music: musicVolume,
      hit: hitVolume,
    };
    let vis = visibleSec(speed);
    // READY → 3 → 2 → 1 → GO! 가 끝난 뒤에 노트가 내려오기 시작
    const cd = countdownPhases(song.color);
    const cdEnd = cd[cd.length - 2].from + cd[cd.length - 2].dur; // "1"이 끝나는 시점
    const leadIn = cdEnd + vis + 0.25;
    const lanePointer = new Map<number, number>();

    // CW: 캔버스 전체 폭, W: 가운데 기어(레인 4개) 폭, gx: 기어 왼쪽 위치
    // 넓은 화면에서는 기어 양옆에 곡 커버 배경과 점수판을 그린다
    let CW = 0;
    let W = 0;
    let gx = 0;
    let H = 0;
    let dpr = 1;
    const cover = new Image();
    let backdrop: HTMLCanvasElement | null = null;
    const makeBackdrop = () => {
      if (!cover.complete || !cover.naturalWidth || !CW) return;
      const c = document.createElement("canvas");
      c.width = Math.round(CW * dpr);
      c.height = Math.round(H * dpr);
      const b = c.getContext("2d")!;
      // 흐림: 아주 작게 줄였다가 늘려 그림 (ctx.filter는 사파리 미지원이고 모바일에서 무거움)
      const tiny = document.createElement("canvas");
      tiny.width = 24;
      tiny.height = Math.max(1, Math.round((24 * c.height) / c.width));
      const tg = tiny.getContext("2d")!;
      // 화면을 꽉 채우게(비율 유지)
      const sc =
        Math.max(tiny.width / cover.naturalWidth, tiny.height / cover.naturalHeight) * 1.15;
      const iw = cover.naturalWidth * sc;
      const ih = cover.naturalHeight * sc;
      tg.drawImage(cover, (tiny.width - iw) / 2, (tiny.height - ih) / 2, iw, ih);
      b.imageSmoothingEnabled = true;
      b.imageSmoothingQuality = "high";
      b.drawImage(tiny, 0, 0, c.width, c.height);
      b.fillStyle = "rgba(8,9,13,0.45)";
      b.fillRect(0, 0, c.width, c.height);
      backdrop = c;
    };
    // 박자 번쩍임용 빛 (한 번 그려두고 투명도만 바꿔서 씀 – 매 프레임 그라데이션 계산 안 하게)
    let beatGlow: HTMLCanvasElement | null = null;
    const makeGlow = () => {
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round((CW / 2) * dpr));
      c.height = Math.max(1, Math.round((H / 2) * dpr));
      const b = c.getContext("2d")!;
      b.scale(c.width / CW, c.height / H);
      const gr = b.createRadialGradient(CW / 2, H * 0.55, W * 0.4, CW / 2, H * 0.55, CW * 0.7);
      gr.addColorStop(0, `${song.color}55`);
      gr.addColorStop(1, `${song.color}00`);
      b.fillStyle = gr;
      b.fillRect(0, 0, CW, H);
      beatGlow = c;
    };
    cover.onload = makeBackdrop;
    cover.src = COVERS[song.id]?.src ?? "";
    const resize = () => {
      const nDpr = Math.min(2, window.devicePixelRatio || 1);
      const nCW = Math.min(wrap.clientWidth, 1100);
      const nH = Math.max(420, Math.min(window.innerHeight - 170, 760));
      // 모바일은 주소창이 들어가고 나올 때마다 resize가 옴 → 크기가 그대로면 캔버스를 다시 만들지 않음
      if (nDpr === dpr && nCW === CW && nH === H) return;
      dpr = nDpr;
      CW = nCW;
      H = nH;
      W = Math.min(CW, 440);
      gx = Math.round((CW - W) / 2);
      canvas.width = Math.round(CW * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${CW}px`;
      canvas.style.height = `${H}px`;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeBackdrop();
      makeGlow();
    };
    resize();
    window.addEventListener("resize", resize);

    // 오디오 시작
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const musicGain = ctx.createGain();
    musicGain.gain.value = calibration ? 0 : live.music;
    src.connect(musicGain).connect(ctx.destination);
    const startAt = ctx.currentTime + leadIn;
    src.start(startAt);
    let stopped = false;

    // 카운트다운 효과음 (화면 표시 시점에 들리도록 싱크값만큼 밀어서 예약)
    const base = startAt - leadIn + offset / 1000;
    const beeps: OscillatorNode[] = [];
    for (const ph of cd) {
      if (!ph.beep) continue;
      const at = Math.max(ctx.currentTime, base + ph.from);
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = ph.beep;
      gn.gain.setValueAtTime(0.0001, at);
      gn.gain.exponentialRampToValueAtTime(0.35, at + 0.01);
      gn.gain.exponentialRampToValueAtTime(0.0001, at + (ph.label === "GO!" ? 0.45 : 0.18));
      o.connect(gn).connect(ctx.destination);
      o.start(at);
      o.stop(at + 0.5);
      beeps.push(o);
    }

    const now = () =>
      ctx.currentTime -
      startAt -
      ((ctx as AudioContext & { outputLatency?: number }).outputLatency ?? 0) -
      (ctx.baseLatency ?? 0) -
      live.offset / 1000;

    // 화면 효과용 상태
    let lastJudge: { judge: Judge; at: number; diff?: number; tick?: boolean } | null = null;
    let shownScore = 0;
    let speedToastAt = -10;
    let fast = 0;
    let slow = 0;
    const diffs: number[] = [];
    const taps: number[] = [];
    const noteTimes = chart.notes.map((n) => n.t);
    const hitBuf = makeHitSound(ctx, hitSound);
    const hitGain = ctx.createGain();
    hitGain.gain.value = live.hit * 0.9;
    hitGain.connect(ctx.destination);
    // 타격 효과: 판정선에서 터지는 빛·링·불꽃
    const bursts: { lane: number; at: number; judge: Judge; big: boolean }[] = [];
    const sparks: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      at: number;
      life: number;
      size: number;
      color: string;
    }[] = [];
    let lastSparkAt = -1;
    let comboAt = -1;
    let drawFrom = 0;
    const colors = laneColors(skin, song.color);
    const laneColor = (l: number) => colors[l];
    const spawnSparks = (
      lane: number,
      at: number,
      n: number,
      color: string,
      speed: number,
      laneW: number,
      judgeY: number
    ) => {
      const cx = lane * laneW + laneW / 2;
      for (let k = 0; k < n; k++) {
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
        const v = speed * (0.45 + Math.random() * 0.75);
        sparks.push({
          x: cx + (Math.random() - 0.5) * laneW * 0.5,
          y: judgeY,
          vx: Math.cos(ang) * v,
          vy: Math.sin(ang) * v,
          at,
          life: 0.28 + Math.random() * 0.25,
          size: 1.5 + Math.random() * 2.5,
          color: Math.random() < 0.35 ? "#FFFFFF" : color,
        });
      }
      if (sparks.length > 400) sparks.splice(0, sparks.length - 400);
    };
    /** 친 노트가 조각나서 흩어짐 → 노트가 "없어졌다"는 게 확실히 보이게 */
    const spawnShards = (
      lane: number,
      at: number,
      color: string,
      laneW: number,
      judgeY: number
    ) => {
      const x0 = lane * laneW + 4;
      const w = laneW - 8;
      for (let k = 0; k < 7; k++) {
        const fx = (k + 0.5) / 7;
        const ang = -Math.PI / 2 + (fx - 0.5) * 2.2 + (Math.random() - 0.5) * 0.4;
        const v = 240 + Math.random() * 220;
        sparks.push({
          x: x0 + w * fx,
          y: judgeY,
          vx: Math.cos(ang) * v,
          vy: Math.sin(ang) * v,
          at,
          life: 0.22 + Math.random() * 0.12,
          size: 4 + Math.random() * 4,
          color,
        });
      }
    };
    const songEnd = song.duration - 2.5;

    const barSec = beatSec * 4;
    const diffInfo = DIFFICULTIES.find((d) => d.key === diff)!;
    const secName = (t: number) => {
      const bar = Math.floor((t - (song.beatOffset ?? 0)) / barSec);
      let name = "";
      for (const [b0, n] of song.sections) if (bar >= b0) name = n;
      return name;
    };

    /** 기어 바깥: 흐린 커버 배경 + 박자에 맞춰 번쩍임 + 양옆 정보판 */
    const drawBackdrop = (t: number, pulse: number) => {
      g.clearRect(0, 0, CW, H);
      if (backdrop) g.drawImage(backdrop, 0, 0, CW, H);
      else {
        g.fillStyle = "#0B0C10";
        g.fillRect(0, 0, CW, H);
      }
      if (gx < 8) return;
      // 박자마다 곡 색이 은은하게 번짐
      if (beatGlow && pulse > 0.02) {
        g.globalAlpha = pulse;
        g.drawImage(beatGlow, 0, 0, CW, H);
        g.globalAlpha = 1;
      }
      if (gx < 150) return;

      const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";
      const lx = 24;
      const panelW = gx - 48;
      g.textAlign = "left";
      g.textBaseline = "top";
      // 왼쪽: 곡 정보
      g.fillStyle = "rgba(255,255,255,0.45)";
      g.font = `600 11px ${mono}`;
      g.fillText("NOW PLAYING", lx, 28);
      g.fillStyle = "#fff";
      g.font = `900 ${Math.min(30, Math.max(18, panelW / 7))}px ${mono}`;
      g.fillText(song.title, lx, 46, panelW);
      g.fillStyle = diffInfo.color;
      g.font = `800 13px ${mono}`;
      g.fillText(`${diffInfo.label.toUpperCase()}  Lv.${chart.level}`, lx, 86);
      g.fillStyle = "rgba(255,255,255,0.5)";
      g.font = `600 12px ${mono}`;
      g.fillText(`${Math.round(song.bpmLabel ?? song.bpm)} BPM`, lx, 106);
      const sec = t > 0 ? secName(t) : "";
      if (sec) {
        g.fillStyle = song.color;
        g.font = `800 12px ${mono}`;
        g.fillText(`▶ ${sec.toUpperCase()}`, lx, 128);
      }
      g.fillStyle = "rgba(255,255,255,0.35)";
      g.font = `600 11px ${mono}`;
      g.fillText(`SPEED x${live.speed.toFixed(1)}`, lx, H - 40);

      // 오른쪽: 점수판
      const rx = gx + W + 24;
      g.fillStyle = "rgba(255,255,255,0.45)";
      g.font = `600 11px ${mono}`;
      g.fillText("SCORE", rx, 28);
      g.fillStyle = "#fff";
      g.font = `900 ${Math.min(34, Math.max(20, panelW / 6))}px ${mono}`;
      g.fillText(fmtScore(Math.round(shownScore)), rx, 46, panelW);
      g.fillStyle = "rgba(255,255,255,0.7)";
      g.font = `700 13px ${mono}`;
      g.fillText(`${engine.accuracy.toFixed(2)}%`, rx, 90);
      g.fillStyle = "rgba(255,255,255,0.45)";
      g.font = `600 11px ${mono}`;
      g.fillText(`MAX COMBO ${engine.maxCombo}`, rx, 110);
      const rows: [string, number, string][] = [
        ["PERFECT", engine.counts.perfect, JUDGE_STYLE.perfect.color],
        ["GREAT", engine.counts.great, JUDGE_STYLE.great.color],
        ["GOOD", engine.counts.good, JUDGE_STYLE.good.color],
        ["MISS", engine.counts.miss, JUDGE_STYLE.miss.color],
      ];
      rows.forEach(([label, n, c], i) => {
        const y = 144 + i * 20;
        g.fillStyle = c;
        g.font = `700 11px ${mono}`;
        g.textAlign = "left";
        g.fillText(label, rx, y);
        g.fillStyle = "#fff";
        g.textAlign = "right";
        g.fillText(String(n), rx + Math.min(panelW, 170), y);
      });
      g.textAlign = "left";
    };

    const draw = (t: number) => {
      const laneW = W / 4;
      const judgeY = H - 92;
      // 박자 위상 (0: 박자 순간) → 판정선·배경이 박자에 맞춰 번쩍
      const bt = t - (song.beatOffset ?? 0);
      const beatPh = bt > 0 ? (((bt % beatSec) + beatSec) % beatSec) / beatSec : 1;
      const pulse = t > 0 ? Math.exp(-beatPh * 5) : 0;
      shownScore += (engine.score - shownScore) * 0.18;
      drawBackdrop(t, pulse);
      g.save();
      g.translate(gx, 0);
      // 기어 테두리 빛
      if (gx > 0) {
        g.fillStyle = song.color;
        g.globalAlpha = 0.5 + 0.5 * pulse;
        g.fillRect(-3, 0, 3, H);
        g.fillRect(W, 0, 3, H);
        g.globalAlpha = 0.12 + 0.2 * pulse;
        g.fillRect(-9, 0, 6, H);
        g.fillRect(W + 3, 0, 6, H);
        g.globalAlpha = 1;
      }
      for (let l = 0; l < 4; l++) {
        // 살짝 비쳐서 레인 뒤로 곡 커버가 은은하게 보임
        g.fillStyle = l % 2 ? "rgba(18,20,26,0.85)" : "rgba(16,18,23,0.85)";
        g.fillRect(l * laneW, 0, laneW, H);
        if (engine.pressed[l]) {
          const grad = g.createLinearGradient(0, judgeY, 0, judgeY - H * 0.5);
          grad.addColorStop(0, `${laneColor(l)}55`);
          grad.addColorStop(1, `${laneColor(l)}00`);
          g.fillStyle = grad;
          g.fillRect(l * laneW, judgeY - H * 0.5, laneW, H * 0.5);
        }
      }
      g.fillStyle = "rgba(255,255,255,0.06)";
      for (let l = 1; l < 4; l++) g.fillRect(l * laneW - 0.5, 0, 1, H);

      // 노트
      const yOf = (time: number) => judgeY - ((time - t) / vis) * judgeY;
      // 마디선: 마디마다 가로줄이 같이 내려와서 박자 읽기 쉽게
      g.fillStyle = "rgba(255,255,255,0.13)";
      for (let k = Math.max(0, Math.ceil(t / barSec)); k * barSec < t + vis; k++) {
        const y = yOf(k * barSec);
        if (y < judgeY) g.fillRect(0, y - 0.5, W, 1);
      }
      // 가림 옵션: y(0=위, judgeY=판정선) 위치에 따른 투명도
      const coverAlpha = (y: number) => {
        if (coverMode === "none" || calibration) return 1;
        const r = y / judgeY; // 0 위 → 1 판정선
        if (coverMode === "fade") return r < 0.55 ? 1 : Math.max(0, 1 - (r - 0.55) / 0.3);
        // 서든: 위쪽 30%만 가리고 아래 70%는 보임 (반응 시간은 남기면서 미리 읽기만 막음)
        return r < 0.3 ? 0 : Math.min(1, (r - 0.3) / 0.1);
      };
      while (drawFrom < engine.notes.length && engine.notes[drawFrom].t < t - 4) drawFrom++;
      for (let i = drawFrom; i < engine.notes.length; i++) {
        const n = engine.notes[i];
        if (n.t > t + vis + 0.1) break;
        const x = n.lane * laneW;
        const c = laneColor(n.lane);
        if (n.end) {
          if (n.tail === "perfect") continue;
          // 머리는 쳤는데 일찍 뗀 롱노트: 남은 몸통은 바로 없앰 (회색으로 계속 내려오면 남아 있는 느낌)
          if (n.head && n.head !== "miss" && n.tail === "miss") continue;
          const dead = n.head === "miss" || n.tail === "miss";
          const yHead = n.holding ? judgeY : yOf(n.t);
          const yTail = Math.max(-20, yOf(n.end));
          if (yTail > H) continue;
          const bc = dead ? "#555555" : c;
          const ca = n.holding ? 1 : coverAlpha(yHead);
          if (ca <= 0 && coverAlpha(yTail) <= 0) continue;
          g.globalAlpha = n.holding ? 1 : Math.max(ca, coverAlpha(yTail) * 0.6);
          drawHoldBody(g, skin, x, yHead, yTail, laneW, bc, dead ? 0.25 : n.holding ? 0.85 : 0.6);
          g.globalAlpha = (dead ? 0.35 : 1) * ca;
          if (g.globalAlpha > 0) drawHead(g, skin, x, yHead, laneW, dead ? "#666666" : c);
          g.globalAlpha = 1;
        } else {
          if (n.head && n.head !== "miss") continue;
          const y = yOf(n.t);
          if (y > H + 20) continue;
          const ca = n.head === "miss" ? 0.3 : coverAlpha(y);
          if (ca <= 0) continue;
          g.globalAlpha = ca;
          drawHead(g, skin, x, y, laneW, c);
          g.globalAlpha = 1;
        }
      }

      // 판정선 아래 키 바닥: 불투명하게 덮어서 지나간 노트가 비쳐 보이지 않게
      g.fillStyle = "#0B0C10";
      g.fillRect(0, judgeY + 2, W, H - judgeY - 2);
      for (let l = 0; l < 4; l++) {
        g.fillStyle = engine.pressed[l] ? `${laneColor(l)}40` : "#15171D";
        g.fillRect(l * laneW + 3, judgeY + 14, laneW - 6, H - judgeY - 20);
      }

      // 판정선 (+ 스킨별 수신부)
      g.save();
      g.shadowColor = song.color;
      g.shadowBlur = 10 * pulse;
      g.fillStyle = `rgba(255,255,255,${0.75 + 0.25 * pulse})`;
      g.fillRect(0, judgeY - 1.5 - pulse, W, 3 + 2 * pulse);
      g.restore();

      // 롱노트 누르는 중: 판정선에서 불꽃이 계속 튐
      if (t - lastSparkAt > 0.035) {
        lastSparkAt = t;
        for (let l = 0; l < 4; l++)
          if (engine.holding[l]) spawnSparks(l, t, 2, laneColor(l), 260, laneW, judgeY);
      }

      g.save();
      g.globalCompositeOperation = "lighter";
      // 타격 효과: 레인 빛기둥 + 판정선 섬광 + 퍼지는 링
      for (let k = bursts.length - 1; k >= 0; k--) {
        const f = bursts[k];
        const age = t - f.at;
        if (age > 0.4 || age < -0.5) {
          bursts.splice(k, 1);
          continue;
        }
        const p = Math.max(0, age) / 0.4;
        const col = f.judge === "perfect" ? laneColor(f.lane) : JUDGE_STYLE[f.judge].color;
        const cx = f.lane * laneW + laneW / 2;
        const fade = 1 - p;
        // 빛기둥
        const beamH = H * (f.big ? 0.55 : 0.4) * (0.6 + 0.4 * Math.min(1, p * 4));
        const beam = g.createLinearGradient(0, judgeY, 0, judgeY - beamH);
        beam.addColorStop(0, `${col}${hex2(0.7 * fade * fade)}`);
        beam.addColorStop(1, `${col}00`);
        g.fillStyle = beam;
        const bw = laneW * (0.9 - 0.3 * p);
        g.fillRect(cx - bw / 2, judgeY - beamH, bw, beamH);
        // 친 순간 짧은 흰 섬광 (노트 모양으로 남아 보이지 않게 둥글고 짧게)
        if (age < 0.12) {
          const fp = Math.max(0, age) / 0.12;
          const fr = laneW * (0.25 + fp * 0.45);
          const flash = g.createRadialGradient(cx, judgeY, 0, cx, judgeY, fr);
          flash.addColorStop(0, `rgba(255,255,255,${0.95 * (1 - fp)})`);
          flash.addColorStop(0.4, `${col}${hex2(0.6 * (1 - fp))}`);
          flash.addColorStop(1, `${col}00`);
          g.fillStyle = flash;
          g.beginPath();
          g.arc(cx, judgeY, fr, 0, Math.PI * 2);
          g.fill();
        }
        // 링
        const ease = 1 - Math.pow(1 - p, 3);
        g.globalAlpha = fade;
        g.strokeStyle = col;
        g.lineWidth = 3 * fade + 1;
        g.beginPath();
        g.arc(cx, judgeY, laneW * (0.2 + ease * 0.5), 0, Math.PI * 2);
        g.stroke();
        g.globalAlpha = 1;
      }
      // 불꽃
      for (let k = sparks.length - 1; k >= 0; k--) {
        const sp = sparks[k];
        const age = t - sp.at;
        if (age > sp.life || age < -0.5) {
          sparks.splice(k, 1);
          continue;
        }
        const a = Math.max(0, age);
        const px = sp.x + sp.vx * a;
        const py = sp.y + sp.vy * a + 900 * a * a;
        const fadeS = 1 - a / sp.life;
        g.globalAlpha = fadeS;
        g.fillStyle = sp.color;
        g.fillRect(px - sp.size / 2, py - sp.size / 2, sp.size, sp.size);
      }
      g.globalAlpha = 1;
      g.restore();

      // 키 표시
      for (let l = 0; l < 4; l++) {
        const on = engine.pressed[l];
        g.fillStyle = on ? "#fff" : "rgba(255,255,255,0.35)";
        g.font = "700 18px ui-monospace, SFMono-Regular, Menlo, monospace";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText(KEY_LABELS[l], l * laneW + laneW / 2, judgeY + 14 + (H - judgeY - 20) / 2);
      }

      // HP 게이지: 기어 오른쪽 (좁은 화면이면 기어 안쪽 가장자리)
      {
        const hpr = engine.hp / HP_MAX;
        const bx = gx >= 24 ? W + 12 : W - 7;
        const top = 40;
        const bh = judgeY - top;
        const low = hpr < 0.3;
        const blink = low ? 0.55 + 0.45 * Math.sin(performance.now() / 90) : 1;
        g.fillStyle = "rgba(0,0,0,0.5)";
        g.fillRect(bx - 1, top - 1, 7, bh + 2);
        const hc = hpr > 0.6 ? "#4ADE80" : hpr > 0.3 ? "#FBBF24" : "#F43F5E";
        g.globalAlpha = blink;
        g.fillStyle = hc;
        g.fillRect(bx, top + bh * (1 - hpr), 5, bh * hpr);
        g.globalAlpha = 1;
        if (gx >= 24) {
          g.fillStyle = "rgba(255,255,255,0.5)";
          g.font = "700 9px ui-monospace, monospace";
          g.textAlign = "center";
          g.textBaseline = "top";
          g.fillText("HP", bx + 2.5, judgeY + 6);
        }
        g.textAlign = "center";
        g.textBaseline = "middle";
      }

      // 판정·콤보
      if (lastJudge && t - lastJudge.at < 0.6) {
        const s = JUDGE_STYLE[lastJudge.judge];
        const age = Math.max(0, t - lastJudge.at);
        const pop = Math.min(1, age / 0.14);
        const miss = lastJudge.judge === "miss";
        // 크게 튀어나왔다가 제자리로(오버슈트), 위로 살짝 떠오르며 사라짐. 미스는 흔들림
        const sc = miss ? 1.15 - 0.15 * pop : 1.75 - 0.75 * easeOutBack(pop);
        const shake = miss ? Math.sin(age * 90) * 7 * (1 - pop) : 0;
        const jy = H * 0.4 - 8 - (miss ? -age * 18 : pop * 6);
        g.save();
        g.globalAlpha = age < 0.42 ? 1 : Math.max(0, 1 - (age - 0.42) / 0.18);
        g.translate(W / 2 + shake, jy);
        g.scale(sc * (miss ? 1 : 1 + 0.12 * (1 - pop)), sc);
        g.font = "900 38px ui-monospace, SFMono-Regular, Menlo, monospace";
        g.shadowColor = s.color;
        g.shadowBlur = miss ? 6 : 22;
        g.fillStyle = s.color;
        g.fillText(s.text, 0, 0);
        g.shadowBlur = 0;
        g.fillText(s.text, 0, 0);
        // 친 순간 하얗게 번쩍
        if (!miss && age < 0.09) {
          g.globalAlpha = 1 - age / 0.09;
          g.fillStyle = "#FFFFFF";
          g.fillText(s.text, 0, 0);
        }
        g.restore();
      }
      if (engine.combo >= 2) {
        // 콤보가 오를 때마다 살짝 튀어오름
        const bump = Math.max(0, 1 - (t - comboAt) / 0.12);
        // 콤보가 쌓일수록 색이 달라짐: 흰 → 하늘 → 초록 → 노랑 → 주황 → 200부터 무지개
        const cc = engine.combo;
        const comboColor =
          cc >= 200
            ? `hsl(${Math.round((t * 160) % 360)} 95% 70%)`
            : cc >= 100
              ? "#FB923C"
              : cc >= 50
                ? "#FDE047"
                : cc >= 25
                  ? "#4ADE80"
                  : cc >= 10
                    ? "#7DF9FF"
                    : "rgba(255,255,255,0.9)";
        g.fillStyle = comboColor;
        g.font = `900 ${Math.round(64 + 14 * bump)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
        if (cc >= 50) {
          g.shadowColor = comboColor;
          g.shadowBlur = cc >= 200 ? 24 : 14;
        }
        g.fillText(String(engine.combo), W / 2, H * 0.4 + 58 - 4 * bump);
        g.shadowBlur = 0;
        g.font = "700 12px ui-monospace, monospace";
        g.fillStyle = "rgba(255,255,255,0.45)";
        g.fillText("COMBO", W / 2, H * 0.4 + 98);
      }

      // 상단: 진행바·정확도·점수
      g.fillStyle = "rgba(255,255,255,0.08)";
      g.fillRect(0, 0, W, 3);
      g.fillStyle = song.color;
      g.fillRect(0, 0, W * Math.max(0, Math.min(1, t / songEnd)), 3);
      g.font = "600 13px ui-monospace, monospace";
      g.textBaseline = "top";
      g.textAlign = "left";
      g.fillStyle = "rgba(255,255,255,0.6)";
      g.fillText(`${engine.accuracy.toFixed(2)}%`, 10, 12);
      g.textAlign = "right";
      g.fillStyle = "#fff";
      g.fillText(fmtScore(Math.round(shownScore)), W - 10, 12);
      // 속도 바꿨을 때 잠깐 표시
      const sAge = performance.now() / 1000 - speedToastAt;
      if (sAge < 1) {
        g.globalAlpha = sAge < 0.7 ? 1 : (1 - sAge) / 0.3;
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillStyle = "rgba(0,0,0,0.55)";
        roundRectFill(g, W / 2 - 70, H * 0.22 - 18, 140, 36, 18);
        g.fillStyle = "#fff";
        g.font = "800 16px ui-monospace, SFMono-Regular, Menlo, monospace";
        g.fillText(`SPEED x${live.speed.toFixed(1)}`, W / 2, H * 0.22);
        g.globalAlpha = 1;
      }
      drawCountdown(g, cd, t + leadIn, W, H);
      g.restore();
    };

    let raf = 0;
    let running = true;
    let finished = false;
    const finish = (failed = false) => {
      if (finished) return;
      finished = true;
      running = false;
      const acc = engine.accuracy;
      onFinish({
        failed,
        songId: song.id,
        diff,
        score: engine.score,
        acc,
        rank: failed ? "F" : rankOf(acc),
        counts: { ...engine.counts },
        maxCombo: engine.maxCombo,
        fc: engine.fullCombo,
        ap: engine.allPerfect,
        fast,
        slow,
        ...timingOf(diffs),
        taps: calibration ? taps : undefined,
      });
    };
    // 화면용 부드러운 시계: 오디오 시계(currentTime)는 오디오 버퍼 단위(수~십 ms)로 뚝뚝 끊겨 올라서
    // 그대로 쓰면 노트가 프레임마다 들쭉날쭉 움직여 잔상·분신처럼 보인다.
    // 그래서 performance.now()로 매끄럽게 흘리고, 오디오 시계와의 차이만 천천히 따라가게 한다.
    let clockBase: number | null = null;
    const smoothNow = () => {
      const audioT = now();
      const perfT = performance.now() / 1000;
      if (clockBase === null || Math.abs(perfT + clockBase - audioT) > 0.03)
        clockBase = audioT - perfT; // 처음·일시정지 재개 등 크게 어긋나면 바로 맞춤
      else clockBase += (audioT - perfT - clockBase) * 0.05;
      return perfT + clockBase;
    };
    const frame = () => {
      if (!running) return;
      const t = smoothNow();
      engine.update(t - live.judge / 1000); // 지나간 노트 미스 처리도 타격 싱크 기준
      for (const e of engine.events) {
        lastJudge = e;
        if (e.tick) {
          // 롱노트 콤보 틱: 작은 불꽃만
          spawnSparks(e.lane, e.at, 4, laneColor(e.lane), 300, W / 4, H - 92);
          comboAt = e.at;
          continue;
        }
        if (e.diff !== undefined && e.judge !== "miss") diffs.push(e.diff);
        if (e.diff !== undefined && e.judge !== "miss" && Math.abs(e.diff * 1000) > FAST_SLOW_MS) {
          if (e.diff < 0) fast++;
          else slow++;
        }
        if (e.judge !== "miss") {
          const big = e.judge === "perfect";
          bursts.push({ lane: e.lane, at: e.at, judge: e.judge, big });
          const laneW = W / 4;
          spawnSparks(
            e.lane,
            e.at,
            big ? 14 : e.judge === "great" ? 8 : 4,
            big ? laneColor(e.lane) : JUDGE_STYLE[e.judge].color,
            big ? 520 : 380,
            laneW,
            H - 92
          );
          // 노트가 깨져 흩어지는 조각
          spawnShards(e.lane, e.at, laneColor(e.lane), laneW, H - 92);
          comboAt = e.at;
        }
      }
      engine.events.length = 0;
      if (engine.dead && !calibration) return fail(t);
      draw(t);
      if (engine.done && t > Math.max(engine.lastTime + 1.2, songEnd)) return finish();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    // HP 바닥: 화면 멈추고 음악이 테이프 멈추듯 느려지며 꺼짐 → FAILED → 결과
    let failing = false;
    const fail = (tFail: number) => {
      if (failing) return;
      failing = true;
      running = false;
      const a = ctx.currentTime;
      try {
        src.playbackRate.setValueAtTime(1, a);
        src.playbackRate.linearRampToValueAtTime(0.05, a + 1.1);
        musicGain.gain.setValueAtTime(musicGain.gain.value, a);
        musicGain.gain.linearRampToValueAtTime(0, a + 1.2);
      } catch {}
      const t0 = performance.now();
      const tick = () => {
        if (!failing) return;
        const el = (performance.now() - t0) / 1000;
        draw(tFail);
        drawFailed(g, el, gx, W, H);
        if (el >= 2.6) {
          failing = false;
          finish(true);
          return;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    /**
     * 입력 이벤트가 실제로 발생한 시각(event.timeStamp)을 곡 시간으로.
     * 핸들러가 늦게 돌아도(프레임 사이 대기, GC 등) 누른 순간 기준으로 판정하려고.
     * 시계 대응은 화면 시계(smoothNow)와 같은 clockBase를 씀. 값이 이상하면 지금 시각으로.
     */
    const eventTime = (stamp: number) => {
      const cur = now();
      if (clockBase === null || !Number.isFinite(stamp)) return cur;
      const t = stamp / 1000 + clockBase;
      return t <= cur + 0.005 && cur - t < 0.2 ? t : cur;
    };
    const press = (lane: number, stamp = NaN) => {
      if (!running) return;
      if (live.hit > 0) {
        const src = ctx.createBufferSource();
        src.buffer = hitBuf;
        src.connect(hitGain);
        src.start();
      }
      const t = eventTime(stamp);
      if (calibration) {
        let bi = -1;
        for (let i = 0; i < noteTimes.length; i++)
          if (bi < 0 || Math.abs(t - noteTimes[i]) < Math.abs(t - noteTimes[bi])) bi = i;
        const d = t - noteTimes[bi];
        if (bi >= CAL_SKIP && Math.abs(d) <= 0.25) taps.push(Math.round(d * 1000));
      }
      engine.press(lane, t - live.judge / 1000);
    };
    const release = (lane: number, stamp = NaN) => {
      if (!running) return;
      engine.release(lane, eventTime(stamp) - live.judge / 1000);
    };

    // 재개 카운트다운 (멈춘 화면 위에 3·2·1, 끝나면 음악 재개)
    let resuming = false;
    const RESUME_PHASES: Phase[] = [
      { label: "3", from: 0, dur: 1, color: "#60A5FA", size: 110 },
      { label: "2", from: 1, dur: 1, color: "#FBBF24", size: 110 },
      { label: "1", from: 2, dur: 1, color: "#F43F5E", size: 110 },
    ];

    // 재개 시도 번호: 카운트다운 도중·오디오 재개 대기 중에 다시 멈추면 이전 시도는 무시되게
    let resumeSeq = 0;
    const pause = () => {
      if (resuming) {
        // 카운트다운 중(또는 오디오 재개 대기 중)에 다시 Esc → 일시정지로 돌아감
        resuming = false;
        resumeSeq++;
        cancelAnimationFrame(raf);
        setPauseTiming({ avgMs: timingOf(diffs).avgMs, n: diffs.length });
        setPauseStats({ score: engine.score, acc: engine.accuracy, combo: engine.maxCombo });
        setPaused(true);
        return;
      }
      if (!running || finished || failing) return;
      running = false;
      cancelAnimationFrame(raf);
      // 누르던 키는 뗀 걸로 (롱노트 중이면 끊김)
      const t = now();
      for (let l = 0; l < 4; l++) if (engine.pressed[l]) engine.release(l, t);
      ctx.suspend();
      setPauseTiming({ avgMs: timingOf(diffs).avgMs, n: diffs.length });
      setPauseStats({ score: engine.score, acc: engine.accuracy, combo: engine.maxCombo });
      setPaused(true);
    };
    const resume = () => {
      if (running || finished || resuming || failing) return;
      setPaused(false);
      resuming = true;
      const seq = ++resumeSeq;
      const frozen = now(); // 오디오가 멈춰 있어서 시간도 그대로
      lastJudge = null; // 카운트다운 숫자와 겹치지 않게
      // 시작 카운트다운(READY·3·2·1·GO) 도중에 멈췄으면 그 카운트다운이 이어지니 3·2·1을 또 띄우지 않음
      const startCdEnd = cd[cd.length - 1].from + cd[cd.length - 1].dur;
      const wait = frozen + leadIn < startCdEnd ? 0 : 3;
      const t0 = performance.now();
      const tick = () => {
        if (!resuming || seq !== resumeSeq) return;
        const el = (performance.now() - t0) / 1000;
        draw(frozen);
        if (wait > 0) {
          g.save();
          g.translate(gx, 0);
          drawCountdown(g, RESUME_PHASES, el, W, H);
          g.restore();
        }
        if (el >= wait) {
          // resuming은 오디오가 실제로 다시 돌 때까지 유지 (그 사이 Esc가 재개를 또 부르지 않게)
          ctx.resume().then(() => {
            if (seq !== resumeSeq || !resuming) {
              ctx.suspend(); // 기다리는 사이 다시 멈춤
              return;
            }
            resuming = false;
            running = true;
            raf = requestAnimationFrame(frame);
          });
          return;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    /** 설정 바로 반영 (일시정지 화면·속도 단축키) */
    const apply = (p: Partial<LiveSettings>) => {
      Object.assign(live, p);
      if (p.speed !== undefined) vis = visibleSec(live.speed);
      if (p.music !== undefined && !calibration) musicGain.gain.value = live.music;
      if (p.hit !== undefined) hitGain.gain.value = live.hit * 0.9;
    };
    ctrl.current = {
      pause,
      resume,
      apply,
      resetTiming: () => {
        diffs.length = 0;
      },
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // 플레이 중엔 스페이스·PageDown 등으로 페이지가 스크롤되지 않게 (일시정지 중엔 버튼·슬라이더 조작용으로 둠)
      if ((running || resuming) && SCROLL_KEYS.has(e.code)) {
        e.preventDefault();
        return;
      }
      if (e.code === "Escape") {
        e.preventDefault();
        if (e.repeat) return; // 꾹 누르고 있으면 멈춤·재개가 연달아 일어나던 문제
        if (running || resuming) pause();
        else resume();
        return;
      }
      // 플레이 중 속도 조절: ↑ ↓ (0.1씩)
      if ((e.code === "ArrowUp" || e.code === "ArrowDown") && running) {
        e.preventDefault();
        const sp =
          Math.round(
            Math.max(1, Math.min(8, live.speed + (e.code === "ArrowUp" ? 0.1 : -0.1))) * 10
          ) / 10;
        apply({ speed: sp });
        onSettings({ speed: sp });
        setLiveUi((v) => ({ ...v, speed: sp }));
        speedToastAt = performance.now() / 1000;
        return;
      }
      const lane = KEY_CODES.indexOf(e.code);
      if (lane < 0) return;
      e.preventDefault();
      if (!e.repeat) press(lane, e.timeStamp);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const lane = KEY_CODES.indexOf(e.code);
      if (lane >= 0) release(lane, e.timeStamp);
    };
    const laneAt = (clientX: number) => {
      const r = canvas.getBoundingClientRect();
      const x = ((clientX - r.left) / r.width) * CW - gx; // 기어 기준 위치
      return Math.max(0, Math.min(3, Math.floor((x / W) * 4)));
    };
    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      const lane = laneAt(e.clientX);
      lanePointer.set(e.pointerId, lane);
      press(lane, e.timeStamp);
    };
    const onPointerUp = (e: PointerEvent) => {
      const lane = lanePointer.get(e.pointerId);
      if (lane === undefined) return;
      lanePointer.delete(e.pointerId);
      // 같은 레인을 다른 손가락이 아직 누르고 있으면 유지
      if (![...lanePointer.values()].includes(lane)) release(lane, e.timeStamp);
    };
    const onVisibility = () => {
      if (document.hidden) pause();
    };
    const noMenu = (e: Event) => e.preventDefault();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("contextmenu", noMenu);
    document.addEventListener("visibilitychange", onVisibility);
    // 상단 고정 헤더에 가리지 않게 아래쪽에 맞추고, 레인 위에 뜨는 플로팅 메뉴는 잠깐 숨김
    wrap.scrollIntoView({ block: "end", behavior: "smooth" });
    const quickMenu = document.querySelector<HTMLElement>("[data-quickmenu]");
    if (quickMenu) quickMenu.style.display = "none";

    return () => {
      running = false;
      resuming = false;
      failing = false;
      cancelAnimationFrame(raf);
      for (const o of beeps) {
        try {
          o.stop();
        } catch {}
      }
      if (!stopped) {
        stopped = true;
        try {
          src.stop();
        } catch {}
        src.disconnect();
      }
      if (ctx.state === "suspended") ctx.resume();
      if (quickMenu) quickMenu.style.display = "";
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("contextmenu", noMenu);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // 한 판 동안 설정은 고정 (재시작은 부모가 key를 바꿔 새로 마운트)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const btn =
    "cursor-pointer rounded-full border border-white/15 px-5 py-2 whitespace-nowrap font-mono text-sm text-white/80 transition-colors hover:border-[#6C63FF]/60 hover:text-white";

  return (
    <div ref={wrapRef} className="relative flex w-full flex-col items-center">
      <canvas
        ref={canvasRef}
        className="touch-none rounded-xl border border-white/10 select-none"
      />
      <button
        type="button"
        onClick={() => ctrl.current.pause()}
        className="absolute top-8 left-1/2 -translate-x-1/2 cursor-pointer rounded-full bg-white/5 px-3 py-1 font-mono text-[11px] text-white/45 hover:text-white"
      >
        II 일시정지 (Esc)
      </button>
      {paused && (
        <div className="absolute inset-0 flex items-center justify-center overflow-y-auto rounded-xl bg-black/75 p-4 backdrop-blur-sm">
          <div className="flex w-full max-w-sm flex-col items-center gap-2.5">
            <p className="font-mono text-lg font-bold text-white">일시정지</p>
            {!calibration && (
              <div className="mb-1 flex items-center gap-4 rounded-xl border border-white/10 bg-[#1C1E24]/90 px-4 py-2 font-mono">
                <span
                  className="text-3xl font-black"
                  style={{ color: rankColorOf(rankOf(pauseStats.acc)) }}
                >
                  {rankOf(pauseStats.acc)}
                </span>
                <span className="flex flex-col text-xs text-white/55">
                  <span className="text-base font-bold text-white tabular-nums">
                    {pauseStats.score.toLocaleString("en-US")}
                  </span>
                  <span>
                    정확도 {pauseStats.acc.toFixed(2)}% · 최대 콤보 {pauseStats.combo}
                  </span>
                </span>
              </div>
            )}
            {!calibration && (
              <div className="mb-1 flex flex-col items-center gap-1.5 font-mono text-xs text-white/50">
                {pauseTiming.applied !== undefined ? (
                  <p>
                    타격 싱크를{" "}
                    <b className="text-white">
                      {pauseTiming.applied > 0 ? "+" : ""}
                      {pauseTiming.applied}ms
                    </b>
                    로 맞췄어요. 이후 입력부터 다시 재요.
                  </p>
                ) : pauseTiming.avgMs === null ? (
                  <p>타이밍 기록이 아직 적어요 (10개부터)</p>
                ) : (
                  <>
                    <p>
                      지금까지 평균{" "}
                      <b className={pauseTiming.avgMs === 0 ? "text-white" : "text-[#FBBF24]"}>
                        {pauseTiming.avgMs > 0 ? "+" : ""}
                        {pauseTiming.avgMs}ms{" "}
                        {pauseTiming.avgMs > 0 ? "늦음" : pauseTiming.avgMs < 0 ? "빠름" : "정확"}
                      </b>{" "}
                      · 입력 {pauseTiming.n}개
                    </p>
                    {pauseTiming.avgMs !== 0 && (
                      <button
                        type="button"
                        onClick={applyPauseSync}
                        className="cursor-pointer rounded-full bg-[#6C63FF] px-3.5 py-1 font-mono text-xs font-bold text-white hover:bg-[#5b52f0]"
                      >
                        타격 싱크에 적용
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
            <div className="w-full rounded-xl border border-white/10 bg-[#1C1E24]/90 p-3.5">
              <PauseRow
                label="노트 속도"
                value={`x${liveUi.speed.toFixed(1)}`}
                onMinus={() => change({ speed: clamp(round1(liveUi.speed - 0.1), 1, 8) })}
                onPlus={() => change({ speed: clamp(round1(liveUi.speed + 0.1), 1, 8) })}
              />
              {!calibration && (
                <>
                  <PauseRow
                    label="음악 싱크"
                    value={`${liveUi.offset > 0 ? "+" : ""}${liveUi.offset}ms`}
                    onMinus={() => change({ offset: clamp(liveUi.offset - 1, -400, 400) })}
                    onPlus={() => change({ offset: clamp(liveUi.offset + 1, -400, 400) })}
                  />
                  <PauseRow
                    label="타격 싱크"
                    value={`${liveUi.judge > 0 ? "+" : ""}${liveUi.judge}ms`}
                    onMinus={() => change({ judge: clamp(liveUi.judge - 1, -400, 400) })}
                    onPlus={() => change({ judge: clamp(liveUi.judge + 1, -400, 400) })}
                  />
                </>
              )}
              <PauseSlider
                label="음악 볼륨"
                value={liveUi.music}
                onChange={(v) => change({ music: v })}
              />
              <PauseSlider
                label="타격음 볼륨"
                value={liveUi.hit}
                onChange={(v) => change({ hit: v })}
              />
            </div>
            <div className="mt-1 flex flex-wrap justify-center gap-2">
              <button type="button" className={btn} onClick={() => ctrl.current.resume()}>
                계속하기 (Esc)
              </button>
              <button type="button" className={btn} onClick={onRestart}>
                처음부터
              </button>
              <button type="button" className={btn} onClick={onQuit}>
                곡 선택으로
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** 0~1 투명도 → "#rrggbb" 뒤에 붙일 두 자리 16진수 */
const hex2 = (a: number) =>
  Math.round(Math.max(0, Math.min(1, a)) * 255)
    .toString(16)
    .padStart(2, "0");

// ───────────────────────── 카운트다운 ─────────────────────────

interface Phase {
  label: string;
  from: number;
  dur: number;
  color: string;
  size: number;
  beep?: number;
}

function countdownPhases(accent: string): Phase[] {
  const list: Omit<Phase, "from">[] = [
    { label: "READY", dur: 1.2, color: "#FFFFFF", size: 54 },
    { label: "3", dur: 0.7, color: "#60A5FA", size: 120, beep: 660 },
    { label: "2", dur: 0.7, color: "#FBBF24", size: 120, beep: 660 },
    { label: "1", dur: 0.7, color: "#F43F5E", size: 120, beep: 660 },
    { label: "GO!", dur: 0.6, color: accent, size: 96, beep: 1320 },
  ];
  let from = 0;
  return list.map((p) => {
    const out = { ...p, from };
    from += p.dur;
    return out;
  });
}

const easeOutBack = (x: number) => {
  const c1 = 1.9;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

/** s: 시작 후 흐른 시간(초) */
function drawCountdown(
  g: CanvasRenderingContext2D,
  phases: Phase[],
  s: number,
  W: number,
  H: number
) {
  const ph = phases.find((p) => s >= p.from && s < p.from + p.dur);
  if (!ph) return;
  const p = (s - ph.from) / ph.dur;
  const cx = W / 2;
  const cy = H * 0.4;
  const go = ph.label === "GO!";

  g.save();
  // 숫자 동안은 화면을 살짝 어둡게
  if (!go) {
    g.fillStyle = "rgba(0,0,0,0.35)";
    g.fillRect(0, 0, W, H);
  }

  // 퍼지는 링
  g.globalAlpha = Math.max(0, 1 - p) * 0.7;
  g.strokeStyle = ph.color;
  g.lineWidth = go ? 6 : 4;
  g.beginPath();
  g.arc(
    cx,
    cy,
    30 + easeOutBack(Math.min(1, p * 1.4)) * (go ? W * 0.55 : W * 0.32),
    0,
    Math.PI * 2
  );
  g.stroke();

  if (ph.label === "READY") {
    // 가로로 번쩍이는 띠 + 글자가 옆에서 미끄러져 들어옴
    const band = g.createLinearGradient(0, 0, W, 0);
    band.addColorStop(0, "rgba(108,99,255,0)");
    band.addColorStop(0.5, "rgba(108,99,255,0.45)");
    band.addColorStop(1, "rgba(108,99,255,0)");
    g.globalAlpha = p < 0.85 ? 1 : (1 - p) / 0.15;
    g.fillStyle = band;
    const bh = 90 * Math.min(1, p * 5);
    g.fillRect(0, cy - bh / 2, W, bh);
  }

  // 글자: 크게 튀어나왔다가 제자리로(오버슈트), 끝에서 흐려짐
  const pop = Math.min(1, p / 0.22);
  const scale = ph.label === "READY" ? 1 : 2.2 - 1.2 * easeOutBack(pop);
  const slide = ph.label === "READY" ? (1 - easeOutBack(Math.min(1, p / 0.3))) * -W * 0.6 : 0;
  const alpha = p > 0.78 ? Math.max(0, 1 - (p - 0.78) / 0.22) : Math.min(1, p / 0.08);
  g.globalAlpha = alpha;
  g.translate(cx + slide, cy);
  g.scale(scale, scale);
  g.font = `900 ${ph.size}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.shadowColor = ph.color;
  g.shadowBlur = 28;
  g.fillStyle = ph.color;
  g.fillText(ph.label, 0, 0);
  g.shadowBlur = 0;
  g.fillText(ph.label, 0, 0);
  g.restore();
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const round1 = (v: number) => Math.round(v * 10) / 10;
const fmtScore = (n: number) =>
  String(n)
    .padStart(7, "0")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

function roundRectFill(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
}

const stepBtn =
  "h-7 w-7 shrink-0 cursor-pointer rounded-full border border-white/15 font-mono text-sm text-white/70 hover:border-[#6C63FF]/60 hover:text-white";

/** 일시정지 화면: − 값 + (꾹 누르면 연속) */
function PauseRow({
  label,
  value,
  onMinus,
  onPlus,
}: {
  label: string;
  value: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="w-20 shrink-0 font-mono text-xs text-white/55">{label}</span>
      <HoldButton className={stepBtn} onStep={onMinus}>
        −
      </HoldButton>
      <span className="flex-1 text-center font-mono text-sm text-white">{value}</span>
      <HoldButton className={stepBtn} onStep={onPlus}>
        +
      </HoldButton>
    </div>
  );
}

function PauseSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="w-20 shrink-0 font-mono text-xs text-white/55">{label}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="min-w-0 flex-1 accent-[#6C63FF]"
      />
      <span className="w-9 text-right font-mono text-xs text-white">
        {value === 0 ? "끔" : Math.round(value * 100)}
      </span>
    </div>
  );
}

/** HP가 바닥났을 때: 화면이 붉게 어두워지고 FAILED가 쾅 */
function drawFailed(g: CanvasRenderingContext2D, el: number, gx: number, W: number, H: number) {
  const CWd = gx * 2 + W;
  g.save();
  // 흑백처럼 어둡게 + 붉은 기
  g.globalAlpha = Math.min(1, el / 0.5) * 0.7;
  g.fillStyle = "#12020a";
  g.fillRect(0, 0, CWd, H);
  // 친 순간 붉은 번쩍임
  if (el < 0.25) {
    g.globalAlpha = (1 - el / 0.25) * 0.5;
    g.fillStyle = "#F43F5E";
    g.fillRect(0, 0, CWd, H);
  }
  const p = Math.min(1, Math.max(0, (el - 0.35) / 0.25));
  if (p > 0) {
    const sc = 2.4 - 1.4 * easeOutBack(p);
    const shake = el < 0.9 ? Math.sin(el * 70) * 6 * (1 - (el - 0.35) / 0.55) : 0;
    g.globalAlpha = Math.min(1, p * 1.5);
    g.translate(CWd / 2 + shake, H * 0.42);
    g.scale(sc, sc);
    g.font = "900 64px ui-monospace, SFMono-Regular, Menlo, monospace";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.shadowColor = "#F43F5E";
    g.shadowBlur = 30;
    g.fillStyle = "#F43F5E";
    g.fillText("FAILED", 0, 0);
    g.shadowBlur = 0;
    g.fillStyle = "#FFE4E6";
    g.fillText("FAILED", 0, 0);
    g.globalAlpha = Math.min(1, Math.max(0, (el - 0.8) / 0.3));
    g.font = "700 14px ui-monospace, monospace";
    g.fillStyle = "rgba(255,255,255,0.7)";
    g.fillText("HP가 바닥났어요", 0, 52);
  }
  g.restore();
}
