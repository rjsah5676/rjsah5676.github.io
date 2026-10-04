"use client";

/**
 * 격투게임 시작 전 화면: 모드 선택(AI는 난이도까지) → 캐릭터 선택 → 맵 선택 → VS.
 * 키보드: 1P A·D 고르기 · J/Space 결정 · Esc 취소, 2P ←→ · Enter 결정 · . 취소 (마우스·터치도 됨)
 * AI 대전이면 1P가 자기 캐릭터를 고른 뒤 상대(CPU) 캐릭터도 고름. 지금 고르는 쪽은 빛나는 테두리로 표시.
 */
import { useEffect, useRef, useState } from "react";
import { CHARS, type CharDef } from "@/lib/fight/chars";
import { MAPS } from "@/lib/fight/maps";
import { AI_LEVELS } from "@/lib/fight/ai";
import { loadSheet } from "@/lib/fight/sprites";

export type Mode = "ai" | "2p" | "online";
export interface Setup {
  mode: Mode;
  c1: number;
  c2: number;
  level: number;
  /** MAPS 인덱스, -1 = 랜덤 */
  map: number;
  /** 랜덤 맵을 고를 때 섞기 연출로 뽑힌 맵 (이번 판 시작에만 씀, 저장 안 함) */
  rolled?: number;
}

const face = (c: CharDef) => `/fight/art/${c.id}-face.webp`;
const art = (c: CharDef) => `/fight/art/${c.id}.webp`;
const PX = "[image-rendering:pixelated]";
const KR = "font-['Nanum_Gothic',sans-serif]";
const MENU_BG = "/fight/bg/menu.webp";

/** 기술 아이콘 (public/fight/icon/<id>-S|X.webp) — 아직 없으면 안 보임 */
function SkillIcon({ c, k, small }: { c: CharDef; k: "S" | "X" | "A"; small?: boolean }) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    <img
      src={`/fight/icon/${c.id}-${k}.webp`}
      alt=""
      onError={() => setOk(false)}
      className={`${small ? "h-[1.7cqw] w-[1.7cqw]" : "h-[2.6cqw] w-[2.6cqw]"} shrink-0 rounded-[0.35cqw] border border-white/30 bg-black/40 object-cover ${PX}`}
    />
  );
}

