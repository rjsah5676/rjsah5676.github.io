/**
 * 격투게임 캐릭터 성능 (프레임 데이터). 그림과는 완전히 분리 — 그림은 public/fight/<id>.json.
 *
 * 단위: 1px = 256 (SUB). 속도는 프레임당 SUB, 시간은 프레임(1/60초).
 * 판정 박스는 캐릭터 발 가운데 기준, 오른쪽을 볼 때 값:
 *   x = 앞쪽으로 얼마나 떨어진 곳부터(px), y = 땅에서 박스 윗변까지 높이(px), w·h = 크기(px)
 */

export const SUB = 256;

/** 기술 id: L 약 · H 발차기 · J 공중 약 · K 공중 발차기 · S 아이덴티티(캐릭터마다 다름) · X 필살기 */
export type MoveId = "L" | "H" | "J" | "K" | "S" | "X";

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
  /** 공중 기술: 시작할 때 앞으로 치고 나가는 속도 (SUB/프레임) */
  lunge?: number;
  /** 돌진기: 판정이 나오는 순간 앞으로 튀어 나감 (공중이면 airVh로 아래로 내리꽂음) */
  rush?: { vx: number; airVh: number };
  /** 여러 번 맞는 기술: 판정 동안 이 프레임마다 다시 맞음 (마지막 타만 다운) */
  multi?: number;
  /** 소환기: 상대 발밑 발판에 기둥을 세움 (delay 뒤 life 동안, every 프레임마다 타격) */
  summon?: { w: number; h: number; delay: number; life: number; every: number };
  proj?: ProjDef;
}

export interface CharDef {
  id: string;
  name: string;
  title: string;
  desc: string;
  hp: number;
  /** 걷기 속도 (SUB/프레임) */
  walk: number;
  /** 점프 가로 속도·공중 최고 가로 속도 */
  jumpVx: number;
  /** 대시 속도 (←← / →→) */
  dash: number;
  /** 아이덴티티 재사용 대기 (프레임) */
  cd: number;
  /** 피격 박스 */
  hurt: Box;
  /** 밀어내기 폭(px) */
  width: number;
  /** 탄·이펙트 색 */
  color: string;
  /** 아이덴티티(L)·필살기(I) 이름과 설명 (선택 화면·HUD) */
  idName: string;
  idDesc: string;
  ultName: string;
  ultDesc: string;
  moves: Record<MoveId, MoveDef>;
}

export const JUMP_VY = -2650; // 약 10.4px/f → 최고 높이 약 134px (2단 점프로 약 240px)
export const GRAVITY = 102; // 0.4px/f²

