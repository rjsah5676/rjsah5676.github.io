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
  sfxDash,
  sfxLand,
  sfxHit,
  sfxJump,
  sfxKO,
  sfxProj,
  sfxSuper,
  sfxWhoosh,
  setFightVolume,
  type Element,
} from "@/lib/fight/sfx";

/** 캐릭터별 효과음 성격 */
const SFX_EL: Record<string, Element> = { kai: "wind", igna: "fire", soyoung: "whip", lily: "water", zena: "bolt" };
import { FightRenderer } from "./render";
import { FightInput, KEY_GUIDE } from "./input";
import Select, { type Setup } from "./Select";
import { scrollToGameTop } from "@/components/GameHeader";
import { RankSubmit } from "@/components/AIRank";
import { clockLabel, fightScore } from "@/lib/aiScore";


const SAVE_KEY = "fight:setup";
const MENU_BGM = "/fight/bgm-menu.mp3";
const MUTE_KEY = "fight:mute";

const btn =
  "cursor-pointer rounded-full border border-white/15 px-3 py-1.5 font-mono text-xs whitespace-nowrap text-white/75 transition-colors hover:border-[#6C63FF]/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-30";
const primaryBtn =
  "cursor-pointer rounded-full bg-[#6C63FF] px-4 py-1.5 font-mono text-xs whitespace-nowrap text-white transition-colors hover:bg-[#5b52f0] disabled:cursor-not-allowed disabled:opacity-40";

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
          아이덴티티
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
  /** 아이덴티티 남은 대기 비율 (0 = 준비됨) */
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

const KR = "font-['Nanum_Gothic',sans-serif]";

