/**
 * 격투게임 캔버스 그리기 — 월드(VIEW_W×VIEW_H)를 화면 해상도에 맞게 키워서 부드럽게 (플랫폼 대전: x·높이).
 * 시뮬레이션 상태를 읽기만 하고 바꾸지 않음. 불꽃·흔들림 같은 연출은 여기서만 가짐.
 */
import { CHARS, SUB } from "@/lib/fight/chars";
import { MAPS } from "@/lib/fight/maps";
import {
  VIEW_H,
  VIEW_W,
  isAir as isAirF,
  platBelow,
  projRect,
  screenY,
  type Ev,
  type Fighter,
  type Proj,
  type State,
} from "@/lib/fight/sim";
import { pickFrame, type LoadedSheet } from "@/lib/fight/sprites";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
  kind: "spark" | "ring" | "dust" | "text" | "flame" | "bolt" | "shard" | "streak";
  text?: string;
}

/** 캐릭터별 능력 (탄·타격 이펙트 모양) */
const ELEMENT: Record<string, "fire" | "bolt" | "ice" | "wind" | "whip" | "water"> = {
  kai: "wind",
  igna: "fire",
  soyoung: "whip",
  lily: "water",
};

/** 이그나 화염구 그림 (public/fight/fx) — 처음 쓸 때 불러옴 */
let fbCache: HTMLImageElement | null | undefined;
function fireball(): HTMLImageElement | null {
  if (fbCache === undefined) {
    fbCache = null;
    const im = new Image();
    im.onload = () => (fbCache = im);
    im.src = "/fight/fx/igna-fireball.webp";
  }
  return fbCache && fbCache.complete ? fbCache : null;
}

function glowAt(g: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  g.save();
  g.globalCompositeOperation = "lighter";
  const l = g.createRadialGradient(x, y, 0, x, y, r);
  l.addColorStop(0, color);
  l.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = l;
  g.fillRect(x - r, y - r, r * 2, r * 2);
  g.restore();
}

export class FightRenderer {
  private g: CanvasRenderingContext2D;
  private bg: HTMLCanvasElement | null = null;
  private bgKey = "";
  private tmp: HTMLCanvasElement | null = null;
  private parts: Particle[] = [];
  private shake = 0;
  private flash = 0;
  private flashColor = "#fff";
  sheets: (LoadedSheet | null)[] = [null, null];

  constructor(private canvas: HTMLCanvasElement) {
    this.g = canvas.getContext("2d")!;
  }

