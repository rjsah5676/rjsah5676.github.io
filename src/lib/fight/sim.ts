/**
 * 격투게임 시뮬레이션 — 결정론적 순수 로직 (그림·소리·시간과 무관), 2.5D (x·깊이 z·높이 h)
 *
 * 온라인 롤백 넷코드를 위해 지키는 규칙:
 *  - 상태(State)는 숫자·배열·평범한 객체만 → clone()으로 통째 저장/복원
 *  - 실수 연산 없이 정수만 (1px = 256), Math.random·Date 안 씀
 *  - 한 프레임 진행은 step(state, [p1입력, p2입력]) 하나 — 같은 상태+같은 입력이면 어디서 돌려도 같은 결과
 *  - 입력은 프레임마다 9비트 (방향 4 + 버튼 5), 명령(↓↘→)도 상태 안의 입력 기록으로 판정
 *
 * 좌표: x = 가로, z = 깊이(0이 앞, 클수록 안쪽), h = 땅에서 높이(위가 +).
 * 화면 위치는 screenY = BASE_Y - z - h (안쪽일수록, 높을수록 위).
 * 공격은 가로·높이 박스가 겹치고 깊이 차이가 기술의 깊이 폭(zr) 안이어야 맞음.
 */
import {
  CHARS,
  GRAVITY,
  JUMP_VY,
  SUB,
  type Box,
  type CharDef,
  type MoveDef,
  type MoveId,
} from "./chars";
import { MAPS, type MapDef } from "./maps";

export const VIEW_W = 320;
export const VIEW_H = 180;
/** 깊이 0·높이 0인 곳의 화면 y(px) */
export const BASE_Y = 172;
export const WALL_L = 14 * SUB;
export const WALL_R = (VIEW_W - 14) * SUB;

/** 입력 비트 */
export const IN = {
  L: 1,
  R: 2,
  /** 안쪽으로 */
  U: 4,
  /** 앞쪽으로 */
  D: 8,
  /** 약공격 */
  A: 16,
  /** 강공격 */
  B: 32,
  /** 필살기 (탄) */
  C: 64,
  /** 초필살기 */
  X: 128,
  /** 점프 */
  J: 256,
} as const;
const IN_MASK = 511;

const HIST = 24;
const INTRO = 100;
const ROUND_END = 170;
export const ROUND_SEC = 60;
export const WINS_NEEDED = 2;
const MAX_ROUNDS = 5;
const DOWN_T = 36;
const RISE_T = 14;
export const METER_MAX = 100;
const SUPER_FREEZE = 36;
/** 기본 깊이 판정 폭(px) */
const HIT_Z = 10;
/** 걸어서 올라갈 수 있는 턱 높이 */
const STEP_UP = 3 * SUB;
const JUMP_V = -JUMP_VY;

export type FState =
  "idle" | "walk" | "jump" | "atk" | "hit" | "block" | "down" | "rise" | "ko" | "win";
export type Phase = "intro" | "fight" | "roundEnd" | "over";

export interface Fighter {
  ch: number;
  x: number;
  z: number;
  /** 땅에서 높이 */
  h: number;
  vx: number;
  vz: number;
  /** 위로 +, 중력으로 줄어듦 */
  vh: number;
  face: 1 | -1;
  hp: number;
  meter: number;
  st: FState;
  /** 지금 상태로 들어온 지 몇 프레임 */
  t: number;
  mv: MoveId | "";
  /** 이번 기술이 이미 맞혔거나 막혔나 (0/1) */
  hit: number;
  stun: number;
  /** 이 캐릭터가 지금 연속으로 맞은 수 */
  combo: number;
  /** 착지하면 다운 */
  kd: number;
  airUsed: number;
  /** 최근 입력 (마지막이 이번 프레임) */
  hist: number[];
}

export interface Proj {
  o: number;
  x: number;
  z: number;
  h: number;
  vx: number;
  life: number;
}

export type EvKind =
  "hit" | "block" | "ko" | "jump" | "proj" | "clash" | "super" | "round" | "fight" | "land";
