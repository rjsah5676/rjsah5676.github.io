/**
 * 격투게임 캔버스 그리기 — 월드(VIEW_W×VIEW_H)를 화면 해상도에 맞게 키워서 부드럽게 (플랫폼 대전: x·높이).
 * 시뮬레이션 상태를 읽기만 하고 바꾸지 않음. 불꽃·흔들림 같은 연출은 여기서만 가짐.
 */
import { CHARS, SUB } from "@/lib/fight/chars";
import { MAPS } from "@/lib/fight/maps";
import {
  VIEW_H,
  VIEW_W,
  boxRect,
  hitRect,
  hurtRect,
  platBelow,
  projRect,
  screenY,
  type Ev,
  type Fighter,
  type Rect,
  type State,
} from "@/lib/fight/sim";
import { pickFrame, type LoadedSheet } from "@/lib/fight/sprites";
import { drawPlat, drawStage } from "./stages";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
  kind: "spark" | "ring" | "dust" | "text" | "flame" | "bolt" | "shard";
  text?: string;
}

/** 캐릭터별 능력 (탄·타격 이펙트 모양) */
const ELEMENT: Record<string, "fire" | "bolt" | "ice"> = { haru: "fire", ren: "bolt", mio: "ice" };

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
  showBoxes = false;

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
    } else drawStage(g, map);
    if (!map.bgPlats) for (const p of map.plats) drawPlat(g, p);
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
            kind: el === "fire" ? "flame" : el === "bolt" ? "bolt" : "shard",
          });
        }
        this.parts.push({ x, y, vx: 0, vy: 0, life: 10, max: 10, color: "#fff", size: 7 + power * 4, kind: "ring" });
        this.shake = Math.max(this.shake, 2 + power * 3);
        this.parts.push({
          x, y: y - 14, vx: 0, vy: -0.4, life: 36, max: 36, color: "#FFE08A", size: 1, kind: "text", text: String(e.v),
        });
      } else if (e.k === "block") {
        this.parts.push({ x, y, vx: 0, vy: 0, life: 12, max: 12, color: "#8FD3FF", size: 11, kind: "ring" });
        for (let i = 0; i < 6; i++)
          this.parts.push({
            x, y, vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 2, life: 10, max: 10,
            color: "#CFEFFF", size: 1, kind: "spark",
          });
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
      } else if (e.k === "fall") {
        const fx = Math.min(VIEW_W - 30, Math.max(30, x));
        this.parts.push({
          x: fx, y: VIEW_H - 30, vx: 0, vy: -0.5, life: 60, max: 60, color: "#FF8A8A", size: 1.4, kind: "text",
          text: `낙하 -${e.v}`,
        });
        this.shake = Math.max(this.shake, 5);
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
    if ((f.st === "rise" || f.inv > 0) && f.t % 4 < 2) g.globalAlpha = 0.55;
    if (sh.pixel) g.imageSmoothingEnabled = false;
    const flip = sh.facing === "left" ? f.face > 0 : f.face < 0;
    const dw = cw / sc,
      dh = ch / sc;
    if (!flip) g.drawImage(src, ssx, ssy, cw, ch, x - ax / sc, y - ay / sc, dw, dh);
    else {
      g.translate(x, 0);
      g.scale(-1, 1);
      g.drawImage(src, ssx, ssy, cw, ch, -ax / sc, y - ay / sc, dw, dh);
    }
    g.restore();
  }

  private drawProj(s: State) {
    const g = this.g;
    for (const p of s.proj) {
      const ch = CHARS[s.p[p.o].ch];
      const el = ELEMENT[ch.id] ?? "fire";
      const r = projRect(p, s);
      const cx = (r.l + r.r) / 2 / SUB;
      const cy = screenY(p.h);
      const w = (r.r - r.l) / SUB;
      const dir = Math.sign(p.vx);
      const t = s.f;
      if (el === "fire") {
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
      g.globalAlpha = 1;
    }
  }

  private rect(r: Rect | null, color: string) {
    if (!r) return;
    const g = this.g;
    const top = screenY(r.hi);
    const bot = screenY(r.lo);
    g.strokeStyle = color;
    g.lineWidth = 0.8;
    g.strokeRect(r.l / SUB, top, (r.r - r.l) / SUB, bot - top);
  }

  private drawBoxes(s: State) {
    const g = this.g;
    for (const f of s.p) {
      this.rect(hurtRect(f), "#4ADE80");
      this.rect(hitRect(f), "#F43F5E");
      g.fillStyle = "#FDE047";
      g.fillRect(f.x / SUB - 1, screenY(f.h) - 1, 2, 2);
      const w = CHARS[f.ch].width;
      this.rect(boxRect(f, { x: -w / 2, y: 1, w, h: 1 }), "#60A5FA");
    }
    for (const p of s.proj) this.rect(projRect(p, s), "#F43F5E");
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
    for (const i of order) this.drawFighter(s.p[i], i, s);
    this.drawProj(s);

    for (const p of this.parts) {
      const a = p.life / p.max;
      g.globalAlpha = Math.min(1, a * 1.5);
      if (p.kind === "spark" || p.kind === "dust") {
        g.fillStyle = p.color;
        g.beginPath();
        g.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
        g.fill();
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
    if (this.showBoxes) this.drawBoxes(s);

    if (this.flash > 0) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalAlpha = this.flash / 20;
      g.fillStyle = this.flashColor;
      g.fillRect(0, 0, this.canvas.width, this.canvas.height);
      g.globalAlpha = 1;
    }
  }
}
