/**
 * 리듬게임 내장곡 채보 만들기 → src/data/rhythm/<id>.json
 *
 *   npm run rhythm-chart -- <id> [옵션]
 *
 * 음원은 public/audio/<id>.mp3, ffmpeg가 PATH에 있어야 함.
 * 게임 안 '내 음악'과 같은 분석기·자동 채보기(src/lib/rhythm)를 그대로 써서 만든다.
 *
 * 옵션
 *   --bpm-label <n>   화면에 보일 BPM (분석기가 셔플로 잘못 보면 직접 지정)
 *   --boss '<json>'   매우 어려움에 보스 패턴을 덧입힘 (아래 BOSS_DEFAULT 참고, {}면 기본값)
 *   --hard-slots      쉬움·보통·어려움을 한 단계 위 규칙으로 (보스곡용: 대략 Lv6 / 11 / 14)
 *   --dry             파일은 안 쓰고 난이도별 통계만 출력
 *
 * 예) Monarch's Fall : npm run rhythm-chart -- monarch --bpm-label 150 --boss '{}'
 *     Maximum Velocity: npm run rhythm-chart -- velocity --bpm-label 180 --hard-slots \
 *       --boss '{"full":0.26,"loud":0.2,"loudSub":3,"fullSub":6,"chordLoud":2,"chordFull":3,"burstSub":12,"burstEvery":2}'
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")),
  ".."
);
const require = createRequire(path.join(ROOT, "package.json"));
const ts = require("typescript");

// ── 인자 ──
const argv = process.argv.slice(2);
const id = argv.find(
  (a) => !a.startsWith("--") && !argv[argv.indexOf(a) - 1]?.match(/^--(bpm-label|boss)$/)
);
if (!id) {
  console.error(
    "사용법: npm run rhythm-chart -- <id> [--bpm-label n] [--boss '{json}'] [--hard-slots] [--dry]"
  );
  process.exit(1);
}
const opt = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const bpmLabelArg = opt("--bpm-label");
const bossArg = opt("--boss");
const hardSlots = argv.includes("--hard-slots");
const dry = argv.includes("--dry");

// ── src/lib/rhythm의 TS를 임시 폴더에 JS로 옮겨서 불러옴 ──
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "rhythm-chart-"));
for (const n of ["analyze", "autochart", "chart"]) {
  const src = fs.readFileSync(path.join(ROOT, "src/lib/rhythm", `${n}.ts`), "utf8");
  let out = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  out = out.replace(/from "\.\/(\w+)"/g, 'from "./$1.mjs"');
  fs.writeFileSync(path.join(tmp, `${n}.mjs`), out);
}
const load = (n) => import(pathToFileURL(path.join(tmp, `${n}.mjs`)).href);
const { analyzeAudio, displayBpm, SR } = await load("analyze");
const { makeAutoChart } = await load("autochart");
const { finishChart } = await load("chart");

// ── 음원 → 22.05kHz 모노 PCM (분석기가 쓰는 OfflineAudioContext는 이 데이터를 돌려주는 가짜로) ──
const mp3 = path.join(ROOT, "public/audio", `${id}.mp3`);
if (!fs.existsSync(mp3)) throw new Error(`음원이 없음: ${mp3}`);
const raw = execFileSync(
  "ffmpeg",
  ["-v", "error", "-i", mp3, "-ac", "1", "-ar", String(SR), "-f", "f32le", "-"],
  {
    maxBuffer: 1 << 30,
  }
);
const pcm = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
globalThis.OfflineAudioContext = class {
  createBufferSource() {
    return { connect() {}, start() {} };
  }
  get destination() {
    return {};
  }
  async startRendering() {
    return { getChannelData: () => pcm };
  }
};
const a = await analyzeAudio({ duration: pcm.length / SR }, () => {});
console.log(
  `분석: ${a.bpm.toFixed(2)} BPM (표시 ${displayBpm(a).toFixed(1)}), 비트 ${a.beats.length}, 타격 ${a.onsets.length}, ${a.duration.toFixed(1)}초`
);

// ── 보스 패턴 ──
// 마디별 음량이 loud 이상인 마디: 박마다 loudSub 등분 노트 + chordLoud개 동시치기
// full 이상인 마디: fullSub 등분 + chordFull개, burstEvery 마디마다 마지막 박을 burstSub 등분 연타
// 레인은 직전 노트 반대 손 우선, 같은 레인 jack초 이내 금지, 동시치기 최대 2개
const BOSS_DEFAULT = {
  density: 1.6, // 바탕이 되는 매우 어려움 자동 채보 밀도 배율
  loud: 0.26,
  full: 0.29,
  loudSub: 2,
  fullSub: 4,
  chordLoud: 1,
  chordFull: 2,
  burstEvery: 4,
  burstSub: 8,
  jack: 0.17,
};

function bossChart(P) {
  let seed = 20261003; // 항상 같은 채보가 나오게 고정 시드
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const beatSec = 60 / a.bpm;
  const barSec = beatSec * 4;
  const b0 = a.beats[0];
  const FPS = SR / 256;
  const nBars = Math.ceil((a.duration - b0) / barSec);
  const barRms = [];
  for (let b = 0; b < nBars; b++) {
    let s = 0;
    let c = 0;
    for (
      let f = Math.floor((b0 + b * barSec) * FPS);
      f < (b0 + (b + 1) * barSec) * FPS && f < a.rms.length;
      f++
    ) {
      s += a.rms[f];
      c++;
    }
    barRms.push(c ? s / c : 0);
  }
  // 실제 비트 추적값 기준 (템포 흔들림 반영)
  const beatT = (k) =>
    k < a.beats.length ? a.beats[k] : a.beats.at(-1) + (k - a.beats.length + 1) * beatSec;

  const notes = makeAutoChart(a, "expert", 0, {
    density: P.density,
    finePos: 0.9,
    chordEvery: 2,
  }).notes.map((n) => ({ ...n }));
  const lastT = notes.at(-1).t;
  const hand = (l) => (l < 2 ? 0 : 1);
  const sameLaneNear = (t, lane) =>
    notes.some(
      (n) =>
        n.lane === lane &&
        (Math.abs(n.t - t) < P.jack || (n.end && t > n.t - 0.01 && t < n.end + P.jack))
    );
  const add = (t, chord = false) => {
    if (t > lastT + 0.01) return;
    const here = notes.filter((n) => Math.abs(n.t - t) < 0.02);
    if (here.length >= 2 || (here.length === 1 && !chord)) return;
    const prev = notes.filter((n) => n.t < t - 0.02).sort((x, y) => y.t - x.t)[0];
    const pick = [0, 1, 2, 3]
      .filter((l) => !here.some((h) => h.lane === l) && !sameLaneNear(t, l))
      .map((l) => ({
        l,
        w:
          rnd() +
          (prev && hand(prev.lane) !== hand(l) ? 1 : 0) +
          (here.length && hand(here[0].lane) !== hand(l) ? 1.5 : 0),
      }))
      .sort((x, y) => y.w - x.w)[0];
    if (pick) notes.push({ t: +t.toFixed(3), lane: pick.l });
  };
  for (let b = 0; b < nBars; b++) {
    const r = barRms[b];
    if (r < P.loud) continue;
    for (let k = 0; k < 4; k++) {
      const t0 = beatT(b * 4 + k);
      const t1 = beatT(b * 4 + k + 1);
      const sub = r >= P.full ? P.fullSub : P.loudSub;
      const cs = r >= P.full ? P.chordFull : P.chordLoud;
      for (let c = 0; c < cs; c++) add(t0 + (c * (t1 - t0)) / cs, true);
      for (let s = 0; s < sub; s++) add(t0 + (s * (t1 - t0)) / sub);
      if (r >= P.full && k === 3 && b % P.burstEvery === P.burstEvery - 1)
        for (let s = 0; s < P.burstSub; s++) add(t0 + (s * (t1 - t0)) / P.burstSub);
    }
  }
  return finishChart(notes, "expert");
}

// ── 난이도별 채보 ──
const charts = {};
if (hardSlots) {
  // [슬롯, 쓰는 규칙, 밀도 배율, 레벨 매기는 기준]
  for (const [slot, rule, d, scale] of [
    ["easy", "hard", 0.5, "normal"],
    ["normal", "hard", 1, "hard"],
    ["hard", "expert", 0.8, "expert"],
  ])
    charts[slot] = finishChart(
      makeAutoChart(a, rule, 0, { density: d }).notes.map((n) => ({ ...n })),
      scale
    );
} else for (const d of ["easy", "normal", "hard"]) charts[d] = makeAutoChart(a, d);
charts.expert =
  bossArg !== undefined
    ? bossChart({ ...BOSS_DEFAULT, ...JSON.parse(bossArg) })
    : makeAutoChart(a, "expert");

// ── 통계 ──
for (const [d, c] of Object.entries(charts)) {
  const t = c.notes.map((n) => n.t);
  const avg = t.length / (t.at(-1) - t[0] + 1);
  let peak = 0;
  for (let i = 0, j = 0; i < t.length; i++) {
    while (t[i] - t[j] > 4) j++;
    peak = Math.max(peak, (i - j + 1) / 4);
  }
  const chords = t.length - new Set(t).size;
  console.log(
    `${d.padEnd(6)} Lv${String(c.level).padStart(2)}  노트 ${c.notes.length}  초당 ${avg.toFixed(2)}  4초 최고 ${peak.toFixed(2)}  동시치기 ${chords}  롱노트 ${c.notes.filter((n) => n.end).length}`
  );
}

const r3 = (x) => Math.round(x * 1000) / 1000;
const out = {
  bpm: Math.round(a.bpm * 100) / 100,
  bpmLabel: bpmLabelArg ? Number(bpmLabelArg) : Math.round(displayBpm(a) * 100) / 100,
  beatOffset: r3(a.beats[0]),
  duration: Math.round(a.duration * 100) / 100,
  charts: Object.fromEntries(
    ["easy", "normal", "hard", "expert"].map((d) => [
      d,
      {
        level: charts[d].level,
        units: charts[d].units,
        notes: charts[d].notes.map((n) =>
          n.end ? [r3(n.t), n.lane, r3(n.end)] : [r3(n.t), n.lane]
        ),
      },
    ])
  ),
};
fs.rmSync(tmp, { recursive: true, force: true });
if (dry) process.exit(0);
const dest = path.join(ROOT, "src/data/rhythm", `${id}.json`);
fs.writeFileSync(dest, JSON.stringify(out));
console.log(`저장: ${path.relative(ROOT, dest)}`);
