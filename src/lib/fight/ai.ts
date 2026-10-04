/**
 * 격투게임 AI — 매 프레임 상태를 보고 "사람처럼" 입력을 만들어 냄.
 * 반응 속도(몇 프레임 뒤에 알아채나), 가드·대공·콤보 확률로 단계를 나눔.
 * 오프라인 전용이라 결정론일 필요는 없지만, 같은 시드면 같은 행동을 하도록 자체 난수를 씀.
 */
import { CHARS, SUB, type MoveDef } from "./chars";
import { IN, VIEW_H, isAir, mapOf, platBelow, type Fighter, type State } from "./sim";

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

type Intent =
  | "approach"
  | "retreat"
  | "wait"
  | "jumpIn"
  | "poke"
  | "jab"
  | "fireball"
  | "block"
  | "space"
  | "throw";

/** 기술 사거리(px): 박스 끝 + 여유 */
const reachOf = (m: MoveDef, extra = 4) => m.box.x + m.box.w + extra;

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
  private techDecision: boolean | null = null;
  private gcDecision: boolean | null = null;
  /** 대시 입력 (톡·떼고·톡) 남은 프레임 */
  private dashSeq: number[] = [];
  /** 저스트 가드 노리기: 상대 판정이 나오기 이 프레임 전에 ↓ */
  private justPlan = -1;

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
    const oc = CHARS[o.ch];
    const map = mapOf(s);
    const toward = o.x > f.x ? IN.R : IN.L;
    const away = o.x > f.x ? IN.L : IN.R;
    const dist = Math.abs(o.x - f.x) / SUB;
    const dy = (o.h - f.h) / SUB;
    const L = this.level;
    const air = isAir(s, f);
    let out = 0;

    // 버튼은 한 프레임 누르고 떼야 새로 눌린 걸로 침
    const press = (b: number) => {
      if (this.lastPress & b) return;
      out |= b;
    };
    const finish = () => {
      this.lastPress = out & (IN.A | IN.B | IN.C | IN.X | IN.J);
      return out;
    };

    if (this.dashSeq.length) {
      out = this.dashSeq.shift()!;
      return finish();
    }

    // ── 잡혔다: 풀기 (단계별 확률) ──
    if (f.grabbed > 0) {
      if (this.techDecision === null) this.techDecision = this.r() < L.block * 0.8;
      if (this.techDecision) out = IN.A | IN.B;
      return finish();
    }
    this.techDecision = null;

    // ── 떨어지는 중: 가까운 발판으로 복귀 ──
    if (air && f.st !== "hit" && f.st !== "ko") {
      // 지금 속도로 가면 착지할 발판이 없으면
      const under = platBelow(map, f.x + f.vx * 24, f.h);
      if (!under || f.h / SUB > VIEW_H) {
        let best = map.plats[0];
        let bd = Infinity;
        for (const p of map.plats) {
          const cx = ((p.x0 + p.x1) / 2) * SUB;
          const d = Math.abs(cx - f.x) + Math.max(0, p.y * SUB - f.h) * 2;
          if (d < bd) ((bd = d), (best = p));
        }
        const cx = ((best.x0 + best.x1) / 2) * SUB;
        out |= cx > f.x ? IN.R : IN.L;
        if (f.jumps < 2 && f.vh < 0 && f.h < best.y * SUB + 40 * SUB) press(IN.J);
        // 우산 활강 (점프를 다 쓴 뒤)
        if (c.glide && f.vh < 0 && f.jumps >= 2) out |= IN.J;
        return finish();
      }
    }

    // ── 상대 공격 감지 (반응 지연) ──
    const om = o.st === "atk" && o.mv ? oc.moves[o.mv] : null;
    const oAtk = !!om && o.mv !== "J" && o.mv !== "T";
    if (oAtk) {
      if (this.sawAtk < 0) this.sawAtk = s.f;
    } else {
      this.sawAtk = -1;
      this.blockDecision = null;
      this.justPlan = -1;
    }
    const oJumpIn = isAir(s, o) && dy > 20 && dy < 120 && dist < 90 && o.vh < 0;
    if (oJumpIn) {
      if (this.sawJump < 0) this.sawJump = s.f;
    } else {
      this.sawJump = -1;
      this.aaDecision = null;
    }
    const noticed = (t: number) => t >= 0 && s.f - t >= L.react;

    const lReach = reachOf(c.moves.L, 6);
    const hReach = reachOf(c.moves.H);
    const tReach = reachOf(c.moves.T, 2);
    const sm = c.moves.S;
    const idReach = sm.proj
      ? 9999
      : sm.box.x + sm.box.w + (sm.rush ? Math.trunc((sm.rush.vx * (sm.active + 4)) / SUB) : 0);
    // 상대의 가장 긴 평타 사거리 (이 밖에서 서성이면 안전)
    const oReach = Math.max(reachOf(oc.moves.L), reachOf(oc.moves.H));
    const faceOk = (f.face > 0) === (o.x > f.x);
    const hitBtn = (b: number) => {
      if (!faceOk) out |= toward;
      else press(b);
    };

    // ── 콤보 이어 가기 ──
    if (f.st === "atk" && f.hit && o.st === "hit") {
      if (this.comboDecision === null) this.comboDecision = this.r() < L.combo;
      if (this.comboDecision) {
        if (f.mv === "L") press(f.chain < 4 && this.r() < 0.6 ? IN.A : IN.B);
        else if (f.mv === "H") {
          if (f.meter >= 100 && this.r() < 0.6) press(IN.X);
          else if (f.cd === 0 && !sm.proj) press(IN.C);
          else if (f.chain < 2) press(IN.B);
        }
      }
      return finish();
    }
    if (f.st !== "atk") this.comboDecision = null;

    const free = f.st === "idle" || f.st === "walk";
    const blocking = f.st === "block";
    const aligned = Math.abs(dy) < 30;
    const incoming = s.proj.find(
      (p) => p.k === 0 && p.o !== me && Math.sign(p.vx) === Math.sign(f.x - p.x) && Math.abs(p.h - f.h - 30 * SUB) < 30 * SUB
    );
    // 발밑 불기둥 피하기
    const pillar = s.proj.find((p) => p.k === 1 && p.o !== me && Math.abs(p.x - f.x) < 40 * SUB && p.t < 24);
    if (pillar && (free || blocking) && !air && this.r() < L.block + 0.1) {
      out |= pillar.x > f.x ? IN.L : IN.R;
      if (Math.abs(pillar.x - f.x) < 20 * SUB) press(IN.J);
      return finish();
    }
    const projDist = incoming ? Math.abs(incoming.x - f.x) / SUB : 999;

    // ── 막는 중: 가드 반격 / 막은 뒤 반격(프레임 이득) ──
    if (blocking && !air) {
      if (f.stun > 0) {
        // 가드 반격: 상대가 아직 기술 중이고 게이지가 있으면 (단계별 확률)
        if (this.gcDecision === null) this.gcDecision = this.r() < L.combo * 0.5;
        if (this.gcDecision && f.meter >= 25 && om && o.t < om.startup + om.active + om.recovery - 6 && this.r() < 0.5) {
          out = IN.D;
          press(IN.B);
          return finish();
        }
        out = IN.D;
        return finish();
      }
      this.gcDecision = null;
      // 경직 끝: 상대가 아직 빈틈이면 반격, 아니면 가드 유지 여부 결정
      if (om && aligned && dist < lReach) {
        const left = om.startup + om.active + om.recovery - o.t;
        if (left >= 3 && this.r() < L.combo) {
          hitBtn(left > 10 ? IN.B : IN.A);
          return finish();
        }
      }
      if (oAtk && dist < oReach + 20) {
        out = IN.D;
        return finish();
      }
    }

    if ((free || blocking) && !air) {
      // 막기 (↓): 상대 공격을 알아챘고, 닿을 거리면 — 고수는 판정 직전에 올려 저스트 가드
      const reach = om ? reachOf(om, 18) : 0;
      if (oAtk && noticed(this.sawAtk) && aligned && (dist < reach || o.mv === "X")) {
        if (this.blockDecision === null) {
          this.blockDecision = this.r() < L.block;
          this.justPlan = this.r() < L.combo * 0.6 ? 2 + Math.floor(this.r() * 3) : -1;
        }
        if (this.blockDecision) {
          const untilHit = om!.startup - o.t;
          if (this.justPlan >= 0 && untilHit > this.justPlan && f.st !== "block") {
            // 아직 안 올림 (저스트 가드 타이밍 기다림) — 대신 살짝 물러남
            out |= away;
            return finish();
          }
          out = IN.D;
          return finish();
        }
      }
      // 탄: 막거나 뛰어넘기
      if (incoming && projDist < 90 && projDist > 16) {
        if (this.blockDecision === null) this.blockDecision = this.r() < L.block;
        if (this.blockDecision) {
          if (this.r() < 0.5) press(IN.J);
          else out |= IN.D;
          return finish();
        }
      }
      // 대공
      if (oJumpIn && noticed(this.sawJump)) {
        if (this.aaDecision === null) this.aaDecision = this.r() < L.antiAir;
        if (this.aaDecision && dist < 50) {
          out |= toward;
          press(IN.B);
          return finish();
        }
      }
      // 묶인 상대 때리기: 탄·끌어당김에 맞아 경직 중이면 달려가서 콤보
      if (o.st === "hit" && o.stun > 8 && aligned && this.r() < L.combo) {
        if (dist > lReach - 4) out |= toward;
        else hitBtn(o.stun > 16 ? IN.B : IN.A);
        return finish();
      }
      // 헛침 벌주기: 상대가 기술 뒷동작(회복)인데 내 사거리 안
      if (om && !o.hit && o.t >= om.startup + om.active && aligned && noticed(this.sawAtk)) {
        const left = om.startup + om.active + om.recovery - o.t;
        if (left >= 4 && dist < hReach && this.r() < L.combo) {
          hitBtn(dist < lReach && left < 9 ? IN.A : IN.B);
          return finish();
        }
      }
      // 잡기: 상대가 가드로 버티면 (가까이)
      if (o.st === "block" && dist < tReach && faceOk && this.r() < L.aggro * 0.15) {
        press(IN.A | IN.B);
        return finish();
      }
      // 필살기: 상대가 빈틈이 크거나 가까우면
      const sx = c.moves.X.box;
      const ultReach = c.moves.X.summon || c.moves.X.proj ? 400 : sx.x + sx.w + 8;
      if (f.meter >= 100 && aligned && dist < ultReach && ((om && o.t < 6) || this.r() < 0.02)) {
        out |= toward;
        press(IN.X);
        return finish();
      }
    }

    // ── 높이 맞추기: 위로 점프 / 아래로 내려가기 ──
    if (free && !air) {
      if (dy > 50 && dist < 260 && !isAir(s, o) && this.r() < 0.5) {
        out |= dist > 30 ? toward : 0;
        press(IN.J);
        return finish();
      }
      if (dy < -50 && dist < 300) {
        const on = platBelow(map, f.x, f.h);
        const below = on && platBelow(map, f.x, f.h - SUB);
        if (on && !on.solid && below) {
          out |= IN.D;
          press(IN.J);
          return finish();
        }
      }
    }
    if (f.st === "jump" && dy > 70 && f.vh < 200 && f.jumps < 2) {
      out |= toward;
      press(IN.J);
      return finish();
    }
    // 공중 공격: 내려오면서 상대 위에 있으면
    if (f.st === "jump" && f.airUsed < 2 && dist < 40 && dy < 0 && dy > -70 && f.vh < 0 && this.r() < L.aggro) {
      hitBtn(this.r() < 0.5 ? IN.A : IN.B);
      return finish();
    }

    // ── 행동 정하기 (몇 프레임씩 유지) ──
    if (--this.hold <= 0 || (!free && !blocking && f.st !== "jump")) {
      this.decide(s, me, dist, lReach, hReach, oReach);
    }
    switch (this.intent) {
      case "approach": {
        // 리치형은 상대 사거리 밖(내 사거리 안)까지만 다가감
        const stopAt = hReach > oReach + 10 ? Math.max(oReach + 6, hReach - 10) : 0;
        if (dist > stopAt) out |= toward;
        else if (free && aligned && this.r() < 0.3 + L.aggro * 0.3) hitBtn(dist < lReach ? IN.A : IN.B);
        if (free && !air && dist > 200 && this.r() < 0.05 + L.aggro * 0.05) this.dashSeq = [0, toward, toward, toward];
        if (dist < lReach && free && aligned && this.r() < L.aggro * 0.2) hitBtn(IN.A);
        break;
      }
      case "retreat": {
        out |= away;
        // 물러나다 따라붙으면 돌아서서 찌름
        const closing = (o.st === "walk" || o.st === "dash") && Math.sign(o.vx) === Math.sign(f.x - o.x);
        if (free && aligned && closing && dist < lReach + 2 && this.r() < L.combo) {
          out &= ~(IN.L | IN.R);
          hitBtn(IN.A);
        }
        break;
      }
      case "space": {
        // 발 재기(풋시): 내 평타는 닿고 상대 평타는 안 닿는 거리를 유지, 들어오면 찌름
        const ideal = Math.max(oReach + 6, hReach - 6);
        const closing = (o.st === "walk" || o.st === "dash" || (o.st === "jump" && Math.abs(o.vx) > 300)) && Math.sign(o.vx) === Math.sign(f.x - o.x);
        if (dist > ideal + 14) out |= toward;
        else if (dist < ideal - 10) out |= away;
        if (free && aligned) {
          // 들어오는 상대는 바로 찌름 (대시는 특히), 가만히 있으면 가끔 찔러 봄. 등 돌리고 있으면 먼저 돌아섬
          const want = closing ? L.combo : 0.12 + L.aggro * 0.15;
          if (dist < lReach + 4 && this.r() < want) {
            out &= ~(IN.L | IN.R);
            hitBtn(IN.A);
          } else if (dist < hReach && dist > lReach - 6 && this.r() < want * 0.8) {
            out &= ~(IN.L | IN.R);
            hitBtn(IN.B);
          }
        }
        break;
      }
      case "jumpIn":
        if (free) {
          out |= toward;
          if (this.r() < 0.2) press(IN.J);
        } else if (f.st === "jump" && dist < 50 && dy < 10) {
          out |= toward;
          press(IN.B);
        }
        break;
      case "poke":
        if (dist > hReach) out |= toward;
        else if (free && aligned) hitBtn(IN.B);
        break;
      case "jab":
        if (dist > lReach) out |= toward;
        else if (free && aligned) hitBtn(IN.A);
        break;
      case "throw":
        if (dist > tReach) out |= toward;
        else if (free && aligned && faceOk) press(IN.A | IN.B);
        break;
      case "fireball":
        // 탄이 아닌 아이덴티티(돌진·채찍)는 닿는 거리에서만
        if (dist > idReach) out |= toward;
        else if (free && aligned && f.cd === 0) hitBtn(IN.C);
        break;
      case "block":
        if (free && !air) out = IN.D;
        break;
      default:
        break;
    }
    if (free && aligned && dist > 120 && dist < idReach && faceOk && this.r() < L.special && f.cd === 0)
      press(IN.C);
    // 우산 활강: 점프를 다 쓴 뒤 내려올 때 (토글하면 2단 점프가 돼 버리니 꾹 누름)
    if (c.glide && f.st === "jump" && f.vh < 0 && f.jumps >= 2 && dist > 60) out |= IN.J;
    // 걷다가 낭떠러지면 멈춤 (아래에 발판이 없으면)
    if (!air && (out & (IN.L | IN.R))) {
      const dir = out & IN.R ? 1 : -1;
      const ax = f.x + dir * 24 * SUB;
      if (!platBelow(map, ax, f.h)) out &= ~(IN.L | IN.R);
    }
    return finish();
  }

  private decide(s: State, me: 0 | 1, dist: number, lReach: number, hReach: number, oReach: number) {
    const L = this.level;
    const r = this.r();
    const f: Fighter = s.p[me];
    const o: Fighter = s.p[1 - me];
    const c = CHARS[f.ch];
    this.hold = 8 + Math.floor(this.r() * 18);
    const lowHp = f.hp < c.hp * 0.25;
    // 사거리 우위가 있으면 발 재기를 선호 (리치형)
    const longer = hReach > oReach + 10;
    const zoner = !!c.moves.S.proj;
    if (dist > 120) {
      if (zoner && r < 0.35 && f.cd === 0) this.intent = "fireball";
      else if (longer && r < 0.7) this.intent = "space";
      else
        this.intent =
          r < 0.55 + L.aggro * 0.3 ? "approach" : r < 0.8 ? "fireball" : r < 0.9 ? "jumpIn" : "wait";
    } else if (dist > 55) {
      if (longer && r < 0.6 + L.combo * 0.25) this.intent = "space";
      else if (longer && r < 0.8 && f.cd === 0) this.intent = "fireball";
      else if (r < L.aggro * 0.35) this.intent = "poke";
      else if (r < L.aggro * 0.6) this.intent = "jumpIn";
      else if (r < 0.75) this.intent = "approach";
      else if (r < 0.85) this.intent = "fireball";
      else this.intent = lowHp ? "retreat" : "wait";
    } else {
      if (o.st === "atk" && o.t > 6)
        this.intent = "jab"; // 상대 빈틈
      else if (o.st === "block" && r < L.aggro * 0.5) this.intent = "throw";
      else if (longer && r < 0.45) this.intent = "retreat"; // 리치형은 붙으면 떨어짐
      else if (longer && r < 0.6) this.intent = "jab";
      else if (r < L.aggro * 0.7) this.intent = "jab";
      else if (r < L.aggro) this.intent = "poke";
      else if (r < L.aggro + 0.15) this.intent = "block";
      else if (r < L.aggro + 0.3) this.intent = "retreat";
      else this.intent = "wait";
      this.hold = 4 + Math.floor(this.r() * 10);
    }
    void lReach;
  }
}