/** 한쪽 선수 HUD: 얼굴 · 이름 · 체력 · 필살기 게이지 · 아이덴티티 대기 */
function PlayerHud({
  ch,
  hp,
  meter,
  cd,
  wins,
  tag,
  right,
}: {
  ch: number;
  hp: number;
  meter: number;
  cd: number;
  wins: number;
  tag: string;
  right?: boolean;
}) {
  const c = CHARS[ch];
  const full = meter >= METER_MAX;
  const cdLeft = cd * (c.cd / 60);
  const ready = cdLeft < 0.05;
  const flip = right ? "scale-x-[-1]" : "";
  return (
    <div className={`flex min-w-0 flex-1 items-start gap-[1cqw] ${right ? "flex-row-reverse" : ""}`}>
      <img
        src={`/fight/art/${c.id}-face.webp`}
        alt={c.name}
        className={`h-[6.4cqw] w-[8cqw] shrink-0 rounded-[0.5cqw] border-[0.25cqw] object-cover shadow-[0_0.3cqw_0_#000] [image-rendering:pixelated] ${flip}`}
        style={{ borderColor: c.color }}
      />
      <div className={`flex min-w-0 flex-1 flex-col gap-[0.45cqw] ${right ? "items-end" : ""}`}>
        <div className={`flex items-baseline gap-[0.8cqw] ${right ? "flex-row-reverse" : ""}`}>
          <span className={`${KR} text-[2.1cqw] leading-none font-extrabold text-white drop-shadow-[0_0.2cqw_0_#000]`}>
            {c.name}
          </span>
          <span className="font-mono text-[1.1cqw] text-white/55 drop-shadow-[0_0.1cqw_0_#000]">{tag}</span>
          <span className="flex gap-[0.4cqw] self-center">
            {Array.from({ length: WINS_NEEDED }, (_, i) => (
              <span
                key={i}
                className={`h-[1.1cqw] w-[1.1cqw] rotate-45 border border-black/60 ${i < wins ? "bg-[#FDE047]" : "bg-white/15"}`}
              />
            ))}
          </span>
        </div>
        {/* 체력 (비스듬한 막대) */}
        <div className={`w-full ${flip}`}>
          <div className="relative h-[2.2cqw] w-full -skew-x-[20deg] overflow-hidden border-[0.2cqw] border-black/70 bg-[#2A0D18] shadow-[0_0.25cqw_0_rgba(0,0,0,0.6)]">
            <div className="absolute inset-y-0 left-0 bg-white/70 transition-[width] duration-700" style={{ width: `${hp * 100}%` }} />
            <div
              className={`absolute inset-y-0 left-0 bg-gradient-to-b ${hp < 0.25 ? "from-[#FF6B81] to-[#C81E3A]" : "from-[#FFE97A] to-[#F5A524]"}`}
              style={{ width: `${hp * 100}%` }}
            />
            <div className="absolute inset-x-0 top-0 h-[35%] bg-white/25" />
          </div>
        </div>
        {/* 필살기 게이지 + 아이덴티티 */}
        <div className={`flex w-full items-center gap-[0.8cqw] ${right ? "flex-row-reverse" : ""}`}>
          <div
            className={`relative flex h-[2.6cqw] w-[2.6cqw] shrink-0 items-center justify-center rounded-full border-[0.2cqw] ${ready ? "border-[#FDE047]" : "border-white/25"}`}
            style={{
              background: ready
                ? "radial-gradient(circle, rgba(253,224,71,0.35), rgba(0,0,0,0.5))"
                : `conic-gradient(rgba(255,255,255,0.35) ${(1 - cd) * 360}deg, rgba(0,0,0,0.55) 0)`,
            }}
            title={`아이덴티티 · ${c.idName}`}
          >
            <span className={`font-mono text-[1.1cqw] font-bold ${ready ? "text-[#FDE047]" : "text-white"}`}>
              {ready ? "L" : cdLeft.toFixed(1)}
            </span>
          </div>
          <span className={`${KR} whitespace-nowrap text-[1.1cqw] font-bold ${ready ? "text-[#FDE047]" : "text-white/45"} drop-shadow-[0_0.1cqw_0_#000]`}>
            {c.idName}
          </span>
          <div className={`ml-auto ${right ? "mr-auto ml-0" : ""} flex items-center gap-[0.6cqw] ${right ? "flex-row-reverse" : ""}`}>
            <div
              className={`relative -skew-x-[20deg] overflow-hidden border bg-black/50 transition-all ${flip} ${
                full
                  ? "h-[1.6cqw] w-[14cqw] border-[#A5F3FC] shadow-[0_0_1.2cqw_rgba(34,211,238,0.9)]"
                  : "h-[1.2cqw] w-[14cqw] border-black/60"
              }`}
            >
              <div
                className={`absolute inset-y-0 left-0 ${full ? "bg-gradient-to-r from-[#0EA5E9] via-[#A5F3FC] to-[#22D3EE]" : "bg-[#3B82F6]"}`}
                style={{ width: `${Math.min(100, meter)}%` }}
              />
              {full && (
                <div className="absolute inset-y-0 w-[30%] animate-[meter-shine_1.1s_linear_infinite] bg-gradient-to-r from-transparent via-white/80 to-transparent" />
              )}
            </div>
            {full ? (
              <span className="animate-pulse whitespace-nowrap font-mono text-[1.4cqw] font-black text-[#A5F3FC] [text-shadow:0_0_0.8cqw_#22D3EE,0_0.1cqw_0_#000]">
                {c.ultName} READY! <span className="rounded-[0.2cqw] bg-[#22D3EE] px-[0.4cqw] text-black">I</span>
              </span>
            ) : (
              <span className="font-mono text-[1.2cqw] font-black text-white/50 drop-shadow-[0_0.1cqw_0_#000]">{meter}%</span>
            )}
          </div>
        </div>
      </div>
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

  // ── 배경음악: 맵마다 (대전 중, 맵 선택에서 그 맵에 커서가 있을 때만) ──
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const mutedRef = useRef(false);
  const wantRef = useRef<string | null>(null);
  const playBgm = useCallback((src: string | null, restart = false) => {
    wantRef.current = src;
    const cur = bgmRef.current;
    if (!src || mutedRef.current) {
      cur?.pause();
      return;
    }
    if (cur && cur.dataset.src === src) {
      // 판이 새로 시작하면 곡도 처음부터
      if (restart) cur.currentTime = 0;
      if (cur.paused) cur.play().catch(() => {});
      return;
    }
    cur?.pause();
    const a = new Audio(src);
    a.dataset.src = src;
    a.loop = true;
    a.volume = 0.35;
    bgmRef.current = a;
    a.play().catch(() => {});
  }, []);
  const previewMap = useCallback(
    // 맵 선택에서 그 맵에 커서가 있으면 맵 곡, 그 밖의 메뉴에선 메인 곡
    (m: number | null) => playBgm(m !== null && m >= 0 ? (MAPS[m].bgm ?? MENU_BGM) : MENU_BGM),
    [playBgm]
  );
  // 브라우저는 클릭·키 입력 전엔 소리를 막으니, 첫 입력 때 다시 틀어 봄
  useEffect(() => {
    const kick = () => {
      const a = bgmRef.current;
      if (wantRef.current && !mutedRef.current && (!a || a.paused)) playBgm(wantRef.current);
    };
    window.addEventListener("pointerdown", kick);
    window.addEventListener("keydown", kick);
    return () => {
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
    };
  }, [playBgm]);
  useEffect(() => {
    mutedRef.current = muted;
    if (muted) bgmRef.current?.pause();
    else playBgm(wantRef.current);
  }, [muted, playBgm]);
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") bgmRef.current?.pause();
      else playBgm(wantRef.current);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      bgmRef.current?.pause();
    };
  }, [playBgm]);
  // ── 게임 루프 ──
  useEffect(() => {
    if (!playing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = new FightRenderer(canvas);
    r.tags = ["1P", setup.mode === "ai" ? "CPU" : "2P"];
    rendererRef.current = r;
    input.configure(setup.mode === "2p");
    const pickMap = () =>
      setup.map >= 0 ? setup.map : Math.floor(Math.random() * MAPS.length);
    let s = newMatch([setup.c1, setup.c2], pickMap());
    playBgm(MAPS[s.map].bgm ?? MENU_BGM, true);
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
      playBgm(MAPS[s.map].bgm ?? MENU_BGM, true);
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
        const elOf = (p: number) => SFX_EL[CHARS[s.p[p].ch].id] ?? "wind";
        for (const e of s.ev) {
          if (e.k === "hit") {
            sfxHit(e.m === "X" ? 2 : e.m === "H" || e.m === "S" || e.m === "K" ? 1 : 0, elOf(e.p));
            if (e.p === 0) hits++;
          } else if (e.k === "block" || e.k === "just") sfxBlock();
          else if (e.k === "throw") {
            sfxHit(1, elOf(e.p));
            if (e.p === 0) hits++;
          } else if (e.k === "tech") sfxBlock();
          else if (e.k === "proj") sfxProj(elOf(e.p), s.p[e.p].mv === "X");
          else if (e.k === "super") sfxSuper();
          else if (e.k === "ko") sfxKO();
          else if (e.k === "jump") sfxJump();
          else if (e.k === "land") sfxLand();
          else if (e.k === "dash") sfxDash();
          else if (e.k === "round") sfxBell(false);
          else if (e.k === "fight") sfxBell(true);
        }
        for (let i = 0; i < 2; i++) {
          const f = s.p[i];
          if (f.st === "atk" && (prevSt[i] !== "atk" || f.t < prevT[i]) && f.mv !== "S")
            sfxWhoosh(f.mv === "H" || f.mv === "K" || f.mv === "X", SFX_EL[CHARS[f.ch].id] ?? "wind");
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

  const start = useCallback(() => {
    setPaused(false);
    setPlaying(true);
    setTimeout(scrollToGameTop, 50);
  }, []);

  const [entry, setEntry] = useState<"mode" | "char">("mode");
  const toMenu = useCallback(() => {
    setEntry("mode");
    playBgm(MENU_BGM, true);
    setPlaying(false);
    setPaused(false);
    setHud(null);
  }, [playBgm]);
  const toChars = useCallback(() => {
    toMenu();
    setEntry("char");
  }, [toMenu]);
  const toggleMute = () =>
    setMuted((m) => {
      setFightVolume(m ? 0.8 : 0);

      try {
        localStorage.setItem(MUTE_KEY, m ? "0" : "1");
      } catch {}
      return !m;
    });

  const level = AI_LEVELS[setup.level];

  if (!playing) {
    return (
      <div className="mx-auto w-full max-w-[min(960px,calc((100dvh-170px)*16/9))]">
        <Select setup={setup} setSetup={setSetup} onStart={start} onPreview={previewMap} entry={entry} />
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={toggleMute} className={btn}>
            {muted ? "🔇 소리 켜기" : "🔊 소리 끄기"}
          </button>
          <span className="font-['Nanum_Gothic',sans-serif] text-[11px] text-white/35">온라인 대전은 준비 중</span>
        </div>
        <div className="mt-3 rounded-lg bg-black/20 px-3 py-2.5 font-['Nanum_Gothic',sans-serif] text-[11px] leading-relaxed text-white/50">
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
            약 4단·발차기 2단, 마지막 동작은 세지만 빈틈 큼 · 발차기·아이덴티티는 막히면 막은 쪽이 먼저 움직임(반격
            기회) · 맞기 직전 가드 = 저스트 가드 · 가드 중 K = 가드 반격(게이지 25) · J+K 잡기(가드 불가, 잡힌 직후 J+K로
            풀기) · 기술 내는 중·대시 중에 맞으면 카운터 · 같은 방향 두 번 대시 · 2단 점프, 공중 공격 점프마다 2번 ·
            떨어지면 위에서 다시 등장 · 게이지 MAX에 필살기 · Esc 일시정지
          </div>
        </div>
      </div>
    );
  }

  const names: [string, string] = [
    "1P",
    setup.mode === "ai" ? `CPU ${level.name}` : "2P",
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
              <PlayerHud ch={setup.c1} hp={hud.hp[0]} meter={hud.meter[0]} cd={hud.cd[0]} wins={hud.wins[0]} tag={names[0]} />
              <div className="flex w-[7cqw] shrink-0 flex-col items-center pt-[0.4cqw]">
                <span
                  className={`font-mono text-[4cqw] leading-none font-black drop-shadow-[0_0.3cqw_0_#000] ${hud.sec <= 10 && hud.phase === "fight" ? "text-[#F87171]" : "text-white"}`}
                >
                  {Math.min(ROUND_SEC, hud.sec)}
                </span>
              </div>
              <PlayerHud ch={setup.c2} hp={hud.hp[1]} meter={hud.meter[1]} cd={hud.cd[1]} wins={hud.wins[1]} tag={names[1]} right />
            </div>
            <div />
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
                ↻ 다시하기
              </button>
              <button type="button" onClick={toMenu} className={btn}>
                메뉴로
              </button>
            </div>
          </div>
        )}
        {result && (
          <div className="absolute inset-x-0 bottom-[14%] flex justify-center gap-[1.4cqw]">
            <button
              type="button"
              onClick={() => restartRef.current()}
              className="cursor-pointer rounded-full bg-[#6C63FF] px-[3cqw] py-[1cqw] font-['Nanum_Gothic',sans-serif] text-[1.8cqw] font-bold text-white shadow-[0_0.4cqw_0_#2E2A7A] hover:bg-[#5b52f0]"
            >
              ↻ 다시하기
            </button>
            <button
              type="button"
              onClick={toChars}
              className="cursor-pointer rounded-full border-[0.2cqw] border-white bg-black/75 px-[3cqw] py-[1cqw] font-['Nanum_Gothic',sans-serif] text-[1.8cqw] font-bold text-white shadow-[0_0.4cqw_0_#000] hover:bg-white hover:text-black"
            >
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
          메뉴로
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
