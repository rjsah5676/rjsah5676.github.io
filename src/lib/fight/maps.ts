/**
 * 격투 맵 (학교, 플랫폼 대전). 판은 화면 한 장(1152×648), 높이 y는 화면 아래에서 위로(px).
 * 발판은 가로 x0~x1, 윗면 높이 y — 밑에서는 점프로 뚫고 올라가고, 끝으로 걸어 내려감.
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
  /** 건물처럼 아래까지 막힌 덩어리 — 윗면보다 낮으면 옆에서 못 들어감 */
  wall?: boolean;
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
  /** 이 맵의 배경음악 (대전 중, 맵 선택에서 이 맵에 커서가 있을 때) */
  bgm?: string;
}

export const MAPS: MapDef[] = [
  {
    // 그림: public/fight/bg/temple.webp (1365×768 원본 → 발판 좌표는 0.844배)
    id: "temple",
    name: "운해 학당",
    desc: "구름 위 산정 학당 — 사슬에 매달린 발판들, 오른쪽은 낭떠러지",
    plats: [
      { x0: 0, x1: 764, y: 132, solid: true, kind: "floor" },
      // 책상 돌단 (왼쪽 끝 너머 학당 안쪽은 발판 아님 → 떨어짐)
      { x0: 340, x1: 563, y: 226, kind: "desk" },
      // 「學問」 현판 위
      { x0: 0, x1: 145, y: 432, kind: "beam" },
      { x0: 582, x1: 717, y: 230, kind: "hang" },
      { x0: 430, x1: 565, y: 340, kind: "hang" },
      { x0: 736, x1: 874, y: 340, kind: "hang" },
      { x0: 585, x1: 717, y: 421, kind: "hang" },
      { x0: 726, x1: 861, y: 498, kind: "hang" },
      { x0: 427, x1: 557, y: 531, kind: "hang" },
      { x0: 561, x1: 700, y: 573, kind: "hang" },
      { x0: 1009, x1: 1152, y: 475, kind: "beam" },
    ],
    spawn: [530, 730],
    respawn: [300, 560, 700],
    bg: "/fight/bg/temple.webp",
    bgPlats: true,
    bgm: "/fight/bgm.mp3",
  },
  {
    // 그림: public/fight/bg/rooftop.webp (1672×941 원본 → 0.689배)
    id: "rooftop",
    name: "노을 옥상",
    desc: "벚꽃 날리는 해 질 녘 학교 옥상 — 떨어질 걱정 없는 넓은 바닥, 양쪽 건물 지붕까지",
    plats: [
      { x0: 0, x1: 1152, y: 186, solid: true, kind: "floor" },
      { x0: 238, x1: 466, y: 301, kind: "beam" },
      { x0: 690, x1: 918, y: 301, kind: "beam" },
      { x0: 452, x1: 700, y: 396, kind: "beam" },
      { x0: 16, x1: 244, y: 473, kind: "roof" },
      { x0: 1000, x1: 1152, y: 498, kind: "roof" },
    ],
    spawn: [380, 772],
    respawn: [360, 576, 800],
    bg: "/fight/bg/rooftop.webp",
    bgPlats: true,
    bgm: "/fight/bgm-rooftop.mp3",
  },
  {
    // 그림: public/fight/bg/sky.webp (1920×1080 = 판 ×5/3) — 배경에 발판 구름 5개를 합성해 둠
    id: "sky",
    name: "천공 구름길",
    desc: "하늘 위 떠다니는 구름 발판 다섯 개 — 가운데 큰 구름 말고는 전부 낭떠러지",
    plats: [
      { x0: 310, x1: 845, y: 150, solid: true, kind: "cloud" },
      { x0: 40, x1: 230, y: 270, kind: "cloud" },
      { x0: 922, x1: 1112, y: 270, kind: "cloud" },
      { x0: 270, x1: 490, y: 390, kind: "cloud" },
      { x0: 662, x1: 882, y: 390, kind: "cloud" },
    ],
    spawn: [440, 712],
    respawn: [380, 576, 772],
    bg: "/fight/bg/sky.webp",
    bgPlats: true,
    bgm: "/fight/bgm.mp3",
  },
  {
    // 그림: public/fight/bg/skyscraper.webp (1920×1080) — 높이 다른 아파트 두 동 옥상, 가운데는 낭떠러지
    id: "skyscraper",
    name: "달밤 마천루",
    desc: "보름달 뜬 도시 위 아파트 옥상 두 동 — 오른쪽 동이 더 높고, 사이로 떨어지면 끝",
    plats: [
      { x0: 0, x1: 495, y: 200, solid: true, wall: true, kind: "roof" },
      { x0: 648, x1: 1152, y: 270, solid: true, wall: true, kind: "roof" },
    ],
    spawn: [280, 880],
    respawn: [250, 900],
    bg: "/fight/bg/skyscraper.webp",
    bgPlats: true,
    bgm: "/fight/bgm-rooftop.mp3",
  },
];