function SkillRow({ c, k, right }: { c: CharDef; k: "S" | "X"; right?: boolean }) {
  const isId = k === "S";
  return (
    <div className={`${KR} mt-[0.3cqw] flex w-full items-start gap-[0.6cqw] ${right ? "flex-row-reverse text-right" : ""}`}>
      <SkillIcon key={c.id} c={c} k={k} />
      <div className={`flex min-w-0 flex-1 flex-col gap-[0.2cqw] ${right ? "items-end" : ""}`}>
        <span
          className={`rounded-[0.3cqw] px-[0.5cqw] text-[1.05cqw] font-bold text-black ${isId ? "bg-[#FDE047]/90" : "bg-[#22D3EE]/90"}`}
        >
          {isId ? "아이덴티티 L" : "필살기 I"} · {isId ? c.idName : c.ultName}
        </span>
        <span className="text-[1.05cqw] leading-snug break-keep text-white/80">{isId ? c.idDesc : c.ultDesc}</span>
        {isId && (
          <span className={`flex items-start gap-[0.4cqw] ${right ? "flex-row-reverse" : ""}`}>
            <SkillIcon key={`${c.id}-A`} c={c} k="A" small />
            <span className="text-[0.95cqw] leading-snug break-keep text-white/55">
              <b className="text-[#FDE047]/80">{c.airLabel ?? "점프 중 L"}</b> {c.airDesc}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}

function CharInfo({ c, right }: { c: CharDef; right?: boolean }) {
  return (
    <div className={`flex flex-col gap-[0.5cqw] ${right ? "items-end text-right" : ""}`}>
      <div className="font-mono text-[1.1cqw] tracking-[0.25em] text-white/45">{c.tagline}</div>
      <div className={`${KR} flex items-center gap-[0.6cqw] text-[1.3cqw] text-white/60 ${right ? "flex-row-reverse" : ""}`}>
        <span>{c.title}</span>
        <span className="text-[#FDE047]" title="조작 난이도">
          {"★".repeat(c.difficulty)}
          <span className="text-white/20">{"★".repeat(3 - c.difficulty)}</span>
        </span>
      </div>
      <div
        className={`${KR} text-[3.2cqw] leading-none font-extrabold drop-shadow-[0_0.3cqw_0_#000]`}
        style={{ color: c.color }}
      >
        {c.name}
      </div>
      <div
        key={c.id}
        className={`${KR} relative my-[0.2cqw] max-w-[21cqw] rounded-[0.8cqw] border border-white/25 bg-black/55 px-[0.9cqw] py-[0.4cqw] text-[1.15cqw] leading-snug text-white italic [animation:modal-fade_300ms_ease-out]`}
      >
        “{c.quote}”
      </div>
      {/* 기술: 아이콘 + 이름 배지 한 줄, 설명은 그 아래 (점프 중 L이 다르면 한 줄 더) */}
      <SkillRow c={c} k="S" right={right} />
      <SkillRow c={c} k="X" right={right} />
    </div>
  );
}

export default function Select({
  setup,
  setSetup,
  onStart,
  onOnline,
  onPreview,
  entry = "mode",
  onBack,
}: {
  setup: Setup;
  setSetup: (f: (s: Setup) => Setup) => void;
  onStart: () => void;
  /** 온라인 대전 → 로비 */
  onOnline?: () => void;
  /** 맵 선택에서 커서가 가리키는 맵 (배경음악 미리 듣기, -1·null = 끔) */
  onPreview: (map: number | null) => void;
  /** 처음 보여 줄 화면 (판이 끝나고 "캐릭터 선택"을 누르면 char) */
  entry?: "mode" | "char";
  /** 맨 처음 화면에서 뒤로(Esc) — 더 갈 곳이 없으니 전체화면 끄기 등 */
  onBack?: () => void;
}) {
  const [stage, setStage] = useState<"mode" | "char" | "map" | "vs">(entry);
  const [lock, setLock] = useState<[boolean, boolean]>([false, false]);
  const [mapCur, setMapCur] = useState(setup.map);
  /** 캐릭터 칸 커서가 '랜덤'에 있나 (쪽마다) */
  const [rnd, setRnd] = useState<[boolean, boolean]>([false, false]);
  /** 랜덤 섞는 중 (캐릭터: 쪽 번호, 맵: "map") — 그동안 입력 막음 */
  const [shuf, setShuf] = useState<0 | 1 | "map" | null>(null);
  /** 맵 섞는 동안 보여 줄 맵 (배경음악은 안 바꿈) */
  const [mapFlash, setMapFlash] = useState<number | null>(null);
  const stRef = useRef({ stage, lock, setup, mapCur, rnd, shuf });
  useEffect(() => {
    stRef.current = { stage, lock, setup, mapCur, rnd, shuf };
  });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  /** 슬롯머신처럼 점점 느려지며 칸을 넘기다 마지막에 멈춤 */
  const spin = (count: number, show: (k: number, last: boolean) => void, done: () => void) => {
    let t = 0;
    for (let k = 0; k < count; k++) {
      // 처음엔 빠르게, 끝으로 갈수록 느려짐 (전체 약 1.8초)
      const q = k / Math.max(1, count - 1);
      t += Math.round(50 + 230 * q * q * q);
      const kk = k;
      timers.current.push(setTimeout(() => show(kk, kk === count - 1), t));
    }
    // 멈춘 뒤 뽑힌 걸 잠깐 보여 주고 결정
    timers.current.push(setTimeout(done, t + 950));
  };

  // 맵 선택 중엔 커서가 있는 맵의 음악, 그 밖의 화면에선 끔
  useEffect(() => {
    onPreview(stage === "map" || stage === "vs" ? mapCur : null);
  }, [stage, mapCur, onPreview]);

  // VS 화면 잠깐 보여 주고 시작 (그동안 캐릭터 시트·맵 그림을 미리 불러 둠)
  useEffect(() => {
    if (stage !== "vs") return;
    const { setup: st } = stRef.current;
    loadSheet(CHARS[st.c1].id).catch(() => {});
    loadSheet(CHARS[st.c2].id).catch(() => {});
    const mi = st.map >= 0 ? st.map : st.rolled;
    if (mi !== undefined && MAPS[mi]?.bg) new Image().src = MAPS[mi].bg!;
    const t = setTimeout(onStart, 1500);
    return () => clearTimeout(t);
  }, [stage, onStart]);

  const ai = setup.mode === "ai";
  const n = CHARS.length;
  /** 지금 커서를 움직이는 쪽 (AI 대전: 1P가 끝나면 CPU 쪽) */
  const pickSide = (l: [boolean, boolean]) => (ai ? (l[0] ? 1 : 0) : -1);

  /** 칸 순서: 랜덤(-1), 0..n-1 */
  const setCursor = (side: 0 | 1, pos: number) => {
    setRnd((r) => (side === 0 ? [pos < 0, r[1]] : [r[0], pos < 0]));
    if (pos >= 0) setSetup((s) => (side === 0 ? { ...s, c1: pos } : { ...s, c2: pos }));
  };
  const move = (side: 0 | 1, d: number) => {
    const { rnd, setup } = stRef.current;
    const cur = rnd[side] ? -1 : side === 0 ? setup.c1 : setup.c2;
    setCursor(side, ((cur + 1 + d + n + 1) % (n + 1)) - 1);
  };
  const lockSide = (side: 0 | 1) => {
    const l: [boolean, boolean] = [...stRef.current.lock];
    l[side] = true;
    setLock(l);
    if (l[0] && l[1]) setStage("map");
  };
  const confirm = (side: 0 | 1) => {
    const { rnd, shuf } = stRef.current;
    if (shuf !== null) return;
    if (!rnd[side]) return lockSide(side);
    // 랜덤: 얼굴 칸을 돌다가 하나에 멈춤
    const pick = Math.floor(Math.random() * n);
    const start = Math.floor(Math.random() * n);
    const count = 14 + ((pick - start - 14 + n * 4) % n) + 1;
    setShuf(side);
    setRnd((r) => (side === 0 ? [false, r[1]] : [r[0], false]));
    spin(
      count,
      (k) => setSetup((s) => (side === 0 ? { ...s, c1: (start + k) % n } : { ...s, c2: (start + k) % n })),
      () => {
        setShuf(null);
        lockSide(side);
      }
    );
  };
  /** 맵 결정 (랜덤이면 섞기 연출 뒤 VS) */
  const confirmMap = (cur: number) => {
    if (stRef.current.shuf !== null) return;
    if (cur >= 0) {
      setSetup((s) => ({ ...s, map: cur, rolled: undefined }));
      setStage("vs");
      return;
    }
    const m = MAPS.length;
    const pick = Math.floor(Math.random() * m);
    const count = 10 + ((pick - 10 + m * 6) % m) + 1;
    setShuf("map");
    spin(
      count,
      (k) => setMapFlash(k % m),
      () => {
        setShuf(null);
        setMapFlash(null);
        setSetup((s) => ({ ...s, map: -1, rolled: pick }));
        setMapCur(pick);
        setStage("vs");
      }
    );
  };
  const cancel = (side: 0 | 1) => {
    const l: [boolean, boolean] = [...stRef.current.lock];
    if (l[side]) l[side] = false;
    else if (side === 1 && ai) l[0] = false;
    else if (side === 0 && !l[1]) {
      // 아무것도 안 고른 상태에서 취소 → 모드 선택으로
      setStage("mode");
      return;
    }
    setLock(l);
  };
  const backToChars = () => {
    // 맵 선택에서 뒤로: 1P부터 다시 고름
    setLock([false, false]);
    setStage("char");
  };
  const toChars = () => {
    if (stRef.current.setup.mode === "online") {
      onOnline?.();
      return;
    }
    setLock([false, false]);
    setStage("char");
  };
  const mapOptions = [-1, ...MAPS.map((_, i) => i)];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      const { stage, lock, mapCur, shuf } = stRef.current;
      if (shuf !== null) {
        e.preventDefault();
        return;
      }
      const k = e.code;
      const p1 = { l: k === "KeyA", r: k === "KeyD", ok: k === "KeyJ" || k === "Space", no: k === "Escape" };
      const p2 = {
        l: k === "ArrowLeft",
        r: k === "ArrowRight",
        ok: k === "Enter" || k === "NumpadEnter" || k === "Comma",
        no: k === "Period" || k === "Backspace",
      };
      const any = p1.l || p1.r || p1.ok || p1.no || p2.l || p2.r || p2.ok || p2.no;
      if (!any) return;
      e.preventDefault();
      if (stage === "mode") {
        if (p1.ok || p2.ok) toChars();
        else if (p1.no) onBack?.();
        return;
      }
      if (stage === "char") {
        if (ai) {
          // AI 대전: 어느 키든 지금 고르는 쪽을 움직임
          const side = (lock[0] ? 1 : 0) as 0 | 1;
          if (p1.l || p2.l) move(side, -1);
          if (p1.r || p2.r) move(side, 1);
          if (p1.ok || p2.ok) confirm(side);
          if (p1.no || p2.no) cancel(side);
        } else {
          if (!lock[0] && p1.l) move(0, -1);
          if (!lock[0] && p1.r) move(0, 1);
          if (p1.ok) confirm(0);
          if (p1.no) cancel(0);
          if (!lock[1] && p2.l) move(1, -1);
          if (!lock[1] && p2.r) move(1, 1);
          if (p2.ok) confirm(1);
          if (p2.no) cancel(1);
        }
      } else if (stage === "map") {
        const i = mapOptions.indexOf(mapCur);
        if (p1.l || p2.l) setMapCur(mapOptions[(i - 1 + mapOptions.length) % mapOptions.length]);
        if (p1.r || p2.r) setMapCur(mapOptions[(i + 1) % mapOptions.length]);
        if (p1.ok || p2.ok) confirmMap(mapCur);
        if (p1.no || p2.no) backToChars();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 최신 값은 stRef로
  }, [ai]);

  const c1 = CHARS[setup.c1],
    c2 = CHARS[setup.c2];
  const side = pickSide(lock);
  const mapShownIdx = mapFlash ?? mapCur;
  const mapShown = mapShownIdx >= 0 ? MAPS[mapShownIdx] : null;
  const thumb = (i: number) => (i >= 0 ? MAPS[i].bg?.replace(".webp", "-thumb.webp") : undefined);

  return (
    <div
      className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-[#0B0D14] select-none [container-type:inline-size]"
    >
      {/* 메인 배경 (맵 선택에선 고른 맵 그림) */}
      <img
        src={stage === "map" && mapShown ? mapShown.bg : MENU_BG}
        alt=""
        className={`absolute inset-0 h-full w-full object-cover ${PX} ${stage === "mode" ? "opacity-90" : "opacity-45"} ${stage === "map" ? "blur-[3px]" : ""}`}
      />
      <div
        className={`absolute inset-0 ${stage === "mode" ? "bg-[linear-gradient(to_top,rgba(5,6,12,0.85),transparent_55%)]" : "bg-[radial-gradient(ellipse_at_center,transparent_25%,#0B0D14_90%)]"}`}
      />

      {stage === "mode" && (
        <div className="absolute inset-0 flex flex-col items-center justify-end gap-[2cqw] pb-[5cqw]">
          <div className="text-center">
            <div className="font-mono text-[6.5cqw] leading-none font-black tracking-[0.12em] text-white italic drop-shadow-[0_0.5cqw_0_#000] [text-shadow:0_0_2cqw_rgba(255,80,60,0.6)]">
              PIXEL FIGHT
            </div>
            <div className={`${KR} mt-[0.6cqw] text-[1.5cqw] tracking-[0.4em] text-white/60`}>픽셀 격투</div>
          </div>
          <div className="flex gap-[1.4cqw]">
            {(
              [
                ["ai", "AI 대전", "CPU와 1:1"],
                ["2p", "2인 대전", "한 키보드로 둘이서"],
                ["online", "온라인 대전", "방 만들고 1:1"],
              ] as const
            ).map(([m, label, sub]) => {
              const on = setup.mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSetup((s) => ({ ...s, mode: m }))}
                  className={`${KR} flex w-[17cqw] cursor-pointer flex-col items-center gap-[0.3cqw] rounded-[0.8cqw] border-[0.25cqw] px-[1cqw] py-[1.1cqw] backdrop-blur-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    on
                      ? "border-[#FDE047] bg-[#FDE047]/15 shadow-[0_0_2cqw_rgba(253,224,71,0.35)]"
                      : "border-white/25 bg-black/45 hover:border-white/60"
                  }`}
                >
                  <span className="text-[2.2cqw] font-extrabold text-white">{label}</span>
                  <span className="text-[1.15cqw] text-white/55">{sub}</span>
                </button>
              );
            })}
          </div>
          <div className={`flex min-h-[3cqw] items-center gap-[0.6cqw] ${ai ? "" : "invisible"}`}>
            <span className={`${KR} text-[1.3cqw] text-white/60`}>난이도</span>
            {AI_LEVELS.map((l, i) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setSetup((s) => ({ ...s, level: i }))}
                className={`${KR} cursor-pointer rounded-full px-[1.2cqw] py-[0.4cqw] text-[1.3cqw] transition-colors ${
                  setup.level === i ? "bg-white font-bold text-black" : "bg-black/50 text-white/65 hover:bg-white/20"
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={toChars}
            className={`${KR} cursor-pointer rounded-full bg-[#E8344E] px-[4cqw] py-[0.9cqw] text-[1.9cqw] font-extrabold text-white shadow-[0_0.4cqw_0_#7A1020] transition-transform hover:scale-105`}
          >
            시작하기
          </button>
        </div>
      )}

      {stage === "char" && (
        <>
          <div className="absolute inset-x-0 top-[2.5cqw] flex flex-col items-center gap-[0.8cqw]">
            <div className="font-mono text-[2.6cqw] font-black tracking-[0.35em] text-white italic drop-shadow-[0_0.3cqw_0_#000]">
              CHARACTER SELECT
            </div>
            <div className={`${KR} text-[1.2cqw] text-white/55`}>
              {ai ? `AI 대전 · CPU ${AI_LEVELS[setup.level].name}` : "2인 대전"}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStage("mode")}
            className={`${KR} absolute top-[2.4cqw] left-[2cqw] cursor-pointer rounded-full bg-black/50 px-[1.4cqw] py-[0.5cqw] text-[1.2cqw] text-white/70 hover:bg-white/20`}
          >
            ◀ 모드 선택
          </button>

          {/* 양쪽 전신 그림 */}
          {([0, 1] as const).map((sd) => {
            const c = sd === 0 ? c1 : c2;
            const col = sd === 0 ? "#3B82F6" : "#F43F5E";
            // 지금 고르는 쪽: AI 대전은 차례인 한쪽, 2인 대전은 아직 안 고른 쪽 모두
            const active = !lock[sd] && (ai ? side === sd : true);
            return (
              <div key={sd} className="contents">
                {/* 전신 그림: 폭이 넓은 그림이어도 설명 글씨 칸을 밀지 않게 따로 띄움 (뒤에 깔림) */}
                {rnd[sd] ? (
                  <div
                    className={`absolute top-[16%] ${sd === 0 ? "left-[6cqw]" : "right-[6cqw]"} z-0 flex h-[70%] w-[16cqw] items-center justify-center font-mono text-[14cqw] font-black text-white/70 [animation:modal-fade_250ms_ease-out]`}
                    style={{ textShadow: `0 0 2cqw ${col}` }}
                  >
                    ?
                  </div>
                ) : (
                <img
                  key={c.id}
                  src={art(c)}
                  alt={c.name}
                  className={`absolute top-[13%] ${sd === 0 ? "left-[1cqw] object-left-bottom" : "right-[1cqw] object-right-bottom"} z-0 h-[76%] w-[26cqw] object-contain ${PX} transition-[filter,opacity] duration-300 [animation:modal-fade_250ms_ease-out] ${sd === 1 ? "scale-x-[-1]" : ""} ${
                    active || lock[sd] ? "" : "opacity-45 brightness-50"
                  }`}
                  style={{
                    filter: active
                      ? `drop-shadow(0 0 0.25cqw ${col}) drop-shadow(0 0 1.4cqw ${col})`
                      : lock[sd]
                        ? "drop-shadow(0 0 0.2cqw #fff)"
                        : undefined,
                  }}
                />
                )}
                <div
                  className={`absolute top-[8.8cqw] z-10 ${sd === 0 ? "left-[27cqw]" : "right-[27cqw] flex flex-col items-end text-right"} w-[22cqw] rounded-[1cqw] bg-black/45 px-[1cqw] py-[0.8cqw] backdrop-blur-[2px]`}
                >
                  <div className={`mb-[0.6cqw] flex items-center gap-[0.6cqw] ${sd === 1 ? "flex-row-reverse" : ""}`}>
                    <span
                      className="rounded-[0.3cqw] px-[0.7cqw] font-mono text-[1.3cqw] font-black text-white"
                      style={{ background: col }}
                    >
                      {sd === 0 ? "1P" : ai ? "CPU" : "2P"}
                    </span>
                    {lock[sd] ? (
                      <span className="font-mono text-[1.4cqw] font-black text-[#FDE047] italic">READY!</span>
                    ) : active ? (
                      <span className={`${KR} animate-pulse text-[1.3cqw] font-bold`} style={{ color: col }}>
                        {ai && sd === 1 ? "▼ 상대 고르는 중" : "▼ 선택 중"}
                      </span>
                    ) : (
                      <span className={`${KR} text-[1.2cqw] text-white/35`}>대기</span>
                    )}
                  </div>
                  {rnd[sd] ? (
                    <div className={`${KR} flex flex-col gap-[0.5cqw] ${sd === 1 ? "items-end" : ""}`}>
                      <div className="font-mono text-[1.1cqw] tracking-[0.25em] text-white/45">RANDOM</div>
                      <div className="text-[3.6cqw] leading-none font-extrabold text-white">랜덤</div>
                      <div className="text-[1.2cqw] text-white/60">결정하면 섞어서 한 명을 뽑아요</div>
                    </div>
                  ) : (
                    <CharInfo c={c} right={sd === 1} />
                  )}
                </div>
              </div>
            );
          })}

          {/* 가운데 아래 얼굴 칸 */}
          <div className="absolute bottom-[1cqw] left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-[0.6cqw] rounded-[1cqw] bg-black/50 px-[1.2cqw] pt-[1.6cqw] pb-[0.7cqw] backdrop-blur-[2px]">
            <div className="flex gap-[1cqw]">
              {(() => {
                const r1 = rnd[0] && !lock[0],
                  r2 = rnd[1] && !lock[1];
                return (
                  <button
                    type="button"
                    onClick={() => {
                      const sd = (lock[0] ? 1 : 0) as 0 | 1;
                      if (lock[sd] || shuf !== null) return;
                      if (rnd[sd]) confirm(sd);
                      else setCursor(sd, -1);
                    }}
                    className="relative cursor-pointer"
                  >
                    <span
                      className={`flex h-[6.4cqw] w-[6.4cqw] items-center justify-center rounded-[0.5cqw] border-[0.3cqw] bg-black/60 font-mono text-[4cqw] font-black text-white/80 ${
                        r1 && r2 ? "border-[#A78BFA]" : r1 ? "border-[#3B82F6]" : r2 ? "border-[#F43F5E]" : "border-white/20"
                      } ${r1 || r2 ? "animate-pulse" : ""}`}
                    >
                      ?
                    </span>
                    <span className={`${KR} block pt-[0.3cqw] text-center text-[1.2cqw] text-white/80`}>랜덤</span>
                  </button>
                );
              })()}
              {CHARS.map((c, i) => {
                const on1 = setup.c1 === i && !rnd[0],
                  on2 = setup.c2 === i && !rnd[1];
                const act1 = !lock[0] && (ai ? side === 0 : true);
                const act2 = !lock[1] && (ai ? side === 1 : true);
                const glow = (on1 && act1) || (on2 && act2);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      // 아직 안 고른 쪽부터 (AI 대전은 1P → CPU). 한 번 누르면 커서, 같은 칸을 한 번 더 누르면 결정
                      const sd = (lock[0] ? 1 : 0) as 0 | 1;
                      if (lock[sd] || shuf !== null) return;
                      const cur = rnd[sd] ? -1 : sd === 0 ? setup.c1 : setup.c2;
                      if (cur === i) confirm(sd);
                      else setCursor(sd, i);
                    }}
                    className="relative cursor-pointer"
                  >
                                        <img
                      src={face(c)}
                      alt={c.name}
                      className={`h-[6.4cqw] w-[8cqw] rounded-[0.5cqw] border-[0.3cqw] object-cover ${PX} ${glow ? "animate-pulse" : ""} ${
                        on1 && on2
                          ? "border-[#A78BFA]"
                          : on1
                            ? "border-[#3B82F6]"
                            : on2
                              ? "border-[#F43F5E]"
                              : "border-white/20 grayscale-[60%]"
                      }`}
                    />
                    <span className="absolute -top-[1.6cqw] left-0 flex gap-[0.3cqw] font-mono text-[1.1cqw] font-black">
                      {on1 && <span className="rounded-[0.2cqw] bg-[#3B82F6] px-[0.4cqw] text-white">1P</span>}
                      {on2 && (
                        <span className="rounded-[0.2cqw] bg-[#F43F5E] px-[0.4cqw] text-white">{ai ? "CPU" : "2P"}</span>
                      )}
                    </span>
                    <span className={`${KR} block pt-[0.3cqw] text-center text-[1.2cqw] text-white/80`}>{c.name}</span>
                  </button>
                );
              })}
            </div>
            <div className={`${KR} text-center text-[1.1cqw] text-white/45`}>
              {ai
                ? side === 0
                  ? "내 캐릭터 고르기 — A·D(←→) 이동, J(Enter)·한 번 더 클릭 결정, Esc 뒤로"
                  : "상대(CPU) 캐릭터 고르기 — Esc(.) 내 캐릭터 다시"
                : "1P A·D + J 결정 · 2P ←→ + Enter 결정 (Esc / . 취소)"}
            </div>
          </div>
        </>
      )}

      {stage === "map" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-[1.6cqw]">
          <div className="font-mono text-[2.6cqw] font-black tracking-[0.35em] text-white italic drop-shadow-[0_0.3cqw_0_#000]">
            STAGE SELECT
          </div>
          <div className="relative w-[52cqw] overflow-hidden rounded-[0.8cqw] border-[0.3cqw] border-white/70 shadow-[0_0_3cqw_rgba(0,0,0,0.8)]">
            {mapShown ? (
               
              <img src={mapShown.bg} alt={mapShown.name} className="aspect-video w-full object-cover" />
            ) : (
              <div className="flex aspect-video w-full items-center justify-center bg-black/60 font-mono text-[6cqw] text-white/70">
                ?
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-[1.4cqw] pt-[3cqw] pb-[1cqw]">
              <div className={`${KR} text-[2.6cqw] font-extrabold text-white`}>
                {mapShown ? mapShown.name : "랜덤"}
                {shuf === "map" && <span className="ml-[1cqw] text-[1.6cqw] text-[#FDE047]">섞는 중…</span>}
              </div>
              <div className={`${KR} text-[1.3cqw] text-white/70`}>{mapShown ? mapShown.desc : "매 판 무작위"}</div>
            </div>
          </div>
          <div className="flex gap-[1cqw]">
            {mapOptions.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (shuf !== null) return;
                  if (mapCur === i) confirmMap(i);
                  else setMapCur(i);
                }}
                className={`relative h-[6.8cqw] w-[12cqw] cursor-pointer overflow-hidden rounded-[0.5cqw] border-[0.25cqw] transition-transform ${
                  mapFlash === i ? "scale-110 border-[#FDE047]" : mapCur === i && mapFlash === null ? "border-[#FDE047]" : "border-white/20"
                }`}
              >
                {thumb(i) ? (
                   
                  <img src={thumb(i)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-black/60 font-mono text-[2.4cqw] text-white/70">
                    ?
                  </span>
                )}
                <span className={`${KR} absolute inset-x-0 bottom-0 bg-black/60 text-[1.1cqw] text-white`}>
                  {i >= 0 ? MAPS[i].name : "랜덤"}
                </span>
              </button>
            ))}
          </div>
          <div className="flex gap-[1cqw]">
            <button
              type="button"
              onClick={backToChars}
              className={`${KR} cursor-pointer rounded-full bg-white/10 px-[2cqw] py-[0.6cqw] text-[1.4cqw] text-white/70 hover:bg-white/20`}
            >
              ◀ 캐릭터 다시
            </button>
            <button
              type="button"
              onClick={() => confirmMap(mapCur)}
              className={`${KR} cursor-pointer rounded-full bg-[#6C63FF] px-[2.4cqw] py-[0.6cqw] text-[1.4cqw] font-bold text-white hover:bg-[#5b52f0]`}
            >
              결정 ▶
            </button>
          </div>
        </div>
      )}

      {stage === "vs" && (
        <div className="absolute inset-0 flex items-center justify-center gap-[4cqw] bg-black/40">
          {([c1, c2] as const).map((c, i) => (
            <div key={i} className={`flex flex-col items-center gap-[1cqw] ${i === 0 ? "order-1" : "order-3"}`}>
                            <img
                src={face(c)}
                alt={c.name}
                className={`h-[18cqw] w-[22.5cqw] rounded-[0.8cqw] border-[0.4cqw] object-cover ${PX} [animation:modal-fade_300ms_ease-out]`}
                style={{ borderColor: c.color, transform: i === 1 ? "scaleX(-1)" : undefined }}
              />
              <div className={`${KR} text-[3.4cqw] font-extrabold`} style={{ color: c.color }}>
                {c.name}
              </div>
            </div>
          ))}
          <div className="order-2 font-mono text-[9cqw] font-black text-[#FDE047] italic drop-shadow-[0_0.5cqw_0_#000]">
            VS
          </div>
        </div>
      )}
    </div>
  );
}
