/**
 * 분석 결과(analyze.ts) → 난이도별 4키 채보.
 *  - 난이도마다 목표 밀도(초당 노트)에 맞춰 강한 타격부터 고름
 *  - 정박(4분) > 8분 > 16분 순으로 우선 (쉬울수록 정박 위주)
 *  - 레인은 음색 높이(높은 소리 → 오른쪽), 같은 레인 연타는 피함
 *  - 킥+심벌처럼 저음·고음이 같이 크게 터지는 정박은 동시치기
 *  - 다음 타격까지 소리가 길게 이어지면 롱노트
 *
 * 사람이 짠 채보처럼 보이게 하는 다듬기:
 *  - 곡의 세기(마디별 음량)를 따라 밀도를 올렸다 내림 — 코러스는 빽빽하게, 브레이크는 비우고,
 *    드롭 직전 2마디는 빌드업으로 조금 더 채움
 *  - 세기가 확 커지는 마디(드롭·코러스 진입)의 첫 노트는 동시치기
 *  - 빠른 연속 노트는 왼손(D F)·오른손(J K)을 번갈아 치게 배치
 *  - 같은 프레이즈가 반복되면(마디의 타격 배치가 같으면) 같은 노트 배치를 다시 씀 → 외워서 치는 재미
 *  - 타격이 고르게 이어지는 구간(스트림)은 계단·연타·트릴 같은 익숙한 패턴으로 깔아 줌 (patterns.ts)
 */
import type { Analysis, Onset } from "./analyze";
import { FPS, gridPos } from "./analyze";
import { finishChart, type Chart, type Difficulty, type Note } from "./chart";
import { assignPatterns, chordPartners, type PatternCtx } from "./patterns";
import { starRating } from "./stars";

interface AutoRule {
  /** 목표 초당 노트 수 (곡에 타격이 그만큼 없으면 그보다 적게) */
  nps: number;
  minGap: number;
  jackGap: number;
  /** 격자 위치별 가중치 [정박, 8분, 16분, 32분, 격자 밖] */
  pos: [number, number, number, number, number];
  /** 이 세기 미만 타격은 버림 */
  floor: number;
  /** 동시치기: 어느 위치에서, 얼마나 세야 */
  chord: { every: number; need: number } | null;
  /** 롱노트가 되려면 다음 노트까지 최소 비트 수 */
  holdBeats: number;
  /**
   * 박 위치별 평균 동시 노트 수 [정박, 반박(셋잇단은 1/3·2/3박), 그 밖].
   * 위치마다 센 타격부터 이 평균이 될 때까지 동시치기(2개, 넘치면 3개)로 만듦
   */
  thick: [number, number, number];
}

// 목표값은 osu!mania 4키 랭크 채보 103개(27곡)를 별점 구간별로 잰 중앙값
// (쉬움 ≈1★ · 보통 2★ · 어려움 3★ · 매우 어려움 4★ · 나이트메어 4.5★+, 레벨 = 별점 × 4)
//   초당 노트 3.1 / 5.1 / 8.5 / 11.3 / 13.1, 가장 짧은 간격 205 / 150 / 86 / 80 / 72ms
//   (어려움은 180 BPM 16분(83ms)이 들어가게 80ms),
//   동시치기 11 / 28 / 41 / 43 / 47%, 정박 동시 노트 수 1.1 / 1.35 / 1.7 / 1.9 / 2.0
const AUTO_RULES: Record<Difficulty, AutoRule> = {
  easy: {
    nps: 3,
    minGap: 0.2,
    jackGap: 0.5,
    pos: [1, 0.6, 0.1, 0, 0],
    floor: 0.15,
    chord: { every: 8, need: 0.55 },
    holdBeats: 2,
    thick: [1.12, 1.03, 1],
  },
  normal: {
    nps: 5,
    minGap: 0.15,
    jackGap: 0.3,
    pos: [1, 0.85, 0.35, 0, 0],
    floor: 0.1,
    chord: { every: 4, need: 0.45 },
    holdBeats: 1.5,
    thick: [1.35, 1.09, 1],
  },
  hard: {
    nps: 8.5,
    minGap: 0.08,
    jackGap: 0.17,
    pos: [1, 0.95, 0.75, 0.3, 0],
    floor: 0.07,
    chord: { every: 2, need: 0.45 },
    holdBeats: 1.5,
    thick: [1.72, 1.19, 1.05],
  },
  expert: {
    nps: 11.3,
    minGap: 0.075,
    jackGap: 0.12,
    pos: [1, 1, 0.9, 0.75, 0.45],
    floor: 0.05,
    chord: { every: 2, need: 0.4 },
    holdBeats: 1.25,
    thick: [1.91, 1.31, 1.1],
  },
  // 나이트메어: 매우 어려움보다 촘촘하게 고른 뒤, 센 마디는 16분으로 꽉 채우고 패턴으로만 레인을 깖 (아래 nightmareNotes)
  nightmare: {
    nps: 13,
    minGap: 0.072,
    jackGap: 0.1,
    pos: [1, 1, 0.95, 0.85, 0.5],
    floor: 0.04,
    chord: { every: 2, need: 0.35 },
    holdBeats: 1.25,
    thick: [2.03, 1.43, 1.15],
  },
};

