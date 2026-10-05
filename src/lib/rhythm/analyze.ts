/**
 * 사용자가 넣은 음악 파일 분석 → 자동 채보용 데이터.
 * 파일은 서버로 보내지 않고 브라우저 안에서만 처리한다.
 *
 *  1. 22.05kHz 모노로 리샘플
 *  2. STFT(1024/256) 스펙트럴 플럭스를 저·중·고 대역별로 → 타격(onset) 후보
 *  3. 1.5ms 해상도 에너지 곡선에서 실제 어택 지점으로 시각 재보정
 *  4. 자기상관으로 템포, 동적 계획법(Ellis)으로 비트 위치 추적
 *  5. 비트를 32분음표 격자로 나누고, 실제 타격과의 평균 어긋남만큼 격자를 옮긴 뒤 타격을 격자에 스냅
 *     (격자 번호 % 8 === 0 정박, % 4 8분, % 2 16분, 홀수 32분)
 */

export const SR = 22050;
const N = 1024;
const HOP = 256;
export const FPS = SR / HOP;

export interface Onset {
  /** 시각(초) — 격자에 스냅됐으면 격자 시각 */
  t: number;
  /** 세기 0~1 (곡 안에서 상대값) */
  s: number;
  low: number;
  mid: number;
  high: number;
  /** 음색 높이 (스펙트럼 무게중심, 로그) */
  cen: number;
  /** 32분음표 격자 번호 (-1이면 격자 밖). %8=정박 · %4=8분 · %2=16분 · 홀수=32분 */
  grid: number;
}

export interface Analysis {
  duration: number;
  bpm: number;
  /** 비트(4분음표) 시각들 */
  beats: number[];
  /** 32분음표 격자 시각들 */
  grid: number[];
  /** 한 비트(4분음표) 안의 격자 칸 수 */
  div: number;
  onsets: Onset[];
  /** 프레임별 음량 (FPS 단위) */
  rms: Float32Array;
}

type Progress = (ratio: number, label: string) => void;
const tick = () => new Promise((r) => setTimeout(r, 0));

// ───────────── FFT ─────────────

function makeFft(n: number) {
  const rev = new Uint32Array(n);
  const bits = Math.log2(n);
  for (let i = 0; i < n; i++) {
    let r = 0;
    for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b);
    rev[i] = r;
  }
  const cos = new Float32Array(n / 2);
  const sin = new Float32Array(n / 2);
  for (let i = 0; i < n / 2; i++) {
    cos[i] = Math.cos((2 * Math.PI * i) / n);
    sin[i] = -Math.sin((2 * Math.PI * i) / n);
  }
  return (re: Float32Array, im: Float32Array) => {
    for (let i = 0; i < n; i++) {
      const j = rev[i];
      if (j > i) {
        let t = re[i];
        re[i] = re[j];
        re[j] = t;
        t = im[i];
        im[i] = im[j];
        im[j] = t;
      }
    }
    for (let size = 2; size <= n; size <<= 1) {
      const half = size >> 1;
      const step = n / size;
      for (let i = 0; i < n; i += size) {
        for (let j = 0, k = 0; j < half; j++, k += step) {
          const a = i + j;
          const b = a + half;
          const tr = re[b] * cos[k] - im[b] * sin[k];
          const ti = re[b] * sin[k] + im[b] * cos[k];
          re[b] = re[a] - tr;
          im[b] = im[a] - ti;
          re[a] += tr;
          im[a] += ti;
        }
      }
    }
  };
}

// ───────────── 통계 헬퍼 ─────────────

function percentile(a: ArrayLike<number>, p: number) {
  const s = Float32Array.from(a).sort();
  return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0;
}
const median = (a: number[]) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
};

/** 구간 평균 (누적합으로 빠르게) */
function movingMean(x: Float32Array, before: number, after: number) {
  const cum = new Float64Array(x.length + 1);
  for (let i = 0; i < x.length; i++) cum[i + 1] = cum[i] + x[i];
  const out = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) {
    const a = Math.max(0, i - before);
    const b = Math.min(x.length, i + after + 1);
    out[i] = (cum[b] - cum[a]) / (b - a);
  }
  return out;
}