export interface Ev {
  k: EvKind;
  /** 관련 플레이어 (hit/block은 때린 쪽) */
  p: number;
  x: number;
  z: number;
  h: number;
  /** 피해량 등 */
  v: number;
  m?: MoveId;
}

export interface State {
  f: number;
  phase: Phase;
  /** 페이즈 안에서 흐른 프레임 */
  pt: number;
  round: number;
  wins: [number, number];
  /** 남은 프레임 */
  timer: number;
  /** MAPS 인덱스 */
  map: number;
  p: [Fighter, Fighter];
  proj: Proj[];
  /** 히트스톱 (판 전체 멈춤) */
  stop: number;
  /** 초필살 연출 멈춤 */
  freeze: number;
  freezeBy: number;
  /** 이번 프레임에 생긴 일 (소리·이펙트용, 다음 step에서 비워짐) */
  ev: Ev[];
  /** 라운드 승자 0/1, 무승부 2, 진행중 -1 */
  roundWinner: number;
  /** 경기 승자 0/1, 무승부 2, 진행중 -1 */
  winner: number;
}

const charOf = (f: Fighter): CharDef => CHARS[f.ch];
const moveOf = (f: Fighter): MoveDef | null => (f.mv ? charOf(f).moves[f.mv] : null);
const totalOf = (m: MoveDef) => m.startup + m.active + m.recovery;
const mapOf = (s: State): MapDef => MAPS[s.map] ?? MAPS[0];

/** 이 자리의 땅 높이 (발판 위면 발판 높이) */
export function groundAt(map: MapDef, x: number, z: number): number {
  let g = 0;
  for (const p of map.plats) {
    if (x >= p.x0 * SUB && x <= p.x1 * SUB && z >= p.z0 * SUB && z <= p.z1 * SUB) g = Math.max(g, p.h * SUB);
  }
  return g;
}

/** 화면에서 발 위치(px) */
export const screenX = (x: number) => x / SUB;
export const screenY = (z: number, h: number) => BASE_Y - (z + h) / SUB;

function newFighter(ch: number, side: 0 | 1, map: MapDef): Fighter {
  const z = Math.trunc((map.z1 * SUB) / 2);
  const x = (side === 0 ? 110 : 210) * SUB;
  return {
    ch,
    x,
    z,
    h: groundAt(map, x, z),
    vx: 0,
    vz: 0,
    vh: 0,
    face: side === 0 ? 1 : -1,
    hp: CHARS[ch].hp,
    meter: 0,
    st: "idle",
    t: 0,
    mv: "",
    hit: 0,
    stun: 0,
    combo: 0,
    kd: 0,
    airUsed: 0,
    hist: new Array(HIST).fill(0),
  };
}

export function newMatch(chars: [number, number], map = 0): State {
  const m = MAPS[map] ?? MAPS[0];
  return {
    f: 0,
    phase: "intro",
    pt: 0,
    round: 1,
    wins: [0, 0],
    timer: ROUND_SEC * 60,
    map: MAPS[map] ? map : 0,
    p: [newFighter(chars[0], 0, m), newFighter(chars[1], 1, m)],
    proj: [],
    stop: 0,
    freeze: 0,
    freezeBy: -1,
    ev: [{ k: "round", p: -1, x: 0, z: 0, h: 0, v: 1 }],
    roundWinner: -1,
    winner: -1,
  };
}

function nextRound(s: State) {
  const meters = [s.p[0].meter, s.p[1].meter];
  const m = mapOf(s);
  s.p = [newFighter(s.p[0].ch, 0, m), newFighter(s.p[1].ch, 1, m)];
  // 게이지는 라운드를 넘어 유지
  s.p[0].meter = meters[0];
  s.p[1].meter = meters[1];
  s.round++;
  s.phase = "intro";
  s.pt = 0;
  s.timer = ROUND_SEC * 60;
  s.proj = [];
  s.roundWinner = -1;
  s.ev.push({ k: "round", p: -1, x: 0, z: 0, h: 0, v: s.round });
}

