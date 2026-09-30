/**
 * 판정·점수 로직. 시간은 전부 "곡 기준 초"로 받는다(오디오 시계 - 시작 - 싱크).
 * 렌더링·입력과 분리해 두어서 화면 없이도 테스트할 수 있다.
 */
import type { Chart, Note } from "./chart";

export type Judge = "perfect" | "great" | "good" | "miss";

export const WINDOW = { perfect: 0.033, great: 0.066, good: 0.1, early: 0.14 } as const;
/** 정확도·점수 반영 비율: PERFECT 100%, GREAT 66%, GOOD 33% */
const WEIGHT: Record<Judge, number> = { perfect: 1, great: 0.66, good: 0.33, miss: 0 };
/** HP 증감: 미스가 이어지면 금방 바닥나고, 잘 치면 천천히 회복 */
export const HP_MAX = 100;
const HP_DELTA: Record<Judge, number> = { perfect: 1, great: 0.6, good: 0, miss: -9 };

/** 롱노트를 끝나기 이만큼 전에 떼도 성공으로 봄 */
const RELEASE_GRACE = 0.1;

export interface LiveNote extends Note {
  /** 머리 판정 결과 */
  head?: Judge;
  /** 꼬리 판정 결과 (롱노트) */
  tail?: Judge;
  /** 롱노트를 누르고 있는 중 */
  holding?: boolean;
  /** 다음 롱노트 콤보 틱 시각 */
  nextTick?: number;
}

export interface JudgeEvent {
  judge: Judge;
  lane: number;
  /** 판정이 난 시각(곡 기준) */
  at: number;
  /** 음수면 빠름, 양수면 늦음 (단노트·머리만) */
  diff?: number;
  /** 롱노트 누르는 중에 오르는 콤보 틱 (점수·판정 횟수에는 안 들어감) */
  tick?: boolean;
}

export class Engine {
  notes: LiveNote[];
  units: number;
  counts: Record<Judge, number> = { perfect: 0, great: 0, good: 0, miss: 0 };
  combo = 0;
  maxCombo = 0;
  hp = HP_MAX;
  /** HP가 바닥났을 때 */
  dead = false;
  private sum = 0;
  private judged = 0;
  /** 레인별 노트 인덱스 목록과 아직 머리 판정 안 된 첫 위치 */
  private lanes: number[][] = [[], [], [], []];
  private ptr = [0, 0, 0, 0];
  holding: (LiveNote | null)[] = [null, null, null, null];
  pressed = [false, false, false, false];
  /** 최근 판정들 (화면 효과용, 그리는 쪽에서 비움) */
  events: JudgeEvent[] = [];
  readonly lastTime: number;

  /** 롱노트 콤보 틱 간격(초). 0이면 틱 없음 */
  private tickSec: number;

  constructor(chart: Chart, tickSec = 0) {
    this.tickSec = tickSec;
    this.notes = chart.notes.map((n) => ({ ...n }));
    this.units = chart.units;
    this.notes.forEach((n, i) => this.lanes[n.lane].push(i));
    this.lastTime = this.notes.reduce((m, n) => Math.max(m, n.end ?? n.t), 0);
  }

  private record(j: Judge, lane: number, at: number, diff?: number) {
    this.counts[j]++;
    this.sum += WEIGHT[j];
    this.judged++;
    this.hp = Math.max(0, Math.min(HP_MAX, this.hp + HP_DELTA[j]));
    if (this.hp <= 0) this.dead = true;
    if (j === "miss") this.combo = 0;
    else this.maxCombo = Math.max(this.maxCombo, ++this.combo);
    this.events.push({ judge: j, lane, at, diff });
  }

  press(lane: number, t: number) {
    if (this.pressed[lane]) return;
    this.pressed[lane] = true;
    const idx = this.lanes[lane][this.ptr[lane]];
    if (idx === undefined) return;
    const n = this.notes[idx];
    const d = t - n.t;
    if (d < -WINDOW.early) return; // 너무 이름: 헛누름
    const a = Math.abs(d);
    const j: Judge =
      a <= WINDOW.perfect
        ? "perfect"
        : a <= WINDOW.great
          ? "great"
          : a <= WINDOW.good
            ? "good"
            : "miss";
    n.head = j;
    this.ptr[lane]++;
    this.record(j, lane, t, d);
    if (n.end) {
      if (j === "miss") {
        n.tail = "miss";
        this.record("miss", lane, t);
      } else {
        n.holding = true;
        this.holding[lane] = n;
      }
    }
  }

  release(lane: number, t: number) {
    this.pressed[lane] = false;
    const n = this.holding[lane];
    if (!n) return;
    this.holding[lane] = null;
    n.holding = false;
    n.tail = t >= n.end! - RELEASE_GRACE ? "perfect" : "miss";
    this.record(n.tail, lane, t);
  }

  /** 매 프레임: 지나간 노트 미스 처리, 끝까지 누른 롱노트 성공 처리 */
  update(t: number) {
    for (let lane = 0; lane < 4; lane++) {
      const list = this.lanes[lane];
      while (this.ptr[lane] < list.length) {
        const n = this.notes[list[this.ptr[lane]]];
        if (t - n.t <= WINDOW.good) break;
        n.head = "miss";
        this.record("miss", lane, n.t + WINDOW.good);
        if (n.end) {
          n.tail = "miss";
          this.record("miss", lane, n.t + WINDOW.good);
        }
        this.ptr[lane]++;
      }
      const h = this.holding[lane];
      // 롱노트를 누르고 있는 동안 일정 간격으로 콤보가 오름 (끝나기 직전까지)
      if (h && this.tickSec > 0) {
        h.nextTick ??= h.t + this.tickSec;
        while (h.nextTick <= Math.min(t, h.end! - this.tickSec * 0.5)) {
          this.maxCombo = Math.max(this.maxCombo, ++this.combo);
          this.events.push({ judge: "perfect", lane, at: h.nextTick, tick: true });
          h.nextTick += this.tickSec;
        }
      }
      if (h && t >= h.end!) {
        this.holding[lane] = null;
        h.holding = false;
        h.tail = "perfect";
        this.record("perfect", lane, h.end!);
      }
    }
  }

  get done() {
    return this.judged >= this.units;
  }
  /** 0~1,000,000 */
  get score() {
    return Math.round((this.sum / Math.max(1, this.units)) * 1_000_000);
  }
  /** 지금까지 판정난 것 기준 정확도(%) */
  get accuracy() {
    return this.judged ? (this.sum / this.judged) * 100 : 100;
  }
  get fullCombo() {
    return this.done && this.counts.miss === 0;
  }
  get allPerfect() {
    return this.done && this.counts.perfect === this.units;
  }
}

export function rankOf(acc: number) {
  return acc >= 97
    ? "S+"
    : acc >= 94
      ? "S"
      : acc >= 90
        ? "A"
        : acc >= 80
          ? "B"
          : acc >= 70
            ? "C"
            : "D";
}
