/**
 * 리듬게임 곡 데이터. 저작권 걱정 없이 직접 작곡한 곡을 16분음표 격자 위의 이벤트로 정의하고,
 * 소리(synth.ts)와 채보(chart.ts)가 같은 이벤트에서 나오게 해서 박자가 정확히 맞도록 한다.
 */

export type Kind =
  | "kick"
  | "snare"
  | "clap"
  | "hat"
  | "ohat"
  | "crash"
  | "tom"
  | "bass"
  | "gtr"
  | "lead"
  | "arp"
  | "pad";

export interface MusicEvent {
  /** 곡 시작부터 16분음표 단위 위치 */
  step: number;
  kind: Kind;
  midi?: number;
  /** 길이(16분음표 수) */
  len: number;
  vel: number;
  /** 피아노: 서스테인 페달 (마디 끝까지 울림) */
  pedal?: boolean;
}

export interface SoundSet {
  /** supersaw: 톱니파 여러 개를 살짝 어긋나게 겹친 두꺼운 리드
   *  piano: 리드·아르페지오·베이스를 전부 피아노 음색으로 */
  lead: OscillatorType | "supersaw" | "piano";
  arp: OscillatorType;
  /** 리드 딜레이 길이(16분음표 수) */
  delaySteps: number;
  /** 리드 음량 배율 (기본 1) */
  leadGain?: number;
  /** 드럼 음량 배율 (기본 1) */
  drums?: number;
}

export interface Song {
  id: string;
  title: string;
  bpm: number;
  bars: number;
  /** 소리가 끝나는 시점(초) */
  duration: number;
  events: MusicEvent[];
  /** 구간 이름 [시작 마디, 이름] – 진행 바 표시용 */
  sections: [number, string][];
  sound: SoundSet;
  color: string;
  desc: string;
}

// ───────────────────────── 작곡용 헬퍼 ─────────────────────────

