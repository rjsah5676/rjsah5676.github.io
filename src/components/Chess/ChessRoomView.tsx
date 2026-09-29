"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import ChessBoard, { Piece } from "./ChessBoard";
import { timeLabel } from "./ChessLobby";
import {
  ABANDON_AFTER_MS,
  HEARTBEAT_MS,
  MAX_SPECTATORS,
  OFFLINE_AFTER_MS,
  beat,
  cancelUndo,
  claimAbandon,
  claimTimeout,
  colorOf,
  joinAsPlayer,
  startGame,
  joinAsSpectator,
  leaveRoom,
  liveClock,
  makeMove,
  offerDraw,
  replay,
  requestUndo,
  resign,
  respondDraw,
  respondUndo,
  serverNow,
  subscribePresence,
  subscribeRoom,
  turnOf,
  undoPlies,
  uciToMove,
  type ChessRoom,
  type Color,
  type EndReason,
  type Presence,
} from "@/firestore/chessGame";

const REASON: Record<EndReason, string> = {
  "": "",
  checkmate: "체크메이트",
  timeout: "시간 초과",
  resign: "기권",
  abandon: "상대 이탈",
  stalemate: "스테일메이트",
  insufficient: "기물 부족",
  threefold: "3회 동형반복",
  fifty: "50수 규칙",
  agreement: "합의",
};
const COLOR_KO = { w: "백", b: "흑" } as const;
const VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
const START_COUNT: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 };

const btn =
  "cursor-pointer rounded-full border border-white/15 px-3 py-1.5 font-mono text-xs whitespace-nowrap text-white/75 transition-colors hover:border-[#6C63FF]/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-30";
const primaryBtn =
  "cursor-pointer rounded-full bg-[#6C63FF] px-4 py-1.5 font-mono text-xs whitespace-nowrap text-white transition-colors hover:bg-[#5b52f0] disabled:cursor-not-allowed disabled:opacity-40";