/** 나이트메어 채우기 설정 (곡별 손보기 가능) */
export interface NightmareTweak {
  /** 이 세기(0~1) 이상인 마디는 8분으로 채움 */
  loud?: number;
  /** 이 세기 이상인 마디는 16분으로 꽉 채우고 박마다 동시치기 */
  full?: number;
  /** 센 마디 박 등분 (2 = 8분, 3 = 셋잇단) */
  loudSub?: number;
  /** 아주 센 마디 박 등분 (4 = 16분, 6 = 16분 셋잇단) */
  fullSub?: number;
  /** 박당 동시치기 수: 센 마디 / 아주 센 마디 */
  chordLoud?: number;
  chordFull?: number;
  /** 몇 마디마다 마지막 박을 연타로 (아주 센 마디) */
  burstEvery?: number;
  /** 연타 등분 (8 = 32분) */
  burstSub?: number;
}
const NIGHTMARE_DEFAULT: Required<NightmareTweak> = {
  loud: 0.45,
  full: 0.72,
  loudSub: 2,
  fullSub: 4,
  chordLoud: 1,
  chordFull: 2,
  burstEvery: 4,
  burstSub: 8,
};

function nearestCen(an: Analysis, t: number) {
  let best = 0;
  let bd = Infinity;
  for (const o of an.onsets) {
    const d = Math.abs(o.t - t);
    if (d < bd) {
      bd = d;
      best = o.cen;
    }
  }
  return best;
}

const posKind = (o: Onset, div: number) => (o.grid < 0 ? 4 : gridPos(o.grid, div));

/** 정렬된 시각 배열에서 t 근처(±gap)에 이미 있는지 */
function tooClose(sorted: number[], t: number, gap: number) {
  let a = 0;
  let b = sorted.length;
  while (a < b) {
    const m = (a + b) >> 1;
    if (sorted[m] < t) a = m + 1;
    else b = m;
  }
  return (
    (a < sorted.length && sorted[a] - t < gap - 1e-6) || (a > 0 && t - sorted[a - 1] < gap - 1e-6)
  );
}

/** 곡별 손보기: 기본 규칙 위에 덮어씀 (내장곡 채보를 뽑을 때 난이도 목표에 맞추려고) */
export interface AutoTweak {
  /** 목표 밀도 배율 (1.3이면 30% 더 빽빽하게) */
  density?: number;
  /** 동시치기 간격(16분음표 단위)·필요 세기 */
  chordEvery?: number;
  chordNeed?: number;
  /** 세분 칸(32분·셋잇단) 가중치 */
  finePos?: number;
  /** 나이트메어 채우기 */
  nightmare?: NightmareTweak;
  /**
   * 격자 채우기 0~1 (어려움·매우 어려움·나이트메어): 곡에서 찾은 타격만으로 목표 밀도가 안 나올 때
   * 센 마디에 8분(어려움)·16분(매우 어려움) 자리를 더함. 클수록 덜 센 마디까지 채움
   */
  fill?: number;
  /** 다른 난이도의 규칙을 빌려 씀 (보스곡의 쉬움을 어려움 규칙 절반 밀도로 뽑는 식) */
  rule?: Difficulty;
  /** 진단용: 패턴을 고를 때마다 (이름, 마디, 길이) */
  onPick?: PatternCtx["onPick"];
}

/**
 * @param shiftMs 곡별 보정(ms, +면 노트가 늦게) — 지금은 안 씀(0)
 */