/** 상태 통째 복사 (롤백 저장용) */
export function clone(s: State): State {
  return {
    ...s,
    wins: [s.wins[0], s.wins[1]],
    p: [cloneF(s.p[0]), cloneF(s.p[1])],
    proj: s.proj.map((p) => ({ ...p })),
    ev: s.ev.slice(),
  };
}
const cloneF = (f: Fighter): Fighter => ({ ...f, hist: f.hist.slice() });

/** 동기화 확인용 해시 (온라인에서 양쪽 상태가 같은지 비교) */
export function hash(s: State): number {
  let h = 2166136261;
  const mix = (n: number) => {
    h = Math.imul(h ^ (n | 0), 16777619);
  };
  mix(s.f);
  mix(s.pt);
  mix(s.round);
  mix(s.timer);
  mix(s.stop);
  mix(s.freeze);
  mix(s.map);
  mix(s.wins[0]);
  mix(s.wins[1]);
  for (const f of s.p) {
    mix(f.x);
    mix(f.z);
    mix(f.h);
    mix(f.vx);
    mix(f.vz);
    mix(f.vh);
    mix(f.face);
    mix(f.hp);
    mix(f.meter);
    mix(f.t);
    mix(f.stun);
    mix(f.combo);
    mix(f.st.length * 31 + f.st.charCodeAt(0));
    mix(f.mv ? f.mv.charCodeAt(0) : 0);
  }
  for (const p of s.proj) {
    mix(p.o);
    mix(p.x);
    mix(p.z);
    mix(p.h);
    mix(p.life);
  }
  return h >>> 0;
}

// ───────────── 입력 해석 ─────────────
const cur = (f: Fighter) => f.hist[HIST - 1];

/** 최근 n프레임 안에 이 버튼을 새로 눌렀나 (선입력 버퍼) */
function pressed(f: Fighter, bits: number, n = 1) {
  for (let k = 0; k < n; k++) {
    const c = f.hist[HIST - 1 - k];
    const p = f.hist[HIST - 2 - k];
    if (c & bits & ~p) return true;
  }
  return false;
}

/** ↓↘→ (캐릭터가 보는 방향 기준) */
function qcf(f: Fighter) {
  const fwd = f.face > 0 ? IN.R : IN.L;
  const code = (v: number) => (v & IN.D ? (v & fwd ? 3 : 2) : v & fwd ? 6 : 0);
  let stage = 0;
  for (let k = 0; k < 16; k++) {
    const c = code(f.hist[HIST - 1 - k]);
    if (stage === 0) {
      if (c === 6) stage = 1;
      else if (k > 6) return false;
    } else if (stage === 1) {
      if (c === 3) stage = 2;
      else if (c === 2) return true;
    } else if (c === 2) return true;
  }
  return false;
}

const holding = (f: Fighter, bit: number) => (cur(f) & bit) !== 0;

// ───────────── 판정 ─────────────
/** 가로(l~r)·높이(lo~hi) 범위, 깊이 z와 깊이 폭 zr (모두 SUB) */
export interface Rect {
  l: number;
  r: number;
  lo: number;
  hi: number;
  z: number;
  zr: number;
}

/** 박스(px, 오른쪽 기준)를 월드 좌표(SUB)로 */
export function boxRect(f: Fighter, b: Box, zr = HIT_Z): Rect {
  const l = f.face > 0 ? f.x + b.x * SUB : f.x - (b.x + b.w) * SUB;
  return { l, r: l + b.w * SUB, lo: f.h + (b.y - b.h) * SUB, hi: f.h + b.y * SUB, z: f.z, zr: zr * SUB };
}
const overlap = (a: Rect, b: Rect) =>
  a.l < b.r && b.l < a.r && a.lo < b.hi && b.lo < a.hi && Math.abs(a.z - b.z) <= Math.max(a.zr, b.zr);

export function hurtRect(f: Fighter): Rect | null {
  if (f.st === "down" || f.st === "rise" || f.st === "ko") return null;
  return boxRect(f, charOf(f).hurt, 0);
}