// ───────────── 본체 ─────────────

export async function analyzeAudio(
  buffer: AudioBuffer,
  progress: Progress,
  /** straight: 셋잇단처럼 보여도 1.5배 템포 4/4로 (내장곡 채보 만들 때 직접 지정) */
  opt: { straight?: boolean } = {}
): Promise<Analysis> {
  progress(0.02, "모노로 변환 중");
  const len = Math.ceil(buffer.duration * SR);
  const off = new OfflineAudioContext(1, len, SR);
  const src = off.createBufferSource();
  src.buffer = buffer;
  src.connect(off.destination);
  src.start();
  const x = (await off.startRendering()).getChannelData(0);

  // ── STFT → 대역별 플럭스 ──
  const frames = Math.floor(x.length / HOP) + 1;
  const half = N / 2;
  const fft = makeFft(N);
  const win = new Float32Array(N);
  for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1));
  const re = new Float32Array(N);
  const im = new Float32Array(N);
  let prev = new Float32Array(half + 1);
  let cur = new Float32Array(half + 1);
  const fl = new Float32Array(frames);
  const fm = new Float32Array(frames);
  const fh = new Float32Array(frames);
  const cen = new Float32Array(frames);
  const rms = new Float32Array(frames);
  const LOW = Math.round((200 * N) / SR); // ~200Hz
  const MID = Math.round((2000 * N) / SR); // ~2kHz

  for (let f = 0; f < frames; f++) {
    // 프레임 중심 = f * HOP (시각 f/FPS 와 맞춤)
    const start = f * HOP - half;
    let e = 0;
    for (let j = 0; j < N; j++) {
      const v = x[start + j] ?? 0;
      re[j] = v * win[j];
      im[j] = 0;
      e += v * v;
    }
    rms[f] = Math.sqrt(e / N);
    fft(re, im);
    let l = 0;
    let m = 0;
    let h = 0;
    let cw = 0;
    let cs = 0;
    for (let k = 1; k <= half; k++) {
      const mag = Math.hypot(re[k], im[k]);
      const lm = Math.log1p(100 * mag);
      cur[k] = lm;
      const d = lm - prev[k];
      if (d > 0) {
        if (k <= LOW) l += d;
        else if (k <= MID) m += d;
        else h += d;
      }
      if (k > LOW) {
        cw += k * mag;
        cs += mag;
      }
    }
    fl[f] = l / LOW;
    fm[f] = m / (MID - LOW);
    fh[f] = h / (half - MID);
    cen[f] = cs > 0 ? Math.log2((cw / cs) * (SR / N)) : 0;
    [prev, cur] = [cur, prev];
    if (f % 2000 === 0) {
      progress(0.05 + 0.55 * (f / frames), "소리 쪼개서 분석 중");
      await tick();
    }
  }

  // 대역별로 정규화 (곡마다 음량·믹스가 달라도 비슷한 기준이 되게)
  for (const b of [fl, fm, fh]) {
    const p = percentile(b, 0.98) || 1;
    for (let i = 0; i < b.length; i++) b[i] = Math.min(1.5, b[i] / p);
  }
  const odf = new Float32Array(frames);
  for (let i = 0; i < frames; i++) odf[i] = fl[i] * 1.0 + fm[i] * 0.9 + fh[i] * 0.55;
  // 살짝 부드럽게
  const sm = new Float32Array(frames);
  for (let i = 0; i < frames; i++)
    sm[i] = 0.25 * (odf[i - 1] ?? odf[i]) + 0.5 * odf[i] + 0.25 * (odf[i + 1] ?? odf[i]);

  progress(0.62, "박자(BPM) 찾는 중");
  await tick();

  // ── 템포: 평균 뺀 플럭스의 자기상관 ──
  const base = movingMean(sm, Math.round(FPS), Math.round(FPS));
  const hp = new Float32Array(frames);
  for (let i = 0; i < frames; i++) hp[i] = Math.max(0, sm[i] - base[i]);
  const minLag = Math.floor((FPS * 60) / 200);
  const maxLag = Math.ceil((FPS * 60) / 60);
  const ac = new Float32Array(maxLag * 3 + 2);
  for (let lag = minLag; lag < ac.length; lag++) {
    let s = 0;
    for (let i = 0; i + lag < frames; i++) s += hp[i] * hp[i + lag];
    ac[lag] = s / (frames - lag);
  }
  let bestLag = minLag;
  let bestScore = -Infinity;
  const scoreOf = (lag: number) => {
    const bpm = (60 * FPS) / lag;
    const w = Math.exp(-0.5 * (Math.log2(bpm / 120) / 0.9) ** 2);
    // 박의 배수에서도 상관이 크면 진짜 박일 가능성이 큼
    return w * (ac[lag] + 0.5 * (ac[lag * 2] ?? 0) + 0.25 * (ac[lag * 3] ?? 0));
  };
  for (let lag = minLag; lag <= maxLag; lag++) {
    const s = scoreOf(lag);
    if (s > bestScore) {
      bestScore = s;
      bestLag = lag;
    }
  }
  // 포물선 보간으로 소수점 lag
  const a0 = ac[bestLag - 1];
  const a1 = ac[bestLag];
  const a2 = ac[bestLag + 1];
  const denom = a0 - 2 * a1 + a2;
  const period = bestLag + (denom !== 0 ? (0.5 * (a0 - a2)) / denom : 0);

  // ── 비트 추적 (동적 계획법) ──
  progress(0.7, "비트 위치 맞추는 중");
  await tick();
  const std = Math.sqrt(hp.reduce((s, v) => s + v * v, 0) / frames) || 1;
  const local = new Float32Array(frames);
  {
    const sig = Math.max(1, period / 32);
    const r = Math.ceil(sig * 3);
    const k: number[] = [];
    for (let i = -r; i <= r; i++) k.push(Math.exp(-0.5 * (i / sig) ** 2));
    for (let i = 0; i < frames; i++) {
      let s = 0;
      for (let j = -r; j <= r; j++) s += (hp[i + j] ?? 0) * k[j + r];
      local[i] = s / std;
    }
  }
  const score = new Float32Array(frames);
  const back = new Int32Array(frames).fill(-1);
  const TIGHT = 300;
  const lo = Math.round(period / 2);
  const hi = Math.round(period * 2);
  for (let i = 0; i < frames; i++) {
    let best = 0;
    let arg = -1;
    for (let p = i - hi; p <= i - lo; p++) {
      if (p < 0) continue;
      const v = score[p] - TIGHT * Math.log((i - p) / period) ** 2;
      if (arg < 0 || v > best) {
        best = v;
        arg = p;
      }
    }
    score[i] = local[i] + (arg >= 0 ? Math.max(0, best) : 0);
    back[i] = arg >= 0 && best > 0 ? arg : -1;
  }
  let endF = frames - 1;
  for (let i = Math.max(0, frames - Math.round(period)); i < frames; i++)
    if (score[i] > score[endF]) endF = i;
  const beatFrames: number[] = [];
  for (let i = endF; i >= 0; i = back[i]) beatFrames.push(i);
  beatFrames.reverse();
  let beats = beatFrames.map((f) => f / FPS);

  // 템포가 일정한 곡이면 직선 회귀로 흔들림 제거 (대부분의 녹음곡은 클릭 트랙 기반)
  beats = straighten(beats);

  // ── 어택 지점 재보정용 고해상도 에너지 (1.45ms 간격) ──
  progress(0.8, "타격 시점 정밀 보정 중");
  await tick();
  const EH = 32;
  const env = new Float32Array(Math.floor(x.length / EH));
  {
    const cum = new Float64Array(x.length + 1);
    for (let i = 0; i < x.length; i++) cum[i + 1] = cum[i] + x[i] * x[i];
    for (let j = 0; j < env.length; j++) {
      const a = Math.max(0, j * EH - 64);
      const b = Math.min(x.length, j * EH + 64);
      env[j] = Math.log(1e-9 + (cum[b] - cum[a]) / Math.max(1, b - a));
    }
  }
  /** 어택 지점과 그 순간의 에너지 상승폭(로그) — 진짜 타격은 확 올라가고, 울림 꼬리의 가짜 피크는 거의 안 올라감 */
  const refine = (t: number) => {
    const a = Math.max(2, Math.floor(((t - 0.03) * SR) / EH));
    const b = Math.min(env.length - 3, Math.ceil(((t + 0.015) * SR) / EH));
    let best = -Infinity;
    let at = t;
    for (let j = a; j <= b; j++) {
      const d = env[j + 2] - env[j - 2];
      if (d > best) {
        best = d;
        at = (j * EH) / SR;
      }
    }
    return { at, rise: best };
  };

  // ── 타격 후보: 지역 최대 + 적응형 문턱 ──
  const thr = movingMean(sm, 12, 6);
  const delta = 0.06 * percentile(sm, 0.95);
  const raw: Onset[] = [];
  const rises: number[] = [];
  let lastPeak = -10;
  for (let i = 2; i < frames - 2; i++) {
    const v = sm[i];
    // 문턱을 낮게 잡아 피아노 난타 같은 작은 타격도 잡고, 가짜(울림 꼬리)는 아래 '상승폭'으로 거름
    if (v < thr[i] * 1.0 + delta * 0.5) continue;
    let isMax = true;
    for (let j = i - 3; j <= i + 3; j++) if (j !== i && (sm[j] ?? 0) > v) isMax = false;
    if (!isMax || i - lastPeak < 4) continue;
    lastPeak = i;
    const pick = (b: Float32Array) => Math.max(b[i - 1], b[i], b[i + 1]);
    const { at, rise } = refine(i / FPS);
    rises.push(rise);
    raw.push({
      t: at,
      s: v - thr[i],
      low: pick(fl),
      mid: pick(fm),
      high: pick(fh),
      cen: cen[Math.min(frames - 1, i + 1)],
      grid: -1,
    });
  }
  const sMax = percentile(
    raw.map((o) => o.s),
    0.95
  );
  for (const o of raw) o.s = Math.min(1, o.s / (sMax || 1));
  // 가짜 피크 제거: 센 타격들의 상승폭 중앙값의 35%도 안 올라간 건 울림 꼬리로 봄
  const riseRef = Math.min(0.8, median(rises.filter((_, i) => raw[i].s > 0.3)) * 0.35);
  const kept = raw.filter((_, i) => rises[i] >= riseRef);

  progress(0.9, "박자 격자에 맞추는 중");
  await tick();
  return { duration: buffer.duration, ...alignToGrid(beats, kept, opt.straight), rms };
}

