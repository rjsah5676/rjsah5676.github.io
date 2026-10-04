"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CHARS } from "@/lib/fight/chars";
import { MAPS } from "@/lib/fight/maps";
import { AI_LEVELS, FightAI } from "@/lib/fight/ai";
import {
  IN,
  METER_MAX,
  ROUND_SEC,
  WINS_NEEDED,
  hpRatio,
  newMatch,
  step,
  type State,
} from "@/lib/fight/sim";
import { loadSheet } from "@/lib/fight/sprites";
import {
  sfxBell,
  sfxBlock,
  sfxHit,
  sfxJump,
  sfxKO,
  sfxProj,
  sfxSuper,
  sfxWhoosh,
  setFightVolume,
} from "@/lib/fight/sfx";
import { FightRenderer } from "./render";
import { FightInput, KEY_GUIDE } from "./input";
import { scrollToGameTop } from "@/components/GameHeader";
import { RankSubmit } from "@/components/AIRank";
import { clockLabel, fightScore } from "@/lib/aiScore";

type Mode = "ai" | "2p";
interface Setup {
  mode: Mode;
  c1: number;
  c2: number;
  level: number;
  /** MAPS 인덱스, -1 = 랜덤 */
  map: number;
}

const SAVE_KEY = "fight:setup";
const MUTE_KEY = "fight:mute";

const btn =
  "cursor-pointer rounded-full border border-white/15 px-3 py-1.5 font-mono text-xs whitespace-nowrap text-white/75 transition-colors hover:border-[#6C63FF]/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-30";
const primaryBtn =
  "cursor-pointer rounded-full bg-[#6C63FF] px-4 py-1.5 font-mono text-xs whitespace-nowrap text-white transition-colors hover:bg-[#5b52f0] disabled:cursor-not-allowed disabled:opacity-40";

