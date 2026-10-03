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
import { assignPatterns, relaneStreams, type PatternCtx } from "./patterns";

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
}

const AUTO_RULES: Record<Difficulty, AutoRule> = {
  easy: {
    nps: 1.6,
    minGap: 0.34,
    jackGap: 0.8,
    pos: [1, 0.45, 0, 0, 0],
    floor: 0.18,
    chord: null,
    holdBeats: 2,
  },
  normal: {
    nps: 3,
    minGap: 0.17,
    jackGap: 0.4,
    pos: [1, 0.8, 0.3, 0, 0],
    floor: 0.12,
    chord: { every: 16, need: 0.55 },
    holdBeats: 1.5,
  },
  hard: {
    nps: 6,
    minGap: 0.09,
    jackGap: 0.2,
    pos: [1, 0.9, 0.65, 0.25, 0],
    floor: 0.08,
    chord: { every: 4, need: 0.7 },
    holdBeats: 1.5,
  },
  expert: {
    nps: 9.5,
    minGap: 0.055,
    jackGap: 0.13,
    pos: [1, 0.95, 0.85, 0.75, 0.45],
    floor: 0.05,
    chord: { every: 2, need: 0.6 },
    holdBeats: 1.25,
  },
};

/** 마지막 makeAutoChart가 쓴 패턴 설정 (보스 채보처럼 노트를 덧입힌 뒤 relaneWithPatterns로 다시 깔 때) */
let lastPatternCtx: (PatternCtx & { cenOf: (t: number) => number }) | null = null;
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
export function relaneWithPatterns(notes: Note[]) {
  if (lastPatternCtx) relaneStreams(notes, lastPatternCtx, lastPatternCtx.cenOf);
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
}

/**
 * @param shiftMs 사용자가 미리듣기로 맞춘 곡별 보정 (+면 노트가 늦게)
 */
export function makeAutoChart(
  an: Analysis,
  diff: Difficulty,
  shiftMs = 0,
  tweak: AutoTweak = {}
): Chart {
  const base = AUTO_RULES[diff];
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
  const cands = an.onsets
    // 격자 밖 타격(셋잇단·싱커페이션 등)은 아주 셀 때만
    .filter((o) => o.s >= R.floor && R.pos[posKind(o, an.div)] > 0 && (o.grid >= 0 || o.s >= 0.5))
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
  };
  const patterned = assignPatterns(
    picked.map((o) => ({ t: o.t, cen: o.cen, count: 1 })),
    patCtx
  );

  const notes: Note[] = [];
  const laneLast = [-Infinity, -Infinity, -Infinity, -Infinity];
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

    // 3) 동시치기 — 규칙 자리 + 구간 진입(드롭·코러스) 첫 노트
    const entry =
      R.chord !== null &&
      sectionStart(barOf(o.t)) &&
      (i === 0 || barOf(picked[i - 1].t) !== barOf(o.t));
    if (
      entry ||
      (R.chord &&
        o.grid >= 0 &&
        o.grid % ((R.chord.every * an.div) / 4) === 0 &&
        // need가 0이면 대역 조건 없이 세기만 봄 (곡별 손보기)
        (R.chord.need === 0 || (o.low >= R.chord.need && o.high >= R.chord.need * 0.8)) &&
        o.s >= Math.max(0.2, R.chord.need))
    ) {
      let l2 = 3 - want;
      if (l2 === want || o.t - laneLast[l2] < R.jackGap) l2 = (want + 2) % 4;
      if (o.t - laneLast[l2] >= R.jackGap) {
        notes.push({ t: o.t, lane: l2 });
        laneLast[l2] = o.t;
      }
    }
  }

  // 3.5) 프레이즈 반복: 마디 안 노트 배치(상대 시각)가 같은 마디는 먼저 나온 마디의 레인을 그대로
  {
    const byBar = new Map<number, Note[]>();
    for (const n of notes) {
      const b = barOf(n.t);
      if (!byBar.has(b)) byBar.set(b, []);
      byBar.get(b)!.push(n);
    }
    const seen = new Map<string, number[]>();
    for (const [b, list] of [...byBar.entries()].sort((x, y) => x[0] - y[0])) {
      list.sort((x, y) => x.t - y.t || x.lane - y.lane);
      const key = list
        .map((n) => Math.round(((n.t - bar0 - b * barSec) / beatSec) * an.div))
        .join(",");
      const lanes = seen.get(key);
      if (lanes && lanes.length === list.length && list.length >= 3) {
        // 복사했을 때 같은 시각에 같은 레인이 겹치면(동시치기) 복사 안 함
        const clash = list.some((n, k) =>
          list.some((m, k2) => k2 !== k && m.t === n.t && lanes[k2] === lanes[k])
        );
        if (!clash) list.forEach((n, k) => (n.lane = lanes[k]));
      } else if (list.length >= 3)
        seen.set(
          key,
          list.map((n) => n.lane)
        );
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

  // 스크립트(보스 패턴 덧입히기)에서 덧입힌 뒤 다시 패턴을 깔 수 있게
  lastPatternCtx = { ...patCtx, cenOf: (t) => nearestCen(an, t) };

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
