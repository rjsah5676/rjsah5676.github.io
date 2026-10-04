"use client";

/**
 * 격투게임 시작 전 화면: 캐릭터 선택 → 맵 선택 → VS.
 * 키보드: 1P A·D 고르기 · J/Space 결정 · K 취소, 2P ←→ · Enter 결정 · . 취소 (마우스·터치도 됨)
 * AI 대전이면 1P가 자기 캐릭터를 고른 뒤 상대(CPU) 캐릭터도 고름.
 */
import { useEffect, useRef, useState } from "react";
import { CHARS, type CharDef } from "@/lib/fight/chars";
import { MAPS } from "@/lib/fight/maps";
import { AI_LEVELS } from "@/lib/fight/ai";

export type Mode = "ai" | "2p";
export interface Setup {
  mode: Mode;
  c1: number;
  c2: number;
  level: number;
  /** MAPS 인덱스, -1 = 랜덤 */
  map: number;
}

const face = (c: CharDef) => `/fight/art/${c.id}-face.webp`;
const art = (c: CharDef) => `/fight/art/${c.id}.webp`;
const PX = "[image-rendering:pixelated]";
const KR = "font-['Nanum_Gothic',sans-serif]";

function CharInfo({ c, right }: { c: CharDef; right?: boolean }) {
  return (
    <div className={`flex flex-col gap-[0.5cqw] ${right ? "items-end text-right" : ""}`}>
      <div className="font-mono text-[1.4cqw] tracking-[0.3em] text-white/50">{c.title}</div>
      <div
        className={`${KR} text-[4.4cqw] leading-none font-extrabold drop-shadow-[0_0.3cqw_0_#000]`}
        style={{ color: c.color }}
      >
        {c.name}
      </div>
      <div className={`${KR} max-w-[19cqw] text-[1.2cqw] text-white/60`}>{c.desc}</div>
      <div className={`${KR} mt-[0.6cqw] max-w-[19cqw] text-[1.1cqw] leading-snug text-white/75`}>
        <span className="mr-[0.6cqw] rounded-[0.3cqw] bg-[#FDE047]/90 px-[0.5cqw] font-bold text-black">
          아이덴티티 · {c.idName}
        </span>
        {c.idDesc}
      </div>
      <div className={`${KR} max-w-[19cqw] text-[1.1cqw] leading-snug text-white/75`}>
        <span className="mr-[0.6cqw] rounded-[0.3cqw] bg-[#22D3EE]/90 px-[0.5cqw] font-bold text-black">
          필살기 · {c.ultName}
        </span>
        {c.ultDesc}
      </div>
    </div>
  );
}