/** 캐릭터 선택 카드의 서 있는 모습 (idle 반복) */
function Portrait({
  id,
  faceLeft = false,
  size = 2,
}: {
  id: string;
  faceLeft?: boolean;
  size?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [sheetLeft, setSheetLeft] = useState(false);
  useEffect(() => {
    let raf = 0;
    let alive = true;
    loadSheet(id)
      .then((sh) => {
        const c = ref.current;
        if (!c || !alive) return;
        const [cw, ch] = sh.cell;
        setSheetLeft(sh.facing === "left");
        c.width = cw;
        c.height = ch;
        const g = c.getContext("2d")!;
        const a = sh.anims[sh.states.idle.anim];
        const t0 = performance.now();
        const draw = () => {
          const fr = Math.floor(((performance.now() - t0) / 1000) * a.fps) % a.frames;
          g.clearRect(0, 0, cw, ch);
          g.drawImage(sh.img, fr * cw, a.row * ch, cw, ch, 0, 0, cw, ch);
          raf = requestAnimationFrame(draw);
        };
        draw();
      })
      .catch(() => {});
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [id]);
  return (
    <canvas
      ref={ref}
      className="block [image-rendering:pixelated]"
      style={{
        width: 100 * size * 0.8,
        transform: faceLeft !== sheetLeft ? "scaleX(-1)" : undefined,
      }}
    />
  );
}

const PAD =
  "flex select-none items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] font-['Nanum_Gothic',sans-serif] text-white/80 active:bg-[#6C63FF]/40 touch-none";

function PadBtn({
  bit,
  onPad,
  className,
  children,
}: {
  bit: number;
  onPad: (pointer: number, bit: number) => void;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`${PAD} ${className}`}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture?.(e.pointerId);
        onPad(e.pointerId, bit);
      }}
      onPointerUp={(e) => onPad(e.pointerId, 0)}
      onPointerCancel={(e) => onPad(e.pointerId, 0)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}

/** 화면 버튼 (휴대폰) — 손가락마다 누른 버튼을 기억해서 합침 */
function TouchPad({ input }: { input: FightInput }) {
  const held = useRef(new Map<number, number>());
  const onPad = useCallback(
    (pointer: number, bit: number) => {
      if (bit) held.current.set(pointer, bit);
      else held.current.delete(pointer);
      let v = 0;
      held.current.forEach((b) => (v |= b));
      input.setTouch(v);
    },
    [input]
  );
  return (
    <div className="mt-3 flex items-end justify-between gap-4 select-none">
      <div className="grid grid-cols-3 grid-rows-3 gap-1.5">
        <span />
        <PadBtn bit={IN.U} onPad={onPad} className="h-12 w-12 text-lg">
          ▲
        </PadBtn>
        <span />
        <PadBtn bit={IN.L} onPad={onPad} className="h-12 w-12 text-lg">
          ◀
        </PadBtn>
        <PadBtn bit={IN.D} onPad={onPad} className="h-12 w-12 text-xs">
          가드
        </PadBtn>
        <PadBtn bit={IN.R} onPad={onPad} className="h-12 w-12 text-lg">
          ▶
        </PadBtn>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <PadBtn bit={IN.C} onPad={onPad} className="h-14 w-14 text-sm">
          고유기
        </PadBtn>
        <PadBtn bit={IN.X} onPad={onPad} className="h-14 w-14 text-sm text-[#FDE047]">
          필살기
        </PadBtn>
        <span />
        <PadBtn bit={IN.A} onPad={onPad} className="h-14 w-14 text-sm">
          약
        </PadBtn>
        <PadBtn bit={IN.B} onPad={onPad} className="h-14 w-14 text-sm">
          발차기
        </PadBtn>
        <PadBtn bit={IN.J} onPad={onPad} className="h-14 w-14 text-sm">
          점프
        </PadBtn>
      </div>
    </div>
  );
}

interface Hud {
  hp: [number, number];
  meter: [number, number];
  /** 고유기 남은 대기 비율 (0 = 준비됨) */
  cd: [number, number];
  wins: [number, number];
  sec: number;
  phase: State["phase"];
  pt: number;
  round: number;
  roundWinner: number;
  winner: number;
  combo: [number, number];
  ko: boolean;
  timeUp: boolean;
}

function hudOf(s: State): Hud {
  return {
    hp: [hpRatio(s.p[0]), hpRatio(s.p[1])],
    meter: [s.p[0].meter, s.p[1].meter],
    cd: [s.p[0].cd / CHARS[s.p[0].ch].cd, s.p[1].cd / CHARS[s.p[1].ch].cd],
    wins: [s.wins[0], s.wins[1]],
    sec: Math.ceil(s.timer / 60),
    phase: s.phase,
    pt:
      s.phase === "intro"
        ? Math.min(s.pt, 70)
        : s.phase === "fight"
          ? Math.min(s.pt, 40)
          : Math.min(s.pt, 60),
    round: s.round,
    roundWinner: s.roundWinner,
    winner: s.winner,
    // 맞은 쪽의 연속 피격 수 = 때린 쪽 콤보
    combo: s.phase === "fight" ? [s.p[1].combo, s.p[0].combo] : [0, 0],
    ko: s.p[0].hp <= 0 || s.p[1].hp <= 0,
    timeUp: s.timer <= 0,
  };
}

function HpBar({
  v,
  right,
  name,
  wins,
}: {
  v: number;
  right?: boolean;
  name: string;
  wins: number;
}) {
  return (
    <div className={`flex min-w-0 flex-1 flex-col gap-[0.6cqw] ${right ? "items-end" : ""}`}>
      <div
        className={`relative h-[2.6cqw] w-full overflow-hidden rounded-[0.4cqw] border border-black/60 bg-[#3B1020] ${right ? "scale-x-[-1]" : ""}`}
      >
        <div
          className="absolute inset-y-0 left-0 bg-[#FF8A3D] transition-[width] duration-500"
          style={{ width: `${v * 100}%` }}
        />
        <div
          className={`absolute inset-y-0 left-0 ${v < 0.25 ? "bg-[#F43F5E]" : "bg-[#FDE047]"}`}
          style={{ width: `${v * 100}%` }}
        />
      </div>
      <div className={`flex items-center gap-[1cqw] ${right ? "flex-row-reverse" : ""}`}>
        <span className="font-['Nanum_Gothic',sans-serif] text-[2.2cqw] font-bold text-white drop-shadow-[0_1px_0_#000]">
          {name}
        </span>
        <span className="flex gap-[0.5cqw]">
          {Array.from({ length: WINS_NEEDED }, (_, i) => (
            <span
              key={i}
              className={`h-[1.4cqw] w-[1.4cqw] rounded-full border border-black/50 ${i < wins ? "bg-[#FDE047]" : "bg-white/20"}`}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

function Meter({ v, cd, right }: { v: number; cd: number; right?: boolean }) {
  const full = v >= METER_MAX;
  const ready = cd <= 0;
  return (
    <div className={`flex items-center gap-[0.8cqw] ${right ? "flex-row-reverse" : ""}`}>
      <div
        className={`relative overflow-hidden rounded-full border px-[0.8cqw] py-[0.15cqw] font-mono text-[1.4cqw] font-bold ${ready ? "border-[#FDE047]/70 text-[#FDE047]" : "border-white/20 text-white/40"}`}
      >
        <div className="absolute inset-y-0 left-0 bg-white/15" style={{ width: `${(1 - cd) * 100}%` }} />
        <span className="relative">고유기</span>
      </div>
      <div
        className={`relative h-[1.3cqw] w-[24cqw] overflow-hidden rounded-full border border-black/50 bg-black/40 ${right ? "scale-x-[-1]" : ""}`}
      >
        <div
          className={`absolute inset-y-0 left-0 ${full ? "animate-pulse bg-[#22D3EE]" : "bg-[#3B82F6]"}`}
          style={{ width: `${Math.min(100, v)}%` }}
        />
      </div>
      <span
        className={`font-mono text-[1.6cqw] font-bold drop-shadow-[0_1px_0_#000] ${full ? "text-[#67E8F9]" : "text-white/50"}`}
      >
        {full ? "MAX" : `${v}%`}
      </span>
    </div>
  );
}

export default function FightGame({ onRanked }: { onRanked?: () => void }) {
  const [setup, setSetup] = useState<Setup>({ mode: "ai", c1: 0, c2: 1, level: 2, map: -1 });
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hud, setHud] = useState<Hud | null>(null);
  const [muted, setMuted] = useState(false);
  const [coarse, setCoarse] = useState(false);
  const [result, setResult] = useState<{
    win: boolean;
    seconds: number;
    hits: number;
    hp: number;
  } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [input] = useState(() => new FightInput());
  const pausedRef = useRef(false);
  const rendererRef = useRef<FightRenderer | null>(null);
  const restartRef = useRef<() => void>(() => {});

  /* eslint-disable react-hooks/set-state-in-effect -- 지난 설정 복원 (마운트 1회) */
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(SAVE_KEY) ?? "null") as Setup | null;
      if (v && CHARS[v.c1] && CHARS[v.c2] && AI_LEVELS[v.level])
        setSetup({ ...v, map: typeof v.map === "number" && (v.map === -1 || MAPS[v.map]) ? v.map : -1 });
      const m = localStorage.getItem(MUTE_KEY) === "1";
      setMuted(m);
      setFightVolume(m ? 0 : 0.8);
    } catch {}
    setCoarse(window.matchMedia("(pointer: coarse)").matches);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(setup));
    } catch {}
  }, [setup]);

  useEffect(() => {
    input.attach();
    return () => input.detach();
  }, [input]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // ── 게임 루프 ──
  useEffect(() => {
    if (!playing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = new FightRenderer(canvas);
    rendererRef.current = r;
    input.configure(setup.mode === "2p");
    const pickMap = () =>
      setup.map >= 0 ? setup.map : Math.floor(Math.random() * MAPS.length);
    let s = newMatch([setup.c1, setup.c2], pickMap());
    let ai = new FightAI(AI_LEVELS[setup.level], (Date.now() & 0xffff) + 1);
    let hits = 0;
    let lastHud = "";
    let acc = 0;
    let last = performance.now();
    let raf = 0;
    let doneReported = false;
    setResult(null);
    setSubmitted(false);
    Promise.all([loadSheet(CHARS[setup.c1].id), loadSheet(CHARS[setup.c2].id)])
      .then(([a, b]) => {
        r.sheets = [a, b];
      })
      .catch(() => {});
    restartRef.current = () => {
      s = newMatch([setup.c1, setup.c2], pickMap());
      ai = new FightAI(AI_LEVELS[setup.level], (Date.now() & 0xffff) + 1);
      hits = 0;
      doneReported = false;
      setResult(null);
      setSubmitted(false);
    };

    const onResize = () => r.resize();
    r.resize();
    window.addEventListener("resize", onResize);
    const onVis = () => {
      if (document.visibilityState === "hidden") setPaused(true);
    };
    document.addEventListener("visibilitychange", onVis);
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape" || e.code === "KeyP") setPaused((p) => !p);
    };
    window.addEventListener("keydown", onKey);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(100, now - last);
      last = now;
      if (pausedRef.current) {
        r.draw(s);
        return;
      }
      acc += dt;
      let steps = 0;
      while (acc >= 1000 / 60 && steps < 4) {
        acc -= 1000 / 60;
        steps++;
        const p1 = input.read(0);
        const p2 = setup.mode === "2p" ? input.read(1) : ai.next(s, 1);
        const prevSt = [s.p[0].st, s.p[1].st];
        const prevT = [s.p[0].t, s.p[1].t];
        step(s, [p1, p2]);
        // 소리
        for (const e of s.ev) {
          if (e.k === "hit") {
            sfxHit(e.m === "X" ? 2 : e.m === "H" || e.m === "S" ? 1 : 0);
            if (e.p === 0) hits++;
          } else if (e.k === "block") sfxBlock();
          else if (e.k === "proj") sfxProj();
          else if (e.k === "super") sfxSuper();
          else if (e.k === "ko") sfxKO();
          else if (e.k === "jump") sfxJump();
          else if (e.k === "round") sfxBell(false);
          else if (e.k === "fight") sfxBell(true);
        }
        for (let i = 0; i < 2; i++) {
          const f = s.p[i];
          if (f.st === "atk" && (prevSt[i] !== "atk" || f.t < prevT[i]) && f.mv !== "S")
            sfxWhoosh(f.mv === "H" || f.mv === "X");
        }
        if (process.env.NODE_ENV !== "production")
          (window as unknown as { __fight: State }).__fight = s;
        r.events(s.ev, s);
        r.tick(s);
        if (s.phase === "over" && !doneReported) {
          doneReported = true;
          const win = s.winner === 0;
          setResult({
            win,
            seconds: Math.round(s.f / 60),
            hits,
            hp: Math.round(hpRatio(s.p[0]) * 100),
          });
        }
      }
      if (acc > 200) acc = 0;
      r.draw(s);
      const h = hudOf(s);
      const key = JSON.stringify(h);
      if (key !== lastHud) {
        lastHud = key;
        setHud(h);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("keydown", onKey);
      input.stop();
      rendererRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 시작할 때의 설정으로 한 판
  }, [playing]);

  const start = () => {
    setPaused(false);
    setPlaying(true);
    setTimeout(scrollToGameTop, 50);
  };
  const toMenu = useCallback(() => {
    setPlaying(false);
    setPaused(false);
    setHud(null);
  }, []);
  const toggleMute = () =>
    setMuted((m) => {
      setFightVolume(m ? 0.8 : 0);
      try {
        localStorage.setItem(MUTE_KEY, m ? "0" : "1");
      } catch {}
      return !m;
    });

  const c1 = CHARS[setup.c1],
    c2 = CHARS[setup.c2];
  const level = AI_LEVELS[setup.level];

  if (!playing) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-white/10 bg-[#1C1E24] p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap gap-1.5">
          {(
            [
              ["ai", "🤖 AI 대전"],
              ["2p", "👥 2인 대전 (한 키보드)"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => setSetup((s) => ({ ...s, mode: m }))}
              className={`cursor-pointer rounded-full px-4 py-1.5 font-['Nanum_Gothic',sans-serif] text-sm transition-colors ${
                setup.mode === m
                  ? "bg-[#6C63FF] text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          ))}
          <span className="self-center pl-1 font-['Nanum_Gothic',sans-serif] text-[11px] text-white/35">
            온라인 대전은 준비 중
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {([0, 1] as const).map((side) => {
            const sel = side === 0 ? setup.c1 : setup.c2;
            return (
              <div key={side}>
                <div className="mb-1.5 font-mono text-xs text-white/40">
                  {side === 0 ? "1P" : setup.mode === "ai" ? "AI" : "2P"}
                </div>
                <div className="flex flex-col gap-2">
                  {CHARS.map((c, i) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        setSetup((s) => (side === 0 ? { ...s, c1: i } : { ...s, c2: i }))
                      }
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${
                        sel === i
                          ? "border-[#6C63FF]/70 bg-[#6C63FF]/15"
                          : "border-white/10 bg-white/[0.03] hover:border-white/25"
                      }`}
                    >
                      <span className="flex h-14 w-16 shrink-0 items-end justify-center overflow-hidden">
                        <Portrait id={c.id} faceLeft={side === 1} size={0.9} />
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="font-['Nanum_Gothic',sans-serif] text-sm text-white">
                          <span style={{ color: c.color }}>●</span> {c.name}{" "}
                          <span className="text-xs text-white/45">{c.title}</span>
                        </span>
                        <span className="font-['Nanum_Gothic',sans-serif] text-[11px] text-white/45">
                          {c.desc}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <div className="mb-1.5 font-mono text-xs text-white/40">맵</div>
          <div className="flex flex-wrap gap-1.5">
            {[{ id: "random", name: "🎲 랜덤", desc: "매 판 무작위" }, ...MAPS].map((m, i) => (
              <button
                key={m.id}
                type="button"
                title={m.desc}
                onClick={() => setSetup((s) => ({ ...s, map: i - 1 }))}
                className={`cursor-pointer rounded-full px-3 py-1 font-['Nanum_Gothic',sans-serif] text-xs transition-colors ${
                  setup.map === i - 1
                    ? "bg-[#6C63FF] text-white"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
          <p className="mt-1 font-['Nanum_Gothic',sans-serif] text-[11px] text-white/35">
            {setup.map >= 0 ? MAPS[setup.map].desc : "운동장·체육관·옥상·복도 중 무작위"}
          </p>
        </div>

        {setup.mode === "ai" && (
          <div className="mt-4">
            <div className="mb-1.5 font-mono text-xs text-white/40">AI 단계</div>
            <div className="flex flex-wrap gap-1.5">
              {AI_LEVELS.map((l, i) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setSetup((s) => ({ ...s, level: i }))}
                  className={`cursor-pointer rounded-full px-3 py-1 font-['Nanum_Gothic',sans-serif] text-xs transition-colors ${
                    setup.level === i
                      ? "bg-[#6C63FF] text-white"
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {i + 1}. {l.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 rounded-lg bg-black/20 px-3 py-2.5 font-['Nanum_Gothic',sans-serif] text-[11px] leading-relaxed text-white/50">
          <div>
            <b className="text-white/70">1P</b> {setup.mode === "ai" ? KEY_GUIDE.p1 : KEY_GUIDE.p1Two}
          </div>
          {setup.mode === "ai" ? (
            <div className="text-white/40">또는 {KEY_GUIDE.p1Alt}</div>
          ) : (
            <div>
              <b className="text-white/70">2P</b> {KEY_GUIDE.p2}
            </div>
          )}
          <div className="mt-1 text-white/40">
            걸으면서 때리기 · 같은 방향 두 번 대시(공중 1번) · 2단 점프, 공중 공격은 점프마다 2번 ·
            공중 고유기는 아래로 내리꽂음 · 떨어지면 위에서 다시 등장 · 게이지 MAX에 필살기(발차기+고유기
            동시도 가능) · 게임패드 · Esc 일시정지
          </div>
        </div>

        <button
          type="button"
          onClick={start}
          className={`${primaryBtn} mt-4 w-full py-2.5 text-sm`}
        >
          ⚔️ {c1.name} vs {c2.name}
          {setup.mode === "ai" ? ` (AI ${level.name})` : ""} 시작
        </button>
      </div>
    );
  }

  const names: [string, string] = [
    `${c1.name}${setup.mode === "ai" ? " (나)" : " 1P"}`,
    `${c2.name}${setup.mode === "ai" ? ` · AI ${level.name}` : " 2P"}`,
  ];

  let banner: { text: string; sub?: string; color?: string } | null = null;
  if (hud) {
    if (hud.phase === "intro")
      banner = hud.pt < 60 ? { text: `ROUND ${hud.round}` } : { text: "FIGHT!", color: "#FDE047" };
    else if (hud.phase === "fight" && hud.pt < 30) banner = { text: "FIGHT!", color: "#FDE047" };
    else if (hud.phase === "roundEnd")
      banner =
        hud.pt < 50
          ? { text: hud.timeUp ? "TIME UP" : "K.O.", color: "#F43F5E" }
          : {
              text:
                hud.roundWinner === 2
                  ? "무승부"
                  : `${CHARS[hud.roundWinner === 0 ? setup.c1 : setup.c2].name} 승리`,
            };
    else if (hud.phase === "over")
      banner = {
        text:
          hud.winner === 2
            ? "DRAW"
            : setup.mode === "ai"
              ? hud.winner === 0
                ? "YOU WIN!"
                : "YOU LOSE"
              : `${hud.winner === 0 ? "1P" : "2P"} WIN!`,
        color: hud.winner === 0 || setup.mode === "2p" ? "#FDE047" : "#F87171",
      };
  }

  return (
    <div className="mx-auto w-full max-w-[min(960px,calc((100dvh-170px)*16/9))]">
      <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-black [container-type:inline-size]">
        <canvas ref={canvasRef} className="block aspect-video w-full [image-rendering:pixelated]" />
        {hud && (
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-[1.6cqw]">
            <div className="flex items-start gap-[2cqw]">
              <HpBar v={hud.hp[0]} name={names[0]} wins={hud.wins[0]} />
              <div className="flex w-[8cqw] shrink-0 flex-col items-center">
                <span
                  className={`font-mono text-[4cqw] leading-none font-bold drop-shadow-[0_2px_0_#000] ${hud.sec <= 10 && hud.phase === "fight" ? "text-[#F87171]" : "text-white"}`}
                >
                  {Math.min(ROUND_SEC, hud.sec)}
                </span>
              </div>
              <HpBar v={hud.hp[1]} right name={names[1]} wins={hud.wins[1]} />
            </div>
            <div className="flex items-end justify-between">
              <Meter v={hud.meter[0]} cd={hud.cd[0]} />
              <Meter v={hud.meter[1]} cd={hud.cd[1]} right />
            </div>
            {hud.combo.map(
              (c, i) =>
                c >= 2 && (
                  <div
                    key={i}
                    className={`absolute top-[22%] ${i === 0 ? "left-[3%]" : "right-[3%]"} font-mono font-black italic drop-shadow-[0_2px_0_#000]`}
                  >
                    <span className="text-[5cqw] text-[#FDE047]">{c}</span>
                    <span className="ml-[0.5cqw] text-[2.4cqw] text-white">HITS</span>
                  </div>
                )
            )}
            {banner && (
              <div className="absolute inset-x-0 top-[34%] text-center">
                <div
                  key={banner.text}
                  className="font-mono text-[8cqw] font-black tracking-wider italic drop-shadow-[0_0.5cqw_0_#000] [animation:modal-fade_200ms_ease-out]"
                  style={{ color: banner.color ?? "#fff" }}
                >
                  {banner.text}
                </div>
              </div>
            )}
          </div>
        )}
        {paused && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/65">
            <div className="font-mono text-lg text-white">일시정지</div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPaused(false)} className={primaryBtn}>
                ▶ 계속
              </button>
              <button
                type="button"
                onClick={() => {
                  restartRef.current();
                  setPaused(false);
                }}
                className={btn}
              >
                ↻ 다시
              </button>
              <button type="button" onClick={toMenu} className={btn}>
                캐릭터 선택
              </button>
            </div>
          </div>
        )}
        {result && (
          <div className="absolute inset-x-0 bottom-[14%] flex justify-center gap-2">
            <button type="button" onClick={() => restartRef.current()} className={primaryBtn}>
              ↻ 다시 한 판
            </button>
            <button type="button" onClick={toMenu} className={btn}>
              캐릭터 선택
            </button>
          </div>
        )}
      </div>

      {coarse && <TouchPad input={input} />}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={() => setPaused((p) => !p)} className={btn}>
          {paused ? "▶ 계속" : "⏸ 일시정지"}
        </button>
        <button type="button" onClick={toMenu} className={btn}>
          캐릭터 선택
        </button>
        <button type="button" onClick={toggleMute} className={btn}>
          {muted ? "🔇 소리 켜기" : "🔊 소리 끄기"}
        </button>
        {!coarse && (
          <span className="font-['Nanum_Gothic',sans-serif] text-[11px] text-white/35">
            {setup.mode === "ai" ? KEY_GUIDE.p1 : `1P ${KEY_GUIDE.p1Two} / 2P ${KEY_GUIDE.p2}`}
          </span>
        )}
      </div>

      {result && setup.mode === "ai" && result.win && (
        <div className="mt-3 max-w-md">
          <RankSubmit
            coll="fight_ai_rankings"
            result={fightScore(setup.level + 1, result.hp, result.seconds)}
            entry={{
              opp: `${setup.level + 1}`,
              moves: Math.max(2, result.hits),
              seconds: result.seconds,
              lead: result.hp,
            }}
            done={submitted}
            onSaved={() => {
              setSubmitted(true);
              onRanked?.();
            }}
          />
          <p className="mt-1.5 px-1 font-['Nanum_Gothic',sans-serif] text-[11px] text-white/35">
            {clockLabel(result.seconds)} · 적중 {result.hits}회 · 남은 체력 {result.hp}%
          </p>
        </div>
      )}
    </div>
  );
}
