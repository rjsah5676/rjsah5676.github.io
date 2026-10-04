/**
 * 격투 맵 (학교). 판은 화면 한 장 크기(320×180), 깊이(z)는 앞(0)에서 뒤(z1)까지.
 * 발판(plats)은 x·z 범위와 높이(px)를 가진 상자 — 그 위에 올라설 수 있고 옆으로는 못 지나감.
 * 시뮬레이션이 쓰는 값만 여기 두고, 배경 그림은 components/Fight/stages.ts.
 */
export interface Plat {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  /** 높이(px) */
  h: number;
  name: string;
}

export interface MapDef {
  id: string;
  name: string;
  desc: string;
  /** 깊이 끝(px) */
  z1: number;
  /** 땅 마찰 (클수록 빨리 멈춤, 프레임당 SUB) */
  friction: number;
  plats: Plat[];
}

export const MAPS: MapDef[] = [
  {
    id: "yard",
    name: "운동장",
    desc: "넓고 평평한 해 질 녘 운동장",
    z1: 50,
    friction: 40,
    plats: [],
  },
  {
    id: "gym",
    name: "체육관",
    desc: "뒤쪽 단상과 뜀틀에 올라설 수 있어요",
    z1: 46,
    friction: 40,
    plats: [
      { x0: 118, x1: 202, z0: 32, z1: 46, h: 14, name: "단상" },
      { x0: 34, x1: 62, z0: 4, z1: 16, h: 12, name: "뜀틀" },
    ],
  },
  {
    id: "roof",
    name: "옥상",
    desc: "밤의 옥상, 물탱크 위가 높은 자리",
    z1: 42,
    friction: 40,
    plats: [
      { x0: 246, x1: 292, z0: 24, z1: 42, h: 24, name: "물탱크" },
      { x0: 34, x1: 82, z0: 0, z1: 8, h: 8, name: "벤치" },
    ],
  },
  {
    id: "hall",
    name: "복도",
    desc: "좁고 왁스 칠한 바닥이라 미끄러워요",
    z1: 22,
    friction: 14,
    plats: [],
  },
];