/** 비트 간격이 거의 일정하면 직선으로 맞춤 (아니면 4비트 이동평균으로만 다듬음) */
function straighten(beats: number[]): number[] {
  const n = beats.length;
  if (n < 8) return beats;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  beats.forEach((y, x) => {
    sx += x;
    sy += y;
    sxx += x * x;
    sxy += x * y;
  });
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const icpt = (sy - slope * sx) / n;
  const res = beats.map((y, x) => y - (icpt + slope * x));
  const sd = Math.sqrt(res.reduce((s, r) => s + r * r, 0) / n);
  if (sd < 0.02) return beats.map((_, x) => icpt + slope * x);
  return beats.map((_, i) => {
    const a = Math.max(0, i - 2);
    const b = Math.min(n - 1, i + 2);
    // 주변 비트들로 i번째 위치를 직선 추정
    let px = 0;
    let py = 0;
    let pxx = 0;
    let pxy = 0;
    const m = b - a + 1;
    for (let k = a; k <= b; k++) {
      px += k;
      py += beats[k];
      pxx += k * k;
      pxy += k * beats[k];
    }
    const sl = (m * pxy - px * py) / (m * pxx - px * px);
    return (py - sl * px) / m + sl * i;
  });
}

/** 한 비트를 몇 칸으로 나눌지: 8 = 32분음표(일반), 12 = 16분 셋잇단(셔플·스윙·12/8 곡) */
export const DIV = 8;
export const DIV_TRIPLET = 12;