export const CHARS: CharDef[] = [
  {
    id: "kai",
    name: "카이",
    title: "맨손 격투 · 바람",
    desc: "빠른 주먹·발차기로 붙어서 몰아치는 맨손 격투가",
    hp: 1250,
    walk: 1180,
    jumpVx: 1050,
    dash: 2700,
    cd: 150,
    hurt: { x: -9, y: 58, w: 18, h: 58 },
    width: 18,
    color: "#E6ECF5",
    idName: "질풍권",
    idDesc: "바람을 두르고 돌진하며 2연타. 공중에선 앞쪽 아래로 내리꽂는 발차기",
    ultName: "천풍난무",
    ultDesc: "회오리를 두르고 돌진하며 6연타, 마지막 타에 날려 버림",
    moves: {
      L: {
        // 약 (J): 제일 빠르고 짧은 경직 — J·J로 이어 치고 발차기·아이덴티티·필살기로 캔슬
        startup: 3,
        active: 3,
        recovery: 5,
        dmg: 40,
        chip: 0,
        hitstun: 14,
        blockstun: 9,
        push: 380,
        hitstop: 5,
        meter: 5,
        box: { x: 4, y: 46, w: 44, h: 18 },
        cancel: ["H", "S", "X"],
      },
      H: {
        // 발차기 (K): 세지만 느리고 헛치면 빈틈 큼 — 연타보다 약 뒤에 이어 쓰는 기술
        startup: 11,
        active: 4,
        recovery: 19,
        dmg: 95,
        chip: 0,
        hitstun: 20,
        blockstun: 14,
        push: 1100,
        hitstop: 9,
        meter: 9,
        box: { x: 2, y: 62, w: 58, h: 30 },
        cancel: ["S", "X"],
        step: 260,
      },
      J: {
        startup: 4,
        active: 8,
        recovery: 6,
        dmg: 60,
        chip: 0,
        hitstun: 16,
        blockstun: 10,
        push: 600,
        hitstop: 6,
        meter: 5,
        box: { x: 0, y: 40, w: 50, h: 26 },
      },
      K: {
        startup: 6,
        active: 8,
        recovery: 10,
        dmg: 90,
        chip: 0,
        hitstun: 20,
        blockstun: 12,
        push: 1300,
        hitstop: 8,
        meter: 8,
        box: { x: 0, y: 44, w: 62, h: 22 },
        lunge: 2300,
      },
      S: {
        // 아이덴티티 「질풍권」: 바람을 두르고 앞으로 돌진하며 2연타 (공중에선 비스듬히 내리꽂는 발차기)
        startup: 9,
        active: 11,
        recovery: 22,
        dmg: 70,
        chip: 6,
        hitstun: 18,
        blockstun: 10,
        push: 1100,
        hitstop: 7,
        meter: 7,
        box: { x: 0, y: 48, w: 46, h: 32 },
        rush: { vx: 2500, airVh: -2200 },
        // 돌진 중 2번 때림
        multi: 6,
      },
      X: {
        // 필살기 「천풍난무」: 회오리를 두르고 돌진하며 6연타, 마지막에 날려 버림
        startup: 6,
        active: 36,
        recovery: 22,
        dmg: 42,
        chip: 8,
        hitstun: 18,
        blockstun: 12,
        push: 220,
        hitstop: 2,
        meter: 0,
        box: { x: -30, y: 86, w: 92, h: 86 },
        kd: true,
        multi: 6,
        rush: { vx: 1500, airVh: -600 },
      },
    },
  },
  {
    id: "igna",
    name: "이그나",
    title: "불꽃 술사",
    desc: "불꽃 탄과 긴 불꽃 베기로 거리를 두고 태우는 술사",
    hp: 1220,
    walk: 1160,
    jumpVx: 980,
    dash: 2500,
    cd: 56,
    hurt: { x: -9, y: 60, w: 18, h: 60 },
    width: 18,
    color: "#FF6A2A",
    idName: "화염구",
    idDesc: "빠르게 날아가는 불꽃 탄. 공중에서 쏘면 앞쪽 아래로 비스듬히 내리꽂음",
    ultName: "업화주",
    ultDesc: "상대 발밑에서 불기둥이 솟아 4연타 — 어디에 있든 따라감",
    moves: {
      L: {
        startup: 4,
        active: 3,
        recovery: 6,
        dmg: 42,
        chip: 0,
        hitstun: 14,
        blockstun: 9,
        push: 400,
        hitstop: 5,
        meter: 5,
        box: { x: 4, y: 40, w: 48, h: 24 },
        cancel: ["H", "S", "X"],
      },
      H: {
        startup: 10,
        active: 5,
        recovery: 18,
        dmg: 100,
        chip: 8,
        hitstun: 21,
        blockstun: 15,
        push: 1150,
        hitstop: 10,
        meter: 10,
        box: { x: 0, y: 68, w: 70, h: 60 },
        cancel: ["S", "X"],
        step: 160,
      },
      J: {
        startup: 5,
        active: 9,
        recovery: 7,
        dmg: 62,
        chip: 0,
        hitstun: 16,
        blockstun: 10,
        push: 620,
        hitstop: 6,
        meter: 5,
        box: { x: -24, y: 56, w: 80, h: 50 },
      },
      K: {
        startup: 8,
        active: 8,
        recovery: 12,
        dmg: 95,
        chip: 6,
        hitstun: 20,
        blockstun: 12,
        push: 1200,
        hitstop: 8,
        meter: 8,
        box: { x: -10, y: 48, w: 76, h: 56 },
        lunge: 1600,
      },
      S: {
        // 아이덴티티 「화염구」: 빠른 불꽃 탄 (공중에선 앞쪽 아래로 내리꽂음)
        startup: 8,
        active: 1,
        recovery: 15,
        dmg: 85,
        chip: 16,
        hitstun: 17,
        blockstun: 13,
        push: 800,
        hitstop: 7,
        meter: 7,
        box: { x: 0, y: 0, w: 0, h: 0 },
        proj: { speed: 1750, y: 36, w: 30, h: 24, life: 95 },
      },
      X: {
        // 필살기 「업화주」: 상대 발밑에서 불기둥이 솟아 4연타 — 어디 있든 쫓아감
        startup: 10,
        active: 1,
        recovery: 30,
        dmg: 88,
        chip: 12,
        hitstun: 24,
        blockstun: 14,
        push: 300,
        hitstop: 5,
        meter: 0,
        box: { x: 0, y: 0, w: 0, h: 0 },
        kd: true,
        summon: { w: 56, h: 150, delay: 20, life: 40, every: 10 },
      },
    },
  },
];

export const charIndex = (id: string) =>
  Math.max(
    0,
    CHARS.findIndex((c) => c.id === id)
  );