export function makeAutoChart(
  an: Analysis,
  diff: Difficulty,
  shiftMs = 0,
  tweak: AutoTweak = {}
): Chart {
  const base = AUTO_RULES[tweak.rule ?? diff];
  const R: AutoRule = {
    ...base,
    nps: base.nps * (tweak.density ?? 1),
    pos: [...base.pos] as AutoRule["pos"],
    chord:
      base.chord && (tweak.chordEvery || tweak.chordNeed)
        ? {
            every: tweak.chordEvery ?? base.chord.every,
            need: tweak.chordNeed ?? base.chord.need,
          }
        : base.chord,
  };
  if (tweak.finePos !== undefined) R.pos[3] = tweak.finePos;
  const beatSec = 60 / an.bpm;
  // 격자 한 칸이 70ms보다 좁은 빠른 곡: 홀수 칸(4/4는 32분, 12/8은 셋잇단 16분 사이)·격자 밖 타격은 안 씀.
  // 바로 옆 칸에 붙어 '살짝 어긋난 동시치기'가 되거나, 일정하던 간격이 갑자기 1.5배가 되는 엇박이 됨
  // (12/8의 셋잇단 8분·16분은 짝수 칸이라 그대로)
  const tightGrid = beatSec / an.div < 0.07;
  if (tightGrid) R.pos[4] = 0;
  // 노트 사이 최소 72ms — 그보다 붙으면 손으로는 동시치기처럼 느껴져서 '살짝 어긋난 동시치기'가 됨
  R.minGap = Math.max(R.minGap, 0.072);
  const cands = an.onsets
    // 격자 밖 타격(셋잇단·싱커페이션 등)은 아주 셀 때만
    .filter(
      (o) =>
        o.s >= R.floor &&
        R.pos[posKind(o, an.div)] > 0 &&
        (o.grid >= 0 || o.s >= 0.5) &&
        !(tightGrid && o.grid % 2 !== 0)
    )
    .map((o) => ({
      o,
      w: o.s * R.pos[posKind(o, an.div)] * (0.8 + 0.2 * Math.max(o.low, o.mid)),
    }))
    .sort((a, b) => b.w - a.w);

  // ── 마디·세기 ──
  const barSec = beatSec * 4;
  // 마디 첫 박: 4박 중 저음(킥)이 가장 센 자리를 첫 박으로
  const beats = an.beats;
  const lowAtBeat = (t: number) => {
    let v = 0;
    for (const o of an.onsets) if (Math.abs(o.t - t) < 0.03) v = Math.max(v, o.low * o.s);
    return v;
  };
  let phase = 0;
  let best = -1;
  for (let k = 0; k < 4; k++) {
    let sum = 0;
    for (let i = k; i < beats.length; i += 4) sum += lowAtBeat(beats[i]);
    if (sum > best) {
      best = sum;
      phase = k;
    }
  }
  const bar0 = (beats[phase] ?? 0) - Math.ceil((beats[phase] ?? 0) / barSec) * barSec;
  const barOf = (t: number) => Math.floor((t - bar0) / barSec);
  const nBars = barOf(an.duration) + 1;
  const rmsAt = (t: number) =>
    an.rms[Math.max(0, Math.min(an.rms.length - 1, Math.round(t * FPS)))];
  // 마디별 세기 = 음량 + 타격 세기 합 + 고역(심벌·분위기) 세기.
  // 요즘 음원은 음량이 평평하게 눌려 있어서 음량만으로는 코러스·벌스 차이가 안 나고,
  // 심벌이 많이 깔리는 구간(코러스·드롭)은 고역 타격이 확 늘어남 → 셋을 섞어서 0~1
  const rmsBar = new Float32Array(nBars);
  const hitBar = new Float32Array(nBars);
  const highBar = new Float32Array(nBars);
  for (let b = 0; b < nBars; b++) {
    let sum = 0;
    let n = 0;
    for (let t = bar0 + b * barSec; t < bar0 + (b + 1) * barSec; t += 0.05) {
      if (t < 0 || t > an.duration) continue;
      sum += rmsAt(t);
      n++;
    }
    rmsBar[b] = n ? sum / n : 0;
  }
  for (const o of an.onsets) {
    const b = barOf(o.t);
    if (b < 0 || b >= nBars) continue;
    hitBar[b] += o.s;
    highBar[b] += o.high * o.s;
  }
  const p95 = (arr: Float32Array) => [...arr].sort((x, y) => x - y)[Math.floor(nBars * 0.95)] || 1;
  const norm = (arr: Float32Array) => {
    const q = p95(arr);
    return (i: number) => Math.min(1, (arr[Math.max(0, Math.min(nBars - 1, i))] ?? 0) / q);
  };
  const nr = norm(rmsBar);
  const nh = norm(hitBar);
  const ng = norm(highBar);
  const intensity = new Float32Array(nBars);
  for (let b = 0; b < nBars; b++) {
    const v = (i: number) => 0.4 * nr(i) + 0.3 * nh(i) + 0.3 * ng(i);
    const mixed = 0.25 * v(b - 1) + 0.5 * v(b) + 0.25 * v(b + 1);
    // 대비를 키움: 0.35 이하는 0, 0.95 이상은 1 (벌스 ≈ 0.3, 코러스 ≈ 1)
    intensity[b] = Math.max(0, Math.min(1, (mixed - 0.35) / 0.6));
  }
  const jump = (b: number) => (b > 0 ? intensity[b] - intensity[b - 1] : 0);
  const sectionStart = (b: number) => jump(b) >= 0.18 && intensity[b] >= 0.55;
  const buildBar = (b: number) => sectionStart(b + 1) || sectionStart(b + 2);
  const dense = diff === "hard" || diff === "expert";
  const factorOf = (b: number) => {
    const I = intensity[Math.max(0, Math.min(nBars - 1, b))];
    let f = dense ? 0.45 + 0.8 * I : 0.65 + 0.5 * I;
    if (I < 0.15) f *= 0.75; // 브레이크
    if (buildBar(b)) f *= 1.25; // 빌드업
    return f;
  };

  // 1) 강한 것부터 간격을 지키며 고르기 — 마디마다 목표 개수를 따로 둬서
  //    세기에 따라 밀도가 오르내리고, 조용하지만 빽빽한 구간도 큰 소리 구간에 밀리지 않게
  const perBar = new Map<number, number>();
  const taken: number[] = [];
  const picked: Onset[] = [];
  for (const { o } of cands) {
    const b = barOf(o.t);
    const target = Math.max(1, Math.round(R.nps * barSec * factorOf(b)));
    if ((perBar.get(b) ?? 0) >= target) continue;
    if (tooClose(taken, o.t, R.minGap)) continue;
    let i = taken.findIndex((t) => t > o.t);
    if (i < 0) i = taken.length;
    taken.splice(i, 0, o.t);
    picked.push(o);
    perBar.set(b, (perBar.get(b) ?? 0) + 1);
  }
  picked.sort((a, b) => a.t - b.t);

  // 1.5) 격자 채우기 — 어려움은 센 마디를 8분으로, 매우 어려움은 아주 센 마디를 16분으로 (fill이 클수록 더 넓게)
  if ((diff === "normal" || diff === "hard" || diff === "expert") && (tweak.fill ?? 0) > 0) {
    // fill 1을 넘으면(1~1.6) 어지간한 마디까지 다 채움
    const fill = Math.min(1.6, tweak.fill ?? 0);
    const loudT = Math.max(0.05, 0.8 - 0.5 * fill);
    // 보통은 8분까지만, 어려움은 8분, 매우 어려움은 아주 센 마디만 16분
    const fullT = diff === "expert" ? Math.max(0.2, 0.95 - 0.45 * fill) : 2;
    const have = picked.map((o) => o.t);
    const beatT = (k: number) =>
      k < an.beats.length
        ? an.beats[k]
        : an.beats[an.beats.length - 1] + (k - an.beats.length + 1) * beatSec;
    const lastPick = picked.length ? picked[picked.length - 1].t : 0;
    const added: Onset[] = [];
    for (let k = 0; k < Math.ceil(an.duration / beatSec); k++) {
      const t0 = beatT(k);
      if (t0 > lastPick) break;
      const I = intensity[Math.max(0, Math.min(nBars - 1, barOf(t0)))];
      if (I < loudT) continue;
      // 12/8(셋잇단 격자)은 점4분을 3·6으로 나눠야 곡 박자에 맞음
      // 잘게 나눈 칸이 너무 촘촘하면(90ms 미만) 한 단계 덜 나눔
      const fine = an.div === 12 ? 6 : 4;
      const sub = I >= fullT && beatSec / fine >= 0.08 ? fine : fine / 2;
      const t1 = beatT(k + 1);
      for (let i = 0; i < sub; i++) {
        const t = t0 + (i * (t1 - t0)) / sub;
        if (tooClose(have, t, R.minGap)) continue;
        let j = have.findIndex((x) => x > t);
        if (j < 0) j = have.length;
        have.splice(j, 0, t);
        added.push({ t, s: 0.3, low: 0.3, mid: 0.3, high: 0.3, cen: nearestCen(an, t), grid: -1 });
      }
    }
    picked.push(...added);
    picked.sort((a, b) => a.t - b.t);
  }

  // 2) 레인: 주변 4초 안에서 음색 높이 순위 → 0~3
  //    + 계단: 가까운(8분 이내) 타격 3개 이상이 음색 높이가 한 방향으로 흐르면 레인도 한 칸씩
  const stairs = new Map<number, 1 | -1>();
  for (let i = 0; i < picked.length;) {
    let j = i;
    const dir = Math.sign(picked[i + 1]?.cen - picked[i].cen) as 1 | -1 | 0;
    while (
      j + 1 < picked.length &&
      picked[j + 1].t - picked[j].t <= beatSec / 2 + 0.01 &&
      Math.sign(picked[j + 1].cen - picked[j].cen) === dir &&
      Math.abs(picked[j + 1].cen - picked[j].cen) > 0.08
    )
      j++;
    if (dir !== 0 && j - i + 1 >= 3) for (let k = i; k <= j; k++) stairs.set(k, dir);
    i = j - i + 1 >= 3 ? j + 1 : i + 1;
  }
  // 2.5) 스트림 패턴 (계단·연타·트릴…) — 고정 시드라 같은 곡은 늘 같은 채보
  let seed = (Math.round(an.bpm * 100) + diff.length * 7919) >>> 0;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const patCtx: PatternCtx = {
    diff,
    beatSec,
    jackGap: R.jackGap,
    chords: R.chord !== null,
    barOf,
    intensity: (b) => intensity[Math.max(0, Math.min(nBars - 1, b))],
    rnd,
    onPick: tweak.onPick,
  };
  const patterned = assignPatterns(
    picked.map((o) => ({ t: o.t, cen: o.cen, count: 1 })),
    patCtx
  );

  if (diff === "nightmare") {
    const shift = shiftMs / 1000;
    const nm = nightmareNotes(
      an,
      picked,
      {
        ...NIGHTMARE_DEFAULT,
        ...tweak.nightmare,
        // 채우기가 클수록 덜 센 마디까지
        loud: (tweak.nightmare?.loud ?? NIGHTMARE_DEFAULT.loud) - 0.3 * (tweak.fill ?? 0),
        full: (tweak.nightmare?.full ?? NIGHTMARE_DEFAULT.full) - 0.3 * (tweak.fill ?? 0),
      },
      {
        beatSec,
        barOf,
        intensity: (b) => intensity[Math.max(0, Math.min(nBars - 1, b))],
        patCtx,
        thick: R.thick,
      }
    );
    const nmHeld = addHoldsInStream(nm, {
      beatSec,
      barOf,
      every: 4,
      maxBeats: 2,
      rmsAt,
      beats: an.beats,
    });
    for (const n of nmHeld) {
      n.t += shift;
      if (n.end) n.end += shift;
    }
    return finishChart(
      nmHeld.filter((n) => n.t > 0.3),
      diff
    );
  }

  // 3) 동시치기 개수 — 박 위치별로 센 타격(센 마디일수록 우선)부터 목표 평균(R.thick)이 될 때까지
  //    (osu 랭크 채보: 동시치기는 정박에 몰리고, 반박·16분으로 갈수록 얇음)
  const extra = new Map<number, number>();
  {
    const beatsArr = an.beats;
    const kindAt = (t: number) => {
      let a = 0;
      let b = beatsArr.length - 1;
      while (b - a > 1) {
        const m = (a + b) >> 1;
        if (beatsArr[m] <= t) a = m;
        else b = m;
      }
      const base = t >= beatsArr[b] ? beatsArr[b] : beatsArr[a];
      const f = (t - base) / beatSec;
      const near = (x: number) => Math.abs(f - x) < 0.04;
      if (near(0) || near(1)) return 0;
      if (near(0.5) || (an.div === 12 && (near(1 / 3) || near(2 / 3)))) return 1;
      return 2;
    };
    const groups: number[][] = [[], [], []];
    picked.forEach((o, i) => groups[kindAt(o.t)].push(i));
    const score = (i: number) => picked[i].s * (0.5 + intensity[Math.max(0, Math.min(nBars - 1, barOf(picked[i].t)))]);
    groups.forEach((g, k) => {
      const m = R.thick[k];
      const two = Math.round(g.length * Math.min(1, m - 1));
      const three = Math.round(g.length * Math.max(0, m - 2));
      g.sort((x, y) => score(y) - score(x)).forEach((i, r) => {
        if (r < two) extra.set(i, r < three ? 2 : 1);
      });
    });
  }

  const notes: Note[] = [];
  const laneLast = [-Infinity, -Infinity, -Infinity, -Infinity];
  /** 최근 동시치기 모양 (chordPartners) */
  const chordHist: string[] = [];
  let prevLane = -1;
  let sameRun = 0;
  for (let i = 0, lo = 0, hi = 0; i < picked.length; i++) {
    const o = picked[i];
    while (picked[lo].t < o.t - 2) lo++;
    while (hi < picked.length && picked[hi].t <= o.t + 2) hi++;
    let below = 0;
    let total = 0;
    for (let k = lo; k < hi; k++) {
      if (k === i) continue;
      total++;
      if (picked[k].cen < o.cen) below++;
      else if (picked[k].cen === o.cen && k < i) below++;
    }
    let want = total ? Math.min(3, Math.floor((below / total) * 4)) : 1;
    const patLanes = patterned.get(i) ?? null;
    if (patLanes) want = patLanes[0];
    const dir = patLanes ? undefined : stairs.get(i);
    if (dir && prevLane >= 0) {
      want = prevLane + dir;
      if (want < 0 || want > 3) want = prevLane - dir;
      want = Math.max(0, Math.min(3, want));
    }
    // 빠른 연속(16분 이내)이 한 손에 3번 몰리면 다른 손으로 — 계단은 예외
    const hand = (l: number) => (l < 2 ? 0 : 1);
    const prev = notes[notes.length - 1];
    // 동시치기 짝(같은 시각)은 건너뛰고 그 앞 노트
    let prev2: Note | undefined;
    for (let k = notes.length - 2; k >= 0; k--)
      if (notes[k].t !== prev?.t) {
        prev2 = notes[k];
        break;
      }
    if (
      !dir &&
      !patLanes &&
      prev &&
      prev2 &&
      o.t - prev.t <= beatSec / 4 + 0.01 &&
      prev.t - prev2.t <= beatSec / 4 + 0.01 &&
      hand(prev.lane) === hand(prev2.lane) &&
      hand(want) === hand(prev.lane)
    )
      want = hand(want) === 0 ? (want === 0 ? 2 : 3) : want === 2 ? 0 : 1;
    // 같은 레인 연타·같은 레인 3연속은 옆 레인으로
    const blocked = (l: number) =>
      o.t - laneLast[l] < R.jackGap || (l === prevLane && sameRun >= 2);
    if (blocked(want)) {
      const order = [1, -1, 2, -2, 3, -3]
        .map((d) => want + d)
        .filter((l) => l >= 0 && l <= 3 && !blocked(l));
      if (order.length) want = order[0];
    }
    sameRun = want === prevLane ? sameRun + 1 : 0;
    prevLane = want;
    laneLast[want] = o.t;
    notes.push({ t: o.t, lane: want });

    // 패턴이 준 동시치기 짝
    if (patLanes && patLanes.length === 2) {
      const l2 = patLanes[1] === want ? patLanes[0] : patLanes[1];
      if (l2 !== want && o.t - laneLast[l2] >= R.jackGap) {
        notes.push({ t: o.t, lane: l2 });
        laneLast[l2] = o.t;
        continue;
      }
    }

    // 동시치기 붙이기 — 3)에서 정한 개수 + 구간 진입(드롭·코러스) 첫 노트는 최소 1개
    const entry =
      R.chord !== null &&
      sectionStart(barOf(o.t)) &&
      (i === 0 || barOf(picked[i - 1].t) !== barOf(o.t));
    const more = Math.max(extra.get(i) ?? 0, entry ? 1 : 0);
    if (more > 0) {
      // 짝 레인: 거울(D+K·F+J)만 반복되지 않게 — 바로 앞 줄 레인·최근 동시치기 모양은 피함
      const prevRow = new Set<number>();
      for (let k = notes.length - 2; k >= 0 && notes[k].t !== o.t; k--) {
        if (prevRow.size && notes[k].t !== notes[k + 1].t) break;
        prevRow.add(notes[k].lane);
      }
      const ls = chordPartners(want, more, {
        avoid: prevRow,
        ok: (l) => o.t - laneLast[l] >= R.jackGap && !notes.some((m) => m.t === o.t && m.lane === l),
        recent: chordHist,
        rnd,
      });
      for (const l2 of ls) {
        notes.push({ t: o.t, lane: l2 });
        laneLast[l2] = o.t;
      }
    }
  }

  // 3.5) 프레이즈 반복: 마디 안 노트 배치(상대 시각)가 같은 마디는 먼저 나온 마디의 레인을 다시 씀
  //      — 음악이 반복되면 손 모양도 반복(외워 치는 재미). 다만 그대로가 아니라 홀수 번째 반복은
  //      좌우 반전으로, "같은 듯 다른" 변주가 되게 (사람 매퍼의 반복-변주 원칙)
  {
    const byBar = new Map<number, Note[]>();
    for (const n of notes) {
      const b = barOf(n.t);
      if (!byBar.has(b)) byBar.set(b, []);
      byBar.get(b)!.push(n);
    }
    const seen = new Map<string, { lanes: number[]; n: number }>();
    for (const [b, list] of [...byBar.entries()].sort((x, y) => x[0] - y[0])) {
      list.sort((x, y) => x.t - y.t || x.lane - y.lane);
      const key = list
        .map((n) => Math.round(((n.t - bar0 - b * barSec) / beatSec) * an.div))
        .join(",");
      // 8분·16분으로 꽉 찬 마디는 리듬만으로는 다 똑같아 보여서(코러스 8마디가 전부 같은 키) 복사하면
      // 같은 손 모양이 끝없이 반복됨 → 이런 마디는 복사하지 않고 패턴 다양성에 맡김.
      // "프레이즈가 반복된다"고 볼 수 있는 건 리듬에 생김새가 있는(간격이 고르지 않은) 마디뿐
      const ts = [...new Set(list.map((n) => n.t))];
      const ivs = new Set(ts.slice(1).map((t, k) => Math.round((t - ts[k]) * 50)));
      const uniform = ts.length >= 6 && ivs.size <= 1;
      const hit = seen.get(key);
      if (!uniform && hit && hit.lanes.length === list.length && list.length >= 3 && hit.n < 3) {
        hit.n++;
        const lanes = hit.n % 2 === 1 ? hit.lanes.map((l) => 3 - l) : hit.lanes;
        // 복사했을 때 같은 시각에 같은 레인이 겹치면(동시치기) 복사 안 함
        const clash = list.some((n, k) =>
          list.some((m, k2) => k2 !== k && m.t === n.t && lanes[k2] === lanes[k])
        );
        if (!clash) list.forEach((n, k) => (n.lane = lanes[k]));
      } else if (!uniform && list.length >= 3 && (!hit || hit.n >= 3))
        // 처음 보는 리듬(또는 세 번 복사한 뒤)은 이 마디를 새 원본으로
        seen.set(key, { lanes: list.map((n) => n.lane), n: 0 });
    }
  }

  // 4) 롱노트: 다음 타격까지 충분히 멀고, 그동안 소리가 거의 안 줄면
  const times = [...new Set(notes.map((n) => n.t))].sort((a, b) => a - b);
  for (const n of notes) {
    const idx = times.indexOf(n.t);
    const next = times[idx + 1];
    if (next === undefined || notes.some((m) => m !== n && m.t === n.t)) continue;
    if (next - n.t < Math.max(0.6, R.holdBeats * beatSec)) continue;
    let head = 0;
    for (let t = n.t; t < n.t + 0.1; t += 1 / FPS) head = Math.max(head, rmsAt(t));
    let sum = 0;
    let cnt = 0;
    for (let t = n.t + 0.15; t < next - 0.12; t += 1 / FPS) {
      sum += rmsAt(t);
      cnt++;
    }
    if (!cnt || sum / cnt < head * 0.62) continue;
    const end = next - Math.max(beatSec * 0.25, 0.12);
    if (end - n.t >= 0.4) n.end = end;
  }

  const holdEvery = diff === "hard" ? 2 : diff === "expert" ? 2 : 0;
  if (holdEvery) {
    const held = addHoldsInStream(notes, {
      beatSec,
      barOf,
      every: holdEvery,
      maxBeats: 2,
      rmsAt,
      beats: an.beats,
    });
    notes.length = 0;
    notes.push(...held);
  }

  const shift = shiftMs / 1000;
  if (shift)
    for (const n of notes) {
      n.t += shift;
      if (n.end) n.end += shift;
    }
  return finishChart(
    notes.filter((n) => n.t > 0.3),
    diff
  );
}