/** 격자 번호가 어떤 위치인지: 0 정박 · 1 8분 · 2 16분 · 3 그 사이(32분/셋잇단) */
export function gridPos(grid: number, div: number): 0 | 1 | 2 | 3 {
  if (grid % div === 0) return 0;
  if (grid % (div / 2) === 0) return 1;
  if (grid % (div / 4) === 0) return 2;
  return 3;
}

function buildGrid(beats: number[], beatSec: number, div: number, shift: number) {
  const g: number[] = [];
  // 첫 비트 앞쪽도 박 단위로 채움 (격자 번호 % div === 0 이 항상 정박이 되게)
  const first = beats[0] + shift;
  const pre = Math.ceil(first / beatSec);
  for (let k = pre; k >= 1; k--)
    for (let q = 0; q < div; q++) g.push(first - k * beatSec + (q * beatSec) / div);
  for (let k = 0; k < beats.length; k++) {
    const b = beats[k] + shift;
    const nb = (beats[k + 1] ?? beats[k] + beatSec) + shift;
    for (let q = 0; q < div; q++) g.push(b + ((nb - b) * q) / div);
  }
  const last = g[g.length - 1];
  for (let t = last + beatSec / div; t < last + beatSec * 8; t += beatSec / div) g.push(t);
  return g;
}
function nearestIdx(g: number[], t: number) {
  let a = 0;
  let b = g.length - 1;
  while (b - a > 1) {
    const m = (a + b) >> 1;
    if (g[m] <= t) a = m;
    else b = m;
  }
  return Math.abs(g[a] - t) <= Math.abs(g[b] - t) ? a : b;
}

