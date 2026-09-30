/**
 * 곡 이벤트를 OfflineAudioContext로 미리 렌더링 → AudioBuffer.
 * 실시간 합성 대신 미리 굽는 이유: 재생 중 끊김이 없고, 재생 위치가 오디오 시계와 정확히 일치해서
 * 판정 싱크가 흔들리지 않는다.
 *
 * 속도: 노드는 만들어 둔 순간부터 렌더링이 끝날 때까지 계속 처리 비용이 들어서, 곡 전체를 한 번에
 * 구우면 (노드 수 × 곡 길이)만큼 느려진다. 그래서 몇 마디씩 잘라 따로 굽고(뒤에 여운 포함) 더한다.
 * 필터도 악기별로 하나만 두고 공유한다.
 */
import type { MusicEvent, Song } from "./music";

const SR = 44100;
/** 한 조각 길이(마디) */
const CHUNK_BARS = 4;
/** 조각 뒤로 더 굽는 여운(초): 패드 릴리즈·딜레이 꼬리 */
const TAIL = 2.4;

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

function makeNoise(ctx: BaseAudioContext) {
  const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let seed = 12345;
  for (let i = 0; i < d.length; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    d[i] = (seed / 0x7fffffff) * 2 - 1;
  }
  return buf;
}

/** events를 t0 기준으로 len초 동안 굽기 */
async function renderChunk(
  song: Song,
  events: MusicEvent[],
  t0: number,
  len: number
): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(2, Math.ceil(len * SR), SR);
  const stepSec = 60 / song.bpm / 4;
  const noise = makeNoise(ctx);
  const chip = song.sound.lead === "square";

  const bus = ctx.createGain();
  bus.gain.value = 0.8;
  bus.connect(ctx.destination);

  // 리드·아르페지오용 스테레오 딜레이 (L 한 번, R 두 번 늦게)
  const send = ctx.createGain();
  const dl = ctx.createDelay(2);
  const dr = ctx.createDelay(2);
  dl.delayTime.value = stepSec * song.sound.delaySteps;
  dr.delayTime.value = stepSec * song.sound.delaySteps;
  const fb = ctx.createGain();
  fb.gain.value = 0.3;
  const wet = ctx.createGain();
  wet.gain.value = 0.22;
  const merger = ctx.createChannelMerger(2);
  send.connect(dl);
  dl.connect(fb).connect(dl);
  dl.connect(dr);
  dl.connect(merger, 0, 0);
  dr.connect(merger, 0, 1);
  merger.connect(wet).connect(bus);

  const filter = (type: BiquadFilterType, freq: number, q = 0.7, dest: AudioNode = bus) => {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    f.connect(dest);
    return f;
  };
  // 악기별 공유 필터
  const hatF = filter("highpass", 8000);
  const ohatF = filter("highpass", 7000);
  const snareF = filter("highpass", 1400);
  const clapF = filter("bandpass", 1500, 1.2);
  const padF = filter("lowpass", 1300, 1);
  const arpF = filter("lowpass", 3200, 1);
  const leadF = filter("lowpass", chip ? 5000 : 3400, 1);
  const bassF = filter("lowpass", 850, 3);
  const arpSend = ctx.createGain();
  arpSend.gain.value = 0.35;
  arpF.connect(arpSend).connect(send);
  const leadSend = ctx.createGain();
  leadSend.gain.value = 0.6;
  leadF.connect(leadSend).connect(send);

  const gainEnv = (
    t: number,
    peak: number,
    a: number,
    hold: number,
    rel: number,
    dest: AudioNode
  ) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setValueAtTime(peak, t + a + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + rel);
    g.connect(dest);
    return g;
  };
  const osc = (
    type: OscillatorType,
    freq: number,
    t: number,
    end: number,
    dest: AudioNode,
    detune = 0
  ) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    o.connect(dest);
    o.start(t);
    o.stop(end);
    return o;
  };
  const noiseHit = (t: number, v: number, dest: AudioNode, dur: number) => {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    const g = ctx.createGain();
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(g).connect(dest);
    s.start(t, (t * 7.3) % 0.5);
    s.stop(t + dur + 0.02);
  };
  const tone = (
    type: OscillatorType,
    midi: number,
    t: number,
    dur: number,
    peak: number,
    dest: AudioNode,
    { detune = 0, a = 0.008, rel = 0.08 } = {}
  ) => {
    const g = gainEnv(t, peak, a, Math.max(0, dur - a), rel, dest);
    const end = t + dur + rel + 0.05;
    if (detune) {
      osc(type, hz(midi), t, end, g, -detune);
      osc(type, hz(midi), t, end, g, detune);
    } else osc(type, hz(midi), t, end, g);
  };

  for (const e of events) {
    const t = e.step * stepSec - t0;
    const dur = e.len * stepSec;
    const v = e.vel;
    switch (e.kind) {
      case "kick": {
        const o = ctx.createOscillator();
        o.frequency.setValueAtTime(150, t);
        o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.95 * v, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
        o.connect(g).connect(bus);
        o.start(t);
        o.stop(t + 0.45);
        break;
      }
      case "snare": {
        noiseHit(t, 0.42 * v, snareF, 0.18);
        const o = ctx.createOscillator();
        o.type = "triangle";
        o.frequency.setValueAtTime(200, t);
        o.frequency.exponentialRampToValueAtTime(140, t + 0.08);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.35 * v, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
        o.connect(g).connect(bus);
        o.start(t);
        o.stop(t + 0.14);
        break;
      }
      case "clap":
        for (const d of [0, 0.011, 0.022]) noiseHit(t + d, 0.22 * v, clapF, 0.1 + d * 3);
        break;
      case "hat":
        noiseHit(t, 0.1 * v, hatF, 0.035);
        break;
      case "ohat":
        noiseHit(t, 0.08 * v, ohatF, 0.22);
        break;
      case "bass":
        tone("sawtooth", e.midi!, t, dur * 0.85, 0.3 * v, bassF, { rel: 0.05 });
        break;
      case "pad":
        tone("sawtooth", e.midi!, t, dur, 0.035, padF, { detune: 9, a: 0.35, rel: 0.6 });
        break;
      case "arp":
        tone(song.sound.arp, e.midi!, t, Math.min(dur, stepSec) * 0.9, chip ? 0.05 : 0.08, arpF, {
          rel: 0.05,
        });
        break;
      case "lead":
        tone(song.sound.lead, e.midi!, t, dur * 0.95, chip ? 0.09 : 0.11, leadF, {
          detune: chip ? 0 : 7,
          rel: 0.12,
        });
        break;
    }
  }
  return ctx.startRendering();
}

