/**
 * 격투게임 캐릭터 성능 (프레임 데이터). 그림과는 완전히 분리 — 그림은 public/fight/<id>.json.
 *
 * 단위: 1px = 256 (SUB). 속도는 프레임당 SUB, 시간은 프레임(1/60초).
 * 판정 박스는 캐릭터 발 가운데 기준, 오른쪽을 볼 때 값:
 *   x = 앞쪽으로 얼마나 떨어진 곳부터(px), y = 땅에서 박스 윗변까지 높이(px), w·h = 크기(px)
 */

export const SUB = 256;

/**
 * 기술 id: L 약 · H 발차기 · J 공중 약 · K 공중 발차기 · S 아이덴티티(캐릭터마다 다름) · X 필살기
 *          T 잡기(약+발차기, 가드 불가) · G 가드 반격(가드 중 발차기, 게이지 25)
 */
export type MoveId = "L" | "H" | "J" | "K" | "S" | "X" | "T" | "G";
type BaseMoveId = Exclude<MoveId, "T" | "G">;

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
  /** 여러 번 맞는 탄: 맞히는 수와 간격(프레임) */
  hits?: number;
  every?: number;
  /** 공중에서 쏴도 내리꽂지 않고 수평으로 */
  flat?: boolean;
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
  rush?: {
    vx: number;
    airVh: number;
    /** 공중에서의 가로 속도 (없으면 vx) */
    airVx?: number;
    /** 공중에서 쓰고 착지하면 이 반경(px)에 충격파 */
    landBurst?: number;
  };
  /** 여러 번 맞는 기술: 판정 동안 이 프레임마다 다시 맞음 (마지막 타만 다운) */
  multi?: number;
  /**
   * 막혔을 때 프레임 이득 (+면 때린 쪽이 먼저 움직임, -면 막은 쪽이 먼저 → 반격 가능).
   * 없으면 기술 종류별 기본값(ON_BLOCK). blockstun은 이 값으로 자동 계산.
   */
  onBlock?: number;
  /** 맞으면 상대를 내 쪽으로 끌어당김 */
  pull?: boolean;
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
  /** 공중에서 점프를 누르고 있으면 천천히 떨어짐 (최대 낙하 속도) */
  glide?: number;
  /** 선택 화면 대사 */
  quote: string;
  /** 설정화 영문 부제 */
  tagline: string;
  /** 난이도 (1 쉬움 ~ 3 어려움) — 선택 화면 표시 */
  difficulty: 1 | 2 | 3;
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

type CharSrc = Omit<CharDef, "moves"> & { moves: Record<BaseMoveId, MoveDef> };

