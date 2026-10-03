/**
 * 자동 채보의 "손맛" 패턴.
 *
 * 쉼 없이 이어지는 구간(스트림: 노트 사이가 한 박 이하로 4개 이상)을 찾아서,
 * 레인을 음색 순위가 아니라 리듬게임에서 익숙한 패턴으로 깔아 준다.
 *
 *   계단      D F J K ·        역계단    D F J K J F ·    3계단   D F J F ·
 *   연타      D F D F ·        연타 응용  D F D F J K J K  트릴    D F K J ·
 *   넓은 연타 DF JK DF JK      교차 연타  DK FJ DK FJ      벌림    D J F K ·
 *
 * 패턴은 마디 단위로 고르고, 다음 마디도 같은 패턴을 이어 갈 확률을 높게 둬서
 * "아, 이 구간은 계단이구나" 하고 외워 치는 재미가 나게 한다.
 * 계단 방향은 그 구간의 음색 흐름(올라가면 →, 내려가면 ←)을 따른다.
 * 8분·16분이 섞여 있어도 한 구간으로 보고 노트마다 한 칸씩 진행 — 리듬이 조금 달라도
 * 손 모양은 그대로라 외워 치기 좋다.
 */
import type { Difficulty } from "./chart";

/** 한 칸: 레인 하나 또는 동시치기 두 레인 */
export type Step = number | [number, number];

export interface Pattern {
  name: string;
  steps: Step[];
  /** 동시치기 패턴 — 동시치기가 허용되는 난이도에서, 느린 간격에서만 */
  chord?: boolean;
  /** 올라가는/내려가는 짝 (음색 흐름에 맞춰 고름) */
  dir?: 1 | -1;
  /** 뽑힐 가중치 */
  w: number;
  /** 이 길이 이상 구간에서만 */
  minLen: number;
}

export const PATTERNS: Pattern[] = [
  { name: "stair", steps: [0, 1, 2, 3], dir: 1, w: 3, minLen: 4 },
  { name: "stair-", steps: [3, 2, 1, 0], dir: -1, w: 3, minLen: 4 },
  { name: "zigzag", steps: [0, 1, 2, 3, 2, 1], dir: 1, w: 2.5, minLen: 6 },
  { name: "zigzag-", steps: [3, 2, 1, 0, 1, 2], dir: -1, w: 2.5, minLen: 6 },
  { name: "stair3", steps: [0, 1, 2, 1], dir: 1, w: 1.5, minLen: 4 },
  { name: "stair3-", steps: [3, 2, 1, 2], dir: -1, w: 1.5, minLen: 4 },
  { name: "trill", steps: [0, 1, 3, 2], w: 2, minLen: 4 },
  { name: "trill-", steps: [3, 2, 0, 1], w: 2, minLen: 4 },
  { name: "split", steps: [0, 2, 1, 3], dir: 1, w: 1.2, minLen: 4 },
  { name: "split-", steps: [3, 1, 2, 0], dir: -1, w: 1.2, minLen: 4 },
  { name: "alt-L", steps: [0, 1], w: 1.2, minLen: 4 },
  { name: "alt-R", steps: [2, 3], w: 1.2, minLen: 4 },
  { name: "alt-switch", steps: [0, 1, 0, 1, 2, 3, 2, 3], w: 2, minLen: 8 },
  {
    name: "wide",
    steps: [
      [0, 1],
      [2, 3],
    ],
    chord: true,
    w: 2,
    minLen: 4,
  },
  {
    name: "cross",
    steps: [
      [0, 3],
      [1, 2],
    ],
    chord: true,
    w: 1.5,
    minLen: 4,
  },
];

export const lanesOf = (s: Step): number[] => (typeof s === "number" ? [s] : s);
const hand = (l: number) => (l < 2 ? 0 : 1);

/** 같은 레인이 다시 나오기까지 최소 몇 칸인지 (연타 간격 검사용) */
function reuseGap(p: Pattern) {
  let min = Infinity;
  const n = p.steps.length;
  for (let i = 0; i < n; i++)
    for (const l of lanesOf(p.steps[i]))
      for (let d = 1; d <= n; d++)
        if (lanesOf(p.steps[(i + d) % n]).includes(l)) {
          min = Math.min(min, d);
          break;
        }
  return min;
}