/** 지금 판정이 살아 있는 공격 박스 */
export function hitRect(f: Fighter): Rect | null {
  const m = moveOf(f);
  if (f.st !== "atk" || !m || m.proj || f.hit) return null;
  if (f.t < m.startup || f.t >= m.startup + m.active) return null;
  return boxRect(f, m.box, m.zr ?? HIT_Z);
}

export function projRect(p: Proj, s: State): Rect {
  const d = CHARS[s.p[p.o].ch].moves.S.proj!;
  return {
    l: p.x - (d.w * SUB) / 2,
    r: p.x + (d.w * SUB) / 2,
    lo: p.h - (d.h * SUB) / 2,
    hi: p.h + (d.h * SUB) / 2,
    z: p.z,
    zr: 8 * SUB,
  };
}

// ───────────── 진행 ─────────────
const onGround = (s: State, f: Fighter) => f.vh <= 0 && f.h <= groundAt(mapOf(s), f.x, f.z);
const airborneS = (s: State, f: Fighter) => !onGround(s, f);

function startMove(s: State, i: number, id: MoveId) {
  const f = s.p[i];
  f.st = "atk";
  f.mv = id;
  f.t = 0;
  f.hit = 0;
  if (id !== "J") {
    f.vx = 0;
    f.vz = 0;
  }
  if (id === "J") f.airUsed = 1;
  if (id === "X") {
    f.meter = 0;
    s.freeze = SUPER_FREEZE;
    s.freezeBy = i;
    s.ev.push({ k: "super", p: i, x: f.x, z: f.z, h: f.h, v: 0 });
  }
}

const hasProj = (s: State, i: number) => s.proj.some((p) => p.o === i);

/** 공격·필살·초필살 시작을 시도 (서 있을 때와 캔슬 때 공통) */
function tryAttack(s: State, i: number, allow: MoveId[]): boolean {
  const f = s.p[i];
  const superIn =
    pressed(f, IN.X, 3) ||
    ((cur(f) & (IN.B | IN.C)) === (IN.B | IN.C) && pressed(f, IN.B | IN.C, 3));
  if (allow.includes("X") && f.meter >= METER_MAX && superIn) {
    startMove(s, i, "X");
    return true;
  }
  if (
    allow.includes("S") &&
    !hasProj(s, i) &&
    (pressed(f, IN.C, 3) || (qcf(f) && pressed(f, IN.A | IN.B, 3)))
  ) {
    startMove(s, i, "S");
    return true;
  }
  if (allow.includes("H") && pressed(f, IN.B, 3)) {
    startMove(s, i, "H");
    return true;
  }
  if (allow.includes("L") && pressed(f, IN.A, 3)) {
    startMove(s, i, "L");
    return true;
  }
  return false;
}