/**
 * 비트 → 세분 격자, 격자 위치를 실제 타격에 맞춰 옮기고 타격을 스냅.
 * 32분 격자와 셋잇단 격자 중 센 타격이 더 많이 들어맞는 쪽을 씀 (스윙·셔플 곡 자동 감지).
 */
export function alignToGrid(beats: number[], raw: Onset[], straight = false) {
  const ivs = beats.slice(1).map((b, i) => b - beats[i]);
  const beatSec = median(ivs) || 0.5;
  const bpm = 60 / beatSec;
  const strong = raw.filter((o) => o.s > 0.35);

  // 세분 칸(정박·8분·16분이 아닌 자리)에 ±15ms로 들어맞는 센 타격 수로 격자 종류를 고름
  const fineHits = (div: number) => {
    const g = buildGrid(beats, beatSec, div, 0);
    let n = 0;
    for (const o of strong) {
      const gi = nearestIdx(g, o.t);
      if (Math.abs(g[gi] - o.t) <= 0.015 && gridPos(gi, div) === 3) n++;
    }
    return n;
  };
  // 셋잇단 격자는 세분 칸이 2배 많아 우연히 맞는 것도 2배 → 칸당 적중률로 비교
  const h8 = fineHits(DIV) / (DIV / 2);
  const h12 = fineHits(DIV_TRIPLET) / ((DIV_TRIPLET * 2) / 3);
  let div = h12 > h8 * 1.3 ? DIV_TRIPLET : DIV;

  // 셋잇단처럼 보이는 곡은 사실 1.5배 템포의 3-3-2 싱커페이션(킥이 8분음표 3개 간격)인 경우가 많다.
  // 예: 170 BPM 곡을 킥 간격(3×8분 = 1.06s)에 맞춰 113 BPM 셋잇단으로 잡음.
  // 그러면 격자 시각은 같지만 '정박' 자리가 틀어지므로, 1.5배 템포의 정박에 킥이 더 세게 오면 그쪽으로 바꿈
  if (div === DIV_TRIPLET) {
    const lowAt = (t: number) => {
      let v = 0;
      for (const o of strong) if (Math.abs(o.t - t) < 0.03) v = Math.max(v, o.low * o.s);
      return v;
    };
    const avg = (list: number[]) =>
      list.length ? list.reduce((a, t) => a + lowAt(t), 0) / list.length : 0;
    const fast = beatSec / 1.5;
    const beatsB: number[] = [];
    for (let t = beats[0]; t < beats[beats.length - 1] + beatSec; t += fast) beatsB.push(t);
    // 1배 정박에 없는 1.5배 정박(사이에 끼는 자리)도 킥이 세면 1.5배가 진짜 템포
    const onlyB = beatsB.filter((t) => !beats.some((b) => Math.abs(b - t) < 0.02));
    if (straight || avg(onlyB) >= avg(beats) * 0.6) {
      return { ...alignWithBeats(beatsB, raw, fast, DIV), bpm: 60 / fast };
    }
  }
  return { ...alignWithBeats(beats, raw, beatSec, div), bpm };
}

