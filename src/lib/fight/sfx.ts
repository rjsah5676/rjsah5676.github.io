/**
 * 격투게임 효과음 — Web Audio로 즉석 합성 (파일 없음).
 * 아케이드 격투게임 느낌을 내려고 소리를 겹쳐 만듦:
 *   타격 = 딱 하는 고음 클릭 + 찌그러뜨린(포화) 저음 쿵 + 거친 노이즈 + 짧은 잔향
 *   가드 = 둔탁한 쿵 + 금속성 울림, 휘두르기 = 위로 쓸리는 바람 소리
 * 마지막에 압축기(컴프레서)를 걸어 소리가 단단하고 크게 들리게 함.
 * 능력별(불·바람·채찍·물)로 맞는 소리·탄 소리를 조금씩 다르게.
 */
export type Element = "fire" | "wind" | "whip" | "water" | "bolt" | "ice";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let bus: GainNode | null = null;
let verb: ConvolverNode | null = null;
let volume = 0.8;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = volume;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 6;
      comp.ratio.value = 6;
      comp.attack.value = 0.002;
      comp.release.value = 0.12;
      comp.connect(master);
      master.connect(ctx.destination);
      bus = ctx.createGain();
      bus.connect(comp);
      // 짧은 잔향 (노이즈로 만든 0.35초 임펄스)
      verb = ctx.createConvolver();
      const len = Math.floor(ctx.sampleRate * 0.35);
      const ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      }
      verb.buffer = ir;
      const vg = ctx.createGain();
      vg.gain.value = 0.22;
      verb.connect(vg).connect(comp);
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function setFightVolume(v: number) {
  volume = v;
  if (master) master.gain.value = v;
}

let noiseBuf: AudioBuffer | null = null;
function noise(c: AudioContext) {
  if (!noiseBuf || noiseBuf.sampleRate !== c.sampleRate) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

const curves = new Map<number, Float32Array<ArrayBuffer>>();
/** 포화(찌그러뜨림) 곡선 */
function drive(c: AudioContext, amt: number) {
  let cv = curves.get(amt);
  if (!cv) {
    cv = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) {
      const x = (i / 1023) * 2 - 1;
      cv[i] = Math.tanh(x * amt) / Math.tanh(amt);
    }
    curves.set(amt, cv);
  }
  const w = c.createWaveShaper();
  w.curve = cv;
  return w;
}

/** 음량 봉투 → 버스 (wet = 잔향으로 보내는 양) */
function env(c: AudioContext, peak: number, attack: number, decay: number, at: number, wet = 0) {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
  g.connect(bus!);
  if (wet > 0 && verb) {
    const s = c.createGain();
    s.gain.value = wet;
    g.connect(s).connect(verb);
  }
  return g;
}

function burst(
  c: AudioContext,
  t: number,
  freq: number,
  q: number,
  peak: number,
  decay: number,
  type: BiquadFilterType = "bandpass",
  wet = 0,
  sweepTo?: number
) {
  const n = c.createBufferSource();
  n.buffer = noise(c);
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + decay);
  f.Q.value = q;
  n.connect(f).connect(env(c, peak, 0.002, decay, t, wet));
  n.start(t, Math.random() * 0.5);
  n.stop(t + decay + 0.05);
}

function tone(
  c: AudioContext,
  t: number,
  type: OscillatorType,
  f0: number,
  f1: number,
  peak: number,
  decay: number,
  amt = 0,
  wet = 0
) {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + decay);
  const out = env(c, peak, 0.002, decay, t, wet);
  if (amt > 0) o.connect(drive(c, amt)).connect(out);
  else o.connect(out);
  o.start(t);
  o.stop(t + decay + 0.05);
}

/** 맞음: power 0(약)~2(필살기), el = 때린 쪽 능력 */
export function sfxHit(power: number, el: Element = "wind") {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  // 1) 딱 — 고음 클릭
  burst(c, t, 4500, 0.7, 0.55, 0.018, "highpass");
  // 2) 쿵 — 찌그러뜨린 저음 (세질수록 낮고 길게)
  tone(c, t, "sine", 210 - power * 40, 42, 0.95, 0.09 + power * 0.07, 3.5, 0.15);
  // 3) 퍽 — 거친 중음 노이즈
  burst(c, t, 1200 - power * 250, 0.9, 0.5 + power * 0.12, 0.06 + power * 0.05, "bandpass", 0.25);
  // 능력별 덧소리
  if (el === "fire") burst(c, t + 0.01, 2600, 0.6, 0.22, 0.18 + power * 0.08, "highpass", 0.3, 900);
  else if (el === "water") {
    tone(c, t, "sine", 520, 1400, 0.18, 0.08);
    burst(c, t + 0.02, 900, 3, 0.18, 0.14, "bandpass", 0.3, 400);
  } else if (el === "whip") tone(c, t, "triangle", 2400, 900, 0.12, 0.05);
  else if (el === "wind") burst(c, t, 1800, 0.8, 0.16, 0.12, "bandpass", 0.2, 600);
  else if (el === "bolt") {
    // 찌직 — 전기
    tone(c, t, "square", 1800, 300, 0.1, 0.08, 2);
    burst(c, t, 5200, 2, 0.25, 0.1, "bandpass", 0.2, 2400);
  }
  if (power >= 2) {
    // 필살기 마무리: 큰 폭발음
    burst(c, t + 0.02, 380, 0.5, 0.7, 0.45, "lowpass", 0.5, 120);
    tone(c, t + 0.02, "sine", 70, 30, 0.8, 0.4, 2);
  }
}

