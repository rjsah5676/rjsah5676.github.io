/**
 * AI 랭킹 모드 점수 (이겼을 때만).
 * 기본 점수(상대 실력) × 기물 우세 × 적은 수 × 짧은 시간 — 모두 곱셈이라 강한 상대를 이길수록 크게 유리.
 */
export interface ScorePart {
  label: string;
  detail: string;
  factor: number;
}

export interface ScoreResult {
  score: number;
  base: number;
  parts: ScorePart[];
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
export const clockLabel = mmss;

function combine(base: number, parts: ScorePart[]): ScoreResult {
  const score = Math.round(parts.reduce((v, p) => v * p.factor, base));
  return { score, base, parts };
}

/** 체스: 상대 레이팅 × 10 기본, 기물 우세 40점당 +100%, 60수 이내 빨리 끝낼수록, 10분 이내 빨리 둘수록 */
export function chessScore(rating: number, lead: number, moves: number, seconds: number) {
  return combine(rating * 10, [
    { label: "기물 우세", detail: `+${Math.max(0, lead)}`, factor: 1 + Math.max(0, lead) / 40 },
    { label: "내 수", detail: `${moves}수`, factor: 1 + Math.max(0, 60 - moves) / 60 },
    { label: "사용 시간", detail: mmss(seconds), factor: 1 + Math.max(0, 600 - seconds) / 1200 },
  ]);
}

/**
 * 장기: 상대별 기본 점수, 점수(기물) 우세 60점당 +100%, 80수 이내, 15분 이내, 외통이 아닌 점수승은 ×0.6
 */
export function janggiScore(
  base: number,
  lead: number,
  moves: number,
  seconds: number,
  checkmate: boolean
) {
  const parts: ScorePart[] = [
    { label: "점수 우세", detail: `+${Math.max(0, lead)}`, factor: 1 + Math.max(0, lead) / 60 },
    { label: "내 수", detail: `${moves}수`, factor: 1 + Math.max(0, 80 - moves) / 80 },
    { label: "사용 시간", detail: mmss(seconds), factor: 1 + Math.max(0, 900 - seconds) / 1800 },
  ];
  if (!checkmate) parts.push({ label: "판정승", detail: "외통 아님", factor: 0.6 });
  return combine(base, parts);
}