/**
 * 누르면서 치는 롱노트 (어려움 이상): 빽빽한 곡은 노트 사이가 비지 않아 4)의 롱노트가 거의 안 생김 →
 * 몇 마디마다 한 번, 박 위의 단노트를 1~2박 누르게 하고 그동안 다른 레인 노트는 그대로 침.
 * 누르는 동안엔 손이 하나 묶이니 그 사이 동시치기는 한 개만 남김. 소리가 그동안 확 줄면 안 만듦.
 */
function addHoldsInStream(
  notes: Note[],
  o: {
    beatSec: number;
    barOf: (t: number) => number;
    every: number;
    maxBeats: number;
    rmsAt: (t: number) => number;
    beats: number[];
  }
) {
  const { beatSec, barOf, every, maxBeats, rmsAt, beats } = o;
  const onBeat = (t: number) => {
    let a = 0;
    let b = beats.length - 1;
    while (b - a > 1) {
      const m = (a + b) >> 1;
      if (beats[m] <= t) a = m;
      else b = m;
    }
    return Math.min(Math.abs(beats[a] - t), Math.abs(beats[b] - t)) < 0.03;
  };
  notes.sort((a, b) => a.t - b.t || a.lane - b.lane);
  const at = new Map<number, Note[]>();
  for (const n of notes) {
    const k = Math.round(n.t * 1000);
    at.set(k, [...(at.get(k) ?? []), n]);
  }
  let lastBar = -Infinity;
  let holdUntil = -Infinity;
  const drop = new Set<Note>();
  for (const n of notes) {
    if (n.end || drop.has(n) || n.t < holdUntil) continue;
    const bar = barOf(n.t);
    if (bar - lastBar < every) continue;
    if ((at.get(Math.round(n.t * 1000)) ?? []).length > 1) continue; // 동시치기 머리는 안 씀
    // 박 위의 노트만
    if (!onBeat(n.t)) continue;
    const nextSame = notes.find((m) => m !== n && m.lane === n.lane && m.t > n.t + 1e-3);
    const room = (nextSame ? nextSame.t : n.t + maxBeats * beatSec + 1) - n.t;
    // 빠른 곡은 1박이 너무 짧아서(180 BPM이면 0.33초) 최소 0.6초, 최대 2박 또는 1초 중 긴 쪽
    const cap = Math.max(maxBeats, Math.round(1 / beatSec));
    const len = Math.min(cap, Math.floor((room - beatSec * 0.5) / beatSec)) * beatSec;
    if (len < Math.max(beatSec, 0.6) - 1e-3) continue;
    let head = 0;
    for (let t = n.t; t < n.t + 0.1; t += 1 / FPS) head = Math.max(head, rmsAt(t));
    let sum = 0;
    let cnt = 0;
    for (let t = n.t + 0.1; t < n.t + len; t += 1 / FPS) ((sum += rmsAt(t)), cnt++);
    if (!cnt || sum / cnt < head * 0.62) continue;
    n.end = n.t + len;
    lastBar = bar;
    holdUntil = n.end;
    // 누르는 동안의 동시치기는 한 개만
    for (const [k, list] of at) {
      if (k / 1000 <= n.t || k / 1000 > n.end + 1e-3 || list.length < 2) continue;
      list.slice(1).forEach((m) => drop.add(m));
    }
  }
  return notes.filter((m) => !drop.has(m));
}

