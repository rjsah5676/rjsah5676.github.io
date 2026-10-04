/**
 * 격투 맵 (학교, 플랫폼 대전). 판은 화면 한 장(1152×648), 높이 y는 화면 아래에서 위로(px).
 * 발판은 가로 x0~x1, 윗면 높이 y — 밑에서는 점프로 뚫고 올라가고, ↓+점프로 내려감.
 * solid 발판(바닥)은 못 내려감. 발판 없는 곳으로 떨어지면 화면 밖 → 체력 깎이고 위에서 다시 등장.
 * 시뮬레이션이 쓰는 값만 여기 두고, 그림은 components/Fight/stages.ts (또는 bg 그림).
 */
export interface Plat {
  x0: number;
  x1: number;
  /** 윗면 높이(px, 화면 아래가 0) */
  y: number;
  /** 못 내려가는 바닥 */
  solid?: boolean;
  /** 그림 종류 */
  kind: string;
}

export interface MapDef {
  id: string;
  name: string;
  desc: string;
  plats: Plat[];
  /** 시작 위치 x (1P, 2P) — 그 아래 가장 높은 발판 위에 섬 */
  spawn: [number, number];
  /** 떨어진 뒤 다시 내려오는 위치 x 후보 (상대에게서 먼 곳) */
  respawn: number[];
  /** 배경 그림 경로 (16:9). 있으면 코드 배경 대신 씀 */
  bg?: string;
  /** 배경 그림에 발판까지 그려져 있으면 true (발판 따로 안 그림) */
  bgPlats?: boolean;
}

export const MAPS: MapDef[] = [
  {
    id: "yard",
    name: "운동장",
    desc: "넓은 바닥에 스탠드 발판, 떨어질 걱정 없는 기본 판",
    plats: [
      { x0: 0, x1: 1152, y: 64, solid: true, kind: "dirt" },
      { x0: 150, x1: 390, y: 210, kind: "stand" },
      { x0: 762, x1: 1002, y: 210, kind: "stand" },
      { x0: 456, x1: 696, y: 340, kind: "stand" },
      { x0: 230, x1: 410, y: 470, kind: "bar" },
      { x0: 742, x1: 922, y: 470, kind: "bar" },
    ],
    spawn: [380, 772],
    respawn: [270, 576, 882],
  },
  {
    id: "gym",
    name: "체육관",
    desc: "단상과 캣워크, 농구 골대까지 오르내리는 판",
    plats: [
      { x0: 0, x1: 1152, y: 56, solid: true, kind: "wood" },
      { x0: 420, x1: 732, y: 150, kind: "stage" },
      { x0: 0, x1: 290, y: 320, kind: "catwalk" },
      { x0: 862, x1: 1152, y: 320, kind: "catwalk" },
      { x0: 496, x1: 656, y: 400, kind: "catwalk" },
      { x0: 110, x1: 210, y: 480, kind: "hoop" },
      { x0: 942, x1: 1042, y: 480, kind: "hoop" },
    ],
    spawn: [300, 852],
    respawn: [150, 576, 1002],
  },
  {
    id: "roof",
    name: "옥상",
    desc: "가운데가 뚫린 두 건물 옥상 — 떨어지면 아파요",
    plats: [
      { x0: 0, x1: 460, y: 96, solid: true, kind: "roof" },
      { x0: 692, x1: 1152, y: 96, solid: true, kind: "roof" },
      { x0: 820, x1: 990, y: 250, solid: true, kind: "tank" },
      { x0: 110, x1: 240, y: 190, kind: "unit" },
      { x0: 500, x1: 652, y: 270, kind: "sign" },
      { x0: 240, x1: 420, y: 420, kind: "sign" },
      { x0: 732, x1: 912, y: 430, kind: "sign" },
    ],
    spawn: [320, 760],
    respawn: [200, 576, 950],
  },
  {
    id: "sky",
    name: "공중 교정",
    desc: "능력 폭주로 떠오른 교정 조각들 — 바닥이 없어요",
    plats: [
      { x0: 70, x1: 310, y: 150, solid: true, kind: "island" },
      { x0: 842, x1: 1082, y: 150, solid: true, kind: "island" },
      { x0: 446, x1: 706, y: 96, solid: true, kind: "island" },
      { x0: 210, x1: 370, y: 310, kind: "chunk" },
      { x0: 782, x1: 942, y: 310, kind: "chunk" },
      { x0: 500, x1: 652, y: 360, kind: "chunk" },
      { x0: 330, x1: 470, y: 490, kind: "chunk" },
      { x0: 682, x1: 822, y: 490, kind: "chunk" },
    ],
    spawn: [190, 962],
    respawn: [190, 576, 962],
  },
];