function control(s: State, i: number) {
  const f = s.p[i];
  const c = charOf(f);
  const fwd = f.face > 0 ? IN.R : IN.L;
  const back = f.face > 0 ? IN.L : IN.R;
  const depth = Math.trunc((c.walk * 7) / 10);
  f.t++;
  switch (f.st) {
    case "idle":
    case "walk": {
      if (tryAttack(s, i, ["X", "S", "H", "L"])) return;
      if (pressed(f, IN.J, 3)) {
        f.st = "jump";
        f.t = 0;
        f.airUsed = 0;
        f.vh = JUMP_V;
        f.vx = holding(f, fwd) ? c.jumpVx * f.face : holding(f, back) ? -c.jumpVx * f.face : 0;
        f.vz = holding(f, IN.U) ? depth : holding(f, IN.D) ? -depth : 0;
        s.ev.push({ k: "jump", p: i, x: f.x, z: f.z, h: f.h, v: 0 });
        return;
      }
      const vx = holding(f, fwd) ? c.walk * f.face : holding(f, back) ? -c.back * f.face : 0;
      const vz = holding(f, IN.U) ? depth : holding(f, IN.D) ? -depth : 0;
      const st: FState = vx || vz ? "walk" : "idle";
      if (st !== f.st) {
        f.st = st;
        f.t = 0;
      }
      f.vx = vx;
      f.vz = vz;
      return;
    }
    case "jump":
      if (!f.airUsed && pressed(f, IN.A | IN.B, 3)) startMove(s, i, "J");
      return;
    case "atk": {
      const m = moveOf(f)!;
      if (f.mv === "S" && f.t === m.startup) {
        const d = m.proj!;
        s.proj.push({
          o: i,
          x: f.x + f.face * 24 * SUB,
          z: f.z,
          h: f.h + d.y * SUB,
          vx: f.face * d.speed,
          life: d.life,
        });
        s.ev.push({ k: "proj", p: i, x: f.x, z: f.z, h: f.h, v: 0 });
      }
      // 맞히거나 막힌 뒤 짧은 동안 다음 기술로 캔슬
      if (f.hit && m.cancel && f.t >= m.startup && f.t < m.startup + m.active + 12 && onGround(s, f)) {
        if (tryAttack(s, i, m.cancel)) return;
      }
      if (f.t >= totalOf(m)) {
        f.mv = "";
        f.t = 0;
        f.st = onGround(s, f) ? "idle" : "jump";
        if (f.st === "jump") f.airUsed = 1;
      }
      return;
    }
    case "hit":
      if (f.stun > 0) f.stun--;
      if (f.stun <= 0 && onGround(s, f)) {
        f.st = "idle";
        f.t = 0;
        f.combo = 0;
      }
      return;
    case "block":
      if (--f.stun <= 0) {
        f.st = "idle";
        f.t = 0;
      }
      return;
    case "down":
      if (f.t >= DOWN_T) {
        f.st = "rise";
        f.t = 0;
      }
      return;
    case "rise":
      if (f.t >= RISE_T) {
        f.st = "idle";
        f.t = 0;
        f.combo = 0;
      }
      return;
    default:
      return;
  }
}

/** 가로·깊이로 움직이되, 발판 옆면(못 올라가는 높이)과 벽은 막힘 */
function moveFlat(map: MapDef, f: Fighter, dx: number, dz: number, air: boolean) {
  const limit = (x: number, z: number) => {
    const g = groundAt(map, x, z);
    return air ? g > f.h : g > f.h + STEP_UP;
  };
  if (dx) {
    let nx = f.x + dx;
    if (nx < WALL_L) nx = WALL_L;
    if (nx > WALL_R) nx = WALL_R;
    if (!limit(nx, f.z)) f.x = nx;
  }
  if (dz) {
    let nz = f.z + dz;
    if (nz < 0) nz = 0;
    if (nz > map.z1 * SUB) nz = map.z1 * SUB;
    if (!limit(f.x, nz)) f.z = nz;
  }
}

function landed(s: State, i: number, f: Fighter) {
  if (f.st === "jump" || (f.st === "atk" && f.mv === "J")) {
    f.st = "idle";
    f.mv = "";
    f.t = 0;
    f.vx = 0;
    f.vz = 0;
    s.ev.push({ k: "land", p: i, x: f.x, z: f.z, h: f.h, v: 0 });
  } else if (f.st === "hit" && f.kd) {
    f.st = "down";
    f.t = 0;
    f.kd = 0;
    f.stun = 0;
    f.vz = 0;
  } else if (f.st === "ko") {
    f.vx = 0;
    f.vz = 0;
  }
}