export async function renderSong(
  song: Song,
  onProgress?: (p: number) => void
): Promise<AudioBuffer> {
  const stepSec = 60 / song.bpm / 4;
  const chunkSteps = CHUNK_BARS * 16;
  const total = Math.ceil(song.duration * SR);
  const out = [new Float32Array(total), new Float32Array(total)];

  const jobs: (() => Promise<void>)[] = [];
  for (let s0 = 0; s0 < song.bars * 16; s0 += chunkSteps) {
    const evs = song.events.filter((e) => e.step >= s0 && e.step < s0 + chunkSteps);
    if (!evs.length) continue;
    const t0 = s0 * stepSec;
    const len = Math.min(chunkSteps * stepSec + TAIL, song.duration - t0);
    jobs.push(async () => {
      const buf = await renderChunk(song, evs, t0, len);
      const at = Math.round(t0 * SR);
      for (let c = 0; c < 2; c++) {
        const d = buf.getChannelData(c);
        const o = out[c];
        const n = Math.min(d.length, total - at);
        for (let i = 0; i < n; i++) o[at + i] += d[i];
      }
    });
  }
  // 동시에 몇 개씩 (렌더링 스레드가 여러 개라 병렬로 빨라짐)
  let done = 0;
  const queue = [...jobs];
  const worker = async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      await job();
      onProgress?.(++done / jobs.length);
    }
  };
  await Promise.all([worker(), worker(), worker()]);

  // 피크 정규화 + 부드러운 클리핑으로 음량 끌어올리기
  let peak = 0;
  for (const d of out) for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
  const drive = 1.6;
  const norm = Math.tanh(drive);
  const k = peak > 0 ? 1 / peak : 1;
  const result = new AudioBuffer({ numberOfChannels: 2, length: total, sampleRate: SR });
  out.forEach((d, c) => {
    for (let i = 0; i < d.length; i++) d[i] = (Math.tanh(d[i] * k * drive) / norm) * 0.9;
    result.copyToChannel(d, c);
  });
  return result;
}

/** 싱크 맞추기용 메트로놈: 120 BPM 클릭 n번 (첫 클릭은 1초 뒤) */
export async function renderMetronome(
  beats = 16,
  bpm = 120
): Promise<{ buffer: AudioBuffer; times: number[] }> {
  const beat = 60 / bpm;
  const times = Array.from({ length: beats }, (_, i) => 1 + i * beat);
  const ctx = new OfflineAudioContext(1, Math.ceil((times[times.length - 1] + 1) * SR), SR);
  times.forEach((t, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = i % 4 === 0 ? 1760 : 1320;
    g.gain.setValueAtTime(0.6, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.07);
  });
  return { buffer: await ctx.startRendering(), times };
}
