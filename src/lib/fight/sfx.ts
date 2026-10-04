/**
 * 격투게임 효과음 — Web Audio로 즉석 합성 (파일 없음).
 * 타격음은 짧은 노이즈 + 떨어지는 저음, 가드는 금속성 고음, 휘두르기는 걸러진 노이즈.
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let volume = 0.8;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = volume;
      master.connect(ctx.destination);
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

function env(c: AudioContext, peak: number, attack: number, decay: number, at: number) {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
  g.connect(master!);
  return g;
}

function burst(
  c: AudioContext,
  t: number,
  freq: number,
  q: number,
  peak: number,
  decay: number,
  type: BiquadFilterType = "bandpass"
) {
  const n = c.createBufferSource();
  n.buffer = noise(c);
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  n.connect(f).connect(env(c, peak, 0.003, decay, t));
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
  decay: number
) {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + decay);
  o.connect(env(c, peak, 0.004, decay, t));
  o.start(t);
  o.stop(t + decay + 0.05);
}

/** 맞음: power 0(약)~2(초필살) */
export function sfxHit(power: number) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  burst(c, t, 900 - power * 200, 0.8, 0.5 + power * 0.15, 0.08 + power * 0.06);
  tone(c, t, "sine", 160 - power * 30, 50, 0.6 + power * 0.1, 0.12 + power * 0.08);
  if (power >= 2) burst(c, t + 0.03, 300, 0.6, 0.5, 0.35, "lowpass");
}

export function sfxBlock() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  tone(c, t, "square", 1500, 900, 0.12, 0.06);
  burst(c, t, 3200, 4, 0.35, 0.07);
}

export function sfxWhoosh(heavy: boolean) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  const n = c.createBufferSource();
  n.buffer = noise(c);
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.Q.value = 1.2;
  f.frequency.setValueAtTime(heavy ? 500 : 900, t);
  f.frequency.exponentialRampToValueAtTime(heavy ? 1800 : 2600, t + 0.12);
  n.connect(f).connect(env(c, heavy ? 0.22 : 0.14, 0.02, heavy ? 0.16 : 0.1, t));
  n.start(t, Math.random() * 0.5);
  n.stop(t + 0.3);
}

export function sfxProj() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  tone(c, t, "sawtooth", 220, 880, 0.12, 0.18);
  burst(c, t, 1400, 1, 0.15, 0.2);
}

export function sfxSuper() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  tone(c, t, "sawtooth", 110, 440, 0.18, 0.5);
  tone(c, t + 0.05, "triangle", 660, 1320, 0.16, 0.45);
  burst(c, t, 2000, 0.7, 0.2, 0.5);
}

export function sfxJump() {
  const c = ac();
  if (!c) return;
  burst(c, c.currentTime, 500, 1, 0.08, 0.06, "lowpass");
}

export function sfxKO() {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  burst(c, t, 250, 0.5, 0.7, 0.8, "lowpass");
  tone(c, t, "sine", 90, 30, 0.7, 0.9);
}

/** 라운드 시작·FIGHT 알림 */
export function sfxBell(high: boolean) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime;
  tone(c, t, "triangle", high ? 1046 : 784, high ? 1046 : 784, 0.25, high ? 0.5 : 0.3);
  tone(c, t, "sine", high ? 2093 : 1568, high ? 2093 : 1568, 0.08, 0.4);
}
