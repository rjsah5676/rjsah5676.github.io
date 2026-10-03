"use client";

import { useEffect, useRef, useState } from "react";
import {
  cleanupEmptyRoom,
  createRoom,
  serverNow,
  subscribeLobby,
  type LobbyRoom,
  type TurnMode,
} from "@/realtime/sketch";

const field =
  "rounded-lg border border-white/10 bg-[#15171c] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#6C63FF]/50 focus:outline-none";
const seg = (on: boolean) =>
  `cursor-pointer rounded-full px-3 py-1.5 font-mono text-xs transition-colors ${
    on ? "bg-[#6C63FF] text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
  }`;
const PHASE_LABEL: Record<string, string> = {
  waiting: "대기 중",
  choosing: "게임 중 · 참가 가능",
  drawing: "게임 중 · 참가 가능",
  reveal: "게임 중 · 참가 가능",
  ended: "게임 끝",
};

export default function SketchLobby({
  uid,
  nick,
  onEnter,
}: {
  uid: string;
  nick: string;
  onEnter: (roomId: string) => void;
}) {
  const [rooms, setRooms] = useState<LobbyRoom[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [max, setMax] = useState(8);
  const [turnMode, setTurnMode] = useState<TurnMode>("winner");
  const [drawTime, setDrawTime] = useState(80);
  const [rounds, setRounds] = useState(2);
  const [hints, setHints] = useState(true);
  const [password, setPassword] = useState("");

  // 아무도 없는 방 정리 — 1분 넘은 방만, 세션당 한 번씩 확인 (실제 접속자가 있으면 지우지 않음)
  const checked = useRef(new Set<string>());
  useEffect(
    () =>
      subscribeLobby((list) => {
        setRooms(list);
        for (const r of list) {
          if (checked.current.has(r.id) || serverNow() - r.createdAt < 60_000) continue;
          checked.current.add(r.id);
          cleanupEmptyRoom(r.id);
        }
      }),
    []
  );

  const create = async () => {
    setBusy(true);
    setError("");
    try {
      const id = await createRoom(uid, nick, {
        name,
        max,
        turnMode,
        drawTime,
        rounds,
        hints,
        password,
      });
      onEnter(id);
    } catch (e) {
      console.error(e);
      setError("방을 만들지 못했어요. 잠시 후 다시 시도해주세요.");
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 pt-6 pb-24">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-sm text-[#8B84FF]">games</div>
          <h1 className="mt-1 font-mono text-2xl font-bold text-white">🎨 스케치 퀴즈</h1>
          <p className="mt-2 font-['Nanum_Gothic',sans-serif] text-sm text-white/50">
            한 명이 그리고 나머지가 맞혀요. 최대 8명, 빨리 맞힐수록 점수가 높아요.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="cursor-pointer rounded-full bg-[#6C63FF] px-5 py-2 font-mono text-sm text-white hover:bg-[#5b52f0]"
        >
          {creating ? "닫기" : "+ 방 만들기"}
        </button>
      </div>

      {creating && (
        <div className="mb-8 grid gap-4 rounded-2xl border border-white/10 bg-[#1C1E24] p-5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            placeholder={`${nick}의 방`}
            aria-label="방 이름"
            className={field}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1.5 font-mono text-[11px] text-white/40">최대 인원</div>
              <div className="flex flex-wrap gap-1">
                {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={seg(max === n)}
                    onClick={() => setMax(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1.5 font-mono text-[11px] text-white/40">다음에 그릴 사람</div>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  className={seg(turnMode === "winner")}
                  onClick={() => setTurnMode("winner")}
                >
                  맞힌 사람
                </button>
                <button
                  type="button"
                  className={seg(turnMode === "order")}
                  onClick={() => setTurnMode("order")}
                >
                  입장 순서
                </button>
              </div>
            </div>
            <div>
              <div className="mb-1.5 font-mono text-[11px] text-white/40">그리는 시간</div>
              <div className="flex flex-wrap gap-1">
                {[60, 80, 100, 120].map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={seg(drawTime === t)}
                    onClick={() => setDrawTime(t)}
                  >
                    {t}초
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1.5 font-mono text-[11px] text-white/40">
                한 사람당 그리는 횟수
              </div>
              <div className="flex flex-wrap gap-1">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={seg(rounds === n)}
                    onClick={() => setRounds(n)}
                  >
                    {n}번
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex cursor-pointer items-center gap-1.5 font-mono text-xs text-white/60">
              <input
                type="checkbox"
                checked={hints}
                onChange={(e) => setHints(e.target.checked)}
                className="h-3.5 w-3.5 accent-[#6C63FF]"
              />
              시간이 지나면 힌트 공개 (첫 글자 → 초성)
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={20}
              placeholder="비밀번호 (비우면 공개방)"
              aria-label="비밀번호"
              className={`${field} min-w-0 flex-1`}
            />
          </div>
          {error && <p className="font-mono text-xs text-red-300">{error}</p>}
          <button
            type="button"
            disabled={busy}
            onClick={create}
            className="cursor-pointer rounded-full bg-[#6C63FF] py-2.5 font-mono text-sm text-white hover:bg-[#5b52f0] disabled:opacity-50"
          >
            {busy ? "만드는 중…" : "방 만들기"}
          </button>
        </div>
      )}

      {rooms === null ? (
        <p className="py-12 text-center font-mono text-sm text-white/30">불러오는 중…</p>
      ) : rooms.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-[#1C1E24] py-14 text-center font-['Nanum_Gothic',sans-serif] text-sm text-white/40">
          열린 방이 없어요. 방을 만들고 친구에게 초대 링크를 보내보세요!
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {rooms.map((r) => {
            const full = r.count >= r.max;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  disabled={full}
                  onClick={() => onEnter(r.id)}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#1C1E24] px-4 py-3 text-left transition-colors hover:border-[#6C63FF]/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-['Nanum_Gothic',sans-serif] text-sm text-white">
                      {r.locked && "🔒 "}
                      {r.name}
                    </span>
                    <span className="font-mono text-[11px] text-white/35">
                      {PHASE_LABEL[r.phase] ?? r.phase} ·{" "}
                      {r.turnMode === "winner" ? "맞힌 사람 순" : "입장 순"}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 font-mono text-sm ${full ? "text-red-300" : "text-white/70"}`}
                  >
                    {r.count}/{r.max}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
