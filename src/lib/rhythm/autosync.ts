/**
 * 자동 싱크: 치는 동안 모은 "입력 − 가장 가까운 노트" 차이(초, 타격 싱크 적용 후)를 보고
 * 타격 싱크를 몇 ms 옮길지 정한다.
 *
 * 최근 WINDOW개의 중앙값이 한쪽으로 쏠려 있고(|중앙값| ≥ MIN_MS), 흔들림이 작으면(MAD ≤ MAD_MS)
 * 중앙값의 GAIN만큼만(최대 STEP_MAX) 옮긴다. 조금씩 여러 번 → 몇 마디 안에 수렴하고,
 * 실수 몇 번(흔들림 큼)엔 움직이지 않는다.
 */
export const AUTO_SYNC = {
  /** 입력 몇 개마다 다시 볼지 */
  every: 12,
  window: 24,
  minMs: 6,
  madMs: 30,
  stepMax: 40,
  gain: 0.7,
  /** 가까운 노트를 찾는 범위(초): MISS여도 보정에 쓰이도록 판정 창보다 넓게 */
  near: 0.25,
  /** 손·입력 지연으로 볼 수 있는 타격 싱크 한계(ms). 넘는 몫은 소리 지연 → 음악 싱크로 */
  handCap: 60,
} as const;

/** 중앙값(ms)과 중앙값 주변 흔들림(MAD, ms) */
export function spreadOf(tapsSec: number[]): { med: number; mad: number } {
  const ms = tapsSec.map((d) => d * 1000).sort((a, b) => a - b);
  const med = ms[Math.floor(ms.length / 2)];
  const dev = ms.map((v) => Math.abs(v - med)).sort((a, b) => a - b);
  return { med, mad: dev[Math.floor(dev.length / 2)] };
}

/**
 * 이번에 타격 싱크를 옮길 양(ms). 0이면 그대로.
 * @param tapsSec 최근 입력 차이들(초). 이미 WINDOW개로 잘라서 넘길 필요 없음
 * @param judge 현재 타격 싱크(ms) — ±400 범위를 넘지 않게
 */
export function autoSyncStep(tapsSec: number[], judge: number): number {
  if (tapsSec.length === 0) return 0;
  const { med, mad } = spreadOf(tapsSec.slice(-AUTO_SYNC.window));
  if (mad > AUTO_SYNC.madMs || Math.abs(med) < AUTO_SYNC.minMs) return 0;
  const step = Math.round(
    Math.max(-AUTO_SYNC.stepMax, Math.min(AUTO_SYNC.stepMax, med * AUTO_SYNC.gain))
  );
  const to = Math.max(-400, Math.min(400, judge + step));
  return to - judge;
}

/**
 * 판이 끝날 때: 타격 싱크가 손 지연 한계를 넘었으면 넘는 몫을 음악 싱크로 옮김.
 * 둘의 합은 그대로라 판정은 안 바뀌고, 노트가 보이는 위치만 소리에 맞게 움직인다.
 */
export function splitSync(judge: number, offset: number): { judge: number; offset: number } {
  const ex = judge - Math.max(-AUTO_SYNC.handCap, Math.min(AUTO_SYNC.handCap, judge));
  if (ex === 0) return { judge, offset };
  return { judge: judge - ex, offset: Math.max(-400, Math.min(400, offset + ex)) };
}
