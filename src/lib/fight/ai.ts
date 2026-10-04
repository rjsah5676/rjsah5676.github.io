/**
 * 격투게임 AI — 매 프레임 상태를 보고 "사람처럼" 입력을 만들어 냄.
 * 반응 속도(몇 프레임 뒤에 알아채나), 가드·대공·콤보 확률로 단계를 나눔.
 * 오프라인 전용이라 결정론일 필요는 없지만, 같은 시드면 같은 행동을 하도록 자체 난수를 씀.
 */
import { CHARS, SUB } from "./chars";
import { IN, isAir, type Fighter, type State } from "./sim";

export interface AILevel {
  id: string;
  name: string;
  /** 상대 공격을 알아채는 데 걸리는 프레임 */
  react: number;
  /** 알아챈 공격을 막을 확률 */
  block: number;
  /** 맞혔을 때 다음 기술로 이어 갈 확률 */
  combo: number;
  /** 뛰어드는 상대를 강공격으로 떨어뜨릴 확률 */
  antiAir: number;
  /** 공격적인 정도 */
  aggro: number;
  /** 프레임당 필살기(탄) 쓸 확률 */
  special: number;
}

export const AI_LEVELS: AILevel[] = [
  {
    id: "1",
    name: "입문",
    react: 30,
    block: 0.05,
    combo: 0,
    antiAir: 0.05,
    aggro: 0.25,
    special: 0.004,
  },
  {
    id: "2",
    name: "초급",
    react: 22,
    block: 0.2,
    combo: 0.2,
    antiAir: 0.15,
    aggro: 0.35,
    special: 0.006,
  },
  {
    id: "3",
    name: "중급",
    react: 16,
    block: 0.42,
    combo: 0.45,
    antiAir: 0.35,
    aggro: 0.45,
    special: 0.008,
  },
  {
    id: "4",
    name: "상급",
    react: 12,
    block: 0.6,
    combo: 0.7,
    antiAir: 0.55,
    aggro: 0.55,
    special: 0.01,
  },
  {
    id: "5",
    name: "고수",
    react: 9,
    block: 0.76,
    combo: 0.86,
    antiAir: 0.7,
    aggro: 0.6,
    special: 0.012,
  },
  {
    id: "6",
    name: "달인",
    react: 6,
    block: 0.9,
    combo: 0.96,
    antiAir: 0.86,
    aggro: 0.65,
    special: 0.014,
  },
];

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Intent = "approach" | "retreat" | "wait" | "jumpIn" | "poke" | "jab" | "fireball" | "block";

export class FightAI {
  private r: () => number;
  private intent: Intent = "wait";
  private hold = 0;
  private lastPress = 0;
  /** 상대가 공격을 시작한 걸 처음 본 프레임 */
  private sawAtk = -1;
  private sawJump = -1;
  private blockDecision: boolean | null = null;
  private aaDecision: boolean | null = null;
  private comboDecision: boolean | null = null;

  constructor(
    public level: AILevel,
    seed = 1
  ) {
    this.r = rng(seed);
  }

