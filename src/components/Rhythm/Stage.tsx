"use client";

import { useEffect, useRef, useState } from "react";
import type { Song } from "@/lib/rhythm/music";
import type { Chart, Difficulty } from "@/lib/rhythm/chart";
import { Engine, rankOf, type Judge } from "@/lib/rhythm/engine";
import {
  drawHead,
  drawHoldBody,
  drawReceptor,
  laneColors,
  makeHitSound,
  type HitSound,
  type Skin,
} from "@/lib/rhythm/fx";

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
  /** 판정 창 안에서 빠르게/늦게 친 횟수 (±FAST_SLOW_MS 넘는 것만) */
  fast: number;
  slow: number;
  /** 친 노트들의 평균 타이밍(ms, +면 늦게 침). 판정 싱크 추천용 */
  avgMs: number | null;
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
  /** ms, 판정만 옮김(+면 늦게 쳐도 맞게). 노트가 보이는 위치는 그대로 */
  judgeOffset: number;
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
  hitVolume,
  hitSound,
  skin,
  judgeOffset,
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
    // READY → 3 → 2 → 1 → GO! 가 끝난 뒤에 노트가 내려오기 시작
    const cd = countdownPhases(song.color);
    const cdEnd = cd[cd.length - 2].from + cd[cd.length - 2].dur; // "1"이 끝나는 시점
    const leadIn = cdEnd + vis + 0.25;
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
      offset / 1000;

    // 화면 효과용 상태
    let lastJudge: { judge: Judge; at: number; diff?: number } | null = null;
    let fast = 0;
    let slow = 0;
    let diffSum = 0;
    let diffN = 0;
    const hitBuf = hitVolume > 0 ? makeHitSound(ctx, hitSound) : null;
    const hitGain = ctx.createGain();
    hitGain.gain.value = hitVolume * 0.9;
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
          const bc = dead ? "#555555" : c;
          drawHoldBody(g, skin, x, yHead, yTail, laneW, bc, dead ? 0.25 : n.holding ? 0.85 : 0.6);
          g.globalAlpha = dead ? 0.35 : 1;
          drawHead(g, skin, n.lane, x, yHead, laneW, dead ? "#666666" : c);
          g.globalAlpha = 1;
        } else {
          if (n.head && n.head !== "miss") continue;
          const y = yOf(n.t);
          if (y > H + 20) continue;
          g.globalAlpha = n.head === "miss" ? 0.3 : 1;
          drawHead(g, skin, n.lane, x, y, laneW, c);
          g.globalAlpha = 1;
        }
      }

      // 판정선 (+ 스킨별 수신부)
      g.fillStyle = "rgba(255,255,255,0.85)";
      g.fillRect(0, judgeY - 1.5, W, 3);
      for (let l = 0; l < 4; l++)
        drawReceptor(g, skin, l, l * laneW, judgeY, laneW, engine.pressed[l]);

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
        // 판정선 섬광 (가로로 번짐)
        const glow = g.createRadialGradient(cx, judgeY, 0, cx, judgeY, laneW * (0.6 + p * 0.8));
        glow.addColorStop(0, `rgba(255,255,255,${0.9 * fade * fade})`);
        glow.addColorStop(0.25, `${col}${hex2(0.8 * fade)}`);
        glow.addColorStop(1, `${col}00`);
        g.fillStyle = glow;
        g.save();
        g.translate(cx, judgeY);
        g.scale(1, 0.45);
        g.translate(-cx, -judgeY);
        g.beginPath();
        g.arc(cx, judgeY, laneW * (0.6 + p * 0.8), 0, Math.PI * 2);
        g.fill();
        g.restore();
        // 링
        const ease = 1 - Math.pow(1 - p, 3);
        g.globalAlpha = fade;
        g.strokeStyle = col;
        g.lineWidth = 3 * fade + 1;
        g.beginPath();
        g.ellipse(
          cx,
          judgeY,
          laneW * (0.2 + ease * 0.55),
          laneW * (0.1 + ease * 0.25),
          0,
          0,
          Math.PI * 2
        );
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
        // 빠르게/늦게 친 정도: 퍼펙트 안이어도 20ms 넘게 어긋나면 표시
        const ms = lastJudge.diff !== undefined ? Math.round(lastJudge.diff * 1000) : 0;
        if (lastJudge.judge !== "miss" && Math.abs(ms) > FAST_SLOW_MS) {
          const early = ms < 0;
          g.font = "800 14px ui-monospace, SFMono-Regular, Menlo, monospace";
          g.fillStyle = early ? "#60A5FA" : "#FB923C";
          g.fillText(`${early ? "FAST" : "SLOW"} ${early ? "" : "+"}${ms}ms`, W / 2, H * 0.4 - 28);
        }
      }
      if (engine.combo >= 2) {
        // 콤보가 오를 때마다 살짝 튀어오름
        const bump = Math.max(0, 1 - (t - comboAt) / 0.12);
        g.fillStyle = "rgba(255,255,255,0.9)";
        g.font = `800 ${Math.round(40 + 8 * bump)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
        g.fillText(String(engine.combo), W / 2, H * 0.4 + 40 - 3 * bump);
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
      drawCountdown(g, cd, t + leadIn, W, H);
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
        fast,
        slow,
        avgMs: diffN >= 10 ? Math.round((diffSum / diffN) * 1000) : null,
      });
    };
    const frame = () => {
      if (!running) return;
      const t = now();
      engine.update(t - judgeOffset / 1000); // 지나간 노트 미스 처리도 판정 싱크 기준
      for (const e of engine.events) {
        lastJudge = e;
        if (e.diff !== undefined && e.judge !== "miss") {
          diffSum += e.diff;
          diffN++;
        }
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
          comboAt = e.at;
        }
      }
      engine.events.length = 0;
      draw(t);
      if (engine.done && t > Math.max(engine.lastTime + 1.2, songEnd)) return finish();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const press = (lane: number) => {
      if (!running) return;
      if (hitBuf) {
        const src = ctx.createBufferSource();
        src.buffer = hitBuf;
        src.connect(hitGain);
        src.start();
      }
      engine.press(lane, now() - judgeOffset / 1000);
    };
    const release = (lane: number) => {
      if (!running) return;
      engine.release(lane, now() - judgeOffset / 1000);
    };

    // 재개 카운트다운 (멈춘 화면 위에 3·2·1, 끝나면 음악 재개)
    let resuming = false;
    const RESUME_PHASES: Phase[] = [
      { label: "3", from: 0, dur: 1, color: "#60A5FA", size: 110 },
      { label: "2", from: 1, dur: 1, color: "#FBBF24", size: 110 },
      { label: "1", from: 2, dur: 1, color: "#F43F5E", size: 110 },
    ];

    const pause = () => {
      if (resuming) {
        // 카운트다운 중에 다시 Esc → 일시정지로 돌아감
        resuming = false;
        cancelAnimationFrame(raf);
        setPaused(true);
        return;
      }
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
      if (running || finished || resuming) return;
      setPaused(false);
      resuming = true;
      const frozen = now(); // 오디오가 멈춰 있어서 시간도 그대로
      lastJudge = null; // 카운트다운 숫자와 겹치지 않게
      const t0 = performance.now();
      const tick = () => {
        if (!resuming) return;
        const el = (performance.now() - t0) / 1000;
        draw(frozen);
        drawCountdown(g, RESUME_PHASES, el, W, H);
        if (el >= 3) {
          resuming = false;
          ctx.resume().then(() => {
            running = true;
            raf = requestAnimationFrame(frame);
          });
          return;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    ctrl.current = { pause, resume };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        e.preventDefault();
        if (running || resuming) pause();
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
      resuming = false;
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