/**
 * 나이트메어: 고른 타격 위에 센 마디를 8분·16분으로 꽉 채우고(박마다 동시치기, 프레이즈 끝 32분 연타),
 * 레인은 음색이 아니라 전부 패턴(계단·연타·트릴…)으로 깖. 쉼이 2박 넘게 없으면 한 스트림으로 봐서
 * 거의 모든 노트가 알아볼 수 있는 패턴 안에 들어감.
 */
function nightmareNotes(
  an: Analysis,
  picked: Onset[],
  P: Required<NightmareTweak>,
  ctx: {
    beatSec: number;
    barOf: (t: number) => number;
    intensity: (bar: number) => number;
    patCtx: PatternCtx;
    thick: [number, number, number];
  }
): Note[] {
  const { beatSec, barOf, intensity } = ctx;
  const beats = an.beats;
  const beatT = (k: number) =>
    k < beats.length ? beats[k] : beats[beats.length - 1] + (k - beats.length + 1) * beatSec;
  // 슬롯: 시각 → 노트 수 (1 또는 2)
  const slots = new Map<number, number>();
  const key = (t: number) => Math.round(t * 200) / 200; // 5ms 격자
  const near = (k: number, range: number) => {
    let best: number | null = null;
    for (const s of slots.keys())
      if (Math.abs(s - k) <= range && (best === null || Math.abs(s - k) < Math.abs(best - k)))
        best = s;
    return best;
  };
  /** burst: 32분 연타처럼 일부러 촘촘한 노트 (합치지 않음) */
  const put = (t: number, count = 1, burst = false) => {
    if (t <= 0 || t > an.duration - 0.2) return;
    const k = key(t);
    // 아주 가까운 슬롯(20ms)은 같은 노트, 72ms 안은 '살짝 어긋난 동시치기'가 되니 딱 붙은 동시치기로 합침
    const same = near(k, 0.02);
    if (same !== null) {
      slots.set(same, Math.max(slots.get(same)!, count));
      return;
    }
    const flam = burst ? null : near(k, 0.072);
    if (flam !== null) {
      slots.set(flam, 2);
      return;
    }
    slots.set(k, count);
  };
  for (const o of picked) put(o.t, 1);
  const lastPick = picked.length ? picked[picked.length - 1].t : 0;
  const nBeats = Math.ceil(an.duration / beatSec);
  for (let k = 0; k < nBeats; k++) {
    const t0 = beatT(k);
    if (t0 > lastPick) break;
    const b = barOf(t0);
    const I = intensity(b);
    if (I < P.loud) continue;
    const full = I >= P.full;
    const t1 = beatT(k + 1);
    const sub = full ? P.fullSub : P.loudSub;
    const chords = full ? P.chordFull : P.chordLoud;
    for (let c = 0; c < chords; c++) put(t0 + (c * (t1 - t0)) / chords, 2);
    for (let i = 0; i < sub; i++) put(t0 + (i * (t1 - t0)) / sub, 1);
    const beatInBar = Math.round((t0 - (beats[0] ?? 0)) / beatSec) % 4;
    if (full && beatInBar === 3 && b % P.burstEvery === P.burstEvery - 1)
      for (let i = 0; i < P.burstSub; i++) put(t0 + (i * (t1 - t0)) / P.burstSub, 1, true);
  }
  // 박 위치별 두께를 목표 평균(thick)까지 — 센 마디부터 2개, 넘치면 3개
  {
    const kindAt = (t: number) => {
      const k = Math.round((t - (beats[0] ?? 0)) / beatSec);
      const f = (t - beatT(Math.max(0, Math.min(k, nBeats)))) / beatSec;
      const near = (x: number) => Math.abs(f - x) < 0.04;
      if (near(0)) return 0;
      if (near(0.5) || near(-0.5) || (an.div === 12 && (near(1 / 3) || near(-1 / 3)))) return 1;
      return 2;
    };
    const groups: number[][] = [[], [], []];
    const ks = [...slots.keys()];
    ks.forEach((t) => groups[kindAt(t)].push(t));
    groups.forEach((g, k) => {
      let need = Math.round(g.length * ctx.thick[k] - g.reduce((a, t) => a + slots.get(t)!, 0));
      const order = [...g].sort((x, y) => intensity(barOf(y)) - intensity(barOf(x)) || x - y);
      for (let round = 0; round < 2 && need > 0; round++)
        for (const t of order) {
          if (need <= 0) break;
          const c = slots.get(t)!;
          if (c >= 2 + round) continue;
          slots.set(t, c + 1);
          need--;
        }
    });
  }
  const times = [...slots.keys()].sort((a, b) => a - b);
  // 패턴용 음색: 가장 가까운 타격의 음색
  const cen = times.map((t) => nearestCen(an, t));
  // 나이트메어는 2박 쉼까지 한 스트림으로 (거의 전부 패턴 안에)
  const assigned = assignPatterns(
    times.map((t, i) => ({ t, cen: cen[i], count: slots.get(t)! })),
    { ...ctx.patCtx, diff: "nightmare", chords: true }
  );
  const notes: Note[] = [];
  const laneLast = [-Infinity, -Infinity, -Infinity, -Infinity];
  let prev: number[] = [];
  for (let i = 0; i < times.length; i++) {
    const t = times[i];
    const count = slots.get(t)!;
    let lanes = assigned.get(i) ?? [];
    // 패턴 밖(드문 경우): 앞 노트와 다른 손, 연타 간격 지키며
    if (lanes.length < count) {
      const free = [0, 1, 2, 3].filter(
        (l) => !lanes.includes(l) && t - laneLast[l] >= ctx.patCtx.jackGap
      );
      free.sort((a, b2) => {
        const ha = prev.some((p) => p < 2 === a < 2) ? 1 : 0;
        const hb = prev.some((p) => p < 2 === b2 < 2) ? 1 : 0;
        return ha - hb;
      });
      lanes = [...lanes, ...free].slice(0, count);
    }
    lanes = lanes.filter((l) => t - laneLast[l] >= ctx.patCtx.jackGap - 1e-6);
    if (!lanes.length) continue;
    for (const l of lanes) {
      notes.push({ t, lane: l });
      laneLast[l] = t;
    }
    prev = lanes;
  }
  return notes;
}

