"use client";

import { useEffect, useRef, useState } from "react";
import { analyzeAudio, displayBpm, rescaleTempo, type Analysis } from "@/lib/rhythm/analyze";
import { DIFFICULTIES, type Chart, type Difficulty } from "@/lib/rhythm/chart";
import { makeHitSound } from "@/lib/rhythm/fx";
import HoldButton from "./HoldButton";

/** 사용자가 넣은 곡 (메모리에만 — 새로고침하면 다시 골라야 함) */
export interface CustomTrack {
  key: string;
  name: string;
  buffer: AudioBuffer;
  analysis: Analysis;
  /** 곡별 채보 보정(ms, +면 노트가 늦게) — 이 브라우저에 곡별로 저장 */
  shiftMs: number;
}

const SHIFT_KEY = "rhythm_custom_shift";
const MAX_BYTES = 40 * 1024 * 1024;
const MAX_SEC = 12 * 60;
const PREVIEW_SEC = 30;

const btn =
  "cursor-pointer rounded-full border border-white/15 px-3 py-1.5 font-mono text-xs whitespace-nowrap text-white/70 transition-colors hover:border-[#6C63FF]/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-30";
const stepBtn =
  "h-8 w-8 shrink-0 cursor-pointer rounded-full border border-white/15 font-mono text-sm text-white/70 hover:border-[#6C63FF]/60 hover:text-white";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const hashOf = (s: string) =>
  ([...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0).toString(
    36
  );

function loadShift(key: string) {
  try {
    const all = JSON.parse(localStorage.getItem(SHIFT_KEY) ?? "{}") as Record<string, number>;
    return Number(all[key]) || 0;
  } catch {
    return 0;
  }
}
function saveShift(key: string, ms: number) {
  try {
    const all = JSON.parse(localStorage.getItem(SHIFT_KEY) ?? "{}") as Record<string, number>;
    all[key] = ms;
    localStorage.setItem(SHIFT_KEY, JSON.stringify(all));
  } catch {}
}

export default function CustomMusic({
  track,
  onTrack,
  charts,
  diff,
  onDiff,
  best,
  getCtx,
  onStart,
  starting,
}: {
  track: CustomTrack | null;
  onTrack: (t: CustomTrack | null) => void;
  charts: Record<Difficulty, Chart> | null;
  diff: Difficulty;
  onDiff: (d: Difficulty) => void;
  best: Record<string, { score: number; rank: string; fc: boolean; ap: boolean }>;
  getCtx: () => Promise<AudioContext>;
  onStart: () => void;
  starting: boolean;
}) {
  const [busy, setBusy] = useState<{ ratio: number; label: string } | null>(null);
  const [err, setErr] = useState("");
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async (file: File) => {
    setErr("");
    if (file.size > MAX_BYTES) return setErr("파일이 너무 커요 (40MB까지).");
    setBusy({ ratio: 0, label: "파일 읽는 중" });
    try {
      const ctx = await getCtx();
      const buffer = await ctx.decodeAudioData(await file.arrayBuffer());
      if (buffer.duration > MAX_SEC) throw new Error("12분이 넘는 곡은 분석할 수 없어요.");
      if (buffer.duration < 15) throw new Error("15초보다 짧은 파일은 분석할 수 없어요.");
      const analysis = await analyzeAudio(buffer, (ratio, label) => setBusy({ ratio, label }));
      if (analysis.onsets.length < 20)
        throw new Error("박자를 찾지 못했어요. 다른 곡으로 해보세요.");
      const key = hashOf(`${file.name}:${file.size}:${buffer.duration.toFixed(2)}`);
      onTrack({
        key,
        name: file.name.replace(/\.[^.]+$/, ""),
        buffer,
        analysis,
        shiftMs: loadShift(key),
      });
    } catch (e) {
      console.error(e);
      setErr(
        e instanceof Error && /분석|박자/.test(e.message)
          ? e.message
          : "이 파일을 읽지 못했어요. mp3·wav·ogg·m4a 파일인지 확인해주세요."
      );
    } finally {
      setBusy(null);
    }
  };

  // ── 미리듣기: 음악 + 노트마다 클릭음 (같은 오디오 시계로 예약해서 기기 지연과 무관하게 비교 가능) ──
  const [preview, setPreview] = useState<{ from: number; startedAt: number } | null>(null);
  const [from, setFrom] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const nodesRef = useRef<AudioScheduledSourceNode[]>([]);
  const ctxRef = useRef<AudioContext | null>(null);
  const stopPreview = () => {
    for (const n of nodesRef.current)
      try {
        n.stop();
      } catch {}
    nodesRef.current = [];
    setPreview(null);
  };
  const playPreview = async (at: number) => {
    if (!track || !charts) return;
    stopPreview();
    const ctx = await getCtx();
    ctxRef.current = ctx;
    const t0 = ctx.currentTime + 0.12;
    const music = ctx.createBufferSource();
    music.buffer = track.buffer;
    const mg = ctx.createGain();
    mg.gain.value = 0.75;
    music.connect(mg).connect(ctx.destination);
    music.start(t0, at, PREVIEW_SEC);
    const nodes: AudioScheduledSourceNode[] = [music];
    const click = makeHitSound(ctx, "wood");
    const cg = ctx.createGain();
    cg.gain.value = 0.9;
    cg.connect(ctx.destination);
    for (const n of charts[diff].notes) {
      if (n.t < at || n.t > at + PREVIEW_SEC) continue;
      const s = ctx.createBufferSource();
      s.buffer = click;
      s.connect(cg);
      s.start(t0 + n.t - at);
      nodes.push(s);
    }
    music.onended = () => {
      if (nodesRef.current[0] === music) setPreview(null);
    };
    nodesRef.current = nodes;
    setPreview({ from: at, startedAt: t0 });
  };
  useEffect(() => {
    if (!preview) return;
    let raf = 0;
    const loop = () => {
      const ctx = ctxRef.current;
      if (ctx) setElapsed(Math.max(0, ctx.currentTime - preview.startedAt));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [preview]);
  // 화면 나갈 때 정지
  useEffect(() => () => nodesRef.current.forEach((n) => n.stop?.()), []);

  // 보정값·난이도·템포가 바뀌면 듣던 위치에서 다시
  const restartKey = `${track?.shiftMs}:${diff}:${track?.analysis.bpm}`;
  const lastKey = useRef(restartKey);
  useEffect(() => {
    if (lastKey.current === restartKey) return;
    lastKey.current = restartKey;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 설정이 바뀌면 미리듣기를 다시 예약
    if (preview) playPreview(preview.from + elapsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 설정이 바뀐 순간에만
  }, [restartKey]);

  const setShift = (ms: number) => {
    if (!track) return;
    const v = Math.max(-200, Math.min(200, Math.round(ms)));
    saveShift(track.key, v);
    onTrack({ ...track, shiftMs: v });
  };

  // ───────── 파일 고르기 전 ─────────
  if (!track) {
    return (
      <div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => !busy && inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && !busy && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files[0];
            if (f && !busy) load(f);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
            drag
              ? "border-[#6C63FF] bg-[#6C63FF]/10"
              : "border-white/15 bg-[#1C1E24] hover:border-white/30"
          }`}
        >
          {busy ? (
            <>
              <p className="font-['Nanum_Gothic',sans-serif] text-sm text-white/80">
                {busy.label}…
              </p>
              <div className="h-1.5 w-60 max-w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-gradient-to-r from-[#6C63FF] to-[#2dd4bf] transition-[width]"
                  style={{ width: `${Math.round(busy.ratio * 100)}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <span className="text-3xl">🎵</span>
              <p className="font-['Nanum_Gothic',sans-serif] text-sm text-white/85">
                음악 파일을 끌어다 놓거나 눌러서 고르세요
              </p>
              <p className="font-mono text-[11px] text-white/35">
                mp3 · wav · ogg · m4a · 12분 이하
              </p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.m4a"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) load(f);
            }}
          />
        </div>
        {err && <p className="mt-2 text-center font-mono text-xs text-red-300">{err}</p>}
        <ul className="mt-4 space-y-1 font-['Nanum_Gothic',sans-serif] text-xs leading-relaxed text-white/40">
          <li>• 파일은 서버로 올라가지 않아요. 이 브라우저 안에서만 분석하고 재생합니다.</li>
          <li>• 드럼 소리와 박자를 분석해서 쉬움~매우 어려움 채보를 자동으로 만들어요.</li>
          <li>• 직접 넣은 곡은 랭킹에 올라가지 않고, 최고 기록만 이 브라우저에 남아요.</li>
        </ul>
      </div>
    );
  }

  // ───────── 분석 끝 ─────────
  const a = track.analysis;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#1C1E24] p-4">
        <div className="min-w-0">
          <p className="truncate font-['Nanum_Gothic',sans-serif] text-base font-bold text-white">
            🎵 {track.name}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-white/45">
            <span>{fmt(a.duration)}</span>
            <span className="flex items-center gap-1.5">
              <span className="text-white/80">{displayBpm(a).toFixed(1)} BPM</span>
              <button
                type="button"
                className="cursor-pointer rounded border border-white/15 px-1.5 text-[10px] hover:border-[#6C63FF]/60 hover:text-white"
                title="박이 너무 느리게 잡혔으면"
                onClick={() => onTrack({ ...track, analysis: rescaleTempo(a, 2) })}
                disabled={a.bpm * 2 > 260}
              >
                ×2
              </button>
              <button
                type="button"
                className="cursor-pointer rounded border border-white/15 px-1.5 text-[10px] hover:border-[#6C63FF]/60 hover:text-white"
                title="박이 너무 빠르게 잡혔으면"
                onClick={() => onTrack({ ...track, analysis: rescaleTempo(a, 0.5) })}
                disabled={a.bpm / 2 < 50}
              >
                ÷2
              </button>
            </span>
          </p>
        </div>
        <button
          type="button"
          className={btn}
          onClick={() => {
            stopPreview();
            onTrack(null);
          }}
        >
          다른 파일
        </button>
      </div>

      {charts && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {DIFFICULTIES.map((d) => {
            const c = charts[d.key];
            const b = best[`custom:${track.key}:${d.key}`];
            const on = d.key === diff;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => onDiff(d.key)}
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
      )}

      {/* 정확도 확인 */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-[#1C1E24] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-sm font-bold text-white">채보 미리듣기</p>
          <p className="font-['Nanum_Gothic',sans-serif] text-[11px] text-white/40">
            노트 위치에 &apos;딱&apos; 소리가 나요. 드럼과 같이 들리면 정확한 거예요.
          </p>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => (preview ? stopPreview() : playPreview(from))}
            className="h-9 w-9 shrink-0 cursor-pointer rounded-full bg-[#6C63FF] font-mono text-sm text-white hover:bg-[#5b52f0]"
            aria-label={preview ? "정지" : "재생"}
          >
            {preview ? "■" : "▶"}
          </button>
          <input
            type="range"
            min={0}
            max={Math.max(0, a.duration - 5)}
            step={1}
            value={preview ? Math.min(a.duration, preview.from + elapsed) : from}
            onChange={(e) => {
              const v = Number(e.target.value);
              setFrom(v);
              if (preview) playPreview(v);
            }}
            aria-label="미리듣기 위치"
            className="min-w-0 flex-1 accent-[#6C63FF]"
          />
          <span className="w-20 text-right font-mono text-xs text-white/60">
            {fmt(preview ? preview.from + elapsed : from)} / {fmt(a.duration)}
          </span>
        </div>

        <label className="mt-4 block font-mono text-xs text-white/50">
          이 곡 채보 보정 (ms) · 딱 소리가 드럼보다 늦으면 −, 빠르면 +
        </label>
        <div className="mt-1.5 flex items-center gap-2">
          <HoldButton className={stepBtn} onStep={() => setShift(track.shiftMs - 5)}>
            −
          </HoldButton>
          <input
            type="range"
            min={-200}
            max={200}
            step={5}
            value={track.shiftMs}
            onChange={(e) => setShift(Number(e.target.value))}
            className="min-w-0 flex-1 accent-[#6C63FF]"
          />
          <HoldButton className={stepBtn} onStep={() => setShift(track.shiftMs + 5)}>
            +
          </HoldButton>
          <span className="w-12 text-right font-mono text-sm text-white">
            {track.shiftMs > 0 ? "+" : ""}
            {track.shiftMs}
          </span>
        </div>
        <p className="mt-1 font-mono text-[10px] text-white/30">
          기기 싱크는 오른쪽 &apos;음악 싱크&apos;에서 따로 맞춰요. 이 값은 이 곡에만 적용돼요.
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          stopPreview();
          onStart();
        }}
        disabled={starting || !charts}
        className="mt-5 w-full cursor-pointer rounded-full bg-[#22D3EE] py-3 font-mono text-base font-bold text-[#0b0c10] transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
      >
        {starting ? "준비 중…" : "시작 (Enter)"}
      </button>
      <p className="mt-2 text-center font-['Nanum_Gothic',sans-serif] text-[11px] text-white/35">
        직접 넣은 곡은 랭킹에 올라가지 않아요
      </p>
    </div>
  );
}
