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
 *   --boss '<json>'   보스곡: 나이트메어 난이도를 추가 (src/lib/rhythm/autochart의 NightmareTweak, {}면 기본값)
 *   --hard-slots      쉬움·보통·어려움을 한 단계 위 규칙으로 (보스곡용: 대략 Lv6 / 11 / 14)
 *   --dry             파일은 안 쓰고 난이도별 통계만 출력
 *
 * 예) Monarch's Fall : npm run rhythm-chart -- monarch --bpm-label 150 --boss '{}'
 *     Maximum Velocity: npm run rhythm-chart -- velocity --bpm-label 180 --hard-slots \
 *       --boss '{"loudSub":3,"fullSub":6,"chordFull":3,"burstSub":12,"burstEvery":2}'
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
for (const n of ["analyze", "autochart", "chart", "patterns"]) {
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
if (!charts.expert) charts.expert = makeAutoChart(a, "expert");
// 보스곡: 나이트메어 (매우 어려움은 다른 곡과 같은 규칙)
if (bossArg !== undefined)
  charts.nightmare = makeAutoChart(a, "nightmare", 0, { nightmare: JSON.parse(bossArg) });

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
    Object.keys(charts).map((d) => [
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