/**
 * 난이도별 목표 레벨 (레벨 = osu!mania 별점 × 4). 나이트메어는 17 이상 —
 * 그 위 등급이 생기면 여기에 더하면 됨
 */
export const TARGET_LEVEL: Record<Difficulty, number> = {
  easy: 4,
  normal: 8,
  hard: 12,
  expert: 16,
  nightmare: 19,
};
/** 목표에서 이만큼 벗어나도 됨 */
const LEVEL_TOL = 1;

/**
 * 난이도별 채보를 한 번에 — 각 난이도가 목표 레벨(TARGET_LEVEL)에 들어올 때까지
 * 밀도(·어려움 이상은 격자 채우기)를 조절해 다시 뽑는다. 가장 가까운 결과를 씀.
 * 곡에 타격이 적어 목표까지 못 올라가도, 아래 난이도보다는 최소 2레벨 높게.
 * @param diffs 만들 난이도 (보스곡·내 음악은 nightmare 포함)
 */
export function makeAutoCharts(
  an: Analysis,
  diffs: Difficulty[],
  shiftMs = 0,
  tweaks: Partial<Record<Difficulty, AutoTweak>> = {}
): Partial<Record<Difficulty, Chart>> {
  const out: Partial<Record<Difficulty, Chart>> = {};
  let prevLevel = -Infinity;
  for (const d of diffs) {
    const base = tweaks[d] ?? {};
    const target = Math.max(TARGET_LEVEL[d], prevLevel + 2);
    const canFill = d !== "easy";
    let density = base.density ?? 1;
    let fill = base.fill ?? 0;
    let best: Chart | null = null;
    let bestRaw = 0;
    for (let attempt = 0; attempt < 7; attempt++) {
      const chart = makeAutoChart(an, d, shiftMs, { ...base, density, fill });
      // 레벨은 난이도별 최저값으로 올려 놓은 값이라, 맞춰 갈 때는 별점 그대로 잼
      const raw = Math.round(starRating(chart.notes) * 4);
      if (!best || Math.abs(raw - target) < Math.abs(bestRaw - target)) {
        best = chart;
        bestRaw = raw;
      }
      const miss = raw - target;
      if ((globalThis as { DEBUG_LV?: boolean }).DEBUG_LV) console.log(`  ${d} 시도${attempt} 밀도x${density.toFixed(2)} 채우기${fill.toFixed(1)} → Lv${raw} 노트${chart.notes.length}`);
      if (Math.abs(miss) <= LEVEL_TOL) break;
      // 레벨은 밀도에 거의 비례 → 비율로 맞춰 감 (한 번에 너무 크게는 안 움직임)
      const ratio = Math.min(1.6, Math.max(0.6, target / Math.max(1, raw)));
      density *= ratio;
      // 밀도를 올려도 곡에서 찾은 타격이 모자라면 격자 채우기로
      if (miss < 0 && canFill) fill = Math.min(1.6, fill + 0.3);
    }
    out[d] = best!;
    prevLevel = bestRaw;
  }
  return out;
}
