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

/** 나무판에 기물 놓는 "탁" — 짧은 노이즈 클릭 + 낮은 공명. capture면 조금 더 묵직하게 두 번 */
export function playPiece(kind: "move" | "capture" = "move", vol = 1) {
  const c = ac();
  if (!c) return;
  const hit = (at: number, pitch: number, amp: number) => {
    // 딱 소리
    const n = c.createBufferSource();
    n.buffer = noise(c);
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = pitch * 6;
    bp.Q.value = 1.2;
    n.connect(bp).connect(env(c, 0.5 * amp * vol, 0.002, 0.05, at));
    n.start(at, Math.random() * 0.5, 0.08);
    // 나무 울림
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(pitch, at);
    o.frequency.exponentialRampToValueAtTime(pitch * 0.7, at + 0.1);
    o.connect(env(c, 0.35 * amp * vol, 0.003, 0.12, at));
    o.start(at);
    o.stop(at + 0.15);
  };
  const t = c.currentTime;
  if (kind === "capture") {
    hit(t, 190, 1);
    hit(t + 0.07, 150, 1.1);
  } else hit(t, 230 + Math.random() * 30, 1);
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
