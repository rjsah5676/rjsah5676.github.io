import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
  type Transaction,
} from "firebase/firestore";
import { Chess } from "chess.js";
import { db } from "../firebase";

/*
 * 온라인 체스 (방 생성/참여/관전)
 *
 * - 정적 호스팅이라 소켓 서버 대신 Firestore onSnapshot 으로 실시간 동기화.
 * - 익명 Auth uid 로 좌석을 식별 → 같은 브라우저면 창을 닫았다 와도 자리 그대로 복귀.
 * - 방 문서(chess_rooms/{id}) : 대국 상태 전체. 수 두기/무르기 등은 전부 트랜잭션.
 * - 접속 상태(chess_rooms/{id}/presence/{uid}) : 하트비트. 방 문서와 분리해서
 *   하트비트마다 로비 리스너까지 깨우지 않도록 함.
 */

export type Color = "w" | "b";
export type RoomStatus = "waiting" | "playing" | "ended" | "closed";
export type GameResult = "" | "1-0" | "0-1" | "1/2-1/2";
export type EndReason =
  | ""
  | "checkmate"
  | "timeout"
  | "resign"
  | "abandon"
  | "stalemate"
  | "insufficient"
  | "threefold"
  | "fifty"
  | "agreement";

export interface ChessRoom {
  id: string;
  name: string;
  hostUid: string;
  whiteUid: string;
  whiteName: string;
  blackUid: string;
  blackName: string;
  /** 0 = 무제한 */
  timeMin: number;
  incSec: number;
  status: RoomStatus;
  /** UCI 형식 ("e2e4", "e7e8q") */
  moves: string[];
  fen: string;
  /** turnStartedAt 시점의 남은 시간 */
  whiteMs: number;
  blackMs: number;
  turnStartedAt: Timestamp | null;
  result: GameResult;
  reason: EndReason;
  /** ply = 요청 당시 moves.length (그 사이 수가 진행되면 무효) */
  undoReq: { uid: string; ply: number } | null;
  drawOffer: string;
  spectators: Record<string, string>;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface Presence {
  name: string;
  lastSeen: number; // 서버 기준 ms
}

export const MAX_SPECTATORS = 2;
export const HEARTBEAT_MS = 25_000;
/** 이 시간 동안 하트비트 없으면 "연결 끊김" 표시 */
export const OFFLINE_AFTER_MS = 60_000;
/** 상대가 이 시간 이상 끊겨 있으면 승리 선언 가능 */
export const ABANDON_AFTER_MS = 180_000;
/** 대기방 방장이 이 시간 이상 안 보이면 로비에서 숨김 */
export const WAITING_STALE_MS = 3 * 60_000;

const ROOMS = "chess_rooms";
const roomRef = (id: string) => doc(db, ROOMS, id);
const presenceRef = (roomId: string, uid: string) => doc(db, ROOMS, roomId, "presence", uid);

// ───────────────────── 서버 시각 보정 ─────────────────────
// 클라이언트 시계가 틀어져 있으면 시간제 대국에서 남은 시간이 엉망이 되므로,
// 내 presence 문서의 serverTimestamp 와 로컬 시각 차이로 오프셋을 잡아둠.
let serverOffset = 0;
export const serverNow = () => Date.now() + serverOffset;
export function syncServerOffset(serverMs: number) {
  serverOffset = serverMs - Date.now();
}

// ───────────────────── 순수 헬퍼 ─────────────────────
export function colorOf(room: ChessRoom, uid: string | null | undefined): Color | null {
  if (!uid) return null;
  if (room.whiteUid === uid) return "w";
  if (room.blackUid === uid) return "b";
  return null;
}

export const turnOf = (room: Pick<ChessRoom, "moves">): Color =>
  room.moves.length % 2 === 0 ? "w" : "b";

export function uciToMove(uci: string) {
  return { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || undefined };
}

export function replay(moves: string[]): Chess {
  const game = new Chess();
  for (const m of moves) game.move(uciToMove(m));
  return game;
}

/** 지금 이 순간 기준 양쪽 남은 시간 (진행중인 쪽은 경과시간 차감) */
export function liveClock(room: ChessRoom, now = serverNow()): { w: number; b: number } {
  const clock = { w: room.whiteMs, b: room.blackMs };
  if (room.timeMin > 0 && room.status === "playing" && room.turnStartedAt) {
    const t = turnOf(room);
    clock[t] = Math.max(0, clock[t] - Math.max(0, now - room.turnStartedAt.toMillis()));
  }
  return clock;
}

/** 시간패 시 상대가 체크메이트 할 기물이 아예 없으면 무승부 (킹 단독 / 킹+마이너 1개) */
function cannotMate(game: Chess, color: Color): boolean {
  const pieces = game
    .board()
    .flat()
    .filter((p) => p && p.color === color && p.type !== "k");
  if (pieces.length === 0) return true;
  return pieces.length === 1 && (pieces[0]!.type === "n" || pieces[0]!.type === "b");
}

function endState(game: Chess): { result: GameResult; reason: EndReason } | null {
  if (game.isCheckmate())
    return { result: game.turn() === "w" ? "0-1" : "1-0", reason: "checkmate" };
  if (game.isStalemate()) return { result: "1/2-1/2", reason: "stalemate" };
  if (game.isInsufficientMaterial()) return { result: "1/2-1/2", reason: "insufficient" };
  if (game.isThreefoldRepetition()) return { result: "1/2-1/2", reason: "threefold" };
  if (game.isDrawByFiftyMoves()) return { result: "1/2-1/2", reason: "fifty" };
  return null;
}

const winFor = (c: Color): GameResult => (c === "w" ? "1-0" : "0-1");
const other = (c: Color): Color => (c === "w" ? "b" : "w");

function timeoutResult(game: Chess, loser: Color): GameResult {
  return cannotMate(game, other(loser)) ? "1/2-1/2" : winFor(other(loser));
}

function normalize(id: string, data: Record<string, unknown>): ChessRoom {
  const d = data as Partial<ChessRoom>;
  return {
    id,
    name: d.name ?? "",
    hostUid: d.hostUid ?? "",
    whiteUid: d.whiteUid ?? "",
    whiteName: d.whiteName ?? "",
    blackUid: d.blackUid ?? "",
    blackName: d.blackName ?? "",
    timeMin: d.timeMin ?? 0,
    incSec: d.incSec ?? 0,
    status: d.status ?? "waiting",
    moves: d.moves ?? [],
    fen: d.fen ?? new Chess().fen(),
    whiteMs: d.whiteMs ?? 0,
    blackMs: d.blackMs ?? 0,
    turnStartedAt: d.turnStartedAt ?? null,
    result: d.result ?? "",
    reason: d.reason ?? "",
    undoReq: d.undoReq ?? null,
    drawOffer: d.drawOffer ?? "",
    spectators: d.spectators ?? {},
    createdAt: d.createdAt ?? null,
    updatedAt: d.updatedAt ?? null,
  };
}

async function readRoom(tx: Transaction, id: string): Promise<ChessRoom> {
  const snap = await tx.get(roomRef(id));
  if (!snap.exists()) throw new Error("방이 존재하지 않습니다.");
  return normalize(snap.id, snap.data());
}

// ───────────────────── 구독 ─────────────────────
export function subscribeRooms(cb: (rooms: ChessRoom[]) => void, onError?: (e: Error) => void) {
  const q = query(collection(db, ROOMS), orderBy("updatedAt", "desc"), limit(40));
  return onSnapshot(
    q,
    { includeMetadataChanges: false },
    (snap) => cb(snap.docs.map((d) => normalize(d.id, d.data({ serverTimestamps: "estimate" })))),
    onError
  );
}

export function subscribeRoom(
  id: string,
  cb: (room: ChessRoom | null) => void,
  onError?: (e: Error) => void
) {
  return onSnapshot(
    roomRef(id),
    (snap) =>
      cb(snap.exists() ? normalize(snap.id, snap.data({ serverTimestamps: "estimate" })) : null),
    onError
  );
}

export function subscribePresence(
  roomId: string,
  myUid: string | null,
  cb: (p: Record<string, Presence>) => void
) {
  return onSnapshot(collection(db, ROOMS, roomId, "presence"), (snap) => {
    // 오프셋은 "방금 서버가 확정해준 내 하트비트"로만 계산해야 함.
    // (다른 사람 하트비트로 스냅샷이 올 때 예전 내 lastSeen 으로 맞추면 시계가 뒤로 밀림)
    snap.docChanges().forEach((c) => {
      if (c.doc.id !== myUid || c.type === "removed" || c.doc.metadata.hasPendingWrites) return;
      const ts = c.doc.data().lastSeen as Timestamp | null;
      if (ts) syncServerOffset(ts.toMillis());
    });
    const out: Record<string, Presence> = {};
    snap.docs.forEach((d) => {
      const data = d.data({ serverTimestamps: "estimate" });
      const ts = data.lastSeen as Timestamp | null;
      out[d.id] = { name: data.name ?? "", lastSeen: ts ? ts.toMillis() : serverNow() };
    });
    cb(out);
  });
}

export async function beat(roomId: string, uid: string, name: string, bumpRoom = false) {
  await setDoc(presenceRef(roomId, uid), { name, lastSeen: serverTimestamp() });
  // 대기방은 로비에서 "살아있는 방"인지 판단하려고 updatedAt 도 갱신
  if (bumpRoom) await updateDoc(roomRef(roomId), { updatedAt: serverTimestamp() });
}

// ───────────────────── 방 생성/참여/퇴장 ─────────────────────
export interface CreateRoomInput {
  name: string;
  uid: string;
  nick: string;
  color: Color | "r";
  timeMin: number;
  incSec: number;
}

/** 내가 대국자로 앉아있는 대기/진행중 방 (방 중복 생성·참여 방지용) */
export async function findMyActiveRoom(uid: string): Promise<ChessRoom | null> {
  const snaps = await Promise.all(
    (["whiteUid", "blackUid"] as const).map((f) =>
      getDocs(query(collection(db, ROOMS), where(f, "==", uid)))
    )
  );
  const rooms = snaps
    .flatMap((s) => s.docs.map((d) => normalize(d.id, d.data())))
    .filter((r) => r.status === "waiting" || r.status === "playing")
    .sort((a, b) => (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0));
  return rooms[0] ?? null;
}

export class ActiveRoomError extends Error {
  constructor(public room: ChessRoom) {
    super("이미 진행중인 게임이 있습니다.");
  }
}

export async function createRoom({
  name,
  uid,
  nick,
  color,
  timeMin,
  incSec,
}: CreateRoomInput): Promise<string> {
  const active = await findMyActiveRoom(uid);
  if (active) throw new ActiveRoomError(active);
  const myColor: Color = color === "r" ? (Math.random() < 0.5 ? "w" : "b") : color;
  const ms = timeMin * 60_000;
  const ref = await addDoc(collection(db, ROOMS), {
    name: name.trim().slice(0, 20),
    hostUid: uid,
    whiteUid: myColor === "w" ? uid : "",
    whiteName: myColor === "w" ? nick : "",
    blackUid: myColor === "b" ? uid : "",
    blackName: myColor === "b" ? nick : "",
    timeMin,
    incSec,
    status: "waiting",
    moves: [],
    fen: new Chess().fen(),
    whiteMs: ms,
    blackMs: ms,
    turnStartedAt: null,
    result: "",
    reason: "",
    undoReq: null,
    drawOffer: "",
    spectators: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function joinAsPlayer(roomId: string, uid: string, nick: string) {
  const active = await findMyActiveRoom(uid);
  if (active && active.id !== roomId) throw new ActiveRoomError(active);
  await runTransaction(db, async (tx) => {
    const room = await readRoom(tx, roomId);
    if (colorOf(room, uid)) return;
    if (room.status !== "waiting") throw new Error("이미 대국이 시작된 방입니다.");
    const seat: Color | null = !room.whiteUid ? "w" : !room.blackUid ? "b" : null;
    if (!seat) throw new Error("빈 자리가 없습니다.");
    const spectators = { ...room.spectators };
    delete spectators[uid];
    tx.update(roomRef(roomId), {
      ...(seat === "w" ? { whiteUid: uid, whiteName: nick } : { blackUid: uid, blackName: nick }),
      spectators,
      updatedAt: serverTimestamp(),
    });
  });
}

/** 방장만 시작 가능. 두 자리가 다 찼을 때 백 시계부터 돌아감 */
export async function startGame(roomId: string, uid: string) {
  await runTransaction(db, async (tx) => {
    const room = await readRoom(tx, roomId);
    if (room.hostUid !== uid) throw new Error("방장만 시작할 수 있습니다.");
    if (room.status !== "waiting") return;
    if (!room.whiteUid || !room.blackUid) throw new Error("상대가 아직 입장하지 않았습니다.");
    tx.update(roomRef(roomId), {
      status: "playing",
      turnStartedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function joinAsSpectator(roomId: string, uid: string, nick: string) {
  await runTransaction(db, async (tx) => {
    const room = await readRoom(tx, roomId);
    if (colorOf(room, uid) || room.spectators[uid] !== undefined) return;
    const spectators = { ...room.spectators };
    // 창만 닫고 사라진 관전자는 자리 비워줌
    const others = Object.keys(spectators);
    const snaps = await Promise.all(others.map((u) => tx.get(presenceRef(roomId, u))));
    snaps.forEach((s, i) => {
      const ts = s.exists() ? (s.data().lastSeen as Timestamp | null) : null;
      if (!ts || serverNow() - ts.toMillis() > OFFLINE_AFTER_MS * 1.5) delete spectators[others[i]];
    });
    if (Object.keys(spectators).length >= MAX_SPECTATORS)
      throw new Error("관전 인원이 가득 찼습니다. (최대 2명)");
    spectators[uid] = nick;
    tx.update(roomRef(roomId), { spectators });
  });
}

/** 대국 중인 플레이어는 나가도 자리가 유지됨 (다시 들어오면 이어서 진행) */
export async function leaveRoom(room: ChessRoom, uid: string) {
  const color = colorOf(room, uid);
  if (!color) {
    if (room.spectators[uid] !== undefined) {
      await updateDoc(roomRef(room.id), { [`spectators.${uid}`]: deleteField() });
    }
    await deleteDoc(presenceRef(room.id, uid)).catch(() => {});
    return;
  }
  if (room.status === "waiting") {
    // 방장이 나가면 방 닫힘, 참가자가 나가면 자리만 비움
    await updateDoc(
      roomRef(room.id),
      room.hostUid === uid
        ? { status: "closed", updatedAt: serverTimestamp() }
        : {
            ...(color === "w" ? { whiteUid: "", whiteName: "" } : { blackUid: "", blackName: "" }),
            updatedAt: serverTimestamp(),
          }
    );
    await deleteDoc(presenceRef(room.id, uid)).catch(() => {});
  }
}

// ───────────────────── 대국 ─────────────────────
export async function makeMove(roomId: string, uid: string, uci: string) {
  await runTransaction(db, async (tx) => {
    const room = await readRoom(tx, roomId);
    const me = colorOf(room, uid);
    if (room.status !== "playing" || !me) throw new Error("대국 중이 아닙니다.");
    if (turnOf(room) !== me) throw new Error("내 차례가 아닙니다.");

    const game = replay(room.moves);
    const timed = room.timeMin > 0;
    const clock = liveClock(room);

    if (timed && clock[me] <= 0) {
      tx.update(roomRef(roomId), {
        status: "ended",
        result: timeoutResult(game, me),
        reason: "timeout",
        whiteMs: clock.w,
        blackMs: clock.b,
        updatedAt: serverTimestamp(),
      });
      return;
    }

    game.move(uciToMove(uci)); // 불법수면 throw
    if (timed) clock[me] += room.incSec * 1000;
    const end = endState(game);

    tx.update(roomRef(roomId), {
      moves: [...room.moves, uci],
      fen: game.fen(),
      whiteMs: clock.w,
      blackMs: clock.b,
      turnStartedAt: serverTimestamp(),
      undoReq: null,
      drawOffer: "",
      updatedAt: serverTimestamp(),
      ...(end ? { status: "ended", ...end } : {}),
    });
  });
}

/** 수를 두는 쪽의 시간이 0이 된 걸 본 쪽(누구든)이 호출 */
export async function claimTimeout(roomId: string) {
  await runTransaction(db, async (tx) => {
    const room = await readRoom(tx, roomId);
    if (room.status !== "playing" || room.timeMin <= 0) return;
    const clock = liveClock(room);
    const t = turnOf(room);
    if (clock[t] > 0) return;
    tx.update(roomRef(roomId), {
      status: "ended",
      result: timeoutResult(replay(room.moves), t),
      reason: "timeout",
      whiteMs: clock.w,
      blackMs: clock.b,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function claimAbandon(roomId: string, uid: string) {
  await runTransaction(db, async (tx) => {
    const room = await readRoom(tx, roomId);
    const me = colorOf(room, uid);
    if (room.status !== "playing" || !me) return;
    const oppUid = me === "w" ? room.blackUid : room.whiteUid;
    const p = await tx.get(presenceRef(roomId, oppUid));
    const ts = p.exists() ? (p.data().lastSeen as Timestamp | null) : null;
    if (ts && serverNow() - ts.toMillis() < ABANDON_AFTER_MS)
      throw new Error("상대가 아직 접속 중입니다.");
    const clock = liveClock(room);
    tx.update(roomRef(roomId), {
      status: "ended",
      result: winFor(me),
      reason: "abandon",
      whiteMs: clock.w,
      blackMs: clock.b,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function resign(roomId: string, uid: string) {
  await runTransaction(db, async (tx) => {
    const room = await readRoom(tx, roomId);
    const me = colorOf(room, uid);
    if (room.status !== "playing" || !me) return;
    const clock = liveClock(room);
    tx.update(roomRef(roomId), {
      status: "ended",
      result: winFor(other(me)),
      reason: "resign",
      whiteMs: clock.w,
      blackMs: clock.b,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function offerDraw(roomId: string, uid: string) {
  await updateDoc(roomRef(roomId), { drawOffer: uid });
}

export async function respondDraw(roomId: string, uid: string, accept: boolean) {
  await runTransaction(db, async (tx) => {
    const room = await readRoom(tx, roomId);
    if (room.status !== "playing" || !room.drawOffer || room.drawOffer === uid) return;
    if (!accept) {
      tx.update(roomRef(roomId), { drawOffer: "" });
      return;
    }
    const clock = liveClock(room);
    tx.update(roomRef(roomId), {
      status: "ended",
      result: "1/2-1/2",
      reason: "agreement",
      drawOffer: "",
      whiteMs: clock.w,
      blackMs: clock.b,
      updatedAt: serverTimestamp(),
    });
  });
}

// ───────────────────── 무르기 ─────────────────────
/**
 * 요청자 기준으로 몇 수(ply)를 되돌릴지.
 * - 내가 방금 둔 상태(상대 차례) → 1수
 * - 상대가 이미 받아둔 상태(내 차례) → 2수 (상대 수 + 내 수)
 * 0이면 무를 수 있는 내 수가 없음.
 */
export function undoPlies(room: ChessRoom, color: Color): number {
  const n = room.moves.length;
  if (n === 0) return 0;
  const lastMover: Color = n % 2 === 1 ? "w" : "b";
  const plies = lastMover === color ? 1 : 2;
  return n >= plies ? plies : 0;
}

export async function requestUndo(room: ChessRoom, uid: string) {
  const me = colorOf(room, uid);
  if (!me || room.status !== "playing" || undoPlies(room, me) === 0) return;
  await updateDoc(roomRef(room.id), { undoReq: { uid, ply: room.moves.length } });
}

export async function cancelUndo(roomId: string) {
  await updateDoc(roomRef(roomId), { undoReq: null });
}

export async function respondUndo(roomId: string, uid: string, accept: boolean) {
  await runTransaction(db, async (tx) => {
    const room = await readRoom(tx, roomId);
    const req = room.undoReq;
    if (room.status !== "playing" || !req || req.uid === uid) return;
    const reqColor = colorOf(room, req.uid);
    if (!accept || !reqColor || req.ply !== room.moves.length) {
      tx.update(roomRef(roomId), { undoReq: null });
      return;
    }
    const plies = undoPlies(room, reqColor);
    if (plies === 0) {
      tx.update(roomRef(roomId), { undoReq: null });
      return;
    }
    // 지금까지 흐른 시간은 현재 차례인 쪽에서 정산하고 되돌림
    const clock = liveClock(room);
    const moves = room.moves.slice(0, room.moves.length - plies);
    tx.update(roomRef(roomId), {
      moves,
      fen: replay(moves).fen(),
      whiteMs: clock.w,
      blackMs: clock.b,
      turnStartedAt: serverTimestamp(),
      undoReq: null,
      drawOffer: "",
      updatedAt: serverTimestamp(),
    });
  });
}