  /** 캔버스 크기를 보이는 크기 × 화면 배율로 */
  resize() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    const w = Math.max(VIEW_W, Math.round(r.width * dpr));
    const h = Math.round((w * VIEW_H) / VIEW_W);
    if (this.canvas.width !== w) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.bgKey = "";
    }
  }

  /** 맵 배경 그림 (MapDef.bg) — 없으면 코드로 그린 배경 */
  private bgImg = new Map<string, HTMLImageElement | null>();
  private bgImage(id: string, src?: string) {
    if (!src) return null;
    if (!this.bgImg.has(id)) {
      this.bgImg.set(id, null);
      const im = new Image();
      im.onload = () => {
        this.bgImg.set(id, im);
        this.bgKey = "";
      };
      im.src = src;
    }
    return this.bgImg.get(id) ?? null;
  }

  private stage(s: State, k: number) {
    const map = MAPS[s.map] ?? MAPS[0];
    const img = this.bgImage(map.id, map.bg);
    const key = `${s.map}:${this.canvas.width}:${img ? 1 : 0}`;
    if (this.bg && this.bgKey === key) return this.bg;
    const c = this.bg ?? document.createElement("canvas");
    c.width = this.canvas.width;
    c.height = this.canvas.height;
    const g = c.getContext("2d")!;
    g.setTransform(k, 0, 0, k, 0, 0);
    if (img) {
      g.imageSmoothingEnabled = true;
      g.imageSmoothingQuality = "high";
      g.drawImage(img, 0, 0, VIEW_W, VIEW_H);
    } else {
      // 그림이 아직 없을 때 (불러오는 중): 어두운 판
      g.fillStyle = "#1A1C26";
      g.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    if (!map.bgPlats || !img) {
      // 발판 위치만 표시 (그림에 발판이 없을 때)
      g.fillStyle = "rgba(230,210,150,0.85)";
      for (const p of map.plats) g.fillRect(p.x0, VIEW_H - p.y, p.x1 - p.x0, p.solid ? 6 : 4);
    }
    this.bg = c;
    this.bgKey = key;
    return c;
  }

  /** 시뮬레이션 이벤트 → 연출 */
  events(evs: Ev[], s: State) {
    for (const e of evs) {
      const x = e.x / SUB,
        y = screenY(e.h);
      if (e.k === "hit") {
        const power = e.m === "X" ? 2 : e.m === "H" || e.m === "S" ? 1 : 0;
        const ch = CHARS[s.p[e.p].ch];
        const el = ELEMENT[ch.id] ?? "fire";
        for (let i = 0; i < 10 + power * 6; i++) {
          const a = Math.random() * Math.PI * 2;
          const sp = 1 + Math.random() * (2 + power * 1.5);
          this.parts.push({
            x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 16 + power * 4, max: 16 + power * 4,
            color: i % 3 ? "#FFF6D6" : ch.color, size: 1 + power * 0.5,
            kind: el === "fire" ? "flame" : el === "bolt" ? "bolt" : el === "wind" || el === "whip" ? "spark" : "shard",
          });
        }
        this.parts.push({ x, y, vx: 0, vy: 0, life: 10, max: 10, color: "#fff", size: 7 + power * 4, kind: "ring" });
        this.shake = Math.max(this.shake, 2 + power * 3);
        this.parts.push({
          x: x + (Math.random() - 0.5) * 22, y: y - 14 - Math.random() * 10, vx: 0, vy: -0.5, life: 30, max: 30,
          color: "#FFE08A", size: 1, kind: "text", text: String(e.v),
        });
      } else if (e.k === "block") {
        this.parts.push({ x, y, vx: 0, vy: 0, life: 12, max: 12, color: "#8FD3FF", size: 11, kind: "ring" });
        for (let i = 0; i < 6; i++)
          this.parts.push({
            x, y, vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 2, life: 10, max: 10,
            color: "#CFEFFF", size: 1, kind: "spark",
          });
      } else if (e.k === "clash" && e.v === 1) {
        // 착지 충격파: 옆으로 퍼지는 바람
        for (let i = 0; i < 14; i++) {
          const d = i % 2 ? 1 : -1;
          this.parts.push({
            x, y: y - 2 - Math.random() * 6, vx: d * (2 + Math.random() * 3), vy: -Math.random() * 0.6,
            life: 16, max: 16, color: "rgba(230,240,255,0.9)", size: 1.4, kind: "streak",
          });
        }
        this.parts.push({ x, y: y - 4, vx: 0, vy: 0, life: 12, max: 12, color: "#DDEBFF", size: 18, kind: "ring" });
        this.shake = Math.max(this.shake, 5);
      } else if (e.k === "clash") {
        this.parts.push({ x, y, vx: 0, vy: 0, life: 14, max: 14, color: "#fff", size: 15, kind: "ring" });
        this.shake = Math.max(this.shake, 3);
      } else if (e.k === "super") {
        this.flash = 10;
        this.flashColor = CHARS[s.p[e.p].ch].color;
      } else if (e.k === "ko") {
        this.flash = 9;
        this.flashColor = "#fff";
        this.shake = 8;
      } else if (e.k === "dash") {
        // 대시 바람 자국
        const f = s.p[e.p];
        for (let i = 0; i < 6; i++)
          this.parts.push({
            x: x - f.face * (4 + i * 5), y: y - 8 - Math.random() * 40, vx: -f.face * (1.5 + Math.random()), vy: 0,
            life: 12, max: 12, color: "rgba(255,255,255,0.85)", size: 1.2, kind: "streak",
          });
      } else if (e.k === "jump" || e.k === "land") {
        for (let i = 0; i < 4; i++)
          this.parts.push({
            x: x + (Math.random() - 0.5) * 10, y, vx: (Math.random() - 0.5) * 1.2, vy: -0.3,
            life: 14, max: 14, color: "rgba(230,220,210,0.8)", size: 1.5, kind: "dust",
          });
      }
    }
  }

  /** 연출 한 프레임 진행 (시뮬레이션이 진행됐을 때만) */
  tick(s: State) {
    if (this.flash > 0) this.flash--;
    if (s.stop > 0 || s.freeze > 0) {
      this.shake *= 0.85;
      return;
    }
    for (const p of this.parts) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.kind === "spark" || p.kind === "shard" || p.kind === "bolt") {
        p.vx *= 0.88;
        p.vy = p.vy * 0.88 + 0.08;
      } else if (p.kind === "flame") {
        p.vx *= 0.9;
        p.vy = p.vy * 0.9 - 0.06;
      }
      p.life--;
    }
    this.parts = this.parts.filter((p) => p.life > 0);
    this.shake *= 0.8;
  }

  /** 이름표: 머리 위 1P(파랑)·2P/CPU(빨강) 표시 — 둘이 겹쳐도 내 캐릭터를 알 수 있게 */
  tags: [string, string] = ["1P", "2P"];
  private drawTag(f: Fighter, i: number) {
    if (f.st === "ko" || f.h / SUB > VIEW_H) return;
    const g = this.g;
    const sh = this.sheets[i];
    const top = sh ? (sh.anchor[1] / (sh.scale ?? 1)) * 0.82 : 62;
    const x = f.x / SUB,
      y = screenY(f.h) - Math.min(top, 74) - 10;
    const col = i === 0 ? "#3B82F6" : "#F43F5E";
    const label = this.tags[i];
    g.save();
    g.font = "bold 9px ui-monospace, monospace";
    const tw = g.measureText(label).width + 6;
    g.globalAlpha = 0.92;
    g.fillStyle = col;
    g.fillRect(x - tw / 2, y - 11, tw, 10);
    g.beginPath();
    g.moveTo(x - 4, y - 1);
    g.lineTo(x + 4, y - 1);
    g.lineTo(x, y + 4);
    g.fill();
    g.fillStyle = "#fff";
    g.textAlign = "center";
    g.fillText(label, x, y - 3);
    g.restore();
  }

  /** 필살기 게이지가 꽉 차면 몸 주위에 빛 */
  private drawMaxAura(f: Fighter, s: State) {
    if (f.meter < 100 || f.st === "ko" || f.h / SUB > VIEW_H) return;
    const g = this.g;
    const x = f.x / SUB,
      y = screenY(f.h);
    const c = CHARS[f.ch].color;
    const p = 0.55 + 0.45 * Math.sin(s.f * 0.18);
    glowAt(g, x, y - 32, 46 + p * 10, c === "#E6ECF5" ? "rgba(140,200,255,0.32)" : "rgba(255,110,40,0.32)");
    g.save();
    g.globalCompositeOperation = "lighter";
    for (let k = 0; k < 3; k++) {
      const a = s.f * 0.09 + k * 2.1;
      g.fillStyle = `rgba(255,255,255,${0.5 * p})`;
      g.fillRect(x + Math.cos(a) * 18 - 1, y - 8 - ((s.f * 1.3 + k * 23) % 64), 2, 2);
    }
    g.restore();
  }

  /** 카이 필살기 동안 몸을 감싸고 도는 회오리 */
  private drawWindAura(f: Fighter, s: State) {
    if (f.st !== "atk" || f.mv !== "X" || CHARS[f.ch].id !== "kai") return;
    const m = CHARS[f.ch].moves.X;
    if (f.t < m.startup - 2 || f.t > m.startup + m.active + 4) return;
    const g = this.g;
    const x = f.x / SUB,
      y = screenY(f.h);
    const spin = s.f * 0.45;
    g.save();
    g.globalCompositeOperation = "lighter";
    for (let k = 0; k < 5; k++) {
      const yy = y - 8 - k * 15;
      const rx = 30 + k * 3,
        ry = 7 + k;
      g.strokeStyle = `rgba(220,235,255,${0.55 - k * 0.07})`;
      g.lineWidth = 2.2;
      g.beginPath();
      g.ellipse(x, yy, rx, ry, 0, spin + k, spin + k + Math.PI * 1.3);
      g.stroke();
      g.strokeStyle = "rgba(160,190,230,0.35)";
      g.lineWidth = 1.2;
      g.beginPath();
      g.ellipse(x, yy, rx * 0.8, ry * 0.8, 0, -spin + k * 2, -spin + k * 2 + Math.PI);
      g.stroke();
    }
    g.restore();
  }

  private drawFighter(f: Fighter, i: number, s: State) {
    const g = this.g;
    const sh = this.sheets[i];
    const map = MAPS[s.map] ?? MAPS[0];
    const x = f.x / SUB;
    const below = platBelow(map, f.x, f.h);
    const y = screenY(f.h);
    if (below) {
      // 그림자 (아래 발판 위에)
      const lift = Math.max(0, (f.h - below.y * SUB) / SUB);
      if (lift < 260) {
        g.fillStyle = `rgba(0,0,0,${0.35 - Math.min(0.25, lift / 900)})`;
        g.beginPath();
        g.ellipse(x, screenY(below.y * SUB), Math.max(5, 13 - lift / 25), 2.6, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
    if (f.h / SUB > VIEW_H) {
      // 화면 위에서 내려오는 중: 위치 표시
      g.fillStyle = CHARS[f.ch].color;
      g.beginPath();
      g.moveTo(x, 14);
      g.lineTo(x - 7, 4);
      g.lineTo(x + 7, 4);
      g.fill();
      return;
    }
    if (!sh) {
      g.fillStyle = CHARS[f.ch].color;
      g.fillRect(x - 8, y - 60, 16, 60);
      return;
    }
    const { anim, frame } = pickFrame(sh, f, s);
    const [cw, ch] = sh.cell;
    const [ax, ay] = sh.anchor;
    const sc = sh.scale ?? 1;
    const sx = frame * cw,
      sy = anim.row * ch;
    const flashHit = (f.st === "hit" && f.t < 2) || (s.stop > 0 && f.st === "hit");
    let src: CanvasImageSource = sh.img;
    let ssx = sx,
      ssy = sy;
    if (flashHit) {
      if (!this.tmp) this.tmp = document.createElement("canvas");
      const t = this.tmp;
      t.width = cw;
      t.height = ch;
      const tg = t.getContext("2d")!;
      tg.clearRect(0, 0, cw, ch);
      tg.drawImage(sh.img, sx, sy, cw, ch, 0, 0, cw, ch);
      tg.globalCompositeOperation = "source-atop";
      tg.fillStyle = "rgba(255,255,255,0.7)";
      tg.fillRect(0, 0, cw, ch);
      tg.globalCompositeOperation = "source-over";
      src = t;
      ssx = 0;
      ssy = 0;
    }
    g.save();
    // 다시 내려온 직후 무적: 깜빡이지 않고 살짝만 투명하게
    if (f.inv > 0) g.globalAlpha = 0.75;
    if (sh.pixel) g.imageSmoothingEnabled = false;
    const flip = sh.facing === "left" ? f.face > 0 : f.face < 0;
    const dw = cw / sc,
      dh = ch / sc;
    if (sh.layDown && (f.st === "down" || f.st === "rise" || (f.st === "ko" && !isAirF(s, f)))) {
      // 쓰러짐 그림이 없으면 눕혀서 (일어날 땐 다시 세움)
      const k = f.st === "rise" ? 1 - f.t / 14 : Math.min(1, f.t / 6);
      g.translate(x, y);
      g.rotate((flip ? 1 : -1) * (Math.PI / 2) * k);
      g.translate(-x, -y);
    }
    if (!flip) g.drawImage(src, ssx, ssy, cw, ch, x - ax / sc, y - ay / sc, dw, dh);
    else {
      g.translate(x, 0);
      g.scale(-1, 1);
      g.drawImage(src, ssx, ssy, cw, ch, -ax / sc, y - ay / sc, dw, dh);
    }
    g.restore();
  }

  /** 필살기 불기둥: 솟기 전엔 바닥에 경고 불씨, 솟으면 시트의 불기둥 그림을 크게 */
  private drawPillar(p: Proj, s: State) {
    const g = this.g;
    const sm = CHARS[s.p[p.o].ch].moves.X.summon!;
    const x = p.x / SUB;
    const y = screenY(p.h);
    if (p.t < sm.delay) {
      const k = p.t / sm.delay;
      g.save();
      g.globalCompositeOperation = "lighter";
      g.fillStyle = `rgba(255,${120 + Math.round(80 * k)},40,${0.25 + 0.5 * k * (0.7 + 0.3 * Math.sin(p.t))})`;
      g.beginPath();
      g.ellipse(x, y, (sm.w / 2) * (0.5 + k * 0.6), 4 + 3 * k, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
      return;
    }
    const sh = this.sheets[p.o];
    const a = sh?.anims.pillar;
    const fade = Math.min(1, (sm.delay + sm.life - p.t) / 8);
    g.save();
    g.globalAlpha = fade;
    if (sh && a) {
      const [cw, ch] = sh.cell;
      const [ax, ay] = sh.anchor;
      const fr = Math.floor(((p.t - sm.delay) * a.fps) / 60) % a.frames;
      // 기둥 높이에 맞춰 크게
      const k = sm.h / (ch * 0.9);
      if (sh.pixel) g.imageSmoothingEnabled = false;
      g.drawImage(sh.img, fr * cw, a.row * ch, cw, ch, x - ax * k, y - ay * k, cw * k, ch * k);
    } else {
      g.fillStyle = "rgba(255,120,40,0.8)";
      g.fillRect(x - sm.w / 2, y - sm.h, sm.w, sm.h);
    }
    g.restore();
    glowAt(g, x, y - sm.h / 2, sm.h * 0.6, "rgba(255,120,40,0.25)");
  }

  private drawProj(s: State) {
    const g = this.g;
    for (const p of s.proj) {
      if (p.k === 1) {
        this.drawPillar(p, s);
        continue;
      }
      const ch = CHARS[s.p[p.o].ch];
      const el = ELEMENT[ch.id] ?? "fire";
      const r = projRect(p, s);
      const cx = (r.l + r.r) / 2 / SUB;
      const cy = screenY(p.h);
      const w = (r.r - r.l) / SUB;
      const dir = Math.sign(p.vx);
      const t = s.f;
      // 내리꽂는 탄은 날아가는 방향으로 기울임
      g.save();
      g.translate(cx, cy);
      g.rotate(Math.atan2(-p.vh, Math.abs(p.vx)) * dir);
      g.translate(-cx, -cy);
      const fbImg = fireball();
      if (el === "fire" && fbImg) {
        // 화염구 그림 (오른쪽을 보는 그림, 앞쪽 원이 탄 판정 위치)
        const hgt = w * 1.7;
        const wid = (hgt * fbImg.width) / fbImg.height;
        g.save();
        g.translate(cx, cy);
        g.scale(dir, 1);
        g.imageSmoothingEnabled = false;
        g.drawImage(fbImg, -wid * 0.78, -hgt / 2, wid, hgt);
        g.restore();
        glowAt(g, cx, cy, w * 1.4, "rgba(255,120,40,0.3)");
      } else if (el === "fire") {
        for (let k = 4; k >= 0; k--) {
          g.globalAlpha = 0.25 + (4 - k) * 0.15;
          g.fillStyle = k > 2 ? "#FF5A1F" : k > 0 ? "#FF9A3A" : "#FFE27A";
          g.beginPath();
          g.ellipse(cx - dir * k * 3.2, cy + Math.sin(t * 0.6 + k) * 0.8, w / 2 + 1 - k * 0.4, w / 2.4 - k * 0.3, 0, 0, Math.PI * 2);
          g.fill();
        }
      } else if (el === "bolt") {
        const grd = g.createRadialGradient(cx, cy, 0, cx, cy, w / 1.4);
        grd.addColorStop(0, "#FFFFFF");
        grd.addColorStop(0.4, "#FFF27A");
        grd.addColorStop(1, "rgba(255,228,92,0)");
        g.fillStyle = grd;
        g.beginPath();
        g.arc(cx, cy, w / 1.4, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = "#FFF6B0";
        g.lineWidth = 0.7;
        for (let k = 0; k < 4; k++) {
          const a = t * 0.9 + k * 1.6;
          g.beginPath();
          g.moveTo(cx, cy);
          g.lineTo(cx + Math.cos(a) * w * 0.5, cy + Math.sin(a) * w * 0.4);
          g.lineTo(cx + Math.cos(a + 0.4) * w * 0.85, cy + Math.sin(a + 0.4) * w * 0.7);
          g.stroke();
        }
        // 공 (야구공)
        g.fillStyle = "#FFFFFF";
        g.beginPath();
        g.arc(cx, cy, w / 4, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = "#E8344E";
        g.lineWidth = 0.4;
        g.beginPath();
        g.arc(cx - w / 8, cy, w / 6, -1, 1);
        g.stroke();
      } else if (el === "water" && p.mv === 1) {
        // 장마 파도: 바닥을 휩쓰는 큰 물결
        const hgt = (r.hi - r.lo) / SUB;
        g.save();
        g.translate(cx, cy + hgt / 2);
        g.scale(dir, 1);
        for (let k = 0; k < 3; k++) {
          g.globalAlpha = 0.35 + k * 0.2;
          g.fillStyle = k === 2 ? "#E8F8FF" : k === 1 ? "#7FD3FF" : "#2E8FE0";
          g.beginPath();
          g.moveTo(-w / 2 - k * 4, 0);
          g.quadraticCurveTo(-w / 4, -hgt * (0.6 - k * 0.12), w / 3 - k * 6, -hgt + k * 10 + Math.sin(t * 0.4) * 2);
          g.quadraticCurveTo(w / 2, -hgt * 0.4, w / 2 - k * 8, 0);
          g.closePath();
          g.fill();
        }
        g.restore();
        glowAt(g, cx, cy, w, "rgba(90,190,255,0.25)");
      } else if (el === "water") {
        // 비눗방울: 둥실 떠가는 투명한 방울
        const rr = w / 2 + Math.sin(t * 0.15) * 1.2;
        const by = cy + Math.sin(t * 0.08) * 3;
        const grd = g.createRadialGradient(cx - rr * 0.3, by - rr * 0.3, rr * 0.1, cx, by, rr);
        grd.addColorStop(0, "rgba(255,255,255,0.85)");
        grd.addColorStop(0.35, "rgba(170,225,255,0.35)");
        grd.addColorStop(0.9, "rgba(90,180,255,0.45)");
        grd.addColorStop(1, "rgba(220,245,255,0.9)");
        g.fillStyle = grd;
        g.beginPath();
        g.arc(cx, by, rr, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = "rgba(255,255,255,0.8)";
        g.lineWidth = 1;
        g.beginPath();
        g.arc(cx, by, rr, 3.6, 4.6);
        g.stroke();
      } else if (el === "wind") {
        // 초승달 바람 칼날
        g.save();
        g.translate(cx, cy);
        g.scale(dir, 1);
        const r = w / 2;
        for (let k = 3; k >= 0; k--) {
          g.globalAlpha = 0.18 + (3 - k) * 0.22;
          g.fillStyle = k ? "#BFD3EA" : "#FFFFFF";
          g.beginPath();
          g.arc(-k * 4 - r * 0.6, 0, r, -1.25, 1.25);
          g.arc(-k * 4 - r * 0.95, 0, r * 0.82, 1.1, -1.1, true);
          g.fill();
        }
        g.restore();
      } else {
        g.save();
        g.translate(cx, cy);
        g.rotate(dir > 0 ? 0 : Math.PI);
        g.globalAlpha = 0.35;
        g.fillStyle = "#BFF3FF";
        g.beginPath();
        g.moveTo(-w, 0);
        g.lineTo(0, -w / 3);
        g.lineTo(0, w / 3);
        g.fill();
        g.globalAlpha = 1;
        g.fillStyle = "#E9FCFF";
        g.strokeStyle = "#3EB6E8";
        g.lineWidth = 0.6;
        g.beginPath();
        g.moveTo(w / 2, 0);
        g.lineTo(0, -w / 3.2);
        g.lineTo(-w / 2.2, 0);
        g.lineTo(0, w / 3.2);
        g.closePath();
        g.fill();
        g.stroke();
        g.restore();
      }
      g.restore();
      g.globalAlpha = 1;
    }
  }

  draw(s: State) {
    const g = this.g;
    const k = this.canvas.width / VIEW_W;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = "high";
    const sx = this.shake > 0.5 ? (Math.random() - 0.5) * this.shake : 0;
    const sy = this.shake > 0.5 ? (Math.random() - 0.5) * this.shake * 0.6 : 0;
    g.drawImage(this.stage(s, k), sx * k, sy * k);
    g.setTransform(k, 0, 0, k, sx * k, sy * k);

    if (s.freeze > 0) {
      g.fillStyle = "rgba(0,0,0,0.55)";
      g.fillRect(-10, -10, VIEW_W + 20, VIEW_H + 20);
    }
    // 발판은 배경에 구워 둠 → 캐릭터 (공격 중인 쪽을 앞에)
    const order = s.p[0].st === "atk" && s.p[1].st !== "atk" ? [1, 0] : [0, 1];
    for (const i of order) {
      this.drawMaxAura(s.p[i], s);
      this.drawFighter(s.p[i], i, s);
      this.drawWindAura(s.p[i], s);
    }
    for (let i = 0; i < 2; i++) this.drawTag(s.p[i], i);
    this.drawProj(s);

    for (const p of this.parts) {
      const a = p.life / p.max;
      g.globalAlpha = Math.min(1, a * 1.5);
      if (p.kind === "spark" || p.kind === "dust") {
        g.fillStyle = p.color;
        g.beginPath();
        g.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
        g.fill();
      } else if (p.kind === "streak") {
        g.strokeStyle = p.color;
        g.lineWidth = p.size;
        g.beginPath();
        g.moveTo(p.x, p.y);
        g.lineTo(p.x - p.vx * 6, p.y);
        g.stroke();
      } else if (p.kind === "flame") {
        g.fillStyle = a > 0.6 ? "#FFE27A" : a > 0.3 ? "#FF9A3A" : "#FF5A1F";
        g.beginPath();
        g.ellipse(p.x, p.y, p.size, p.size * 1.6, 0, 0, Math.PI * 2);
        g.fill();
      } else if (p.kind === "bolt") {
        g.strokeStyle = a > 0.5 ? "#FFFFFF" : "#FFE45C";
        g.lineWidth = 0.6;
        g.beginPath();
        g.moveTo(p.x, p.y);
        g.lineTo(p.x - p.vx * 1.5 + 1, p.y - p.vy * 1.5 - 1);
        g.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
        g.stroke();
      } else if (p.kind === "shard") {
        g.fillStyle = a > 0.5 ? "#FFFFFF" : "#9FE8FF";
        g.beginPath();
        g.moveTo(p.x, p.y - p.size * 1.6);
        g.lineTo(p.x + p.size * 0.7, p.y);
        g.lineTo(p.x, p.y + p.size * 1.6);
        g.lineTo(p.x - p.size * 0.7, p.y);
        g.fill();
      } else if (p.kind === "ring") {
        g.globalAlpha = a;
        g.strokeStyle = p.color;
        g.lineWidth = 1.4;
        g.beginPath();
        g.arc(p.x, p.y, p.size * (1.6 - a), 0, Math.PI * 2);
        g.stroke();
      } else if (p.kind === "text" && p.text) {
        g.font = "bold 8px ui-sans-serif, system-ui, sans-serif";
        g.textAlign = "center";
        g.lineWidth = 2;
        g.strokeStyle = "rgba(0,0,0,0.8)";
        g.strokeText(p.text, p.x, p.y);
        g.fillStyle = p.color;
        g.fillText(p.text, p.x, p.y);
      }
    }
    g.globalAlpha = 1;

    if (this.flash > 0) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalAlpha = this.flash / 20;
      g.fillStyle = this.flashColor;
      g.fillRect(0, 0, this.canvas.width, this.canvas.height);
      g.globalAlpha = 1;
    }
  }
}
