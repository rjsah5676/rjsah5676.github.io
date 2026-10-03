"use client";

import { rankDateLabel } from "@/lib/rankDate";
import { useEffect, useState } from "react";
import {
  addRhythmRanking,
  getRhythmTop,
  RHYTHM_NAME_MAX,
  type RhythmRanking,
} from "@/firestore/rhythmRankings";
import type { Result } from "./Stage";

const NAME_KEY = "rhythm_name";

function List({ list, highlight }: { list: RhythmRanking[]; highlight?: string | null }) {
  if (!list.length)
    return (
      <p className="py-6 text-center font-mono text-xs text-white/30">
        아직 기록이 없어요. 첫 번째가 되어보세요.
      </p>
    );
  return (
    <ol className="divide-y divide-white/5">
      {list.map((r, i) => (
        <li
          key={r.id}
          className={`flex items-center gap-3 px-1 py-1.5 font-mono text-xs ${
            r.id === highlight ? "rounded-md bg-[#6C63FF]/20" : ""
          }`}
        >
          <span
            className={`w-5 text-right ${i === 0 ? "text-[#FDE047]" : i < 3 ? "text-white/80" : "text-white/35"}`}
          >
            {i + 1}
          </span>
          <span className="min-w-0 flex-1 truncate font-['Nanum_Gothic',sans-serif] text-white/85">
            {r.name}
          </span>
          {r.ap ? (
            <span className="text-[10px] text-[#7DF9FF]">AP</span>
          ) : r.fc ? (
            <span className="text-[10px] text-[#4ADE80]">FC</span>
          ) : null}
          <span className="w-14 text-right text-white/40">{r.acc.toFixed(2)}%</span>
          <span className="w-20 text-right text-white">{r.score.toLocaleString("en-US")}</span>
          <span className="hidden w-[3.75rem] text-right text-[11px] text-white/30 tabular-nums sm:inline">
            {rankDateLabel(r.createdAt)}
          </span>
        </li>
      ))}
    </ol>
  );
}

function useTop(songId: string, diff: string, refresh: number) {
  const [state, setState] = useState<{ key: string; list: RhythmRanking[]; error: boolean } | null>(
    null
  );
  const key = `${songId}:${diff}:${refresh}`;
  useEffect(() => {
    let alive = true;
    getRhythmTop(songId, diff)
      .then((list) => alive && setState({ key, list, error: false }))
      .catch(() => alive && setState({ key, list: [], error: true }));
    return () => {
      alive = false;
    };
  }, [songId, diff, key]);
  return state?.key === key ? state : null;
}

/** 곡 선택 화면: 현재 곡·난이도 TOP 10 */
export function RankingBoard({
  songId,
  diff,
  label,
}: {
  songId: string;
  diff: string;
  label: string;
}) {
  const top = useTop(songId, diff, 0);
  return (
    <div className="rounded-xl border border-white/10 bg-[#1C1E24] p-4">
      <p className="mb-2 font-mono text-sm font-bold text-white">
        랭킹 <span className="text-xs font-normal text-white/40">· {label} TOP 10</span>
      </p>
      {!top ? (
        <p className="py-6 text-center font-mono text-xs text-white/30">불러오는 중…</p>
      ) : top.error ? (
        <p className="py-6 text-center font-mono text-xs text-red-300/80">
          랭킹을 불러오지 못했습니다.
        </p>
      ) : (
        <List list={top.list} />
      )}
    </div>
  );
}

/** 결과 화면: 이름 넣고 등록 + TOP 10 */
export function SubmitRanking({ result, label }: { result: Result; label: string }) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [myId, setMyId] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const top = useTop(result.songId, result.diff, refresh);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 지난번 이름 복원(마운트 1회)
      setName(localStorage.getItem(NAME_KEY) ?? "");
    } catch {}
  }, []);

  const submit = async () => {
    const n = name.trim();
    if (!n || status === "saving" || status === "done") return;
    setStatus("saving");
    try {
      const id = await addRhythmRanking(result.songId, result.diff, {
        name: n,
        score: result.score,
        acc: result.acc,
        maxCombo: result.maxCombo,
        fc: result.fc,
        ap: result.ap,
      });
      try {
        localStorage.setItem(NAME_KEY, n);
      } catch {}
      setMyId(id);
      setStatus("done");
      setRefresh((r) => r + 1);
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  };

  const myRank = top && myId ? top.list.findIndex((r) => r.id === myId) : -1;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#1C1E24] p-5">
      <p className="mb-3 font-mono text-sm font-bold text-white">
        랭킹 <span className="text-xs font-normal text-white/40">· {label} TOP 10</span>
      </p>
      {status === "done" ? (
        <p className="mb-3 rounded-lg bg-white/5 px-3 py-2 text-center font-mono text-xs text-white/70">
          등록 완료{myRank >= 0 ? ` · ${myRank + 1}위` : top ? " · TOP 10 밖" : ""}
        </p>
      ) : (
        <form
          className="mb-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, RHYTHM_NAME_MAX))}
            placeholder="이름"
            maxLength={RHYTHM_NAME_MAX}
            className="min-w-0 flex-1 rounded-full border border-white/10 bg-[#15171c] px-4 py-2 font-['Nanum_Gothic',sans-serif] text-sm text-white placeholder:text-white/25 focus:border-[#6C63FF]/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!name.trim() || status === "saving"}
            className="shrink-0 cursor-pointer rounded-full bg-[#6C63FF] px-4 py-2 font-mono text-sm text-white hover:bg-[#5b52f0] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === "saving" ? "등록 중…" : "등록"}
          </button>
        </form>
      )}
      {status === "error" && (
        <p className="mb-2 font-mono text-xs text-red-300/80">
          등록하지 못했습니다. 잠시 후 다시 시도해주세요.
        </p>
      )}
      {!top ? (
        <p className="py-6 text-center font-mono text-xs text-white/30">불러오는 중…</p>
      ) : top.error ? (
        <p className="py-6 text-center font-mono text-xs text-red-300/80">
          랭킹을 불러오지 못했습니다.
        </p>
      ) : (
        <List list={top.list} highlight={myId} />
      )}
    </div>
  );
}