function alignWithBeats(beats: number[], raw: Onset[], beatSec: number, div: number) {
  const strong = raw.filter((o) => o.s > 0.35);
  // 격자를 강한 타격들과의 중간 어긋남만큼 이동 (프레임 단위 지연 보정)
  let grid = buildGrid(beats, beatSec, div, 0);
  const diffs: number[] = [];
  for (const o of strong) {
    const d = o.t - grid[nearestIdx(grid, o.t)];
    if (Math.abs(d) < 0.04) diffs.push(d);
  }
  const shift = median(diffs);
  grid = buildGrid(beats, beatSec, div, shift);
  const outBeats = beats.map((b) => b + shift);

  // 세분 격자라 칸이 좁음: 칸 간격의 42% 안이면 스냅 (127BPM 32분이면 ±25ms)
  const tol = Math.min(0.035, (beatSec / div) * 0.42);
  const byGrid = new Map<number, Onset>();
  const offGrid: Onset[] = [];
  for (const o of raw) {
    const gi = nearestIdx(grid, o.t);
    if (Math.abs(o.t - grid[gi]) <= tol) {
      const prev = byGrid.get(gi);
      if (!prev) byGrid.set(gi, { ...o, t: grid[gi], grid: gi });
      else {
        prev.s = Math.max(prev.s, o.s);
        prev.low = Math.max(prev.low, o.low);
        prev.mid = Math.max(prev.mid, o.mid);
        prev.high = Math.max(prev.high, o.high);
      }
    } else offGrid.push(o);
  }
  const onsets = [...byGrid.values(), ...offGrid].sort((a, b) => a.t - b.t);
  return { beats: outBeats, grid, onsets, div };
}

/**
 * 화면에 보여줄 BPM. 셋잇단 격자(12/8·셔플) 곡은 분석상 비트가 점4분음표라
 * DAW·생성기가 말하는 템포(8분음표 2개 = 1박)보다 1.5배 작게 나옴 → 1.5배로 환산해서 표시
 */
export const displayBpm = (a: { bpm: number; div: number }) =>
  a.div === DIV_TRIPLET ? a.bpm * 1.5 : a.bpm;

/** BPM을 2배·절반으로 바로잡기 (자동 검출이 반이나 두 배로 잡는 경우) */
export function rescaleTempo(a: Analysis, factor: 2 | 0.5): Analysis {
  let beats: number[];
  if (factor === 2) {
    beats = [];
    a.beats.forEach((b, i) => {
      beats.push(b);
      if (i + 1 < a.beats.length) beats.push((b + a.beats[i + 1]) / 2);
    });
  } else {
    // 짝수·홀수 비트 중 강한 타격이 더 많이 걸리는 쪽을 남김
    const hit = (list: number[]) =>
      a.onsets.reduce(
        (s, o) => s + (list.some((b) => Math.abs(b - o.t) < 0.03) ? o.s * (0.5 + o.low) : 0),
        0
      );
    const even = a.beats.filter((_, i) => i % 2 === 0);
    const odd = a.beats.filter((_, i) => i % 2 === 1);
    beats = hit(even) >= hit(odd) ? even : odd;
  }
  // 이미 스냅된 시각을 원래 후보처럼 다시 맞춤
  const raw = a.onsets.map((o) => ({ ...o, grid: -1 }));
  return { ...a, ...alignToGrid(beats, raw) };
}
