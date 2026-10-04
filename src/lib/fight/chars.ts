/**
 * 격투게임 캐릭터 성능 (프레임 데이터). 그림과는 완전히 분리 — 그림은 public/fight/<id>.json.
 *
 * 단위: 1px = 256 (SUB). 속도는 프레임당 SUB, 시간은 프레임(1/60초).
 * 판정 박스는 캐릭터 발 가운데 기준, 오른쪽을 볼 때 값:
 *   x = 앞쪽으로 얼마나 떨어진 곳부터(px), y = 땅에서 박스 윗변까지 높이(px), w·h = 크기(px)
 */

export const SUB = 256;

export type MoveId = "L" | "H" | "J" | "S" | "X";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ProjDef {
  /** 프레임당 SUB */
  speed: number;
  /** 발에서 탄 가운데까지 높이(px) */
  y: number;
  w: number;
  h: number;
  /** 사라질 때까지 프레임 */
  life: number;
}

export interface MoveDef {
  startup: number;
  active: number;
  recovery: number;
  dmg: number;
  /** 막았을 때 깎이는 양 */
  chip: number;
  hitstun: number;
  blockstun: number;
  /** 맞은 쪽이 밀려나는 속도 (프레임당 SUB) */
  push: number;
  hitstop: number;
  /** 맞히면 차는 게이지 */
  meter: number;
  box: Box;
  /** 맞히거나 막혔을 때 이어 쓸 수 있는 기술 */
  cancel?: MoveId[];
  /** 다운시킴 */
  kd?: boolean;
  /** 시작 동안 앞으로 나가는 속도 */
  step?: number;
  proj?: ProjDef;
}

export interface CharDef {
  id: string;
  name: string;
  title: string;
  desc: string;
  hp: number;
  walk: number;
  back: number;
  jumpVx: number;
  /** 피격 박스 */
  hurt: Box;
  /** 밀어내기 폭(px) */
  width: number;
  /** 탄·이펙트 색 */
  color: string;
  moves: Record<MoveId, MoveDef>;
}

export const JUMP_VY = -1770; // 약 6.9px/f → 최고 높이 약 60px
export const GRAVITY = 102; // 0.4px/f²