  next(s: State, me: 0 | 1): number {
    const f = s.p[me];
    const o = s.p[1 - me];
    if (s.phase !== "fight") return 0;
    const c = CHARS[f.ch];
    const fwd = f.face > 0 ? IN.R : IN.L;
    const back = f.face > 0 ? IN.L : IN.R;
    const dist = Math.abs(o.x - f.x) / SUB;
    const L = this.level;
    let out = 0;

    // 버튼은 한 프레임 누르고 떼야 새로 눌린 걸로 침
    const press = (b: number) => {
      if (this.lastPress & b) return;
      out |= b;
    };

    // ── 상대 공격 감지 (반응 지연) ──
    const oAtk = o.st === "atk" && o.mv !== "J";
    if (oAtk) {
      if (this.sawAtk < 0) this.sawAtk = s.f;
    } else {
      this.sawAtk = -1;
      this.blockDecision = null;
    }
    const oJumpIn =
      isAir(s, o) && (o.vx === 0 || Math.sign(o.vx) === Math.sign(f.x - o.x)) && dist < 120;
    if (oJumpIn) {
      if (this.sawJump < 0) this.sawJump = s.f;
    } else {
      this.sawJump = -1;
      this.aaDecision = null;
    }
    const noticed = (t: number) => t >= 0 && s.f - t >= L.react;

    // ── 콤보 이어 가기 ──
    if (f.st === "atk" && f.hit && o.st === "hit") {
      if (this.comboDecision === null) this.comboDecision = this.r() < L.combo;
      if (this.comboDecision) {
        if (f.mv === "L") press(IN.B);
        else if (f.mv === "H") {
          if (f.meter >= 100 && this.r() < 0.6) press(IN.X);
          else if (!s.proj.some((p) => p.o === me)) press(IN.C);
        }
      }
      this.lastPress = out;
      return out;
    }
    if (f.st !== "atk") this.comboDecision = null;

    const free = f.st === "idle" || f.st === "walk";
    const incoming = s.proj.find(
      (p) => p.o !== me && Math.sign(p.vx) === Math.sign(f.x - p.x) && Math.abs(p.z - f.z) < 10 * SUB
    );
    const aligned = Math.abs(o.z - f.z) / SUB <= 8;
    const projDist = incoming ? Math.abs(incoming.x - f.x) / SUB : 999;

    if (free) {
      // 막기: 상대 공격을 알아챘고, 닿을 거리면
      const reach = o.mv ? CHARS[o.ch].moves[o.mv].box.x + CHARS[o.ch].moves[o.mv].box.w + 18 : 0;
      if (oAtk && noticed(this.sawAtk) && aligned && (dist < reach || o.mv === "X")) {
        if (this.blockDecision === null) this.blockDecision = this.r() < L.block;
        if (this.blockDecision) {
          this.lastPress = back;
          return back;
        }
      }
      // 탄: 막거나 뛰어넘기
      if (incoming && projDist < 70 && projDist > 20) {
        if (this.blockDecision === null) this.blockDecision = this.r() < L.block;
        if (this.blockDecision) {
          // 깊이로 비켜서 피하거나 막기
          if (this.r() < 0.45 && projDist > 30) out |= f.z > (incoming.z ?? 0) ? IN.U : IN.D;
          else out |= back;
          this.lastPress = out & (IN.A | IN.B | IN.C | IN.X);
          return out;
        }
      }
      // 대공
      if (oJumpIn && noticed(this.sawJump) && dist < 70) {
        if (this.aaDecision === null) this.aaDecision = this.r() < L.antiAir;
        if (this.aaDecision && dist < 55) {
          press(IN.B);
          this.lastPress = out;
          return out;
        }
      }
      // 초필살: 상대가 빈틈이 크거나 가까우면
      const sx = c.moves.X.box;
      if (f.meter >= 100 && dist < sx.x + sx.w + 8 && (o.st === "atk" || this.r() < 0.02)) {
        press(IN.X);
        this.lastPress = out;
        return out;
      }
    }

    // ── 행동 정하기 (몇 프레임씩 유지) ──
    if (--this.hold <= 0 || (!free && f.st !== "jump")) {
      this.decide(s, me, dist);
    }
    const lReach = c.moves.L.box.x + c.moves.L.box.w + 6;
    const hReach = c.moves.H.box.x + c.moves.H.box.w + 4;
    switch (this.intent) {
      case "approach":
        out |= fwd;
        if (dist < lReach && free && this.r() < L.aggro * 0.2) press(IN.A);
        break;
      case "retreat":
        out |= back;
        break;
      case "jumpIn":
        if (free) out |= fwd | (this.r() < 0.2 ? IN.J : 0);
        else if (f.st === "jump" && dist < 50 && f.vh < 0) press(IN.B);
        break;
      case "poke":
        if (dist > hReach) out |= fwd;
        else if (free && aligned) press(IN.B);
        break;
      case "jab":
        if (dist > lReach) out |= fwd;
        else if (free && aligned) press(IN.A);
        break;
      case "fireball":
        if (free && aligned && !s.proj.some((p) => p.o === me)) press(IN.C);
        break;
      case "block":
        out |= back;
        break;
      default:
        break;
    }
    if (free && dist > 90 && this.r() < L.special && !s.proj.some((p) => p.o === me)) press(IN.C);
    // 깊이 맞추기 (물러나는 중이 아니면 상대와 같은 줄로)
    const dz = (o.z - f.z) / SUB;
    if (free && this.intent !== "retreat" && Math.abs(dz) > 4 + (1 - L.aggro) * 4) out |= dz > 0 ? IN.U : IN.D;
    this.lastPress = out & (IN.A | IN.B | IN.C | IN.X | IN.J);
    return out;
  }

  private decide(s: State, me: 0 | 1, dist: number) {
    const L = this.level;
    const r = this.r();
    const f: Fighter = s.p[me];
    const o: Fighter = s.p[1 - me];
    this.hold = 8 + Math.floor(this.r() * 18);
    const lowHp = f.hp < CHARS[f.ch].hp * 0.25;
    if (dist > 120) {
      this.intent =
        r < 0.55 + L.aggro * 0.3 ? "approach" : r < 0.8 ? "fireball" : r < 0.9 ? "jumpIn" : "wait";
    } else if (dist > 55) {
      if (r < L.aggro * 0.35) this.intent = "poke";
      else if (r < L.aggro * 0.6) this.intent = "jumpIn";
      else if (r < 0.75) this.intent = "approach";
      else if (r < 0.85) this.intent = "fireball";
      else this.intent = lowHp ? "retreat" : "wait";
    } else {
      if (o.st === "atk" && o.t > 6)
        this.intent = "jab"; // 상대 빈틈
      else if (r < L.aggro * 0.7) this.intent = "jab";
      else if (r < L.aggro) this.intent = "poke";
      else if (r < L.aggro + 0.15) this.intent = "block";
      else if (r < L.aggro + 0.3) this.intent = "retreat";
      else this.intent = "wait";
      this.hold = 4 + Math.floor(this.r() * 10);
    }
  }
}