/** 스트림의 한 칸(같은 시각의 노트 묶음) */
export interface Slot {
  t: number;
  /** 음색 높이 (없으면 0) */
  cen: number;
  /** 이 시각에 노트가 몇 개인지 (1 또는 2) */
  count: number;
}

export interface PatternCtx {
  diff: Difficulty;
  beatSec: number;
  /** 같은 레인 연타 최소 간격(초) */
  jackGap: number;
  /** 동시치기 허용 여부 */
  chords: boolean;
  /** 마디 번호 */
  barOf: (t: number) => number;
  /** 마디 세기 0~1 */
  intensity: (bar: number) => number;
  /** 0~1 난수 (고정 시드) */
  rnd: () => number;
}

/** 간격 g가 어느 음표쯤인지: 1 = 4분, 2 = 8분, 4 = 16분 이상 */
function subdivision(g: number, beatSec: number): 1 | 2 | 4 {
  if (g >= beatSec * 0.75) return 1;
  if (g >= beatSec * 0.375) return 2;
  return 4;
}

/**
 * 스트림을 찾아 패턴 레인을 매긴다.
 * @returns slot index → 레인들 (count만큼). 패턴에 안 들어간 칸은 없음.
 */
export function assignPatterns(slots: Slot[], ctx: PatternCtx): Map<number, number[]> {
  const out = new Map<number, number[]>();
  // 쉬움·보통은 노트가 띄엄띄엄이라 2박까지를 "이어진다"고 봄 (D _ F _ J _ K 도 계단으로 읽힘)
  // 나이트메어도 2박: 거의 모든 노트를 패턴 안에 넣기 위해
  const maxGap =
    ctx.beatSec *
    (ctx.diff === "easy" || ctx.diff === "normal" || ctx.diff === "nightmare" ? 2.1 : 1.05);
  let i = 0;
  while (i < slots.length - 3) {
    let j = i;
    while (j + 1 < slots.length && slots[j + 1].t - slots[j].t <= maxGap) j++;
    if (j - i + 1 >= 4) layStream(slots, i, j, ctx, out);
    i = j + 1;
  }
  return out;
}

const prevOf = (out: Map<number, number[]>, k: number) => (k > 0 && out.get(k - 1)) || [];