const RAW: CharSrc[] = [
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
    quote: "덤벼. 주먹 하나면 충분해.",
    tagline: "RELENTLESS FIGHTER",
    difficulty: 2,
    idName: "질풍권",
    idDesc: "바람을 두르고 돌진하며 2연타. 공중에선 아래로 급강하해 착지하며 충격파로 넘어뜨림",
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
        push: 560,
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
        // 공중: 거의 수직으로 급강하 → 착지 충격파 (공중 K는 앞으로 길게 차는 기술)
        rush: { vx: 2500, airVh: -3400, airVx: 900, landBurst: 46 },
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
    quote: "다 태워 줄게. 가까이 오지 마!",
    tagline: "BLAZING SOUL",
    difficulty: 1,
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
        push: 660,
        hitstop: 5,
        meter: 5,
        box: { x: 4, y: 40, w: 48, h: 24 },
        cancel: ["H", "S", "X"],
      },
      H: {
        startup: 10,
        active: 5,
        recovery: 20,
        dmg: 90,
        chip: 8,
        hitstun: 21,
        blockstun: 15,
        push: 1150,
        hitstop: 10,
        meter: 10,
        box: { x: 0, y: 68, w: 64, h: 60 },
        onBlock: -6,
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
  {
    // 거리형(리치): 채찍이 길어 멀리서 맞히기 쉬운 대신 한 대가 약하고, 헛치면 빈틈이 큼
    id: "soyoung",
    name: "소영",
    title: "선생님 · 채찍",
    desc: "긴 채찍으로 거리를 지배하는 엄한 선생님. 붙으면 약함",
    hp: 1270,
    walk: 1020,
    jumpVx: 900,
    dash: 2300,
    cd: 100,
    hurt: { x: -9, y: 60, w: 18, h: 60 },
    width: 18,
    color: "#FF5FB4",
    quote: "수업은 끝났어, 지금부터… 제대로 할 시간이지.",
    tagline: "STRICT BUT KIND",
    difficulty: 3,
    idName: "지도편달",
    idDesc: "아주 긴 채찍으로 낚아채 내 앞으로 끌어당김 — 이어서 약·발차기",
    ultName: "보충수업",
    ultDesc: "채찍을 휘몰아 앞뒤를 모두 6번 후려침",
    moves: {
      L: {
        // 약: 리치는 길지만 한 대가 약하고 조금 느림
        startup: 4,
        active: 3,
        recovery: 7,
        dmg: 36,
        chip: 0,
        hitstun: 13,
        blockstun: 8,
        push: 800,
        hitstop: 4,
        meter: 5,
        box: { x: 8, y: 46, w: 62, h: 14 },
        cancel: ["H", "S", "X"],
      },
      H: {
        startup: 10,
        active: 4,
        recovery: 20,
        dmg: 90,
        chip: 0,
        hitstun: 19,
        blockstun: 13,
        push: 1350,
        hitstop: 8,
        meter: 9,
        box: { x: 10, y: 52, w: 88, h: 26 },
        cancel: ["S", "X"],
      },
      J: {
        // 공중 채찍: 앞쪽 아래로 길게 휘둘러 공중에서도 리치로 견제 (뛰어드는 상대·아래 발판 상대)
        startup: 6,
        active: 9,
        recovery: 8,
        dmg: 58,
        chip: 0,
        hitstun: 18,
        blockstun: 10,
        push: 1000,
        hitstop: 6,
        meter: 6,
        box: { x: 0, y: 60, w: 96, h: 56 },
      },
      K: {
        startup: 8,
        active: 8,
        recovery: 12,
        dmg: 78,
        chip: 0,
        hitstun: 18,
        blockstun: 12,
        push: 1200,
        hitstop: 7,
        meter: 7,
        box: { x: 0, y: 40, w: 80, h: 40 },
      },
      S: {
        // 아이덴티티 「지도편달」: 아주 긴 채찍으로 끌어당김
        startup: 12,
        active: 4,
        recovery: 18,
        dmg: 55,
        chip: 6,
        hitstun: 26,
        blockstun: 12,
        push: 1300,
        hitstop: 8,
        meter: 7,
        box: { x: 20, y: 50, w: 120, h: 18 },
        pull: true,
      },
      X: {
        // 필살기 「보충수업」: 앞뒤 넓게 6연타
        startup: 8,
        active: 36,
        recovery: 24,
        dmg: 40,
        chip: 8,
        hitstun: 18,
        blockstun: 12,
        push: 200,
        hitstop: 2,
        meter: 0,
        box: { x: -80, y: 80, w: 170, h: 80 },
        kd: true,
        multi: 6,
      },
    },
  },
  {
    // 기동형(함정): 작고 가볍고 공중에서 오래 떠 있어 맞히기 어려운 대신 체력이 낮고 한 대가 약함
    id: "lily",
    name: "릴리",
    title: "유치원생 · 우산과 물",
    desc: "우산으로 둥실 떠다니며 물방울을 띄우는 꼬마. 작아서 잘 안 맞음",
    hp: 1170,
    walk: 1120,
    jumpVx: 1050,
    dash: 2500,
    cd: 80,
    glide: 520,
    hurt: { x: -8, y: 50, w: 16, h: 50 },
    width: 16,
    color: "#5EC8FF",
    quote: "비… 많이 오네~ 우산 같이 쓸까?!",
    tagline: "KINDERGARTEN GIRL",
    difficulty: 2,
    idName: "비눗방울",
    idDesc: "느리게 떠가는 큰 물방울 — 오래 남아서 길목을 막고, 맞으면 오래 갇힘",
    ultName: "장마 파도",
    ultDesc: "바닥을 휩쓰는 큰 파도가 지나가며 5번 때림",
    moves: {
      L: {
        startup: 4,
        active: 3,
        recovery: 6,
        dmg: 37,
        chip: 0,
        hitstun: 13,
        blockstun: 8,
        push: 640,
        hitstop: 4,
        meter: 5,
        box: { x: 4, y: 44, w: 40, h: 22 },
        cancel: ["H", "S", "X"],
      },
      H: {
        startup: 8,
        active: 5,
        recovery: 16,
        dmg: 86,
        chip: 0,
        hitstun: 19,
        blockstun: 13,
        push: 1050,
        hitstop: 8,
        meter: 9,
        box: { x: 0, y: 62, w: 56, h: 52 },
        cancel: ["S", "X"],
      },
      J: {
        startup: 4,
        active: 9,
        recovery: 6,
        dmg: 48,
        chip: 0,
        hitstun: 15,
        blockstun: 10,
        push: 560,
        hitstop: 5,
        meter: 5,
        box: { x: -10, y: 50, w: 58, h: 44 },
      },
      K: {
        startup: 6,
        active: 8,
        recovery: 10,
        dmg: 82,
        chip: 0,
        hitstun: 18,
        blockstun: 12,
        push: 1100,
        hitstop: 7,
        meter: 7,
        box: { x: -6, y: 44, w: 60, h: 44 },
        lunge: 1500,
      },
      S: {
        // 아이덴티티 「비눗방울」: 느리고 오래 가는 함정 탄
        startup: 10,
        active: 1,
        recovery: 14,
        dmg: 70,
        chip: 10,
        hitstun: 34,
        blockstun: 14,
        push: 500,
        hitstop: 8,
        meter: 7,
        box: { x: 0, y: 0, w: 0, h: 0 },
        proj: { speed: 520, y: 40, w: 34, h: 34, life: 230, flat: true },
      },
      X: {
        // 필살기 「장마 파도」: 바닥을 따라가는 큰 파도 5연타
        startup: 10,
        active: 1,
        recovery: 28,
        dmg: 52,
        chip: 10,
        hitstun: 20,
        blockstun: 12,
        push: 600,
        hitstop: 3,
        meter: 0,
        box: { x: 0, y: 0, w: 0, h: 0 },
        kd: true,
        proj: { speed: 900, y: 34, w: 80, h: 70, life: 120, hits: 5, every: 8, flat: true },
      },
    },
  },
  {
    // 중거리 창술: 리치는 카이·이그나보다 길고 소영보다 짧음. 아이덴티티로 띄워 놓고 이어 치는 콤보형
    id: "zena",
    name: "제나",
    title: "창술 · 번개",
    desc: "번개 두른 창으로 중거리를 지배하는 장난꾸러기",
    hp: 1140,
    walk: 1120,
    jumpVx: 1000,
    dash: 2600,
    cd: 130,
    hurt: { x: -9, y: 58, w: 18, h: 58 },
    width: 18,
    color: "#FFD43B",
    quote: "찌릿찌릿~ 감전 조심하라구!",
    tagline: "THUNDER LANCER",
    difficulty: 2,
    idName: "뇌창",
    idDesc: "번개 창을 아주 빠르게 던짐. 맞으면 오래 감전돼서 달려가 이어 칠 수 있음 (대기 길음)",
    ultName: "천뢰강림",
    ultDesc: "상대 발밑에 번개 창이 연달아 3번 내리꽂힘",
    moves: {
      L: {
        startup: 4,
        active: 3,
        recovery: 7,
        dmg: 38,
        chip: 0,
        hitstun: 13,
        blockstun: 8,
        push: 640,
        hitstop: 4,
        meter: 5,
        box: { x: 6, y: 46, w: 52, h: 16 },
        cancel: ["H", "S", "X"],
      },
      H: {
        startup: 11,
        active: 4,
        recovery: 20,
        dmg: 80,
        chip: 0,
        hitstun: 19,
        blockstun: 13,
        push: 1150,
        hitstop: 8,
        meter: 9,
        box: { x: 4, y: 56, w: 68, h: 26 },
        cancel: ["S", "X"],
      },
      J: {
        startup: 5,
        active: 8,
        recovery: 7,
        dmg: 52,
        chip: 0,
        hitstun: 15,
        blockstun: 10,
        push: 700,
        hitstop: 5,
        meter: 5,
        box: { x: -10, y: 50, w: 72, h: 36 },
      },
      K: {
        startup: 7,
        active: 8,
        recovery: 11,
        dmg: 80,
        chip: 0,
        hitstun: 18,
        blockstun: 12,
        push: 1150,
        hitstop: 7,
        meter: 7,
        box: { x: 0, y: 44, w: 70, h: 30 },
        lunge: 1400,
      },
      S: {
        // 아이덴티티 「뇌창」: 아주 빠른 창 던지기, 맞으면 오래 감전
        startup: 11,
        active: 1,
        recovery: 16,
        dmg: 70,
        chip: 12,
        hitstun: 38,
        blockstun: 14,
        push: 500,
        hitstop: 9,
        meter: 7,
        box: { x: 0, y: 0, w: 0, h: 0 },
        proj: { speed: 2600, y: 38, w: 40, h: 14, life: 70 },
      },
      X: {
        // 필살기 「천뢰강림」: 상대 발밑에 번개 창 3연타
        startup: 10,
        active: 1,
        recovery: 28,
        dmg: 95,
        chip: 14,
        hitstun: 26,
        blockstun: 14,
        push: 400,
        hitstop: 6,
        meter: 0,
        box: { x: 0, y: 0, w: 0, h: 0 },
        kd: true,
        summon: { w: 48, h: 160, delay: 16, life: 36, every: 12 },
      },
    },
  },
];