export default function Select({
  setup,
  setSetup,
  onStart,
  onInteract,
}: {
  setup: Setup;
  setSetup: (f: (s: Setup) => Setup) => void;
  onStart: () => void;
  /** 첫 클릭·키 입력 (배경음악 시작용) */
  onInteract: () => void;
}) {
  const [stage, setStage] = useState<"char" | "map" | "vs">("char");
  const [lock, setLock] = useState<[boolean, boolean]>([false, false]);
  const [mapCur, setMapCur] = useState(setup.map);
  const stRef = useRef({ stage, lock, setup, mapCur });
  useEffect(() => {
    stRef.current = { stage, lock, setup, mapCur };
  });

  // VS 화면 잠깐 보여 주고 시작
  useEffect(() => {
    if (stage !== "vs") return;
    const t = setTimeout(onStart, 1500);
    return () => clearTimeout(t);
  }, [stage, onStart]);

  const ai = setup.mode === "ai";
  const n = CHARS.length;
  /** 지금 커서를 움직이는 쪽 (AI 대전: 1P가 끝나면 CPU 쪽) */
  const pickSide = (l: [boolean, boolean]) => (ai ? (l[0] ? 1 : 0) : -1);

  const move = (side: 0 | 1, d: number) =>
    setSetup((s) => (side === 0 ? { ...s, c1: (s.c1 + d + n) % n } : { ...s, c2: (s.c2 + d + n) % n }));
  const confirm = (side: 0 | 1) => {
    const l: [boolean, boolean] = [...stRef.current.lock];
    l[side] = true;
    setLock(l);
    if (l[0] && l[1]) setStage("map");
  };
  const cancel = (side: 0 | 1) => {
    const l: [boolean, boolean] = [...stRef.current.lock];
    if (l[side]) l[side] = false;
    else if (side === 1 && ai) l[0] = false;
    setLock(l);
  };
  const mapOptions = [-1, ...MAPS.map((_, i) => i)];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      const { stage, lock, mapCur } = stRef.current;
      const k = e.code;
      const p1 = { l: k === "KeyA", r: k === "KeyD", ok: k === "KeyJ" || k === "Space", no: k === "KeyK" };
      const p2 = {
        l: k === "ArrowLeft",
        r: k === "ArrowRight",
        ok: k === "Enter" || k === "NumpadEnter" || k === "Comma",
        no: k === "Period" || k === "Backspace",
      };
      const any = p1.l || p1.r || p1.ok || p1.no || p2.l || p2.r || p2.ok || p2.no;
      if (!any) return;
      e.preventDefault();
      onInteract();
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
        if (p1.ok || p2.ok) {
          setSetup((s) => ({ ...s, map: mapCur }));
          setStage("vs");
        }
        if (p1.no || p2.no) {
          setLock([true, false]);
          setStage("char");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 최신 값은 stRef로
  }, [ai]);

  const c1 = CHARS[setup.c1],
    c2 = CHARS[setup.c2];
  const side = pickSide(lock);
  const mapShown = mapCur >= 0 ? MAPS[mapCur] : null;
  const thumb = (i: number) => (i >= 0 ? MAPS[i].bg?.replace(".webp", "-thumb.webp") : undefined);

  return (
    <div
      className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-[#0B0D14] select-none [container-type:inline-size]"
      onPointerDown={onInteract}
    >
      {/* 배경: 맵 그림을 어둡게 */}
      { }
      <img
        src={MAPS[0].bg}
        alt=""
        className="absolute inset-0 h-full w-full scale-105 object-cover opacity-30 blur-[2px]"
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#0B0D14_85%)]" />

      {stage === "char" && (
        <>
          <div className="absolute inset-x-0 top-[2.5cqw] flex flex-col items-center gap-[0.8cqw]">
            <div className="font-mono text-[2.6cqw] font-black tracking-[0.35em] text-white italic drop-shadow-[0_0.3cqw_0_#000]">
              CHARACTER SELECT
            </div>
            <div className="flex items-center gap-[0.8cqw]">
              {(
                [
                  ["ai", "AI 대전"],
                  ["2p", "2인 대전"],
                ] as const
              ).map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setSetup((s) => ({ ...s, mode: m }));
                    setLock([false, false]);
                  }}
                  className={`${KR} cursor-pointer rounded-full px-[1.4cqw] py-[0.4cqw] text-[1.3cqw] transition-colors ${
                    setup.mode === m ? "bg-[#6C63FF] text-white" : "bg-white/10 text-white/60 hover:bg-white/20"
                  }`}
                >
                  {label}
                </button>
              ))}
              {ai && (
                <span className="flex items-center gap-[0.4cqw] pl-[1cqw]">
                  <span className={`${KR} text-[1.2cqw] text-white/45`}>CPU</span>
                  {AI_LEVELS.map((l, i) => (
                    <button
                      key={l.id}
                      type="button"
                      title={l.name}
                      onClick={() => setSetup((s) => ({ ...s, level: i }))}
                      className={`${KR} cursor-pointer rounded-full px-[0.9cqw] py-[0.3cqw] text-[1.15cqw] transition-colors ${
                        setup.level === i ? "bg-white text-black" : "bg-white/10 text-white/55 hover:bg-white/20"
                      }`}
                    >
                      {l.name}
                    </button>
                  ))}
                </span>
              )}
            </div>
          </div>

          {/* 양쪽 전신 그림 */}
          {([0, 1] as const).map((sd) => {
            const c = sd === 0 ? c1 : c2;
            return (
              <div
                key={sd}
                className={`absolute bottom-0 ${sd === 0 ? "left-[1cqw]" : "right-[1cqw]"} flex h-[78%] items-end gap-[1.5cqw] ${sd === 1 ? "flex-row-reverse" : ""}`}
              >
                { }
                <img
                  key={c.id}
                  src={art(c)}
                  alt={c.name}
                  className={`h-full w-auto ${PX} drop-shadow-[0_0_2cqw_rgba(0,0,0,0.8)] [animation:modal-fade_250ms_ease-out] ${sd === 1 ? "scale-x-[-1]" : ""} ${lock[sd] ? "" : "opacity-90"}`}
                />
                <div className="mb-[18cqw]">
                  <div
                    className={`mb-[0.6cqw] inline-block rounded-[0.3cqw] px-[0.7cqw] font-mono text-[1.3cqw] font-black ${sd === 0 ? "bg-[#3B82F6]" : "bg-[#F43F5E]"} text-white`}
                  >
                    {sd === 0 ? "1P" : ai ? "CPU" : "2P"} {lock[sd] ? "✔" : ""}
                  </div>
                  <CharInfo c={c} right={sd === 1} />
                </div>
              </div>
            );
          })}

          {/* 가운데 아래 얼굴 칸 */}
          <div className="absolute bottom-[2.5cqw] left-1/2 flex -translate-x-1/2 flex-col items-center gap-[1cqw]">
            <div className="flex gap-[1cqw]">
              {CHARS.map((c, i) => {
                const on1 = setup.c1 === i,
                  on2 = setup.c2 === i;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      // 아직 안 고른 쪽부터 (AI 대전은 1P → CPU)
                      const sd = (lock[0] ? 1 : 0) as 0 | 1;
                      setSetup((s) => (sd === 0 ? { ...s, c1: i } : { ...s, c2: i }));
                      confirm(sd);
                    }}
                    className="relative cursor-pointer"
                  >
                    { }
                    <img
                      src={face(c)}
                      alt={c.name}
                      className={`h-[7.5cqw] w-[9.4cqw] rounded-[0.5cqw] border-[0.3cqw] object-cover ${PX} ${
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
                  ? "내 캐릭터 고르기 — A·D(←→) 이동, J(Enter) 결정"
                  : "상대(CPU) 캐릭터 고르기 — K(.) 뒤로"
                : "1P A·D + J 결정 · 2P ←→ + Enter 결정 (K / . 취소)"}
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
              <div className={`${KR} text-[2.6cqw] font-extrabold text-white`}>{mapShown ? mapShown.name : "랜덤"}</div>
              <div className={`${KR} text-[1.3cqw] text-white/70`}>{mapShown ? mapShown.desc : "매 판 무작위"}</div>
            </div>
          </div>
          <div className="flex gap-[1cqw]">
            {mapOptions.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (mapCur === i) {
                    setSetup((s) => ({ ...s, map: i }));
                    setStage("vs");
                  } else setMapCur(i);
                }}
                className={`relative h-[6.8cqw] w-[12cqw] cursor-pointer overflow-hidden rounded-[0.5cqw] border-[0.25cqw] ${
                  mapCur === i ? "border-[#FDE047]" : "border-white/20"
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
              onClick={() => {
                setLock([true, false]);
                setStage("char");
              }}
              className={`${KR} cursor-pointer rounded-full bg-white/10 px-[2cqw] py-[0.6cqw] text-[1.4cqw] text-white/70 hover:bg-white/20`}
            >
              ◀ 캐릭터 다시
            </button>
            <button
              type="button"
              onClick={() => {
                setSetup((s) => ({ ...s, map: mapCur }));
                setStage("vs");
              }}
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
              { }
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