export const CHARS: CharDef[] = [
  {
    id: "haru",
    name: "하루",
    title: "붉은 검객",
    desc: "카타나 한 자루, 무난한 기본기와 크게 베는 강공격",
    hp: 1300,
    walk: 420,
    back: 340,
    jumpVx: 520,
    hurt: { x: -10, y: 46, w: 20, h: 46 },
    width: 22,
    color: "#FFD166",
    moves: {
      L: {
        startup: 5,
        active: 3,
        recovery: 9,
        dmg: 50,
        chip: 0,
        hitstun: 15,
        blockstun: 10,
        push: 600,
        hitstop: 6,
        meter: 5,
        box: { x: 4, y: 36, w: 30, h: 20 },
        cancel: ["H", "S", "X"],
      },
      H: {
        startup: 12,
        active: 4,
        recovery: 18,
        dmg: 120,
        chip: 0,
        hitstun: 22,
        blockstun: 15,
        push: 900,
        hitstop: 10,
        meter: 10,
        box: { x: 0, y: 50, w: 38, h: 46 },
        cancel: ["S", "X"],
        step: 180,
      },
      J: {
        startup: 5,
        active: 10,
        recovery: 6,
        dmg: 70,
        chip: 0,
        hitstun: 18,
        blockstun: 12,
        push: 500,
        hitstop: 7,
        meter: 6,
        box: { x: 0, y: 30, w: 32, h: 28 },
      },
      S: {
        startup: 14,
        active: 1,
        recovery: 22,
        dmg: 80,
        chip: 15,
        hitstun: 18,
        blockstun: 14,
        push: 700,
        hitstop: 7,
        meter: 8,
        box: { x: 0, y: 0, w: 0, h: 0 },
        proj: { speed: 900, y: 30, w: 16, h: 14, life: 140 },
      },
      X: {
        startup: 6,
        active: 6,
        recovery: 32,
        dmg: 260,
        chip: 40,
        hitstun: 40,
        blockstun: 22,
        push: 1400,
        hitstop: 16,
        meter: 0,
        box: { x: -6, y: 60, w: 70, h: 60 },
        kd: true,
        step: 300,
      },
    },
  },
  {
    id: "ren",
    name: "렌",
    title: "그림자 닌자",
    desc: "쌍쿠나이, 빠른 발과 짧은 공격, 체력은 적음",
    hp: 1200,
    walk: 500,
    back: 400,
    jumpVx: 600,
    hurt: { x: -10, y: 47, w: 20, h: 47 },
    width: 22,
    color: "#B9A3FF",
    moves: {
      L: {
        startup: 4,
        active: 3,
        recovery: 8,
        dmg: 45,
        chip: 0,
        hitstun: 15,
        blockstun: 9,
        push: 560,
        hitstop: 5,
        meter: 5,
        box: { x: 2, y: 38, w: 26, h: 22 },
        cancel: ["H", "S", "X"],
      },
      H: {
        startup: 10,
        active: 5,
        recovery: 16,
        dmg: 105,
        chip: 0,
        hitstun: 21,
        blockstun: 14,
        push: 850,
        hitstop: 9,
        meter: 10,
        box: { x: -4, y: 48, w: 36, h: 44 },
        cancel: ["S", "X"],
        step: 220,
      },
      J: {
        startup: 4,
        active: 10,
        recovery: 5,
        dmg: 60,
        chip: 0,
        hitstun: 17,
        blockstun: 11,
        push: 480,
        hitstop: 6,
        meter: 6,
        box: { x: -2, y: 32, w: 34, h: 30 },
      },
      S: {
        startup: 12,
        active: 1,
        recovery: 20,
        dmg: 70,
        chip: 12,
        hitstun: 17,
        blockstun: 13,
        push: 650,
        hitstop: 6,
        meter: 8,
        box: { x: 0, y: 0, w: 0, h: 0 },
        proj: { speed: 1150, y: 32, w: 14, h: 12, life: 110 },
      },
      X: {
        startup: 5,
        active: 8,
        recovery: 30,
        dmg: 240,
        chip: 35,
        hitstun: 40,
        blockstun: 22,
        push: 1300,
        hitstop: 15,
        meter: 0,
        box: { x: -10, y: 56, w: 66, h: 56 },
        kd: true,
        step: 420,
      },
    },
  },
  {
    id: "mio",
    name: "미오",
    title: "푸른 창술사",
    desc: "긴 창끝 견제, 느리지만 묵직함",
    hp: 1400,
    walk: 340,
    back: 290,
    jumpVx: 460,
    hurt: { x: -10, y: 46, w: 20, h: 46 },
    width: 24,
    color: "#7FE3FF",
    moves: {
      L: {
        startup: 6,
        active: 3,
        recovery: 11,
        dmg: 55,
        chip: 0,
        hitstun: 15,
        blockstun: 10,
        push: 620,
        hitstop: 6,
        meter: 5,
        box: { x: 8, y: 34, w: 42, h: 14 },
        cancel: ["H", "S", "X"],
      },
      H: {
        startup: 14,
        active: 4,
        recovery: 20,
        dmg: 135,
        chip: 0,
        hitstun: 23,
        blockstun: 16,
        push: 1000,
        hitstop: 11,
        meter: 10,
        box: { x: 0, y: 46, w: 44, h: 38 },
        cancel: ["S", "X"],
        step: 140,
      },
      J: {
        startup: 6,
        active: 9,
        recovery: 7,
        dmg: 75,
        chip: 0,
        hitstun: 18,
        blockstun: 12,
        push: 520,
        hitstop: 7,
        meter: 6,
        box: { x: 2, y: 28, w: 38, h: 26 },
      },
      S: {
        startup: 16,
        active: 1,
        recovery: 24,
        dmg: 95,
        chip: 18,
        hitstun: 19,
        blockstun: 15,
        push: 760,
        hitstop: 8,
        meter: 8,
        box: { x: 0, y: 0, w: 0, h: 0 },
        proj: { speed: 720, y: 26, w: 22, h: 20, life: 170 },
      },
      X: {
        startup: 7,
        active: 6,
        recovery: 34,
        dmg: 280,
        chip: 45,
        hitstun: 42,
        blockstun: 22,
        push: 1500,
        hitstop: 17,
        meter: 0,
        box: { x: -4, y: 64, w: 76, h: 64 },
        kd: true,
        step: 260,
      },
    },
  },
];

export const charIndex = (id: string) =>
  Math.max(
    0,
    CHARS.findIndex((c) => c.id === id)
  );
