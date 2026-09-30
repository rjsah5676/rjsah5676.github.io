/**
 * 곡 이벤트 → 난이도별 4키 채보.
 * 멜로디 음높이로 레인을 정하고(높은 음 → 오른쪽), 드럼은 동시치기·채우기로 쓴다.
 * 같은 곡·난이도면 항상 같은 채보가 나오도록 시드 고정 난수를 쓴다.
 */
import type { Kind, MusicEvent, Song } from "./music";

export type Difficulty = "easy" | "normal" | "hard" | "expert";
export const DIFFICULTIES: { key: Difficulty; label: string; color: string }[] = [
  { key: "easy", label: "쉬움", color: "#4ADE80" },
  { key: "normal", label: "보통", color: "#60A5FA" },
  { key: "hard", label: "어려움", color: "#F59E0B" },
  { key: "expert", label: "매우 어려움", color: "#F43F5E" },
];

export interface Note {
  /** 판정 시각(초, 곡 시작 기준) */
  t: number;
  lane: number;
  /** 롱노트 끝 시각. 없으면 단노트 */
  end?: number;
}

export interface Chart {
  notes: Note[];
  level: number;
  /** 판정 단위 수 (롱노트는 머리+꼬리 2) */
  units: number;
}

interface Rule {
  /** 이 격자(16분음표 배수)에 있는 음만 */
  grid: number;
  /** 노트 사이 최소 간격(초) – 동시치기 제외 */
  minGap: number;
  /** 같은 레인 연타 최소 간격(초) */
  jackGap: number;
  /** 이 길이(16분음표) 이상 멜로디는 롱노트 */
  holdMin: number;
  /** 롱노트 포함 동시에 눌러야 하는 최대 개수 */
  maxPress: number;
  /** 멜로디 없는 곳을 채울 소스 */
  fill: Kind[];
  /** 동시치기로 얹을 드럼과 확률 */
  chord: { kinds: Kind[]; prob: number; onlyDownbeat: boolean };
  /** 롱노트 누르는 중에 다른 노트 허용 */
  notesDuringHold: boolean;
}

const RULES: Record<Difficulty, Rule> = {
  easy: {
    grid: 4,
    minGap: 0.32,
    jackGap: 0.9,
    holdMin: 8,
    maxPress: 1,
    fill: ["arp", "kick"],
    chord: { kinds: [], prob: 0, onlyDownbeat: true },
    notesDuringHold: false,
  },
  normal: {
    grid: 2,
    minGap: 0.16,
    jackGap: 0.45,
    holdMin: 6,
    maxPress: 2,
    fill: ["arp", "kick", "snare"],
    chord: { kinds: ["crash", "kick"], prob: 0.35, onlyDownbeat: true },
    notesDuringHold: false,
  },
  hard: {
    grid: 1,
    minGap: 0.1,
    jackGap: 0.22,
    holdMin: 4,
    maxPress: 2,
    fill: ["arp", "tom", "snare", "kick", "clap"],
    chord: { kinds: ["crash", "kick", "snare"], prob: 0.45, onlyDownbeat: false },
    notesDuringHold: true,
  },
  expert: {
    grid: 1,
    minGap: 0.07,
    jackGap: 0.15,
    holdMin: 4,
    maxPress: 3,
    fill: ["arp", "tom", "snare", "clap", "kick", "gtr", "hat"],
    chord: { kinds: ["crash", "kick", "snare", "clap"], prob: 0.8, onlyDownbeat: false },
    notesDuringHold: true,
  },
};

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (s: string) =>
  [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261);

