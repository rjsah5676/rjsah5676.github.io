"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import tm1 from "@/img/melongame/tm1.png";
import tm2 from "@/img/melongame/tm2.png";
import tm3 from "@/img/melongame/tm3.png";
import tm4 from "@/img/melongame/tm4.png";
import tm5 from "@/img/melongame/tm5.png";
import tm6 from "@/img/melongame/tm6.png";
import tm7 from "@/img/melongame/tm7.png";
import tm8 from "@/img/melongame/tm8.png";
import tm9 from "@/img/melongame/tm9.png";
import tmT from "@/img/melongame/tm_t.png";
import tmMain from "@/img/melongame/mainMelon.png";
import bbyongSound from "@/sounds/melongame/bbyong.mp3";
import bgmSound from "@/sounds/melongame/bgm.mp3";
import endSound from "@/sounds/melongame/endbgm.mp3";
import "@/css/Page/melon.css";
import { getTopMelonScores, addMelonScore, type MelonScore } from "@/firestore/melonGame";
import {
  CELL,
  COLS,
  ROWS,
  TICK_MS,
  TIME_START,
  TIME_STEP,
  TOTAL_SEC,
  cellsIn,
  createBoard,
  isClear,
  rangeOf,
  type Board,
  type Range,
} from "@/lib/melon/logic";

const MELON_SRC = [tm1, tm2, tm3, tm4, tm5, tm6, tm7, tm8, tm9].map((m) => m.src);

/** 판 바깥 여백(논리 좌표) */
const PAD = 20;
const W = COLS * CELL + PAD * 2;
const H = ROWS * CELL + PAD * 2;
const GRAVITY = 2600; // px/s²

type Phase = "menu" | "play" | "over";

interface Faller {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  v: number;
  age: number;
}
interface Drop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  r: number;
}
interface Floater {
  x: number;
  y: number;
  text: string;
  age: number;
}
interface Flash {
  g: Range;
  age: number;
}

const VOL_KEY = "melon:volume";
interface Volume {
  bgm: number;
  sfx: number;
}
const DEFAULT_VOL: Volume = { bgm: 0.7, sfx: 0.5 };

function loadVolume(): Volume {
  try {
    const v = JSON.parse(localStorage.getItem(VOL_KEY) ?? "null");
    if (v && typeof v.bgm === "number" && typeof v.sfx === "number") return v;
  } catch {}
  return DEFAULT_VOL;
}

