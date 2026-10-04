/**
 * 캐릭터 그림 (스프라이트 시트) — 게임 로직과 분리된 표시 전용.
 *
 * public/fight/<id>.png : 동작마다 한 줄, 모든 칸 같은 크기, 한쪽 방향만 (facing에 적음)
 * public/fight/<id>.json: 아래 SpriteSheet 형식
 * 직접 그린 그림으로 바꿀 땐 이 두 파일만 같은 형식으로 바꾸면 됨.
 *   - cell: 칸 크기, anchor: 칸 안에서 발 가운데 위치 (모든 칸 공통)
 *   - anims: 줄 번호·프레임 수·초당 프레임·반복 여부
 *   - moves: 기술마다 쓸 동작과 프레임 구간 (impact = 공격 판정이 나오는 순간 보일 칸)
 *   - states: 서기·걷기·피격 등 상태별 동작 (frame이 있으면 그 칸 고정)
 * 기술의 실제 속도·판정은 src/lib/fight/chars.ts 프레임 데이터가 정하고, 그림은 거기에 맞춰 늘이거나 줄여서 보여 줌.
 */
import type { MoveId } from "./chars";
import { CHARS } from "./chars";
import { finishRec, type Fighter, type State } from "./sim";

export interface AnimDef {
  row: number;
  frames: number;
  fps: number;
  loop: boolean;
}
export interface MoveAnim {
  anim: string;
  from: number;
  impact: number;
  to: number;
}
export interface StateAnim {
  anim: string;
  frame?: number;
}
export interface SpriteSheet {
  image: string;
  cell: [number, number];
  anchor: [number, number];
  /** 그림이 보고 있는 쪽 (반대쪽은 뒤집어서 그림) */
  facing?: "left" | "right";
  /** 월드 1px당 그림 px (크게 그려서 부드럽게 줄여 보여 줄 때, 없으면 1) */
  scale?: number;
  /** 도트 그림이면 true — 확대할 때 뭉개지 않고 픽셀 그대로 */
  pixel?: boolean;
  /** 쓰러짐 그림이 없어서 맞는 그림을 눕혀 그림 (render.ts) */
  layDown?: boolean;
  anims: Record<string, AnimDef>;
  moves: Record<MoveId, MoveAnim>;
  /** 약·발차기 연속 동작별 그림 (없으면 moves 것 반복) */
  chain?: Partial<Record<MoveId, MoveAnim[]>>;
  states: Record<string, StateAnim>;
  credit?: string;
}

export interface LoadedSheet extends SpriteSheet {
  img: HTMLImageElement;
}

const cache = new Map<string, Promise<LoadedSheet>>();

export function loadSheet(id: string): Promise<LoadedSheet> {
  let p = cache.get(id);
  if (!p) {
    p = fetch(`/fight/${id}.json`)
      .then((r) => r.json() as Promise<SpriteSheet>)
      .then(
        (meta) =>
          new Promise<LoadedSheet>((res, rej) => {
            const img = new Image();
            img.onload = () => res({ ...meta, img });
            img.onerror = rej;
            img.src = meta.image;
          })
      );
    p.catch(() => cache.delete(id));
    cache.set(id, p);
  }
  return p;
}

const clampI = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.floor(v)));

/** 이 순간 보여 줄 동작·칸 */
export function pickFrame(sh: SpriteSheet, f: Fighter, s: State): { anim: AnimDef; frame: number } {
  const loopAt = (name: string, t: number, reverse = false) => {
    const a = sh.anims[name];
    const k = Math.floor((t * a.fps) / 60) % a.frames;
    return { anim: a, frame: reverse ? a.frames - 1 - k : k };
  };
  const stateAnim = (key: string, t: number) => {
    const st = sh.states[key];
    const a = sh.anims[st.anim];
    if (st.frame !== undefined) return { anim: a, frame: Math.min(st.frame, a.frames - 1) };
    if (a.loop) return loopAt(st.anim, t);
    return { anim: a, frame: clampI((t * a.fps) / 60, 0, a.frames - 1) };
  };
  switch (f.st) {
    case "idle":
      return stateAnim("idle", s.f + f.ch * 17);
    case "walk": {
      const backward = Math.sign(f.vx) !== f.face;
      return loopAt(sh.states.walk.anim, f.t, backward);
    }
    case "dash":
      return sh.states.dash ? stateAnim("dash", f.t) : loopAt(sh.states.walk.anim, f.t * 2);
    case "jump":
      if (f.dashT > 0 && sh.states.dash) return stateAnim("dash", f.t);
      return stateAnim("jump", f.t);
    case "atk": {
      const m = CHARS[f.ch].moves[f.mv as MoveId];
      // 잡기·가드 반격은 그림이 없으면 약·발차기 그림으로
      const ma =
        sh.chain?.[f.mv as MoveId]?.[f.chain - 1] ??
        sh.moves[f.mv as MoveId] ??
        sh.moves[f.mv === "T" ? "L" : "H"];
      const a = sh.anims[ma.anim];
      const total = m.startup + m.active + m.recovery + finishRec(f);
      let fr: number;
      if (f.t < m.startup) fr = ma.from + ((ma.impact - ma.from) * f.t) / Math.max(1, m.startup);
      else
        fr =
          ma.impact +
          ((ma.to - ma.impact + 1) * (f.t - m.startup)) / Math.max(1, total - m.startup);
      return { anim: a, frame: clampI(fr, ma.from, Math.min(ma.to, a.frames - 1)) };
    }
    case "hit":
      return stateAnim("hit", f.t);
    case "block":
      return stateAnim("block", f.t);
    case "down": {
      const a = sh.anims[sh.states.down.anim];
      const mid = Math.floor(a.frames * 0.7);
      return { anim: a, frame: clampI((f.t * a.fps) / 60, 0, mid) };
    }
    case "rise": {
      const a = sh.anims[sh.states.down.anim];
      const mid = Math.floor(a.frames * 0.7);
      return { anim: a, frame: clampI(mid - (mid * f.t) / 14, 0, mid) };
    }
    case "ko":
      return stateAnim("ko", f.t);
    case "win":
      return stateAnim("win", f.t);
  }
}