function layStream(
  slots: Slot[],
  from: number,
  to: number,
  ctx: PatternCtx,
  out: Map<number, number[]>
) {
  // 마디 경계로 끊어 조각(chunk)으로 — 너무 짧은 꼬리는 앞 조각에 붙임
  const chunks: [number, number][] = [];
  let s = from;
  for (let k = from + 1; k <= to; k++)
    if (ctx.barOf(slots[k].t) !== ctx.barOf(slots[k - 1].t)) {
      chunks.push([s, k - 1]);
      s = k;
    }
  chunks.push([s, to]);
  for (let k = chunks.length - 1; k > 0; k--)
    if (chunks[k][1] - chunks[k][0] + 1 < 3) {
      chunks[k - 1][1] = chunks[k][1];
      chunks.splice(k, 1);
    }
  if (chunks[0][1] - chunks[0][0] + 1 < 3 && chunks.length > 1) {
    chunks[1][0] = chunks[0][0];
    chunks.splice(0, 1);
  }

  let cur: Pattern | null = null;
  let phase = 0;
  let kept = 0; // 같은 패턴을 몇 마디째 이어 가는지 (3마디 넘기면 바꿈)
  for (const [a, b] of chunks) {
    const len = b - a + 1;
    // 이 조각의 가장 촘촘한 간격 기준으로 쓸 수 있는 패턴 (같은 레인 연타 간격 지키기)
    let g = Infinity;
    for (let k = a; k < b; k++) g = Math.min(g, slots[k + 1].t - slots[k].t);
    const sub = subdivision(g, ctx.beatSec);
    // 동시치기 패턴은 느린 간격에서만: 어려움·매우 어려움은 8분까지, 보통은 4분만
    const chordOk =
      ctx.chords &&
      (ctx.diff === "normal"
        ? sub === 1
        : ctx.diff === "easy"
          ? false
          : ctx.diff === "nightmare"
            ? true
            : sub <= 2);
    const allowed = PATTERNS.filter(
      (p) => (!p.chord || chordOk) && reuseGap(p) * g >= ctx.jackGap - 1e-6
    );
    if (!allowed.length) {
      cur = null;
      continue;
    }
    // 음색 흐름: 올라가면 1, 내려가면 -1
    const slope = slots[b].cen - slots[a].cen;
    const dir: 1 | -1 | 0 = Math.abs(slope) < 0.06 ? 0 : slope > 0 ? 1 : -1;
    const I = ctx.intensity(ctx.barOf(slots[a].t));

    // 같은 패턴을 이어 갈까 (반복 = 외우는 재미)
    // 두 레인만 두드리는 연타는 한 마디 넘게 끌면 지루해서 금방 바꿈
    const keepP = cur?.name.startsWith("alt-") && cur.name !== "alt-switch" ? 0.3 : 0.62;
    const keep = cur && kept < 3 && allowed.includes(cur) && len >= cur.minLen && ctx.rnd() < keepP;
    kept = keep ? kept + 1 : 0;
    if (!keep) {
      const cands = allowed
        .filter((p) => len >= p.minLen && p !== cur)
        .map((p) => {
          let w = p.w;
          if (p.dir && dir && p.dir !== dir) w *= 0.25; // 흐름과 반대 방향은 드물게
          if (p.chord) w *= 0.4 + 1.2 * I; // 동시치기는 센 구간에서
          if (p.chord && sub === 4) w *= 0.35; // 16분 동시치기 연타는 드물게
          if (p.name.startsWith("alt") && sub === 4) w *= 1.4; // 16분은 연타가 제맛
          if (p.name.startsWith("stair") && len >= 8) w *= 1.3;
          return { p, w };
        });
      if (!cands.length) {
        cur = null;
        continue;
      }
      let r = ctx.rnd() * cands.reduce((acc, c) => acc + c.w, 0);
      cur = cands[cands.length - 1].p;
      for (const c of cands) {
        r -= c.w;
        if (r <= 0) {
          cur = c.p;
          break;
        }
      }
      // 시작 위치: 바로 앞 칸(이미 정해진 레인)과 같은 레인·같은 손으로 시작하지 않게
      const prevLanes = prevOf(out, a);
      const n = cur.steps.length;
      let bestOff = 0;
      let bestScore = -Infinity;
      for (let off = 0; off < n; off++) {
        const first = lanesOf(cur.steps[off]);
        let sc = 0;
        if (first.some((l) => prevLanes.includes(l))) sc -= 10;
        if (prevLanes.length && first.every((l) => prevLanes.every((pl) => hand(pl) !== hand(l))))
          sc += 2;
        if (off === 0) sc += 1; // 가능하면 패턴 처음부터
        if (sc > bestScore) {
          bestScore = sc;
          bestOff = off;
        }
      }
      phase = bestOff;
    }
    if (!cur) continue;
    const pat = cur;
    const stepAt = (ph: number) =>
      lanesOf(pat.steps[((ph % pat.steps.length) + pat.steps.length) % pat.steps.length]);
    for (let k = a; k <= b; k++, phase++) {
      const lanes = stepAt(phase);
      if (slots[k].count < 2 || lanes.length === 2) {
        out.set(k, lanes.slice(0, Math.max(1, slots[k].count)));
        continue;
      }
      // 이 칸은 원래 동시치기인데 패턴은 단노트: 짝은 반대편 레인 — 앞뒤 칸과 겹치지 않는 쪽으로
      const main = lanes[0];
      const near = new Set([...stepAt(phase + 1), ...(k > a ? stepAt(phase - 1) : prevOf(out, k))]);
      const partner = [3 - main, (main + 2) % 4, (main + 1) % 4, (main + 3) % 4].find(
        (l) => l !== main && !near.has(l)
      );
      out.set(k, partner === undefined ? [main] : [main, partner]);
    }
  }
}