function physics(s: State, i: number) {
  const f = s.p[i];
  const map = mapOf(s);
  const m = moveOf(f);
  const ground0 = groundAt(map, f.x, f.z);
  const air = f.vh > 0 || f.h > ground0;
  if (f.st === "atk" && m?.step && f.t < m.startup && !air) moveFlat(map, f, m.step * f.face, 0, false);
  if (air) {
    f.vh -= GRAVITY;
    moveFlat(map, f, f.vx, f.vz, true);
    f.h += f.vh;
    const g = groundAt(map, f.x, f.z);
    if (f.h <= g && f.vh <= 0) {
      f.h = g;
      f.vh = 0;
      landed(s, i, f);
    }
  } else {
    moveFlat(map, f, f.vx, f.vz, false);
    const g = groundAt(map, f.x, f.z);
    if (g < f.h) {
      // 발판 끝에서 걸어 나가면 떨어짐
      f.vh = 0;
      f.h -= 1;
      if (f.st === "idle" || f.st === "walk") {
        f.st = "jump";
        f.t = 0;
        f.airUsed = 1;
      }
    } else f.h = g;
    if (f.st !== "walk") {
      const fr = map.friction;
      if (f.vx > 0) f.vx = Math.max(0, f.vx - fr);
      else if (f.vx < 0) f.vx = Math.min(0, f.vx + fr);
      if (f.vz > 0) f.vz = Math.max(0, f.vz - fr);
      else if (f.vz < 0) f.vz = Math.min(0, f.vz + fr);
    }
  }
}

/** 두 캐릭터가 겹치지 않게 밀어냄 (깊이·높이가 가까울 때만) */
function separate(s: State) {
  const [a, b] = s.p;
  if (Math.abs(a.h - b.h) > 40 * SUB || Math.abs(a.z - b.z) > 9 * SUB) return;
  const need = Math.trunc(((charOf(a).width + charOf(b).width) * SUB) / 2);
  const dx = b.x - a.x;
  if (Math.abs(dx) >= need) return;
  const dir = dx > 0 ? 1 : dx < 0 ? -1 : a.face;
  const over = need - Math.abs(dx);
  let pa = Math.trunc(over / 2);
  let pb = over - pa;
  // 벽에 붙은 쪽은 못 밀리니 반대쪽이 다 밀림
  const room = (f: Fighter, d: number) => (d > 0 ? WALL_R - f.x : f.x - WALL_L);
  const ra = room(a, -dir),
    rb = room(b, dir);
  if (pa > ra) {
    pb += pa - ra;
    pa = ra;
  }
  if (pb > rb) {
    pa = Math.min(ra, pa + pb - rb);
    pb = rb;
  }
  const map = mapOf(s);
  moveFlat(map, a, -dir * pa, 0, airborneS(s, a));
  moveFlat(map, b, dir * pb, 0, airborneS(s, b));
}

function faceEachOther(s: State) {
  for (let i = 0; i < 2; i++) {
    const f = s.p[i],
      o = s.p[1 - i];
    if ((f.st === "idle" || f.st === "walk") && o.x !== f.x) f.face = o.x > f.x ? 1 : -1;
  }
}

function canBlock(s: State, d: Fighter, fromX: number) {
  if (airborneS(s, d)) return false;
  if (d.st !== "idle" && d.st !== "walk" && d.st !== "block") return false;
  const backBit = fromX > d.x ? IN.L : IN.R;
  return holding(d, backBit);
}

function scaleDmg(dmg: number, combo: number) {
  return Math.trunc((dmg * Math.max(30, 100 - 12 * combo)) / 100);
}

