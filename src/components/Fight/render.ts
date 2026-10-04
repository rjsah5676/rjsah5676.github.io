/**
 * 격투게임 캔버스 그리기 (320×180 도트 화면을 정수배로 키워서).
 * 시뮬레이션 상태를 읽기만 하고 바꾸지 않음. 불꽃·흔들림 같은 연출은 여기서만 가짐.
 */
import { CHARS, SUB } from "@/lib/fight/chars";
import {
  FLOOR,
  VIEW_H,
  VIEW_W,
  boxRect,
  hitRect,
  hurtRect,
  projRect,
  type Ev,
  type Fighter,
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
  kind: "spark" | "ring" | "dust" | "text";
  text?: string;
}

const px = (v: number) => Math.round(v / SUB);

/** 0~1 값 하나로 만드는 결정적 잡음 (배경용) */
function hash1(n: number) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

function makeBackground(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = VIEW_W;
  c.height = VIEW_H;
  const g = c.getContext("2d")!;
  // 하늘: 해질녘
  const sky = g.createLinearGradient(0, 0, 0, 130);
  sky.addColorStop(0, "#1B1035");
  sky.addColorStop(0.45, "#4A2463");
  sky.addColorStop(0.8, "#C2546B");
  sky.addColorStop(1, "#F29E6D");
  g.fillStyle = sky;
  g.fillRect(0, 0, VIEW_W, 130);
  // 별
  for (let i = 0; i < 60; i++) {
    const x = Math.floor(hash1(i) * VIEW_W);
    const y = Math.floor(hash1(i + 99) * 60);
    g.fillStyle = `rgba(255,255,255,${0.3 + hash1(i + 7) * 0.6})`;
    g.fillRect(x, y, 1, 1);
  }
  // 해
  g.fillStyle = "#FFD9A0";
  g.beginPath();
  g.arc(236, 104, 22, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#FFE9C7";
  g.beginPath();
  g.arc(236, 104, 15, 0, Math.PI * 2);
  g.fill();
  // 산 두 겹 (도트 느낌으로 1px 단위)
  const ridge = (base: number, amp: number, seed: number, color: string) => {
    g.fillStyle = color;
    for (let x = 0; x < VIEW_W; x++) {
      const h =
        Math.sin(x / 37 + seed) * amp * 0.5 +
        Math.sin(x / 13 + seed * 2) * amp * 0.25 +
        Math.sin(x / 5.3 + seed * 3) * amp * 0.08;
      const y = Math.round(base - amp * 0.4 - h);
      g.fillRect(x, y, 1, 140 - y);
    }
  };
  ridge(112, 34, 1.3, "#5B2C5E");
  ridge(124, 26, 4.1, "#3A1D45");
  // 멀리 탑
  g.fillStyle = "#2A1433";
  for (const [x, w, h] of [
    [40, 10, 34],
    [276, 8, 28],
  ]) {
    g.fillRect(x, 130 - h, w, h);
    g.fillRect(x - 3, 130 - h, w + 6, 3);
    g.fillRect(x - 2, 130 - h + 10, w + 4, 2);
  }
  // 바닥: 돌판
  const fl = g.createLinearGradient(0, 130, 0, VIEW_H);
  fl.addColorStop(0, "#5E4A5A");
  fl.addColorStop(1, "#2B2230");
  g.fillStyle = fl;
  g.fillRect(0, 130, VIEW_W, VIEW_H - 130);
  g.fillStyle = "#7A6274";
  g.fillRect(0, 130, VIEW_W, 1);
  // 원근 줄눈
  g.strokeStyle = "rgba(20,10,25,0.45)";
  g.lineWidth = 1;
  for (let i = -12; i <= 12; i++) {
    g.beginPath();
    g.moveTo(160 + i * 14 + 0.5, 131);
    g.lineTo(160 + i * 46 + 0.5, VIEW_H);
    g.stroke();
  }
  for (const y of [138, 148, 162, 176]) {
    g.fillStyle = "rgba(20,10,25,0.4)";
    g.fillRect(0, y, VIEW_W, 1);
  }
  return c;
}

export class FightRenderer {
  private g: CanvasRenderingContext2D;
  private bg: HTMLCanvasElement | null = null;
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

  /** 캔버스 크기를 보이는 크기 × 화면 배율에 맞춤 (정수배) */
  resize() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const k = Math.max(1, Math.floor((r.width * dpr) / VIEW_W));
    if (this.canvas.width !== VIEW_W * k) {
      this.canvas.width = VIEW_W * k;
      this.canvas.height = VIEW_H * k;
    }
  }

  /** 시뮬레이션 이벤트 → 연출 */
  events(evs: Ev[], s: State) {
    for (const e of evs) {
      const x = e.x / SUB,
        y = e.y / SUB;
      if (e.k === "hit") {
        const power = e.m === "X" ? 2 : e.m === "H" || e.m === "S" ? 1 : 0;
        const color = CHARS[s.p[e.p].ch].color;
        for (let i = 0; i < 8 + power * 6; i++) {
          const a = Math.random() * Math.PI * 2;
          const sp = 1 + Math.random() * (2 + power * 1.5);
          this.parts.push({
            x,
            y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            life: 14 + power * 4,
            max: 14 + power * 4,
            color: i % 3 ? "#FFF6D6" : color,
            size: power ? 2 : 1,
            kind: "spark",
          });
        }
        this.parts.push({
          x,
          y,
          vx: 0,
          vy: 0,
          life: 10,
          max: 10,
          color: "#fff",
          size: 6 + power * 4,
          kind: "ring",
        });
        this.shake = Math.max(this.shake, 2 + power * 3);
        this.parts.push({
          x,
          y: y - 12,
          vx: 0,
          vy: -0.4,
          life: 36,
          max: 36,
          color: "#FFE08A",
          size: 1,
          kind: "text",
          text: String(e.v),
        });
      } else if (e.k === "block") {
        this.parts.push({
          x,
          y,
          vx: 0,
          vy: 0,
          life: 12,
          max: 12,
          color: "#8FD3FF",
          size: 10,
          kind: "ring",
        });
        for (let i = 0; i < 5; i++)
          this.parts.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 3,
            vy: -Math.random() * 2,
            life: 10,
            max: 10,
            color: "#CFEFFF",
            size: 1,
            kind: "spark",
          });
      } else if (e.k === "clash") {
        this.parts.push({
          x,
          y,
          vx: 0,
          vy: 0,
          life: 14,
          max: 14,
          color: "#fff",
          size: 14,
          kind: "ring",
        });
        this.shake = Math.max(this.shake, 3);
      } else if (e.k === "super") {
        this.flash = 10;
        this.flashColor = CHARS[s.p[e.p].ch].color;
      } else if (e.k === "ko") {
        this.flash = 9;
        this.flashColor = "#fff";
        this.shake = 8;
      } else if (e.k === "jump") {
        for (let i = 0; i < 4; i++)
          this.parts.push({
            x: x + (Math.random() - 0.5) * 10,
            y: FLOOR / SUB,
            vx: (Math.random() - 0.5) * 1.2,
            vy: -0.3,
            life: 14,
            max: 14,
            color: "#B9A2B0",
            size: 1,
            kind: "dust",
          });
      }
    }
  }

  /** 연출 한 프레임 진행 (시뮬레이션이 진행됐을 때만) */
  tick(s: State) {
    if (this.flash > 0) this.flash--;
    if (s.stop > 0 || s.freeze > 0) {
      // 히트스톱 중엔 불꽃도 멈춤 (흔들림·번쩍임만)
      this.shake *= 0.85;
      return;
    }
    for (const p of this.parts) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.kind === "spark") {
        p.vx *= 0.88;
        p.vy = p.vy * 0.88 + 0.08;
      }
      p.life--;
    }
    this.parts = this.parts.filter((p) => p.life > 0);
    this.shake *= 0.8;
  }

  private drawFighter(f: Fighter, i: number, s: State) {
    const g = this.g;
    const sh = this.sheets[i];
    const x = f.x / SUB,
      y = f.y / SUB;
    // 그림자
    const lift = Math.max(0, (FLOOR - f.y) / SUB);
    g.fillStyle = `rgba(0,0,0,${0.35 - Math.min(0.2, lift / 200)})`;
    g.beginPath();
    g.ellipse(Math.round(x), FLOOR / SUB + 1, Math.max(6, 14 - lift / 6), 3, 0, 0, Math.PI * 2);
    g.fill();
    if (!sh) {
      g.fillStyle = CHARS[f.ch].color;
      g.fillRect(Math.round(x) - 10, Math.round(y) - 44, 20, 44);
      return;
    }
    const { anim, frame } = pickFrame(sh, f, s);
    const [cw, ch] = sh.cell;
    const [ax, ay] = sh.anchor;
    const sx = frame * cw,
      sy = anim.row * ch;
    const dx = Math.round(x),
      dy = Math.round(y) - ay;
    const flashHit = (f.st === "hit" && f.t < 2) || (s.stop > 0 && f.st === "hit");
    let src: CanvasImageSource = sh.img;
    let ssx = sx,
      ssy = sy;
    if (flashHit) {
      // 맞은 순간 하얗게 번쩍
      if (!this.tmp) this.tmp = document.createElement("canvas");
      const t = this.tmp;
      t.width = cw;
      t.height = ch;
      const tg = t.getContext("2d")!;
      tg.clearRect(0, 0, cw, ch);
      tg.drawImage(sh.img, sx, sy, cw, ch, 0, 0, cw, ch);
      tg.globalCompositeOperation = "source-atop";
      tg.fillStyle = "rgba(255,255,255,0.75)";
      tg.fillRect(0, 0, cw, ch);
      tg.globalCompositeOperation = "source-over";
      src = t;
      ssx = 0;
      ssy = 0;
    }
    g.save();
    if (f.st === "rise" && f.t % 4 < 2) g.globalAlpha = 0.6; // 일어나는 중 무적 깜빡임
    const flip = sh.facing === "left" ? f.face > 0 : f.face < 0;
    if (!flip) g.drawImage(src, ssx, ssy, cw, ch, dx - ax, dy, cw, ch);
    else {
      g.translate(dx, 0);
      g.scale(-1, 1);
      g.drawImage(src, ssx, ssy, cw, ch, -ax, dy, cw, ch);
    }
    g.restore();
  }

  private drawProj(s: State) {
    const g = this.g;
    for (const p of s.proj) {
      const col = CHARS[s.p[p.o].ch].color;
      const r = projRect(p, s);
      const cx = px((r.l + r.r) / 2),
        cy = px((r.t + r.b) / 2);
      const w = px(r.r - r.l);
      const dir = Math.sign(p.vx);
      // 꼬리
      for (let k = 3; k >= 1; k--) {
        g.globalAlpha = 0.18 * (4 - k);
        g.fillStyle = col;
        const s2 = Math.max(2, w / 2 - k);
        g.fillRect(cx - dir * k * 6 - s2, cy - s2 / 1.4, s2 * 2, (s2 * 2) / 1.4);
      }
      g.globalAlpha = 1;
      const pulse = (s.f >> 2) % 2;
      g.fillStyle = col;
      g.beginPath();
      g.arc(cx, cy, w / 2 + pulse, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#FFFDF2";
      g.beginPath();
      g.arc(cx + dir, cy, w / 4, 0, Math.PI * 2);
      g.fill();
    }
  }

  private drawBoxes(s: State) {
    const g = this.g;
    const rect = (r: { l: number; r: number; t: number; b: number } | null, color: string) => {
      if (!r) return;
      g.strokeStyle = color;
      g.lineWidth = 1;
      g.strokeRect(px(r.l) + 0.5, px(r.t) + 0.5, px(r.r - r.l) - 1, px(r.b - r.t) - 1);
    };
    for (const f of s.p) {
      rect(hurtRect(f), "#4ADE80");
      rect(hitRect(f), "#F43F5E");
      // 기준점(발 가운데)
      g.fillStyle = "#FDE047";
      g.fillRect(px(f.x) - 1, px(f.y) - 1, 3, 3);
      // 밀어내기 폭
      const w = CHARS[f.ch].width;
      rect(boxRect(f, { x: -w / 2, y: 2, w, h: 2 }), "#60A5FA");
    }
    for (const p of s.proj) rect(projRect(p, s), "#F43F5E");
  }

  draw(s: State) {
    const g = this.g;
    const k = this.canvas.width / VIEW_W;
    g.setTransform(k, 0, 0, k, 0, 0);
    g.imageSmoothingEnabled = false;
    if (!this.bg) this.bg = makeBackground();
    const sx = this.shake > 0.5 ? Math.round((Math.random() - 0.5) * this.shake) : 0;
    const sy = this.shake > 0.5 ? Math.round((Math.random() - 0.5) * this.shake * 0.6) : 0;
    g.save();
    g.translate(sx, sy);
    g.drawImage(this.bg, 0, 0);

    // 초필살 연출: 배경 어둡게
    if (s.freeze > 0) {
      g.fillStyle = "rgba(0,0,0,0.55)";
      g.fillRect(-10, -10, VIEW_W + 20, VIEW_H + 20);
    }
    // 뒤에 있는(맞는 중) 캐릭터 먼저
    const order = s.p[0].st === "atk" && s.p[1].st !== "atk" ? [1, 0] : [0, 1];
    for (const i of order) this.drawFighter(s.p[i], i, s);
    this.drawProj(s);

    for (const p of this.parts) {
      const a = p.life / p.max;
      if (p.kind === "spark" || p.kind === "dust") {
        g.globalAlpha = Math.min(1, a * 1.5);
        g.fillStyle = p.color;
        g.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      } else if (p.kind === "ring") {
        g.globalAlpha = a;
        g.strokeStyle = p.color;
        g.lineWidth = 2;
        g.beginPath();
        g.arc(Math.round(p.x), Math.round(p.y), p.size * (1.6 - a), 0, Math.PI * 2);
        g.stroke();
      } else if (p.kind === "text" && p.text) {
        g.globalAlpha = Math.min(1, a * 2);
        g.font = "bold 8px ui-monospace, monospace";
        g.textAlign = "center";
        g.fillStyle = "#000";
        g.fillText(p.text, Math.round(p.x) + 1, Math.round(p.y) + 1);
        g.fillStyle = p.color;
        g.fillText(p.text, Math.round(p.x), Math.round(p.y));
      }
    }
    g.globalAlpha = 1;
    if (this.showBoxes) this.drawBoxes(s);
    g.restore();

    if (this.flash > 0) {
      g.globalAlpha = this.flash / 20;
      g.fillStyle = this.flashColor;
      g.fillRect(0, 0, VIEW_W, VIEW_H);
      g.globalAlpha = 1;
    }
  }
}
