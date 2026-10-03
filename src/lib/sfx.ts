/*
 * 짧은 효과음을 Web Audio로 즉석 합성 (파일 없이).
 * 첫 사용자 입력 이후에만 소리가 나므로(브라우저 자동재생 정책) 게임 입력에서 호출하면 됨.
 */

let ctx: AudioContext | null = null;
function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** 노이즈 버퍼 (재사용) */
let noiseBuf: AudioBuffer | null = null;
function noise(c: AudioContext): AudioBuffer {
  if (!noiseBuf || noiseBuf.sampleRate !== c.sampleRate) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

function env(c: AudioContext, peak: number, attack: number, decay: number, at = c.currentTime) {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
  g.connect(c.destination);
  return g;
}

/**
 * 나무판에 기물 놓는 "딱!" — 모달 합성.
 * 아주 짧은 타격(임펄스)이 나무의 고유 진동수 몇 개를 울리고 수십 ms 안에 사라짐.
 * 낮은 음이 길게 남으면 북소리처럼 들려서, 저음은 아주 짧게만 넣음.
 */
type Mode = [freq: number, amp: number, decayMs: number];
const CLACK: Mode[] = [
  [1180, 1, 38],
  [1730, 0.75, 30],
  [2690, 0.55, 22],
  [3610, 0.35, 16],
  [5230, 0.2, 10],
  [210, 0.35, 9], // 판이 살짝 울리는 몸통 (짧게)
];
const CAPTURE: Mode[] = [
  [1320, 1, 32],
  [2010, 0.85, 26],
  [3050, 0.6, 18],
  [4420, 0.4, 12],
  [6100, 0.25, 8],
  [190, 0.4, 10],
];

const bufCache = new Map<string, AudioBuffer>();
function clackBuffer(c: AudioContext, kind: "move" | "capture", scale: number): AudioBuffer {
  const key = `${kind}:${scale}:${c.sampleRate}`;
  const hit = bufCache.get(key);
  if (hit) return hit;
  const sr = c.sampleRate;
  const len = Math.floor(sr * 0.16);
  const buf = c.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  const modes = kind === "capture" ? CAPTURE : CLACK;
  // 두 번 부딪히는 소리 (잡을 땐 기물끼리 한 번 더)
  const hits =
    kind === "capture"
      ? [
          [0, 1],
          [0.028, 0.55],
        ]
      : [[0, 1]];
  for (const [at, gain] of hits) {
    const off = Math.floor(at * sr);
    for (const [f0, amp, decay] of modes) {
      const f = f0 * scale;
      const k = 1000 / (decay * sr);
      const w = (2 * Math.PI * f) / sr;
      const ph = Math.random() * Math.PI * 2;
      for (let i = 0; off + i < len; i++) {
        const e = Math.exp(-i * k);
        if (e < 0.001) break;
        d[off + i] += gain * amp * e * Math.sin(w * i + ph);
      }
    }
    // 타격 순간의 "틱" (1.5ms 노이즈)
    const n = Math.floor(sr * 0.0015);
    for (let i = 0; i < n && off + i < len; i++)
      d[off + i] += gain * 0.9 * (Math.random() * 2 - 1) * (1 - i / n);
  }
  // 정규화
  let peak = 0;
  for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(d[i]));
  if (peak > 0) for (let i = 0; i < len; i++) d[i] /= peak;
  bufCache.set(key, buf);
  return buf;
}

/**
 * 실제 녹음 파일이 있으면 그걸 씀: public/audio/sfx/piece-move.mp3, piece-capture.mp3
 * (없거나 못 읽으면 위의 합성음으로)
 */
const samples = new Map<string, Promise<AudioBuffer | null>>();
function sample(c: AudioContext, kind: "move" | "capture") {
  const url = `/audio/sfx/piece-${kind}.mp3`;
  let p = samples.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
      .then((b) => c.decodeAudioData(b))
      .catch(() => null);
    samples.set(url, p);
  }
  return p;
}

/** 기물 놓는 소리. scale은 음높이 배율 (장기 알은 크고 두꺼워서 조금 낮게) */
export function playPiece(kind: "move" | "capture" = "move", vol = 1, scale = 1) {
  const c = ac();
  if (!c) return;
  void sample(c, kind).then((rec) => {
    const src = c.createBufferSource();
    src.buffer = rec ?? clackBuffer(c, kind, scale);
    // 매번 살짝 다르게 (녹음 파일은 장기일 때 조금 낮게)
    src.playbackRate.value = (rec ? scale ** 0.5 : 1) * (0.97 + Math.random() * 0.06);
    const g = c.createGain();
    g.gain.value = (rec ? 0.9 : 0.55) * vol;
    src.connect(g).connect(c.destination);
    src.start();
  });
}

/** 첫 착수 때 늦지 않게 미리 받아 둠 */
export function preloadPieceSounds() {
  const c = ac();
  if (!c) return;
  void sample(c, "move");
  void sample(c, "capture");
}

/** 깃발 꽂기 "톡" (뽑을 땐 음이 내려감) */
export function playFlag(on: boolean, vol = 1) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  o.type = "triangle";
  const [a, b] = on ? [520, 1040] : [900, 450];
  o.frequency.setValueAtTime(a, t);
  o.frequency.exponentialRampToValueAtTime(b, t + 0.08);
  o.connect(env(c, 0.3 * vol, 0.004, 0.11, t));
  o.start(t);
  o.stop(t + 0.14);
}

/** 칸 열기 "톡" — 짧고 부드러운 물방울 소리 */
export function playReveal(vol = 1) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(980, t);
  o.frequency.exponentialRampToValueAtTime(620, t + 0.05);
  o.connect(env(c, 0.28 * vol, 0.003, 0.07, t));
  o.start(t);
  o.stop(t + 0.09);
}

/** 좌우 동시 클릭(자동 열기) "또로롱" — 올라가는 짧은 3음 */
export function playChord(vol = 1) {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime;
  [660, 880, 1175].forEach((f, i) => {
    const t = t0 + i * 0.045;
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(f, t);
    o.connect(env(c, 0.2 * vol, 0.003, 0.08, t));
    o.start(t);
    o.stop(t + 0.1);
  });
}

/** 지뢰 폭발 "콰광" — 저역 노이즈 + 떨어지는 저음 */
export function playExplosion(vol = 1) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  const n = c.createBufferSource();
  n.buffer = noise(c);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(2400, t);
  lp.frequency.exponentialRampToValueAtTime(120, t + 0.9);
  n.connect(lp).connect(env(c, 0.9 * vol, 0.005, 1.0, t));
  n.start(t);
  n.stop(t + 1.1);
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(110, t);
  o.frequency.exponentialRampToValueAtTime(32, t + 0.6);
  o.connect(env(c, 0.8 * vol, 0.005, 0.7, t));
  o.start(t);
  o.stop(t + 0.75);
}