/** a가 d를 m으로 때림 (src = 판정 위치 x, 탄이면 탄 위치) */
function applyHit(s: State, ai: number, m: MoveDef, srcX: number, mid: MoveId) {
  const a = s.p[ai];
  const d = s.p[1 - ai];
  const dir = d.x >= srcX ? 1 : -1; // d가 밀려날 방향
  if (mid !== "S") a.hit = 1;
  const nearWall = dir > 0 ? WALL_R - d.x < 8 * SUB : d.x - WALL_L < 8 * SUB;
  const eh = d.h + 28 * SUB;
  if (canBlock(s, d, srcX)) {
    d.hp -= m.chip;
    d.st = "block";
    d.t = 0;
    d.mv = "";
    d.stun = m.blockstun;
    d.vx = Math.trunc((dir * m.push * 7) / 10);
    d.vz = 0;
    a.meter = Math.min(METER_MAX, a.meter + (m.meter >> 1));
    d.meter = Math.min(METER_MAX, d.meter + 3);
    s.stop = Math.max(s.stop, m.hitstop - 3);
    if (nearWall && mid !== "S") a.vx = Math.trunc((-dir * m.push) / 2);
    s.ev.push({ k: "block", p: ai, x: d.x - dir * 10 * SUB, z: d.z, h: eh, v: m.chip, m: mid });
  } else {
    const dmg = scaleDmg(m.dmg, d.combo);
    const wasAir = airborneS(s, d);
    d.hp -= dmg;
    d.combo++;
    d.st = "hit";
    d.t = 0;
    d.mv = "";
    d.stun = m.hitstun;
    d.vx = dir * m.push;
    d.vz = 0;
    if (wasAir || m.kd) {
      d.vh = m.kd ? 1100 : 900;
      d.kd = 1;
    }
    a.meter = Math.min(METER_MAX, a.meter + m.meter);
    d.meter = Math.min(METER_MAX, d.meter + (dmg >> 4));
    s.stop = Math.max(s.stop, m.hitstop);
    if (nearWall && mid !== "S") a.vx = Math.trunc((-dir * m.push) / 2);
    s.ev.push({ k: "hit", p: ai, x: d.x - dir * 8 * SUB, z: d.z, h: eh, v: dmg, m: mid });
  }
  if (d.hp <= 0) d.hp = 0;
}

function projectiles(s: State) {
  const map = mapOf(s);
  for (const p of s.proj) {
    p.x += p.vx;
    p.life--;
    // 발판에 막힘
    if (groundAt(map, p.x, p.z) > p.h) p.life = 0;
  }
  // 탄끼리 부딪치면 둘 다 사라짐
  for (let i = 0; i < s.proj.length; i++)
    for (let j = i + 1; j < s.proj.length; j++) {
      const a = s.proj[i],
        b = s.proj[j];
      if (a.o !== b.o && a.life > 0 && b.life > 0 && overlap(projRect(a, s), projRect(b, s))) {
        a.life = b.life = 0;
        s.ev.push({ k: "clash", p: -1, x: (a.x + b.x) >> 1, z: a.z, h: a.h, v: 0 });
      }
    }
  for (const p of s.proj) {
    if (p.life <= 0) continue;
    const d = s.p[1 - p.o];
    const h = hurtRect(d);
    if (h && overlap(projRect(p, s), h)) {
      applyHit(s, p.o, CHARS[s.p[p.o].ch].moves.S, p.x - p.vx * 4, "S");
      p.life = 0;
    }
    if (p.x < -20 * SUB || p.x > (VIEW_W + 20) * SUB) p.life = 0;
  }
  s.proj = s.proj.filter((p) => p.life > 0);
}

function attacks(s: State) {
  const hits: number[] = [];
  for (let i = 0; i < 2; i++) {
    const r = hitRect(s.p[i]);
    const h = hurtRect(s.p[1 - i]);
    if (r && h && overlap(r, h)) hits.push(i);
  }
  // 동시에 맞으면 서로 맞음 (상쇄)
  const ms = hits.map((i) => [moveOf(s.p[i])!, s.p[i].mv as MoveId, s.p[i].x] as const);
  hits.forEach((i, k) => applyHit(s, i, ms[k][0], ms[k][2], ms[k][1]));
}

function endRound(s: State, winner: number) {
  s.phase = "roundEnd";
  s.pt = 0;
  s.roundWinner = winner;
  if (winner === 0 || winner === 1) s.wins[winner]++;
  s.proj = [];
}

function checkKO(s: State) {
  const [a, b] = s.p;
  const ka = a.hp <= 0,
    kb = b.hp <= 0;
  if (!ka && !kb) return;
  for (const [f, i] of [
    [a, 0],
    [b, 1],
  ] as const) {
    if (f.hp > 0) continue;
    f.st = "ko";
    f.t = 0;
    f.mv = "";
    f.vh = 800;
    f.vx = f.x < s.p[1 - i].x ? -500 : 500;
    f.vz = 0;
    s.ev.push({ k: "ko", p: i, x: f.x, z: f.z, h: f.h, v: 0 });
  }
  s.stop = 48;
  endRound(s, ka && kb ? 2 : ka ? 1 : 0);
}