export function sfxBlock() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  tone(c, t, "sine", 140, 70, 0.5, 0.07, 2);
  tone(c, t, "square", 1900, 1500, 0.07, 0.09, 0, 0.4);
  tone(c, t, "triangle", 2850, 2600, 0.06, 0.14, 0, 0.4);
  burst(c, t, 3800, 3, 0.25, 0.05);
}

/** 휘두르기 (공격 시작) */
export function sfxWhoosh(heavy: boolean, el: Element = "wind") {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  if (el === "whip") {
    // 채찍: 쉬익 하고 끝에 짝
    burst(c, t, 900, 1.5, heavy ? 0.22 : 0.15, 0.1, "bandpass", 0, 3800);
    burst(c, t + (heavy ? 0.11 : 0.07), 5000, 0.8, heavy ? 0.6 : 0.45, 0.02, "highpass", 0.3);
    return;
  }
  burst(c, t, heavy ? 450 : 800, 1.4, heavy ? 0.26 : 0.16, heavy ? 0.16 : 0.1, "bandpass", 0, heavy ? 2200 : 3000);
}

/** 탄 발사 */
export function sfxProj(el: Element = "fire", big = false) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  if (el === "bolt") {
    // 슈웅 찌직 — 번개 창
    burst(c, t, 900, 1.2, 0.3, 0.16, "bandpass", 0.2, 5000);
    tone(c, t, "square", 2400, 600, 0.08, 0.12, 2);
    return;
  }
  if (el === "water") {
    // 퐁 — 물방울
    tone(c, t, "sine", 300, 1100, 0.3, 0.12, 0, 0.3);
    tone(c, t + 0.05, "sine", 600, 1500, 0.15, 0.08);
    if (big) burst(c, t, 600, 0.6, 0.45, 0.7, "lowpass", 0.4, 2200);
    return;
  }
  // 화르륵 — 불꽃
  burst(c, t, 500, 0.8, 0.4, 0.28, "bandpass", 0.3, 2400);
  burst(c, t, 3000, 0.5, 0.18, 0.3, "highpass", 0.2);
  tone(c, t, "sawtooth", 140, 60, 0.2, 0.2, 2);
}

/** 대시 */
export function sfxDash() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  burst(c, t, 600, 1, 0.18, 0.12, "bandpass", 0, 2600);
  tone(c, t, "sine", 120, 60, 0.15, 0.06);
}

/** 필살기 발동 (화면 멈춤) */
export function sfxSuper() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  // 우웅 — 기 모으는 소리 + 번쩍
  tone(c, t, "sawtooth", 80, 320, 0.25, 0.55, 2.5, 0.4);
  tone(c, t, "square", 160, 640, 0.08, 0.5, 0, 0.4);
  burst(c, t, 400, 0.6, 0.3, 0.55, "bandpass", 0.5, 5000);
  tone(c, t + 0.5, "triangle", 1568, 1568, 0.22, 0.35, 0, 0.6);
  tone(c, t + 0.5, "triangle", 2093, 2093, 0.14, 0.35, 0, 0.6);
}

export function sfxJump() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  burst(c, t, 700, 1, 0.1, 0.07, "bandpass", 0, 1500);
}

export function sfxLand() {
  const c = ac();
  if (!c) return;
  tone(c, c.currentTime, "sine", 110, 50, 0.25, 0.06, 1.5);
}

export function sfxKO() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  burst(c, t, 4500, 0.7, 0.6, 0.02, "highpass");
  tone(c, t, "sine", 120, 28, 1, 1.1, 4, 0.5);
  burst(c, t, 300, 0.5, 0.8, 1.2, "lowpass", 0.7, 60);
  tone(c, t + 0.15, "sawtooth", 220, 55, 0.18, 1, 2, 0.5);
}

/** 라운드 시작(낮게)·FIGHT(크게) — 징 + 화음 */
export function sfxBell(high: boolean) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  if (!high) {
    tone(c, t, "sine", 98, 92, 0.5, 1.2, 1.5, 0.6);
    tone(c, t, "triangle", 196, 190, 0.18, 1, 0, 0.6);
    burst(c, t, 2500, 4, 0.12, 0.6, "bandpass", 0.6);
    return;
  }
  // 파워코드 찍기
  for (const [f, v] of [
    [110, 0.4],
    [165, 0.3],
    [220, 0.25],
    [330, 0.15],
  ] as const)
    tone(c, t, "sawtooth", f, f * 0.98, v, 0.6, 3, 0.5);
  burst(c, t, 4500, 0.7, 0.5, 0.03, "highpass", 0.4);
  tone(c, t, "sine", 80, 40, 0.8, 0.3, 3);
}