export function makeChart(song: Song, diff: Difficulty): Chart {
  const R = RULES[diff];
  const rand = rng(hash(song.id + diff));
  const stepSec = 60 / song.bpm / 4;
  const T = (step: number) => step * stepSec;

  const byStep = new Map<number, MusicEvent[]>();
  for (const e of song.events) {
    if (!byStep.has(e.step)) byStep.set(e.step, []);
    byStep.get(e.step)!.push(e);
  }
  const leads = song.events.filter((e) => e.kind === "lead");
  const arps = song.events.filter((e) => e.kind === "arp");

  // 레인 계산용: 근처 2마디 안의 음역
  const rangeAround = (list: MusicEvent[], step: number) => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const e of list) {
      if (e.step < step - 16 || e.step > step + 16) continue;
      lo = Math.min(lo, e.midi!);
      hi = Math.max(hi, e.midi!);
    }
    return [lo, hi] as const;
  };
  const pitchLane = (list: MusicEvent[], e: MusicEvent) => {
    const [lo, hi] = rangeAround(list, e.step);
    if (hi <= lo) return Math.floor(rand() * 4);
    return Math.min(3, Math.floor(((e.midi! - lo) / (hi - lo + 1)) * 4));
  };

  const notes: Note[] = [];
  const laneLast = [-Infinity, -Infinity, -Infinity, -Infinity]; // 레인별 마지막 노트(끝) 시각
  const holdEnd = [-Infinity, -Infinity, -Infinity, -Infinity];
  let lastTime = -Infinity;
  let lastLane = 1;

  const activeHolds = (t: number) => holdEnd.filter((e) => e > t - 0.001).length;
  const free = (lane: number, t: number) =>
    holdEnd[lane] < t - 0.08 && t - laneLast[lane] >= R.jackGap - 1e-6;

  /** 원하는 레인이 막혀 있으면 가까운 빈 레인으로 */
  const pickLane = (want: number, t: number, avoid: number[] = []) => {
    const order = [0, 1, 2, 3].sort(
      (a, b) => Math.abs(a - want) - Math.abs(b - want) || rand() - 0.5
    );
    return order.find((l) => !avoid.includes(l) && free(l, t)) ?? -1;
  };

  const place = (lane: number, t: number, end?: number) => {
    notes.push(end ? { t, lane, end } : { t, lane });
    laneLast[lane] = end ?? t;
    if (end) holdEnd[lane] = end;
  };

  const lastStep = song.bars * 16;
  for (let step = 0; step < lastStep; step++) {
    if (step % R.grid) continue;
    const evs = byStep.get(step);
    if (!evs) continue;
    const t = T(step);
    if (t - lastTime < R.minGap - 1e-6) continue;
    const holds = activeHolds(t);
    if (holds && !R.notesDuringHold) continue;
    if (holds >= R.maxPress) continue;

    // 1) 주 노트: 멜로디 > 채우기 소스
    const lead = evs.find((e) => e.kind === "lead");
    let main: MusicEvent | undefined = lead;
    if (!main) for (const k of R.fill) if ((main = evs.find((e) => e.kind === k))) break;
    if (!main) continue;

    let want: number;
    if (main.kind === "lead") want = pitchLane(leads, main);
    else if (main.kind === "arp") want = pitchLane(arps, main);
    else if (main.kind === "kick") want = (step / 4) % 2 ? 3 : 0;
    else if (main.kind === "snare" || main.kind === "clap") want = (step / 8) % 2 ? 2 : 1;
    else want = (lastLane + 1 + Math.floor(rand() * 3)) % 4; // 하이햇 등: 직전과 다른 레인
    const lane = pickLane(want, t);
    if (lane < 0) continue;

    let end: number | undefined;
    const noteSec = main.len * stepSec;
    if (main.kind === "lead" && main.len >= R.holdMin && noteSec >= 0.35) {
      // 다음 멜로디 직전에 놓도록 1칸 짧게
      end = t + noteSec - stepSec;
      if (!R.notesDuringHold) {
        // 쉬움·보통: 롱노트 중에는 다른 노트가 없으니 끝을 조금 여유 있게
        end = t + noteSec - Math.min(stepSec * 2, noteSec * 0.25);
      }
    }
    place(lane, t, end);
    lastTime = t;
    lastLane = lane;

    // 2) 동시치기
    const pressing = activeHolds(t + 0.001); // 방금 놓은 롱노트 포함
    let count = end ? pressing : pressing + 1;
    const beat = step % 4 === 0;
    const down = step % 16 === 0;
    if (R.chord.prob > 0 && (R.chord.onlyDownbeat ? down : beat)) {
      for (const k of R.chord.kinds) {
        if (count >= R.maxPress) break;
        if (main.kind === k || !evs.some((e) => e.kind === k)) continue;
        if (rand() > R.chord.prob) continue;
        const l2 = pickLane(3 - lane, t, [lane]);
        if (l2 < 0) continue;
        place(l2, t);
        count++;
      }
    }
  }

  notes.sort((a, b) => a.t - b.t || a.lane - b.lane);
  const units = notes.reduce((s, n) => s + (n.end ? 2 : 1), 0);

  // 레벨: 초당 노트 수(평균·최고 구간) 기준 대략 1~15
  const playSec = notes.length ? notes[notes.length - 1].t - notes[0].t + 1 : 1;
  const avg = notes.length / playSec;
  let peak = 0;
  for (let i = 0, j = 0; i < notes.length; i++) {
    while (notes[i].t - notes[j].t > 4) j++;
    peak = Math.max(peak, (i - j + 1) / 4);
  }
  const level = Math.max(1, Math.min(15, Math.round(avg + peak * 0.45)));
  return { notes, level, units };
}