const NO_INPUT: [number, number] = [0, 0];

/** 한 프레임 진행 (s를 직접 바꿈 — 보관이 필요하면 clone 먼저) */
export function step(s: State, input: [number, number]): State {
  s.ev = [];
  s.f++;
  const inp = s.phase === "fight" ? input : NO_INPUT;
  for (let i = 0; i < 2; i++) {
    const h = s.p[i].hist;
    h.shift();
    h.push(inp[i] & IN_MASK);
  }
  if (s.phase === "over") {
    s.pt++;
    for (let i = 0; i < 2; i++) {
      s.p[i].t++;
      physics(s, i);
    }
    return s;
  }
  if (s.freeze > 0) {
    s.freeze--;
    return s;
  }
  if (s.stop > 0) {
    s.stop--;
    return s;
  }

  if (s.phase === "intro") {
    s.pt++;
    for (const f of s.p) f.t++;
    if (s.pt >= INTRO) {
      s.phase = "fight";
      s.pt = 0;
      s.ev.push({ k: "fight", p: -1, x: 0, z: 0, h: 0, v: 0 });
    }
    return s;
  }

  if (s.phase === "fight") {
    s.pt++;
    if (s.timer > 0) s.timer--;
    control(s, 0);
    control(s, 1);
  } else {
    // roundEnd: 조작 없이 물리만, 이긴 쪽은 승리 포즈
    s.pt++;
    for (let i = 0; i < 2; i++) {
      const f = s.p[i];
      f.t++;
      if (f.st === "walk") ((f.st = "idle"), (f.vx = 0), (f.vz = 0));
      if (f.st === "hit" && f.stun > 0) f.stun--;
      if (f.st === "hit" && f.stun <= 0 && onGround(s, f)) ((f.st = "idle"), (f.t = 0));
      if (f.st === "atk" && f.t >= totalOf(moveOf(f)!)) ((f.st = "idle"), (f.mv = ""), (f.t = 0));
      if (f.st === "block" && --f.stun <= 0) ((f.st = "idle"), (f.t = 0));
      if (f.st === "down" && f.t >= DOWN_T) ((f.st = "rise"), (f.t = 0));
      if (f.st === "rise" && f.t >= RISE_T) ((f.st = "idle"), (f.t = 0));
      if (s.pt > 50 && s.roundWinner === i && f.st === "idle") ((f.st = "win"), (f.t = 0));
    }
  }

  physics(s, 0);
  physics(s, 1);
  separate(s);
  faceEachOther(s);

  if (s.phase === "fight") {
    projectiles(s);
    attacks(s);
    checkKO(s);
    if (s.phase === "fight" && s.timer <= 0) {
      // 시간 끝: 남은 체력 비율로
      const r0 = Math.trunc((s.p[0].hp * 1000) / CHARS[s.p[0].ch].hp);
      const r1 = Math.trunc((s.p[1].hp * 1000) / CHARS[s.p[1].ch].hp);
      endRound(s, r0 > r1 ? 0 : r1 > r0 ? 1 : 2);
    }
  } else if (s.phase === "roundEnd" && s.pt >= ROUND_END) {
    const [w0, w1] = s.wins;
    if (w0 >= WINS_NEEDED || w1 >= WINS_NEEDED || s.round >= MAX_ROUNDS) {
      s.phase = "over";
      s.pt = 0;
      s.winner = w0 > w1 ? 0 : w1 > w0 ? 1 : 2;
    } else nextRound(s);
  }
  return s;
}

/** 화면 표시용: 체력·게이지 비율 등 */
export const hpRatio = (f: Fighter) => f.hp / CHARS[f.ch].hp;
/** 공중인지 (AI·그림용) */
export const isAir = (s: State, f: Fighter) => airborneS(s, f);
export { charOf, moveOf, totalOf, mapOf };