export default function MelonGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("menu");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_START);
  const [ready, setReady] = useState(false);
  const [vol, setVol] = useState<Volume>(DEFAULT_VOL);
  const [volOpen, setVolOpen] = useState(false);
  const [ranks, setRanks] = useState<MelonScore[] | null>(null);
  const [name, setName] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "sending" | "done" | "error">("idle");

  // 게임 루프에서 쓰는 값은 ref로 (렌더와 무관하게 최신값)
  const phaseRef = useRef<Phase>("menu");
  const boardRef = useRef<Board>([]);
  const timeRef = useRef(TIME_START);
  const scoreRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const layerDirty = useRef(true);
  const drag = useRef<{
    id: number;
    ax: number;
    ay: number;
    bx: number;
    by: number;
    moved: boolean;
  } | null>(null);
  const fx = useRef({
    fallers: [] as Faller[],
    drops: [] as Drop[],
    floaters: [] as Floater[],
    flash: null as Flash | null,
  });
  const imgs = useRef<HTMLImageElement[]>([]);
  const ring = useRef<HTMLImageElement | null>(null);
  const audio = useRef<{
    bbyong: HTMLAudioElement;
    bgm: HTMLAudioElement;
    end: HTMLAudioElement;
  } | null>(null);

  const loadRanks = useCallback(() => {
    getTopMelonScores(10)
      .then(setRanks)
      .catch(() => setRanks([]));
  }, []);

  // ── 이미지·소리 준비 ──
  useEffect(() => {
    let left = MELON_SRC.length + 1;
    const done = () => {
      layerDirty.current = true; // 다 불러오기 전에 그린 판이 비어 보이지 않게
      left -= 1;
      if (left === 0) setReady(true);
    };
    imgs.current = MELON_SRC.map((src) => {
      const im = new Image();
      im.onload = done;
      im.onerror = done;
      im.src = src;
      return im;
    });
    const r = new Image();
    r.onload = done;
    r.onerror = done;
    r.src = tmT.src;
    ring.current = r;

    const bgm = new Audio(bgmSound);
    bgm.loop = true;
    audio.current = { bbyong: new Audio(bbyongSound), bgm, end: new Audio(endSound) };
    const v = loadVolume();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 저장된 볼륨은 마운트 후에만 읽을 수 있음
    setVol(v);

    // 처음 들어오면 사이트 헤더 아래에 묻히지 않게 게임 영역으로 내려줌
    const scrollId = setTimeout(
      () => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      350
    );

    boardRef.current = createBoard(); // 메뉴 뒤에 깔리는 장식용 판
    layerDirty.current = true;
    loadRanks();

    return () => {
      clearTimeout(scrollId);
      if (timerRef.current) clearTimeout(timerRef.current);
      const a = audio.current;
      if (a)
        [a.bgm, a.end].forEach((el) => {
          el.pause();
          el.currentTime = 0;
        });
    };
  }, [loadRanks]);

  // 볼륨 반영·저장
  useEffect(() => {
    const a = audio.current;
    if (a) {
      a.bgm.volume = vol.bgm;
      a.end.volume = vol.bgm;
      a.bbyong.volume = vol.sfx;
    }
    try {
      localStorage.setItem(VOL_KEY, JSON.stringify(vol));
    } catch {}
  }, [vol]);

  // ── 그리기 루프 ──
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const layer = document.createElement("canvas");
    const lctx = layer.getContext("2d")!;
    let dpr = 0;
    let raf = 0;
    let last = performance.now();

    const fitDpr = () => {
      const d = Math.min(2, window.devicePixelRatio || 1);
      if (d === dpr) return;
      dpr = d;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      layer.width = W * dpr;
      layer.height = H * dpr;
      layerDirty.current = true;
    };

    /** 판(배경 + 남은 멜론)은 바뀔 때만 다시 그려 둠 */
    const drawLayer = () => {
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lctx.clearRect(0, 0, W, H);
      const bg = lctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#14261C");
      bg.addColorStop(1, "#0E1A14");
      lctx.fillStyle = bg;
      lctx.fillRect(0, 0, W, H);
      // 빈 칸 자리 표시
      lctx.fillStyle = "rgba(255,255,255,0.035)";
      for (let c = 0; c < COLS; c++)
        for (let r = 0; r < ROWS; r++) {
          lctx.beginPath();
          lctx.arc(
            PAD + c * CELL + CELL / 2,
            PAD + r * CELL + CELL / 2,
            CELL * 0.36,
            0,
            Math.PI * 2
          );
          lctx.fill();
        }
      const b = boardRef.current;
      for (let c = 0; c < b.length; c++)
        for (let r = 0; r < ROWS; r++) {
          const v = b[c][r];
          const im = imgs.current[v - 1];
          if (v && im?.complete) lctx.drawImage(im, PAD + c * CELL, PAD + r * CELL, CELL, CELL);
        }
      layerDirty.current = false;
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      fitDpr();
      if (layerDirty.current) drawLayer();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(layer, 0, 0, W, H);

      // 드래그 선택
      const d = drag.current;
      if (d && d.moved && phaseRef.current === "play") {
        const g = rangeOf(d.ax - PAD, d.ay - PAD, d.bx - PAD, d.by - PAD);
        for (const { c, r } of cellsIn(boardRef.current, g))
          if (ring.current) ctx.drawImage(ring.current, PAD + c * CELL, PAD + r * CELL, CELL, CELL);
        const x = Math.min(d.ax, d.bx);
        const y = Math.min(d.ay, d.by);
        const w = Math.abs(d.bx - d.ax);
        const h = Math.abs(d.by - d.ay);
        ctx.fillStyle = "rgba(250,204,21,0.14)";
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = "rgba(250,204,21,0.9)";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(x, y, w, h);
        ctx.setLineDash([]);
      }

      const F = fx.current;
      // 합이 안 맞았을 때 선택 칸이 잠깐 붉게
      if (F.flash) {
        F.flash.age += dt;
        const a = 1 - F.flash.age / 0.35;
        if (a <= 0) F.flash = null;
        else {
          const g = F.flash.g;
          const c0 = Math.max(0, g.c0);
          const r0 = Math.max(0, g.r0);
          const c1 = Math.min(COLS - 1, g.c1);
          const r1 = Math.min(ROWS - 1, g.r1);
          if (c1 >= c0 && r1 >= r0) {
            ctx.fillStyle = `rgba(244,63,94,${0.22 * a})`;
            ctx.fillRect(
              PAD + c0 * CELL,
              PAD + r0 * CELL,
              (c1 - c0 + 1) * CELL,
              (r1 - r0 + 1) * CELL
            );
          }
        }
      }

      // 터진 과즙 방울
      F.drops = F.drops.filter((p) => (p.age += dt) < p.life);
      for (const p of F.drops) {
        p.vy += GRAVITY * 0.5 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        ctx.globalAlpha = 1 - p.age / p.life;
        ctx.fillStyle = "#B6F36A";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 톡 튀어 오르며 커졌다가 돌면서 떨어지는 멜론
      F.fallers = F.fallers.filter((m) => m.y < H + CELL * 2);
      for (const m of F.fallers) {
        m.age += dt;
        const pop = m.age < 0.09;
        if (!pop) {
          m.vy += GRAVITY * dt;
          m.x += m.vx * dt;
          m.y += m.vy * dt;
          m.rot += m.vr * dt;
        }
        const s = pop ? 1 + (m.age / 0.09) * 0.28 : Math.max(0.6, 1.28 - (m.age - 0.09) * 0.9);
        const im = imgs.current[m.v - 1];
        if (!im) continue;
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(m.rot);
        ctx.globalAlpha = Math.max(0, Math.min(1, 1.4 - m.age));
        ctx.drawImage(im, (-CELL / 2) * s, (-CELL / 2) * s, CELL * s, CELL * s);
        ctx.restore();
      }

      // +점수
      F.floaters = F.floaters.filter((f) => (f.age += dt) < 0.9);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const f of F.floaters) {
        const k = f.age / 0.9;
        ctx.globalAlpha = 1 - k * k;
        ctx.font = `${Math.round(30 + (1 - k) * 6)}px Jua, sans-serif`;
        ctx.lineWidth = 5;
        ctx.strokeStyle = "rgba(10,30,18,0.85)";
        ctx.strokeText(f.text, f.x, f.y - k * 46);
        ctx.fillStyle = "#FDE047";
        ctx.fillText(f.text, f.x, f.y - k * 46);
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ── 진행 ──
  const stopTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const finish = () => {
    stopTimer();
    phaseRef.current = "over";
    setPhase("over");
    drag.current = null;
    const a = audio.current;
    if (a) {
      a.bgm.pause();
      a.bgm.currentTime = 0;
      a.end.currentTime = 0;
      a.end.play().catch(() => {});
    }
  };

  // 예전과 같게: 시작하자마자 한 번 줄고, 이후 100ms마다 0.11씩 → 0 밑이면 끝
  const tick = () => {
    timeRef.current -= TIME_STEP;
    setTimeLeft(timeRef.current);
    if (timeRef.current < 0) return finish();
    timerRef.current = setTimeout(tick, TICK_MS);
  };

  const start = () => {
    if (!ready) return;
    stopTimer();
    boardRef.current = createBoard();
    layerDirty.current = true;
    fx.current = { fallers: [], drops: [], floaters: [], flash: null };
    scoreRef.current = 0;
    setScore(0);
    timeRef.current = TIME_START;
    setName("");
    setSubmitState("idle");
    phaseRef.current = "play";
    setPhase("play");
    const a = audio.current;
    if (a) {
      a.end.pause();
      a.bgm.currentTime = 0;
      a.bgm.play().catch(() => {});
    }
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    tick();
  };

  const quit = () => {
    stopTimer();
    drag.current = null;
    phaseRef.current = "menu";
    setPhase("menu");
    const a = audio.current;
    if (a)
      [a.bgm, a.end].forEach((el) => {
        el.pause();
        el.currentTime = 0;
      });
  };

  // ── 입력 ──
  const toLogical = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (phaseRef.current !== "play") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = toLogical(e);
    drag.current = { id: e.pointerId, ax: p.x, ay: p.y, bx: p.x, by: p.y, moved: false };
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const p = toLogical(e);
    d.bx = p.x;
    d.by = p.y;
    d.moved = true;
  };
  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    // 움직이지 않고 뗀 클릭은 아무 일도 없음 (예전에도 결과가 바뀌지 않음)
    if (!d.moved || phaseRef.current !== "play") return;
    const g = rangeOf(d.ax - PAD, d.ay - PAD, d.bx - PAD, d.by - PAD);
    const cells = cellsIn(boardRef.current, g);
    const sum = cells.reduce((s, c) => s + c.v, 0);
    if (!isClear(sum)) {
      if (cells.length) fx.current.flash = { g, age: 0 };
      return;
    }
    const F = fx.current;
    let cx = 0;
    let cy = 0;
    for (const { c, r, v } of cells) {
      boardRef.current[c][r] = 0;
      const x = PAD + c * CELL + CELL / 2;
      const y = PAD + r * CELL + CELL / 2;
      cx += x;
      cy += y;
      F.fallers.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 260,
        vy: -(420 + Math.random() * 320),
        rot: 0,
        vr: (Math.random() - 0.5) * 9,
        v,
        age: 0,
      });
      for (let i = 0; i < 5; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 120 + Math.random() * 220;
        F.drops.push({
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 80,
          age: 0,
          life: 0.35 + Math.random() * 0.3,
          r: 1.5 + Math.random() * 2.5,
        });
      }
    }
    F.floaters.push({
      x: cx / cells.length,
      y: cy / cells.length,
      text: `+${cells.length}`,
      age: 0,
    });
    layerDirty.current = true;
    scoreRef.current += cells.length;
    setScore(scoreRef.current);
    const a = audio.current;
    if (a) {
      a.bbyong.currentTime = 0;
      a.bbyong.play().catch(() => {});
    }
  };
  const onCancel = () => {
    drag.current = null;
  };

  // ── 랭킹 ──
  const tenth = ranks && ranks.length >= 10 ? ranks[9].score : 0;
  const qualifies = phase === "over" && ranks !== null && score > tenth;
  const submit = async () => {
    const n = name.trim();
    if (n.length < 1 || n.length > 9 || submitState === "sending") return;
    setSubmitState("sending");
    try {
      await addMelonScore(n, score);
      setSubmitState("done");
      loadRanks();
    } catch {
      setSubmitState("error");
    }
  };

  const secLeft = Math.max(0, (timeLeft / TIME_STEP) * (TICK_MS / 1000));
  const ratio = Math.max(0, Math.min(1, timeLeft / TIME_START));
  const low = phase === "play" && secLeft <= 10;

  const btn =
    "cursor-pointer rounded-full px-6 py-2.5 font-['Jua',sans-serif] text-lg transition-transform hover:-translate-y-0.5 disabled:cursor-default disabled:opacity-50";

  return (
    <div className="mx-auto max-w-[920px] px-4 pt-6 pb-24">
      {/* 고정 헤더+메뉴(약 100px) 아래로 맞춰 스크롤, 판이 한 화면에 다 들어오게 폭 제한 */}
      <div
        ref={topRef}
        className="mx-auto scroll-mt-[108px]"
        style={{ maxWidth: `max(320px, min(100%, calc((100svh - 250px) * ${W / H})))` }}
      >
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <div className="font-mono text-sm text-[#8B84FF]">멜론 게임</div>
            <p className="mt-1 font-['Nanum_Gothic',sans-serif] text-sm text-white/50">
              드래그로 묶은 숫자 합이 <b className="text-white/80">10</b> 또는{" "}
              <b className="text-white/80">20</b>이면 터져요
            </p>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setVolOpen((v) => !v)}
              aria-label="볼륨"
              aria-expanded={volOpen}
              className="cursor-pointer rounded-full border border-white/10 bg-[#1C1E24] px-3 py-1.5 font-mono text-sm whitespace-nowrap text-white/70 hover:text-white"
            >
              {vol.bgm === 0 && vol.sfx === 0 ? "🔇" : "🔊"} 볼륨
            </button>
            {volOpen && (
              <div className="absolute top-full right-0 z-30 mt-2 w-56 rounded-2xl border border-white/10 bg-[#1C1E24] p-4 shadow-2xl">
                {(
                  [
                    ["bgm", "배경음악"],
                    ["sfx", "효과음"],
                  ] as const
                ).map(([k, label]) => (
                  <label key={k} className="mb-3 block last:mb-0">
                    <span className="mb-1 flex justify-between font-mono text-xs text-white/50">
                      {label}
                      <span className="text-white/80">{Math.round(vol[k] * 100)}</span>
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={vol[k]}
                      onChange={(e) => setVol((v) => ({ ...v, [k]: Number(e.target.value) }))}
                      className="w-full accent-[#9BE15D]"
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 점수·시간 */}
        <div className="mb-3 flex items-center gap-4 rounded-2xl border border-white/10 bg-[#1C1E24] px-4 py-3">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs text-white/40">SCORE</span>
            <span
              key={score}
              className="melon-bump font-['Jua',sans-serif] text-3xl text-[#B6F36A]"
            >
              {score}
            </span>
          </div>
          <div className="flex-1">
            <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-[width] duration-100 ease-linear ${
                  low ? "bg-[#F43F5E]" : ratio < 0.35 ? "bg-[#FBBF24]" : "bg-[#9BE15D]"
                }`}
                style={{ width: `${(phase === "menu" ? 1 : ratio) * 100}%` }}
              />
            </div>
          </div>
          <span
            className={`w-12 text-right font-mono text-sm tabular-nums ${low ? "text-[#F43F5E]" : "text-white/60"}`}
          >
            {phase === "menu" ? Math.round(TOTAL_SEC) : Math.ceil(secLeft)}s
          </span>
          {phase === "play" && (
            <button
              type="button"
              onClick={quit}
              className="cursor-pointer rounded-full border border-white/10 px-3 py-1 font-mono text-xs text-white/50 hover:text-white"
            >
              그만하기
            </button>
          )}
        </div>

        {/* 판 */}
        <div className="relative overflow-hidden rounded-3xl border border-[#9BE15D]/20 shadow-[0_30px_80px_-30px_rgba(155,225,93,0.35)]">
          <canvas
            ref={canvasRef}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onCancel}
            onContextMenu={(e) => e.preventDefault()}
            className="block w-full touch-none select-none"
            style={{ aspectRatio: `${W} / ${H}` }}
          />

          {phase === "menu" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0B140F]/80 p-4 text-center backdrop-blur-[2px]">
              <img
                src={tmMain.src}
                alt=""
                draggable={false}
                className="melon-float h-[22%] min-h-16 w-auto drop-shadow-[0_12px_30px_rgba(155,225,93,0.35)]"
              />
              <h1 className="font-['Jua',sans-serif] text-4xl text-[#B6F36A] sm:text-6xl">
                멜론 게임
              </h1>
              <button
                type="button"
                onClick={start}
                disabled={!ready}
                className={`${btn} bg-[#9BE15D] px-10 text-[#0E1A14] shadow-[0_10px_30px_-8px_rgba(155,225,93,0.8)]`}
              >
                {ready ? "시작하기" : "불러오는 중…"}
              </button>
            </div>
          )}

          {phase === "over" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-y-auto bg-[#0B140F]/85 p-4 text-center backdrop-blur-sm">
              <div className="font-mono text-xs tracking-[0.3em] text-white/50">TIME UP</div>
              <div className="melon-pop font-['Jua',sans-serif] text-6xl text-[#B6F36A] sm:text-7xl">
                {score}
                <span className="ml-1 text-2xl text-white/60">점</span>
              </div>
              {qualifies && submitState !== "done" && (
                <form
                  className="flex flex-col items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    submit();
                  }}
                >
                  <p className="font-['Nanum_Gothic',sans-serif] text-sm text-white/70">
                    10위 안에 들었어요! 이름을 남겨주세요
                  </p>
                  <div className="flex gap-2">
                    <input
                      value={name}
                      maxLength={9}
                      autoFocus
                      onChange={(e) => setName(e.target.value)}
                      placeholder="1~9글자"
                      className="w-36 rounded-full border border-white/15 bg-[#1C1E24] px-4 py-2 text-center text-white focus:border-[#9BE15D]/60 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!name.trim() || submitState === "sending"}
                      className="cursor-pointer rounded-full bg-[#9BE15D] px-5 py-2 font-mono text-sm font-bold text-[#0E1A14] disabled:cursor-default disabled:opacity-40"
                    >
                      {submitState === "sending" ? "등록 중" : "등록"}
                    </button>
                  </div>
                  {submitState === "error" && (
                    <p className="font-mono text-xs text-[#F43F5E]">
                      등록에 실패했어요. 다시 눌러주세요.
                    </p>
                  )}
                </form>
              )}
              {submitState === "done" && (
                <p className="font-['Nanum_Gothic',sans-serif] text-sm text-[#B6F36A]">
                  랭킹에 등록했어요!
                </p>
              )}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={start}
                  className={`${btn} bg-[#9BE15D] text-[#0E1A14]`}
                >
                  다시하기
                </button>
                <button
                  type="button"
                  onClick={quit}
                  className={`${btn} border border-white/15 text-white/80`}
                >
                  처음으로
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 랭킹·방법 */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-[#1C1E24] p-5">
          <h2 className="mb-3 font-mono text-sm font-bold text-white">랭킹 TOP 10</h2>
          {ranks === null ? (
            <p className="font-mono text-xs text-white/30">불러오는 중…</p>
          ) : ranks.length === 0 ? (
            <p className="font-mono text-xs text-white/30">아직 기록이 없어요</p>
          ) : (
            <ol className="flex flex-col gap-1.5">
              {ranks.map((r, i) => (
                <li key={i} className="flex items-center gap-3 font-mono text-sm">
                  <span
                    className={`w-6 text-right ${i === 0 ? "text-[#FDE047]" : i === 1 ? "text-[#E5E7EB]" : i === 2 ? "text-[#F59E0B]" : "text-white/35"}`}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate text-white/80">{r.name}</span>
                  <span className="text-[#B6F36A]">{r.score}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
        <section className="rounded-2xl border border-white/10 bg-[#1C1E24] p-5 font-['Nanum_Gothic',sans-serif] text-sm leading-relaxed text-white/60">
          <h2 className="mb-3 font-mono text-sm font-bold text-white">게임 방법</h2>
          <ul className="flex flex-col gap-1.5">
            <li>· 드래그로 사각형을 그려 멜론을 묶어요</li>
            <li>· 숫자 합이 10 또는 20이면 묶인 멜론이 터지고, 터진 개수만큼 점수</li>
            <li>· 제한 시간은 약 2분, 10위 안에 들면 이름을 남길 수 있어요</li>
            <li>· 모바일은 손가락으로 드래그</li>
          </ul>
          <p className="mt-4 font-mono text-[11px] text-white/30">
            개발 lee gm · 디자인 tae hb · 음악 lee sh
          </p>
        </section>
      </div>
    </div>
  );
}