function fmtClock(ms: number) {
  if (ms < 10_000) return (Math.max(0, ms) / 1000).toFixed(1);
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** color 쪽이 잡은 상대 기물 목록 + 기물 점수 차이 */
function captured(game: Chess) {
  const count = {
    w: { ...Object.fromEntries(Object.keys(START_COUNT).map((k) => [k, 0])) },
    b: {},
  } as Record<Color, Record<string, number>>;
  count.b = { ...count.w };
  game
    .board()
    .flat()
    .forEach((p) => {
      if (p && p.type !== "k") count[p.color][p.type]++;
    });
  const out = { w: [] as string[], b: [] as string[] };
  let score = 0;
  for (const t of ["q", "r", "b", "n", "p"]) {
    for (let i = count.b[t]; i < START_COUNT[t]; i++) out.w.push(t); // 백이 잡은 흑 기물
    for (let i = count.w[t]; i < START_COUNT[t]; i++) out.b.push(t);
    score += (count.w[t] - count.b[t]) * VALUE[t];
  }
  return { list: out, diff: score };
}

function PlayerBar({
  name,
  color,
  clockMs,
  timed,
  active,
  online,
  isMe,
  caps,
  diff,
}: {
  name: string;
  color: Color;
  clockMs: number;
  timed: boolean;
  active: boolean;
  online: boolean | null;
  isMe: boolean;
  caps: string[];
  diff: number;
}) {
  const low = timed && clockMs < 20_000;
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${online === null ? "bg-white/20" : online ? "bg-emerald-400" : "bg-red-400"}`}
          title={online === null ? "빈 자리" : online ? "접속 중" : "연결 끊김"}
        />
        <span className="truncate font-['Nanum_Gothic',sans-serif] text-sm text-white/90">
          {name || "대기 중…"}
          {isMe && <span className="ml-1 text-[#8B84FF]">(나)</span>}
        </span>
        <span className="shrink-0 font-mono text-[10px] text-white/35">{COLOR_KO[color]}</span>
        <span className="flex min-w-0 items-center overflow-hidden text-base">
          {caps.map((t, i) => (
            <Piece
              key={i}
              type={t}
              color={color === "w" ? "b" : "w"}
              className="-mr-1 text-[15px] opacity-80"
            />
          ))}
          {diff > 0 && <span className="ml-1.5 font-mono text-[11px] text-white/40">+{diff}</span>}
        </span>
      </div>
      {timed && (
        <div
          className={`shrink-0 rounded-md px-2.5 py-1 font-mono text-lg tabular-nums transition-colors ${
            active
              ? low
                ? "bg-red-500/85 text-white"
                : "bg-[#E9E6F7] text-[#16141d]"
              : "bg-white/5 text-white/45"
          }`}
        >
          {fmtClock(clockMs)}
        </div>
      )}
    </div>
  );
}

interface Props {
  roomId: string;
  uid: string;
  nick: string;
  intent: "play" | "watch" | null;
  onExit: () => void;
}

export default function ChessRoomView({ roomId, uid, nick, intent, onExit }: Props) {
  const [room, setRoom] = useState<ChessRoom | null | undefined>(undefined);
  const [presence, setPresence] = useState<Record<string, Presence>>({});
  const [now, setNow] = useState(() => serverNow());
  const [flip, setFlip] = useState(false);
  const [msg, setMsg] = useState("");
  const [confirmResign, setConfirmResign] = useState(false);
  const [copied, setCopied] = useState(false);
  // 낙관적 업데이트: 서버 응답 전에 보드에 먼저 반영
  const [pending, setPending] = useState<{ base: number; uci: string } | null>(null);
  const intentDone = useRef(false);
  const timeoutClaimed = useRef("");
  const topRef = useRef<HTMLDivElement>(null);
  const scrolled = useRef(false);

  useEffect(
    () =>
      subscribeRoom(
        roomId,
        (r) => setRoom(r),
        () => setRoom(null)
      ),
    [roomId]
  );
  useEffect(() => subscribePresence(roomId, uid, setPresence), [roomId, uid]);

  const me = room ? colorOf(room, uid) : null;
  const isSpectator = !!room && room.spectators[uid] !== undefined;
  const participating = !!me || isSpectator;
  const hostWaiting = !!room && room.status === "waiting" && room.hostUid === uid;
  const timed = !!room && room.timeMin > 0;
  const playing = room?.status === "playing";

  // 로비에서 참여/관전 누르고 들어온 경우 자동 처리
  useEffect(() => {
    if (!room || intentDone.current || participating) return;
    intentDone.current = true;
    if (!intent) return;
    const run =
      intent === "play" ? joinAsPlayer(roomId, uid, nick) : joinAsSpectator(roomId, uid, nick);
    run.catch((e: Error) => setMsg(e.message));
  }, [room, intent, participating, roomId, uid, nick]);

  // 하트비트 (탭이 백그라운드로 가도 브라우저가 허용하는 한 계속 전송,
  // 돌아오면 즉시 전송)
  useEffect(() => {
    if (!participating) return;
    const send = () => beat(roomId, uid, nick, hostWaiting).catch(() => {});
    send();
    const t = setInterval(send, HEARTBEAT_MS);
    const onVis = () => document.visibilityState === "visible" && send();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [participating, roomId, uid, nick, hostWaiting]);

  useEffect(() => {
    const t = setInterval(() => setNow(serverNow()), timed && playing ? 100 : 1000);
    return () => clearInterval(t);
  }, [timed, playing]);

  // 상단 헤더가 커서 입장 시 보드 쪽으로 스크롤 (모바일에서 특히)
  useEffect(() => {
    if (!room || scrolled.current) return;
    scrolled.current = true;
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [room]);

  const moves = room?.moves;
  const game = useMemo(() => replay(moves ?? []), [moves]);
  const history = useMemo(() => game.history(), [game]);

  // 서버 반영되면 낙관적 수 제거
  const [prevLen, setPrevLen] = useState(moves?.length ?? 0);
  if (moves && moves.length !== prevLen) {
    setPrevLen(moves.length);
    setPending(null);
  }

  const display = useMemo(() => {
    if (!room || !pending || pending.base !== room.moves.length)
      return { fen: room?.fen ?? "", last: room?.moves.at(-1) };
    const g = new Chess(room.fen);
    try {
      g.move(uciToMove(pending.uci));
      return { fen: g.fen(), last: pending.uci };
    } catch {
      return { fen: room.fen, last: room.moves.at(-1) };
    }
  }, [room, pending]);

  const clock = room ? liveClock(room, now) : { w: 0, b: 0 };
  const turn = room ? turnOf(room) : "w";

  // 시간 초과 판정 (대국자 쪽에서 감지해서 기록)
  useEffect(() => {
    if (!room || !playing || !timed || !me) return;
    const key = `${room.moves.length}`;
    if (liveClock(room, now)[turnOf(room)] <= 0 && timeoutClaimed.current !== key) {
      timeoutClaimed.current = key;
      claimTimeout(roomId).catch(() => (timeoutClaimed.current = ""));
    }
  }, [room, playing, timed, me, now, roomId]);

  if (room === undefined) {
    return <p className="pt-24 text-center font-mono text-sm text-white/40">방에 접속하는 중…</p>;
  }
  if (room === null || room.status === "closed") {
    return (
      <div className="flex flex-col items-center gap-4 pt-24 text-center">
        <p className="font-['Nanum_Gothic',sans-serif] text-white/60">
          {room === null ? "존재하지 않는 방입니다." : "방장이 방을 닫았습니다."}
        </p>
        <button type="button" onClick={onExit} className={primaryBtn}>
          로비로
        </button>
      </div>
    );
  }

  const orientation: Color = me ?? (flip ? "b" : "w");
  const opp: Color = orientation === "w" ? "b" : "w";
  const seat = (c: Color) => ({
    uid: c === "w" ? room.whiteUid : room.blackUid,
    name: c === "w" ? room.whiteName : room.blackName,
  });
  const isOnline = (c: Color): boolean | null => {
    const s = seat(c);
    if (!s.uid) return null;
    if (s.uid === uid) return true;
    const p = presence[s.uid];
    return !!p && now - p.lastSeen < OFFLINE_AFTER_MS;
  };
  const oppColor: Color | null = me ? (me === "w" ? "b" : "w") : null;
  const oppSeat = oppColor ? seat(oppColor) : null;
  const oppLastSeen = oppSeat?.uid
    ? (presence[oppSeat.uid]?.lastSeen ?? room.updatedAt?.toMillis() ?? now)
    : now;
  const oppOffline = !!oppColor && playing && isOnline(oppColor) === false;
  const oppAwayMs = now - oppLastSeen;

  const caps = captured(game);
  const canMove = playing && !!me && turn === me && !pending;
  const undoReq = room.undoReq;
  const myUndoPlies = me ? undoPlies(room, me) : 0;
  const specNames = Object.entries(room.spectators);
  const seatOpen = room.status === "waiting" && (!room.whiteUid || !room.blackUid);

  const run = (p: Promise<unknown>) =>
    p.catch((e: Error) => {
      console.error(e);
      setMsg(e.message || "요청에 실패했습니다.");
    });

  const onMove = (uci: string) => {
    setMsg("");
    setPending({ base: room.moves.length, uci });
    makeMove(roomId, uid, uci).catch((e: Error) => {
      setPending(null);
      setMsg(e.message || "수를 둘 수 없습니다.");
    });
  };

  const exit = async () => {
    await leaveRoom(room, uid).catch(() => {});
    onExit();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${location.origin}/games/chess/?room=${roomId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  let status: React.ReactNode;
  if (room.status === "waiting") {
    status = seatOpen ? "상대를 기다리는 중…" : "시작 대기 중";
  } else if (room.status === "ended") {
    const winner: Color | null = room.result === "1-0" ? "w" : room.result === "0-1" ? "b" : null;
    const head = winner ? `${COLOR_KO[winner]} 승리` : "무승부";
    const mine = me ? (winner === null ? " · 무승부" : winner === me ? " · 승리!" : " · 패배") : "";
    status = (
      <>
        <span className="text-white">{head}</span>
        <span className="text-white/50"> ({REASON[room.reason]})</span>
        <span className="text-[#8B84FF]">{mine}</span>
      </>
    );
  } else {
    status = (
      <>
        {me ? (turn === me ? "내 차례" : "상대 차례") : `${COLOR_KO[turn]} 차례`}
        {game.inCheck() && <span className="ml-2 text-red-400">체크!</span>}
      </>
    );
  }

  const pairs: [string, string | undefined][] = [];
  for (let i = 0; i < history.length; i += 2) pairs.push([history[i], history[i + 1]]);

  return (
    <div ref={topRef} className="mx-auto max-w-5xl scroll-mt-28 px-3 pt-8 pb-24 sm:px-6">
      {/* 헤더 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <button type="button" onClick={exit} className={btn}>
            ← {hostWaiting ? "방 닫기" : me && room.status === "waiting" ? "나가기" : "로비"}
          </button>
          <span className="truncate font-['Nanum_Gothic',sans-serif] text-white/90">
            {room.name}
          </span>
          <span className="shrink-0 font-mono text-xs text-white/40">{timeLabel(room)}</span>
        </div>
        <div className="flex gap-1.5">
          {!me && (
            <button type="button" onClick={() => setFlip((f) => !f)} className={btn}>
              ⇅ 뒤집기
            </button>
          )}
          <button type="button" onClick={copyLink} className={btn}>
            {copied ? "복사됨!" : "🔗 초대 링크"}
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-5 lg:flex-row lg:items-start lg:justify-center">
        {/* 보드 */}
        <div className="w-full max-w-[max(300px,min(560px,calc(100dvh-190px)))]">
          <PlayerBar
            {...seat(opp)}
            color={opp}
            clockMs={clock[opp]}
            timed={timed}
            active={playing && turn === opp}
            online={isOnline(opp)}
            isMe={seat(opp).uid === uid}
            caps={caps.list[opp]}
            diff={opp === "w" ? caps.diff : -caps.diff}
          />
          <div className="relative">
            <ChessBoard
              fen={display.fen}
              orientation={orientation}
              canMove={canMove}
              lastMove={display.last}
              onMove={onMove}
            />
            {room.status === "waiting" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-black/55 p-4 text-center">
                {!seatOpen ? (
                  room.hostUid === uid ? (
                    <>
                      <p className="font-['Nanum_Gothic',sans-serif] text-white">
                        상대가 입장했습니다
                      </p>
                      <button
                        type="button"
                        onClick={() => run(startGame(roomId, uid))}
                        className={primaryBtn}
                      >
                        ▶ 게임 시작
                      </button>
                    </>
                  ) : (
                    <p className="font-['Nanum_Gothic',sans-serif] text-white">
                      방장이 시작하기를 기다리는 중…
                    </p>
                  )
                ) : me ? (
                  <>
                    <p className="font-['Nanum_Gothic',sans-serif] text-white">
                      상대를 기다리는 중…
                    </p>
                    <p className="font-mono text-xs text-white/60">
                      초대 링크를 보내거나 로비에서 참여를 기다리세요
                    </p>
                    <button type="button" onClick={copyLink} className={primaryBtn}>
                      {copied ? "복사됨!" : "초대 링크 복사"}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="font-['Nanum_Gothic',sans-serif] text-white">
                      상대를 기다리는 중…
                    </p>
                    <button
                      type="button"
                      onClick={() => run(joinAsPlayer(roomId, uid, nick))}
                      className={primaryBtn}
                    >
                      대국 참여하기
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          <PlayerBar
            {...seat(orientation)}
            color={orientation}
            clockMs={clock[orientation]}
            timed={timed}
            active={playing && turn === orientation}
            online={isOnline(orientation)}
            isMe={seat(orientation).uid === uid}
            caps={caps.list[orientation]}
            diff={orientation === "w" ? caps.diff : -caps.diff}
          />
        </div>

        {/* 사이드 패널 */}
        <div className="flex w-full max-w-[560px] flex-col gap-3 lg:w-72 lg:max-w-none">
          <div className="rounded-xl border border-white/10 bg-[#1C1E24] px-4 py-3 font-['Nanum_Gothic',sans-serif] text-sm text-white/80">
            {status}
          </div>

          {msg && (
            <div
              className="rounded-lg bg-red-500/10 px-3 py-2 font-mono text-xs text-red-300"
              onClick={() => setMsg("")}
            >
              {msg}
            </div>
          )}

          {/* 관전/참여 안내 */}
          {!participating && room.status !== "waiting" && room.status !== "ended" && (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#1C1E24] px-4 py-3">
              <span className="font-mono text-xs text-white/50">
                관전 {specNames.length}/{MAX_SPECTATORS}
              </span>
              <button
                type="button"
                disabled={specNames.length >= MAX_SPECTATORS}
                onClick={() => run(joinAsSpectator(roomId, uid, nick))}
                className={primaryBtn}
              >
                관전하기
              </button>
            </div>
          )}

          {/* 상대 연결 끊김 */}
          {me && oppOffline && (
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 font-['Nanum_Gothic',sans-serif] text-xs text-amber-200">
              상대 연결이 끊겼습니다 ({Math.floor(oppAwayMs / 1000)}초). 돌아오면 이어서 진행됩니다.
              {oppAwayMs >= ABANDON_AFTER_MS ? (
                <button
                  type="button"
                  onClick={() => run(claimAbandon(roomId, uid))}
                  className={`${primaryBtn} mt-2 block`}
                >
                  승리 선언
                </button>
              ) : (
                <div className="mt-1 text-amber-200/60">
                  {Math.ceil((ABANDON_AFTER_MS - oppAwayMs) / 1000)}초 후 승리 선언 가능
                </div>
              )}
            </div>
          )}

          {/* 무르기 / 무승부 요청 */}
          {me && playing && undoReq && (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-[#6C63FF]/40 bg-[#6C63FF]/10 px-4 py-3">
              {undoReq.uid === uid ? (
                <>
                  <span className="font-['Nanum_Gothic',sans-serif] text-xs text-white/80">
                    무르기 요청 중…
                  </span>
                  <button type="button" onClick={() => run(cancelUndo(roomId))} className={btn}>
                    취소
                  </button>
                </>
              ) : (
                <>
                  <span className="font-['Nanum_Gothic',sans-serif] text-xs text-white/80">
                    상대가 무르기를 요청했습니다
                  </span>
                  <span className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => run(respondUndo(roomId, uid, true))}
                      className={primaryBtn}
                    >
                      수락
                    </button>
                    <button
                      type="button"
                      onClick={() => run(respondUndo(roomId, uid, false))}
                      className={btn}
                    >
                      거절
                    </button>
                  </span>
                </>
              )}
            </div>
          )}
          {me && playing && room.drawOffer && (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-[#6C63FF]/40 bg-[#6C63FF]/10 px-4 py-3">
              {room.drawOffer === uid ? (
                <span className="font-['Nanum_Gothic',sans-serif] text-xs text-white/80">
                  무승부 제안 중…
                </span>
              ) : (
                <>
                  <span className="font-['Nanum_Gothic',sans-serif] text-xs text-white/80">
                    상대가 무승부를 제안했습니다
                  </span>
                  <span className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => run(respondDraw(roomId, uid, true))}
                      className={primaryBtn}
                    >
                      수락
                    </button>
                    <button
                      type="button"
                      onClick={() => run(respondDraw(roomId, uid, false))}
                      className={btn}
                    >
                      거절
                    </button>
                  </span>
                </>
              )}
            </div>
          )}

          {/* 대국자 액션 */}
          {me && playing && (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                disabled={myUndoPlies === 0 || !!undoReq}
                onClick={() => run(requestUndo(room, uid))}
                className={btn}
              >
                ↶ 무르기 요청
              </button>
              <button
                type="button"
                disabled={!!room.drawOffer}
                onClick={() => run(offerDraw(roomId, uid))}
                className={btn}
              >
                ½ 무승부 제안
              </button>
              {confirmResign ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmResign(false);
                      run(resign(roomId, uid));
                    }}
                    className="cursor-pointer rounded-full bg-red-500/85 px-3 py-1.5 font-mono text-xs text-white hover:bg-red-500"
                  >
                    정말 기권
                  </button>
                  <button type="button" onClick={() => setConfirmResign(false)} className={btn}>
                    취소
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => setConfirmResign(true)} className={btn}>
                  ⚑ 기권
                </button>
              )}
            </div>
          )}

          {room.status === "ended" && (
            <button type="button" onClick={onExit} className={primaryBtn}>
              로비로 돌아가기
            </button>
          )}

          {/* 기보 */}
          <div className="max-h-44 overflow-y-auto rounded-xl border border-white/10 bg-[#1C1E24] p-2 lg:max-h-72">
            {pairs.length === 0 ? (
              <p className="py-3 text-center font-mono text-xs text-white/30">
                아직 둔 수가 없습니다
              </p>
            ) : (
              <div className="grid grid-cols-[2.2rem_1fr_1fr] gap-y-0.5 font-mono text-xs">
                {pairs.map(([w, b], i) => (
                  <div key={i} className="contents">
                    <span className="px-1 text-white/30">{i + 1}.</span>
                    <span className="px-1 text-white/80">{w}</span>
                    <span className="px-1 text-white/80">{b ?? ""}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 관전자 */}
          <div className="px-1 font-mono text-[11px] text-white/35">
            관전 {specNames.length}/{MAX_SPECTATORS}
            {specNames.length > 0 && ` · ${specNames.map(([, n]) => n).join(", ")}`}
          </div>
          {me && playing && (
            <p className="px-1 font-['Nanum_Gothic',sans-serif] text-[11px] leading-relaxed text-white/30">
              로비로 나가도 대국은 유지됩니다. 같은 브라우저로 다시 들어오면 이어서 둘 수 있어요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
