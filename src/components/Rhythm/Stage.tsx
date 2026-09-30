"use client";

import { useEffect, useRef, useState } from "react";
import type { Song } from "@/lib/rhythm/music";
import type { Chart, Difficulty } from "@/lib/rhythm/chart";
import { Engine, rankOf, type Judge } from "@/lib/rhythm/engine";

export const KEY_CODES = ["KeyD", "KeyF", "KeyJ", "KeyK"];
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
}

const JUDGE_STYLE: Record<Judge, { text: string; color: string }> = {
  perfect: { text: "PERFECT", color: "#7DF9FF" },
  great: { text: "GREAT", color: "#4ADE80" },
  good: { text: "GOOD", color: "#FBBF24" },
  miss: { text: "MISS", color: "#F87171" },
};

/** 스크롤 속도 1.0 → 노트가 2.4초 동안 내려옴 */
export const visibleSec = (speed: number) => 2.4 / speed;

interface Props {
  song: Song;
  diff: Difficulty;
  chart: Chart;
  buffer: AudioBuffer;
  ctx: AudioContext;
  speed: number;
  /** ms, +면 노트가 늦게 옴 */
  offset: number;
  onFinish: (result: Result) => void;
  onQuit: () => void;
  onRestart: () => void;
}

export default function Stage({
  song,
  diff,
  chart,
  buffer,
  ctx,
  speed,
  offset,
  onFinish,
  onQuit,
  onRestart,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paused, setPaused] = useState(false);
  // 일시정지·재개를 effect 밖(버튼)에서도 부르기 위해
  const ctrl = useRef<{ pause: () => void; resume: () => void }>({
    pause: () => {},
    resume: () => {},
  });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    const g = canvas.getContext("2d")!;
    const engine = new Engine(chart);
    const vis = visibleSec(speed);
    const leadIn = Math.max(1.6, vis + 0.6);
    const lanePointer = new Map<number, number>();

    let W = 0;
    let H = 0;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.min(wrap.clientWidth, 460);
      H = Math.max(420, Math.min(window.innerHeight - 170, 760));
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // 오디오 시작
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    const startAt = ctx.currentTime + leadIn;
    src.start(startAt);
    let stopped = false;

    const now = () =>
      ctx.currentTime -
      startAt -
      ((ctx as AudioContext & { outputLatency?: number }).outputLatency ?? 0) -
      (ctx.baseLatency ?? 0) -
      offset / 1000;

    // 화면 효과용 상태
    let lastJudge: { judge: Judge; at: number; diff?: number } | null = null;
    const flashes: { lane: number; at: number; judge: Judge }[] = [];
    let drawFrom = 0;
    const laneColor = (l: number) => (l === 1 || l === 2 ? song.color : "#E6E8EF");
    const songEnd = song.duration - 2.5;

    const draw = (t: number) => {
      const laneW = W / 4;
      const judgeY = H - 92;
      g.clearRect(0, 0, W, H);
      g.fillStyle = "#0E1015";
      g.fillRect(0, 0, W, H);
      for (let l = 0; l < 4; l++) {
        g.fillStyle = l % 2 ? "#12141A" : "#101217";
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
      while (drawFrom < engine.notes.length && engine.notes[drawFrom].t < t - 4) drawFrom++;
      for (let i = drawFrom; i < engine.notes.length; i++) {
        const n = engine.notes[i];
        if (n.t > t + vis + 0.1) break;
        const x = n.lane * laneW;
        const c = laneColor(n.lane);
        if (n.end) {
          if (n.tail === "perfect") continue;
          const dead = n.head === "miss" || n.tail === "miss";
          const yHead = n.holding ? judgeY : yOf(n.t);
          const yTail = Math.max(-20, yOf(n.end));
          if (yTail > H) continue;
          g.globalAlpha = dead ? 0.25 : n.holding ? 0.85 : 0.6;
          g.fillStyle = dead ? "#555" : c;
          g.fillRect(x + laneW * 0.22, yTail, laneW * 0.56, Math.max(0, yHead - yTail));
          g.globalAlpha = dead ? 0.35 : 1;
          g.fillRect(x + laneW * 0.22, yTail - 3, laneW * 0.56, 6);
          g.fillStyle = dead ? "#666" : c;
          roundRect(g, x + 4, yHead - 8, laneW - 8, 16, 4);
          g.globalAlpha = 1;
        } else {
          if (n.head && n.head !== "miss") continue;
          const y = yOf(n.t);
          if (y > H + 20) continue;
          g.globalAlpha = n.head === "miss" ? 0.3 : 1;
          g.fillStyle = c;
          roundRect(g, x + 4, y - 8, laneW - 8, 16, 4);
          g.globalAlpha = 1;
        }
      }

      // 판정선
      g.fillStyle = "rgba(255,255,255,0.85)";
      g.fillRect(0, judgeY - 1.5, W, 3);

      // 타격 효과
      for (let k = flashes.length - 1; k >= 0; k--) {
        const f = flashes[k];
        const age = t - f.at;
        if (age > 0.22 || age < -0.5) {
          flashes.splice(k, 1);
          continue;
        }
        const p = Math.max(0, age) / 0.22;
        g.globalAlpha = 1 - p;
        g.strokeStyle = JUDGE_STYLE[f.judge].color;
        g.lineWidth = 3;
        const cx = f.lane * laneW + laneW / 2;
        const r = laneW * (0.25 + p * 0.35);
        g.strokeRect(cx - r, judgeY - r * 0.55, r * 2, r * 1.1);
        g.globalAlpha = 1;
      }

      // 키 표시
      for (let l = 0; l < 4; l++) {
        const on = engine.pressed[l];
        g.fillStyle = on ? `${laneColor(l)}40` : "rgba(255,255,255,0.03)";
        g.fillRect(l * laneW + 3, judgeY + 14, laneW - 6, H - judgeY - 20);
        g.fillStyle = on ? "#fff" : "rgba(255,255,255,0.35)";
        g.font = "700 18px ui-monospace, SFMono-Regular, Menlo, monospace";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText(KEY_LABELS[l], l * laneW + laneW / 2, judgeY + 14 + (H - judgeY - 20) / 2);
      }

      // 판정·콤보
      if (lastJudge && t - lastJudge.at < 0.6) {
        const s = JUDGE_STYLE[lastJudge.judge];
        const pop = Math.min(1, (t - lastJudge.at) / 0.06);
        g.fillStyle = s.color;
        g.font = `800 ${Math.round(22 + 6 * (1 - pop))}px ui-monospace, SFMono-Regular, Menlo, monospace`;
        g.fillText(s.text, W / 2, H * 0.4);
        if (
          lastJudge.diff !== undefined &&
          (lastJudge.judge === "great" || lastJudge.judge === "good")
        ) {
          g.font = "600 11px ui-monospace, monospace";
          g.fillStyle = "rgba(255,255,255,0.55)";
          g.fillText(lastJudge.diff < 0 ? "FAST" : "SLOW", W / 2, H * 0.4 - 24);
        }
      }
      if (engine.combo >= 2) {
        g.fillStyle = "rgba(255,255,255,0.9)";
        g.font = "800 40px ui-monospace, SFMono-Regular, Menlo, monospace";
        g.fillText(String(engine.combo), W / 2, H * 0.4 + 40);
        g.font = "600 10px ui-monospace, monospace";
        g.fillStyle = "rgba(255,255,255,0.4)";
        g.fillText("COMBO", W / 2, H * 0.4 + 66);
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
      g.fillText(
        String(engine.score)
          .padStart(7, "0")
          .replace(/\B(?=(\d{3})+(?!\d))/g, ","),
        W - 10,
        12
      );
      if (t < 0) {
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillStyle = "rgba(255,255,255,0.5)";
        g.font = "600 13px ui-monospace, monospace";
        g.fillText("READY", W / 2, H * 0.3);
      }
    };

    let raf = 0;
    let running = true;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      running = false;
      const acc = engine.accuracy;
      onFinish({
        songId: song.id,
        diff,
        score: engine.score,
        acc,
        rank: rankOf(acc),
        counts: { ...engine.counts },
        maxCombo: engine.maxCombo,
        fc: engine.fullCombo,
        ap: engine.allPerfect,
      });
    };
    const frame = () => {
      if (!running) return;
      const t = now();
      engine.update(t);
      for (const e of engine.events) {
        lastJudge = e;
        if (e.judge !== "miss") flashes.push({ lane: e.lane, at: e.at, judge: e.judge });
      }
      engine.events.length = 0;
      draw(t);
      if (engine.done && t > Math.max(engine.lastTime + 1.2, songEnd)) return finish();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const press = (lane: number) => {
      if (!running) return;
      engine.press(lane, now());
    };
    const release = (lane: number) => {
      if (!running) return;
      engine.release(lane, now());
    };

    const pause = () => {
      if (!running || finished) return;
      running = false;
      cancelAnimationFrame(raf);
      // 누르던 키는 뗀 걸로 (롱노트 중이면 끊김)
      const t = now();
      for (let l = 0; l < 4; l++) if (engine.pressed[l]) engine.release(l, t);
      ctx.suspend();
      setPaused(true);
    };
    const resume = () => {
      if (running || finished) return;
      setPaused(false);
      ctx.resume().then(() => {
        running = true;
        raf = requestAnimationFrame(frame);
      });
    };
    ctrl.current = { pause, resume };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        e.preventDefault();
        if (running) pause();
        else resume();
        return;
      }
      const lane = KEY_CODES.indexOf(e.code);
      if (lane < 0) return;
      e.preventDefault();
      if (!e.repeat) press(lane);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const lane = KEY_CODES.indexOf(e.code);
      if (lane >= 0) release(lane);
    };
    const laneAt = (clientX: number) => {
      const r = canvas.getBoundingClientRect();
      return Math.max(0, Math.min(3, Math.floor(((clientX - r.left) / r.width) * 4)));
    };
    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      const lane = laneAt(e.clientX);
      lanePointer.set(e.pointerId, lane);
      press(lane);
    };
    const onPointerUp = (e: PointerEvent) => {
      const lane = lanePointer.get(e.pointerId);
      if (lane === undefined) return;
      lanePointer.delete(e.pointerId);
      // 같은 레인을 다른 손가락이 아직 누르고 있으면 유지
      if (![...lanePointer.values()].includes(lane)) release(lane);
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
      cancelAnimationFrame(raf);
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
    "w-40 cursor-pointer rounded-full border border-white/15 px-4 py-2 font-mono text-sm text-white/80 transition-colors hover:border-[#6C63FF]/60 hover:text-white";

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
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-black/70 backdrop-blur-sm">
          <p className="mb-2 font-mono text-lg font-bold text-white">일시정지</p>
          <button type="button" className={btn} onClick={() => ctrl.current.resume()}>
            계속하기
          </button>
          <button type="button" className={btn} onClick={onRestart}>
            처음부터
          </button>
          <button type="button" className={btn} onClick={onQuit}>
            곡 선택으로
          </button>
        </div>
      )}
    </div>
  );
}

function roundRect(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
  g.fill();
}