/**
 * 막혔을 때 기본 프레임 이득 — 격투게임 공식:
 *   약은 거의 0(막혀도 안전, 계속 압박), 발차기는 조금 손해, 아이덴티티는 크게 손해(막히면 반격당함),
 *   필살기는 막히면 확정 반격. 약 4단·발차기 2단의 마지막 동작은 sim.ts에서 빈틈이 더 붙음.
 */
const ON_BLOCK: Record<MoveId, number> = { L: -1, H: -4, J: 0, K: -2, S: -8, X: -16, T: 0, G: -10 };

/** 잡기(띄우기): 가드 불가, 사거리 짧음. 잡히는 순간 약+발차기로 풀 수 있고, 못 풀면 위로 띄워져 공중 콤보 시작 */
const THROW: MoveDef = {
  startup: 5,
  active: 3,
  recovery: 14,
  dmg: 60,
  chip: 0,
  hitstun: 30,
  blockstun: 0,
  push: 0,
  hitstop: 10,
  meter: 8,
  box: { x: 0, y: 56, w: 38, h: 44 },
};
/** 가드 반격: 막는 중에 발차기 → 게이지 25를 써서 바로 밀쳐 냄 (시작 동안 무적) */
const GUARD_COUNTER: MoveDef = {
  startup: 4,
  active: 4,
  recovery: 20,
  dmg: 40,
  chip: 0,
  hitstun: 22,
  blockstun: 10,
  push: 1800,
  hitstop: 8,
  meter: 0,
  box: { x: -6, y: 64, w: 62, h: 64 },
  kd: true,
};
export const GUARD_COUNTER_COST = 25;

function normalize(c: CharSrc): CharDef {
  const moves = { ...c.moves, T: { ...THROW }, G: { ...GUARD_COUNTER } } as Record<MoveId, MoveDef>;
  for (const id of Object.keys(moves) as MoveId[]) {
    const m = moves[id];
    if (m.proj || m.summon || id === "T") continue;
    const adv = m.onBlock ?? ON_BLOCK[id];
    // 첫 판정 프레임에 막혔다고 보고: 막은 쪽 경직 = 때린 쪽 남은 동작 + 이득
    m.blockstun = Math.max(2, m.active - 1 + m.recovery + adv);
  }
  return { ...c, moves };
}

export const CHARS: CharDef[] = RAW.map(normalize);

export const charIndex = (id: string) =>
  Math.max(
    0,
    CHARS.findIndex((c) => c.id === id)
  );