const NOTE: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
/** "f#5" → 78 */
export function midiOf(name: string): number {
  const m = /^([a-g])(#|b)?(-?\d)$/.exec(name);
  if (!m) throw new Error(`bad note ${name}`);
  return 12 * (Number(m[3]) + 1) + NOTE[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
}

/** "e5 - - - . c5 - ..." (16칸) → 음표 목록. '-'는 앞 음 늘이기, '.'는 쉼표 */
function parseBar(bar: string): { at: number; midi: number; len: number }[] {
  const tokens = bar.trim().split(/\s+/);
  if (tokens.length !== 16) throw new Error(`bar must have 16 tokens: "${bar}"`);
  const out: { at: number; midi: number; len: number }[] = [];
  tokens.forEach((t, i) => {
    if (t === "-") {
      if (out.length && out[out.length - 1].at + out[out.length - 1].len === i)
        out[out.length - 1].len++;
    } else if (t !== ".") out.push({ at: i, midi: midiOf(t), len: 1 });
  });
  return out;
}

type Drum = string | string[];
interface Section {
  name: string;
  bars: number;
  kick?: Drum;
  snare?: Drum;
  clap?: Drum;
  hat?: Drum;
  ohat?: Drum;
  crash?: Drum;
  /** 탐 필인: x 위치마다 높은 탐 → 낮은 탐 순서로 */
  tom?: Drum;
  bass?: "pulse" | "octave" | "root" | "half";
  /** 파워코드 기타: 8분 뮤트 연주(chug) / 한 마디 길게(sustain) */
  gtr?: "chug" | "sustain";
  /** 이 구간만 쓰는 코드 진행 (마디마다, 모자라면 반복) */
  chords?: string[][];
  /** 이 구간 음 높이를 반음 단위로 올림 (마지막 후렴 전조) */
  transpose?: number;
  pad?: boolean;
  /** 아르페지오 간격(16분음표 수) */
  arp?: 1 | 2;
  /** 아르페지오 음량 (기본 1) – 멜로디를 받쳐줘야 하는 구간에서 낮춤 */
  arpVel?: number;
  /** 마디별 멜로디 (모자라면 반복) */
  lead?: string[];
  /** 피아노 페달: true면 전부, "acc"면 반주(베이스·아르페지오)만 마디 끝까지 울림 */
  pedal?: boolean | "acc";
}

interface SongSpec {
  id: string;
  title: string;
  bpm: number;
  /** 마디마다 코드 (4마디 반복): [베이스 루트, ...코드 구성음] */
  chords: string[][];
  sections: Section[];
  sound: SoundSet;
  color: string;
  desc: string;
}

const drumAt = (d: Drum | undefined, bar: number) =>
  d === undefined ? "" : typeof d === "string" ? d : d[bar % d.length];

function build(spec: SongSpec): Song {
  const events: MusicEvent[] = [];
  const sections: [number, string][] = [];
  let bar0 = 0;
  for (const sec of spec.sections) {
    sections.push([bar0, sec.name]);
    const secStart = events.length;
    for (let b = 0; b < sec.bars; b++) {
      const base = (bar0 + b) * 16;
      const chord = sec.chords
        ? sec.chords[b % sec.chords.length]
        : spec.chords[(bar0 + b) % spec.chords.length];
      const tr = sec.transpose ?? 0;
      const root = midiOf(chord[0]) + tr;
      const tones = chord.slice(1).map((n) => midiOf(n) + tr);

      const drums: [Kind, Drum | undefined][] = [
        ["kick", sec.kick],
        ["snare", sec.snare],
        ["clap", sec.clap],
        ["hat", sec.hat],
        ["ohat", sec.ohat],
        ["crash", sec.crash],
      ];
      for (const [kind, d] of drums) {
        const pat = drumAt(d, b);
        for (let i = 0; i < pat.length; i++) {
          if (pat[i] === "x" || pat[i] === "o")
            events.push({ step: base + i, kind, len: 1, vel: pat[i] === "x" ? 1 : 0.55 });
        }
      }

      // 탐 필인: 한 마디 안에서 나오는 순서대로 음이 내려감
      const tomPat = drumAt(sec.tom, b);
      let tomN = 0;
      for (let i = 0; i < tomPat.length; i++)
        if (tomPat[i] === "x")
          events.push({ step: base + i, kind: "tom", midi: 52 - 3 * (tomN++ % 5), len: 1, vel: 1 });

      if (sec.gtr === "chug")
        for (let i = 0; i < 16; i += 2)
          events.push({
            step: base + i,
            kind: "gtr",
            midi: root + 12,
            len: 2,
            vel: i % 4 ? 0.8 : 1,
          });
      if (sec.gtr === "sustain")
        events.push({ step: base, kind: "gtr", midi: root + 12, len: 16, vel: 1 });

      if (sec.bass === "pulse")
        for (let i = 0; i < 16; i += 2)
          events.push({ step: base + i, kind: "bass", midi: root, len: 2, vel: i % 4 ? 0.7 : 1 });
      if (sec.bass === "octave")
        for (let i = 0; i < 16; i += 2)
          events.push({
            step: base + i,
            kind: "bass",
            midi: root + (i % 4 ? 12 : 0),
            len: 2,
            vel: 1,
          });
      if (sec.bass === "root")
        events.push({ step: base, kind: "bass", midi: root, len: 16, vel: 1 });
      if (sec.bass === "half")
        for (let i = 0; i < 16; i += 8)
          events.push({ step: base + i, kind: "bass", midi: root, len: 8, vel: 1 });

      if (sec.pad)
        for (const m of tones) events.push({ step: base, kind: "pad", midi: m, len: 16, vel: 1 });

      if (sec.arp) {
        // 코드 구성음을 한 옥타브 위에서 오르내리기
        const up = [...tones.map((m) => m + 12), tones[0] + 24];
        const seq = [0, 1, 2, 3, 2, 1, 0, 1];
        for (let i = 0; i < 16; i += sec.arp)
          events.push({
            step: base + i,
            kind: "arp",
            midi: up[seq[(i / sec.arp) % seq.length]],
            len: sec.arp,
            vel: sec.arpVel ?? 1,
          });
      }

      if (sec.lead) {
        for (const n of parseBar(sec.lead[b % sec.lead.length]))
          events.push({ step: base + n.at, kind: "lead", midi: n.midi + tr, len: n.len, vel: 1 });
      }
    }
    if (sec.pedal)
      for (let i = secStart; i < events.length; i++) {
        const k = events[i].kind;
        if (k === "bass" || k === "arp" || (k === "lead" && sec.pedal === true))
          events[i].pedal = true;
      }
    bar0 += sec.bars;
  }
  // 마디 경계를 넘는 멜로디 이어붙이기: 마디 끝까지 '-'였고 다음 마디가 '-'로 시작하는 경우는
  // parseBar가 처리 못 하므로, 작곡할 때 긴 음은 한 마디 안에서 끝나게 쓴다.
  events.sort((a, b) => a.step - b.step);
  const stepSec = 60 / spec.bpm / 4;
  return {
    id: spec.id,
    title: spec.title,
    bpm: spec.bpm,
    bars: bar0,
    duration: bar0 * 16 * stepSec + 2.5,
    events,
    sections,
    sound: spec.sound,
    color: spec.color,
    desc: spec.desc,
  };
}

// ───────────────────────── 공용 드럼 패턴 ─────────────────────────

const FOUR = "x...x...x...x...";
const BACK = "....x.......x...";
const ROCK_KICK = "x.....x...x.....";
const HAT8 = "x.x.x.x.x.x.x.x.";
const CRASH1 = "x...............";
const FILL_SN = "........x.x.xxxx";
const FILL_TOM = "........xxxxxxxx";

// ───────────────────────── 곡: Moonlight (베토벤 월광 소나타 3악장 리믹스) ─────────────────────────
// 원곡(1801)은 퍼블릭 도메인, 편곡은 직접. 3악장 Presto 아르페지오 + 1악장 테마 인용 브레이크.

const CSm = ["c#2", "c#4", "e4", "g#4"];
const CSmB = ["b1", "c#4", "e4", "g#4"];
const GS7 = ["g#1", "b#3", "d#4", "f#4"];
const GS = ["g#1", "g#3", "b#3", "d#4"];
const GSm = ["g#1", "g#3", "b3", "d#4"];
const A3 = ["a1", "a3", "c#4", "e4"];
const FSm3 = ["f#1", "f#3", "a3", "c#4"];
const E3 = ["e2", "e3", "g#3", "b3"];
const B3 = ["b1", "b3", "d#4", "f#4"];

const prestoCm1 = "c#4 e4 g#4 c#5 e4 g#4 c#5 e5 g#4 c#5 e5 g#5 c#5 e5 g#5 c#6";
const prestoCm2 = "c#5 e5 g#5 c#6 e5 g#5 c#6 e6 . . c#6 - . . c#6 -";
const prestoG1 = "b#3 d#4 f#4 g#4 d#4 f#4 g#4 b#4 f#4 g#4 b#4 d#5 g#4 b#4 d#5 f#5";
const prestoG2 = "g#4 b#4 d#5 g#5 b#4 d#5 g#5 b#5 . . g#5 - . . g#5 -";
const prestoA = "a3 c#4 e4 a4 c#4 e4 a4 c#5 e4 a4 c#5 e5 a4 c#5 e5 a5";
const prestoFm = "f#3 a3 c#4 f#4 a3 c#4 f#4 a4 c#4 f#4 a4 c#5 f#4 a4 c#5 f#5";
const prestoGend = "g#3 b#3 d#4 g#4 b#3 d#4 g#4 b#4 d#4 g#4 b#4 d#5 . . g#5 -";
const presto = [prestoCm1, prestoCm2, prestoG1, prestoG2, prestoCm1, prestoA, prestoFm, prestoGend];
const prestoChords = [CSm, CSm, GS7, GS7, CSm, A3, FSm3, GS];

const moonTheme2 = [
  "g#5 - - - f#5 - e5 - d#5 - e5 - f#5 - - -",
  "d#5 - - - c#5 - b4 - a4 - b4 - c#5 - - -",
  "e5 - - - d#5 - c#5 - b4 - c#5 - e5 - g#5 -",
  "f#5 - - - - - d#5 - - - - - . . . .",
  "c#6 - - - b5 - a5 - g#5 - a5 - b5 - - -",
  "b5 - - - a5 - g#5 - f#5 - g#5 - e5 - - -",
  "a5 - - - g#5 - f#5 - e5 - f#5 - a5 - c#6 -",
  "b#5 - - - - - - - g#5 - - - . . . .",
];
const theme2Chords = [E3, B3, CSm, GSm, A3, E3, FSm3, GS];

// 1악장(Adagio sostenuto) 멜로디: 셋잇단 반주는 16분음표로 바꿔 흐르게
const adagio = [
  ". . . . . . . . . . . . . . . .",
  ". . . . . . . . . . . . . . . .",
  ". . . . . . . . . . . . g#4 - - g#4",
  "g#4 - - - - - - - g#4 - - g#4 g#4 - - -",
  "g#4 - - - - - - - g#4 - - g#4 g#4 - - -",
  "g#4 - - - - - - - a4 - - - g#4 - - -",
  "f#4 - - - - - - - b4 - - - e4 - - -",
  "d#4 - - - - - - - - - - - . . . .",
];

const MOON: SongSpec = {
  id: "moonlight",
  title: "Moonlight",
  bpm: 160,
  color: "#A5B4FC",
  desc: "160 BPM · 베토벤 월광 3악장 리믹스",
  chords: prestoChords,
  sound: { lead: "piano", arp: "triangle", delaySteps: 3, drums: 0.42 },
  sections: [
    {
      name: "Intro",
      pedal: true,
      bars: 2,
      chords: [CSm, CSm],
      bass: "root",
      lead: [prestoCm1, prestoCm2],
    },
    {
      name: "Presto",
      pedal: true,
      bars: 8,
      chords: prestoChords,
      kick: ROCK_KICK,
      snare: [BACK, BACK, BACK, BACK, BACK, BACK, BACK, FILL_SN],
      hat: HAT8,
      crash: [CRASH1, "", "", "", CRASH1, "", "", ""],
      bass: "octave",
      lead: presto,
    },
    {
      name: "Theme",
      pedal: "acc",
      bars: 8,
      chords: theme2Chords,
      kick: FOUR,
      snare: [BACK, BACK, BACK, BACK, BACK, BACK, BACK, FILL_SN],
      hat: HAT8,
      crash: [CRASH1, "", "", "", CRASH1, "", "", ""],
      bass: "octave",
      arp: 1,
      lead: moonTheme2,
    },
    {
      name: "Adagio",
      pedal: true,
      bars: 8,
      chords: [CSm, CSmB, A3, GS7, CSm, CSmB, A3, GS7],
      kick: [
        "x...............",
        "",
        "x...............",
        "",
        "x.......x.......",
        "x.......x.......",
        "x.......x.......",
        "x...x...x...x...",
      ],
      arp: 1,
      arpVel: 0.7,
      bass: "root",
      lead: adagio,
    },
    {
      name: "Build",
      pedal: true,
      bars: 4,
      chords: [GS7, GS7, GS7, GS7],
      kick: FOUR,
      snare: ["x...x...x...x...", "x.x.x.x.x.x.x.x.", "x.x.x.x.x.x.x.x.", "xxxxxxxxxxxxxxxx"],
      hat: HAT8,
      tom: ["", "", "", FILL_TOM],
      bass: "pulse",
      lead: [prestoG1, prestoG2, prestoG1, prestoGend],
    },
    {
      name: "Presto",
      pedal: true,
      bars: 8,
      chords: prestoChords,
      kick: FOUR,
      snare: [BACK, BACK, BACK, BACK, BACK, BACK, BACK, FILL_SN],
      hat: HAT8,
      crash: [CRASH1, "", "", "", CRASH1, "", "", ""],
      bass: "octave",
      lead: presto,
    },
    {
      name: "Theme",
      pedal: "acc",
      bars: 8,
      chords: theme2Chords,
      kick: FOUR,
      snare: [BACK, BACK, BACK, BACK, BACK, BACK, BACK, FILL_SN],
      hat: HAT8,
      crash: [CRASH1, "", "", "", CRASH1, "", "", ""],
      tom: ["", "", "", "", "", "", "", FILL_TOM],
      bass: "octave",
      arp: 1,
      lead: moonTheme2,
    },
    {
      name: "Outro",
      pedal: true,
      bars: 2,
      chords: [CSm, CSm],
      kick: ["x.......x.......", "x..............."],
      crash: [CRASH1, CRASH1],
      bass: "half",
      lead: ["c#5 - - - . . . . c#5 - - - . . . .", "c#4 - - - - - - - - - - - - - - -"],
    },
  ],
};

// ───────────────────────── 곡: Flight of the Bumblebee (림스키코르사코프 「왕벌의 비행」 리믹스) ─────────────────────────
// 원곡(1900)은 퍼블릭 도메인, 편곡은 직접. 쉬지 않고 이어지는 반음계 16분음표가 핵심.

const Am = ["a1", "a3", "c4", "e4"];
const E7 = ["e2", "g#3", "b3", "d4"];
const Dm = ["d2", "d4", "f4", "a4"];
const F = ["f1", "f3", "a3", "c4"];

// 도입: 높은 E에서 반음씩 흘러내림
const beeIntro = [
  "e6 d#6 d6 c#6 d6 c#6 c6 b5 c6 b5 a#5 a5 g#5 g5 f#5 f5",
  "e5 d#5 d5 c#5 d5 c#5 c5 b4 c5 b4 a#4 a4 g#4 g4 f#4 f4",
];
// 주제: A에서 반음 내려갔다 돌아오는 붕붕거림
const beeA1 = "a5 g#5 g5 f#5 f5 a#5 a5 g#5 a5 g#5 g5 f#5 f5 f#5 g5 g#5";
const beeA2 = "a5 g#5 g5 f#5 g5 f#5 f5 e5 f5 e5 d#5 d5 c#5 c5 b4 a#4";
const beeA3 = "a4 g#4 g4 f#4 f4 a#4 a4 g#4 a4 g#4 g4 f#4 f4 f#4 g4 g#4";
const beeA4 = "a4 a#4 b4 c5 c#5 d5 d#5 e5 f5 f#5 g5 g#5 a5 - . .";
const beeA = [beeA1, beeA1, beeA2, beeA3, beeA1, beeA1, beeA2, beeA4];
const beeAChords = [Am, Am, E7, Am, Am, Am, E7, Am];
// 4도 위(D)로 옮긴 주제
const beeB1 = "d6 c#6 c6 b5 a#5 d#6 d6 c#6 d6 c#6 c6 b5 a#5 b5 c6 c#6";
const beeB2 = "d6 c#6 c6 b5 c6 b5 a#5 a5 a#5 a5 g#5 g5 f#5 f5 e5 d#5";
const beeB3 = "d5 c#5 c5 b4 a#4 d#5 d5 c#5 d5 c#5 c5 b4 a#4 b4 c5 c#5";
const beeRun = "e5 f5 f#5 g5 g#5 a5 a#5 b5 c6 c#6 d6 d#6 e6 - - -";
const beeB = [beeB1, beeB1, beeB2, beeB3, beeA1, beeA1, beeA2, beeRun];
const beeBChords = [Dm, Dm, Dm, Dm, Am, Am, E7, E7];
// 날갯짓 트릴 + 긴 음 (숨 돌리는 구간)
const beeBuzz = [
  "e5 f5 e5 f5 e5 f5 e5 f5 e5 f5 e5 f5 e5 - - -",
  "d#5 e5 d#5 e5 d#5 e5 d#5 e5 d#5 e5 d#5 e5 d#5 - - -",
  "a5 - - - - - - - g#5 - - - - - - -",
  "g5 - - - f#5 - - - f5 - - - e5 - - -",
];
// 끝: 반음씩 기어올라 A로 착지
const beeFinal = [
  "f4 f#4 g4 g#4 a4 a#4 b4 c5 c#5 d5 d#5 e5 f5 f#5 g5 g#5",
  "a5 a#5 b5 c6 c#6 d6 d#6 e6 . . e6 . . e6 . .",
  beeA1,
  "a5 g#5 g5 f#5 f5 e5 d#5 d5 c#5 c5 b4 a#4 a4 g#4 g4 f#4",
];

const BEE: SongSpec = {
  id: "bumblebee",
  title: "Flight of the Bumblebee",
  bpm: 150,
  color: "#FACC15",
  desc: "150 BPM · 림스키코르사코프 왕벌의 비행 리믹스",
  chords: beeAChords,
  sound: { lead: "piano", arp: "triangle", delaySteps: 3, drums: 0.42 },
  sections: [
    { name: "Intro", bars: 2, chords: [Am, E7], lead: beeIntro },
    {
      name: "Theme",
      pedal: "acc",
      bars: 8,
      chords: beeAChords,
      kick: FOUR,
      snare: [BACK, BACK, BACK, BACK, BACK, BACK, BACK, FILL_SN],
      hat: HAT8,
      crash: [CRASH1, "", "", "", CRASH1, "", "", ""],
      bass: "pulse",
      lead: beeA,
    },
    {
      name: "Rise",
      pedal: "acc",
      bars: 8,
      chords: beeBChords,
      kick: ROCK_KICK,
      snare: [BACK, BACK, BACK, BACK, BACK, BACK, BACK, FILL_SN],
      hat: HAT8,
      crash: [CRASH1, "", "", "", CRASH1, "", "", ""],
      bass: "octave",
      lead: beeB,
    },
    {
      name: "Buzz",
      bars: 4,
      pedal: "acc",
      chords: [Am, E7, F, E7],
      kick: ["x.......x.......", "x.......x.......", "x...............", "x...x...x...x..."],
      bass: "root",
      arp: 2,
      arpVel: 0.9,
      lead: beeBuzz,
    },
    {
      name: "Theme",
      pedal: "acc",
      bars: 8,
      chords: beeAChords,
      kick: FOUR,
      snare: [BACK, BACK, BACK, BACK, BACK, BACK, BACK, FILL_SN],
      hat: HAT8,
      crash: [CRASH1, "", "", "", CRASH1, "", "", ""],
      tom: ["", "", "", "", "", "", "", FILL_TOM],
      bass: "octave",
      lead: beeA,
    },
    {
      name: "Final",
      pedal: "acc",
      bars: 4,
      chords: [E7, E7, Am, E7],
      kick: FOUR,
      snare: [BACK, "x.x.x.x.x.x.x.x.", BACK, "xxxxxxxxxxxxxxxx"],
      hat: HAT8,
      crash: [CRASH1, "", CRASH1, ""],
      bass: "pulse",
      lead: beeFinal,
    },
    {
      name: "Outro",
      bars: 2,
      pedal: true,
      chords: [Am, Am],
      kick: ["x.......x.......", "x..............."],
      crash: [CRASH1, CRASH1],
      bass: "half",
      lead: ["a5 . e5 . c5 . a4 . a5 - - - - - - -", "a4 - - - - - - - - - - - . . . ."],
    },
  ],
};

export const SONGS: Song[] = [build(MOON), build(BEE)];
