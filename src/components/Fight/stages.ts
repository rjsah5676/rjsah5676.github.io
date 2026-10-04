/**
 * 학교 맵 배경·발판 그리기 (캔버스, 화면 해상도에 맞춰 한 번 그려 두고 재사용 — render.ts가 구워 둠).
 * 월드 좌표 1152×648, 높이 y는 아래에서 위로 → 화면 y = VIEW_H - y.
 * 흐림(blur)·빛(lighter)·안개 층을 겹쳐 그림판 느낌을 줄임. 그림 파일(MapDef.bg)이 있으면 그걸 씀.
 */
import { VIEW_H, VIEW_W } from "@/lib/fight/sim";
import type { MapDef, Plat } from "@/lib/fight/maps";

type G = CanvasRenderingContext2D;
const W = VIEW_W,
  H = VIEW_H;
const Y = (y: number) => H - y;

function rnd(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lin(g: G, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) {
  const l = g.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([o, c]) => l.addColorStop(o, c));
  return l;
}
const vgrad = (g: G, y0: number, y1: number, stops: [number, string][]) => lin(g, 0, y0, 0, y1, stops);

function radial(g: G, x: number, y: number, r: number, stops: [number, string][]) {
  const l = g.createRadialGradient(x, y, 0, x, y, r);
  stops.forEach(([o, c]) => l.addColorStop(o, c));
  return l;
}

/** 흐림 효과를 월드 px 단위로 — 따로 그린 층을 한 번에 흐리게 (도형마다 흐리면 매우 느림) */
let layer: HTMLCanvasElement | null = null;
function blurred(g: G, px: number, draw: (g: G) => void) {
  const m = g.getTransform();
  const k = m.a || 1;
  if (!layer) layer = document.createElement("canvas");
  layer.width = g.canvas.width;
  layer.height = g.canvas.height;
  const lg = layer.getContext("2d")!;
  lg.setTransform(m);
  draw(lg);
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.filter = `blur(${(px * k).toFixed(1)}px)`;
  g.drawImage(layer, 0, 0);
  g.restore();
}

function glow(g: G, x: number, y: number, r: number, color: string, alpha = 1) {
  g.save();
  g.globalCompositeOperation = "lighter";
  g.globalAlpha = alpha;
  g.fillStyle = radial(g, x, y, r, [
    [0, color],
    [1, "rgba(0,0,0,0)"],
  ]);
  g.fillRect(x - r, y - r, r * 2, r * 2);
  g.restore();
}

/** 고운 잡티 (그림 질감) */
let grainPat: CanvasPattern | null = null;
function grain(g: G, alpha: number) {
  if (!grainPat) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const cg = c.getContext("2d")!;
    const id = cg.createImageData(128, 128);
    const r = rnd(77);
    for (let i = 0; i < id.data.length; i += 4) {
      const v = 110 + r() * 145;
      id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
      id.data[i + 3] = 255;
    }
    cg.putImageData(id, 0, 0);
    grainPat = g.createPattern(c, "repeat");
  }
  if (!grainPat) return;
  g.save();
  g.globalAlpha = alpha;
  g.globalCompositeOperation = "overlay";
  g.fillStyle = grainPat;
  g.fillRect(0, 0, W, H);
  g.restore();
}

/** 능선 실루엣 (sin 합) */
function ridge(g: G, base: number, amp: number, seed: number, color: string, step = 6) {
  const r = rnd(seed);
  const ph = [r() * 6, r() * 6, r() * 6];
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(0, H);
  for (let x = 0; x <= W; x += step) {
    const y =
      base -
      amp * (0.5 + 0.3 * Math.sin(x * 0.006 + ph[0]) + 0.15 * Math.sin(x * 0.017 + ph[1]) + 0.08 * Math.sin(x * 0.05 + ph[2]));
    g.lineTo(x, y);
  }
  g.lineTo(W, H);
  g.fill();
}

/** 빌딩 실루엣 줄 */
function skyline(g: G, base: number, minH: number, maxH: number, seed: number, body: string, lit: string[], litP: number) {
  const r = rnd(seed);
  for (let x = -10; x < W + 10; ) {
    const w = 26 + r() * 54;
    const h = minH + r() * (maxH - minH);
    g.fillStyle = body;
    g.fillRect(x, base - h, w, h + 2);
    if (r() < 0.3) g.fillRect(x + w * 0.4, base - h - 10 - r() * 18, 2, 30);
    for (let yy = base - h + 6; yy < base - 4; yy += 7)
      for (let xx = x + 4; xx < x + w - 4; xx += 6)
        if (r() < litP) {
          g.fillStyle = lit[Math.floor(r() * lit.length)];
          g.fillRect(xx, yy, 2.6, 3.4);
        }
    x += w + 2 + r() * 6;
  }
}

function cloud(g: G, x: number, y: number, s: number, body: string, lit: string, seed: number) {
  const r = rnd(seed);
  const puffs: [number, number, number][] = [];
  for (let i = 0; i < 9; i++) puffs.push([(r() - 0.5) * 160 * s, (r() - 0.7) * 34 * s, (22 + r() * 30) * s]);
  g.fillStyle = body;
  g.beginPath();
  for (const [dx, dy, rr] of puffs) {
    g.moveTo(x + dx + rr, y + dy);
    g.arc(x + dx, y + dy, rr, 0, Math.PI * 2);
  }
  g.fill();
  g.fillStyle = lit;
  g.beginPath();
  for (const [dx, dy, rr] of puffs) {
    g.moveTo(x + dx + rr * 0.8, y + dy - rr * 0.25);
    g.arc(x + dx, y + dy - rr * 0.25, rr * 0.8, 0, Math.PI * 2);
  }
  g.fill();
}

function windows(g: G, x0: number, x1: number, y: number, w: number, h: number, gap: number, seed: number, litC: string, darkC: string, frame: string) {
  const r = rnd(seed);
  for (let x = x0; x + w <= x1; x += w + gap) {
    g.fillStyle = frame;
    g.fillRect(x - 1.5, y - 1.5, w + 3, h + 3);
    const lit = r() < 0.55;
    g.fillStyle = lin(g, x, y, x + w, y + h, lit ? [[0, litC], [1, darkC]] : [[0, darkC], [1, darkC]]);
    g.fillRect(x, y, w, h);
    g.fillStyle = "rgba(255,255,255,0.18)";
    g.beginPath();
    g.moveTo(x, y + h);
    g.lineTo(x + w * 0.5, y);
    g.lineTo(x + w * 0.75, y);
    g.lineTo(x + w * 0.25, y + h);
    g.fill();
    g.fillStyle = frame;
    g.fillRect(x + w / 2 - 0.8, y, 1.6, h);
  }
}

function rays(g: G, sx: number, sy: number, angles: number[], len: number, color: string, alpha: number) {
  g.save();
  g.globalCompositeOperation = "lighter";
  g.globalAlpha = alpha;
  for (const a of angles) {
    const w = 0.05;
    g.fillStyle = lin(g, sx, sy, sx + Math.cos(a) * len, sy + Math.sin(a) * len, [
      [0, color],
      [1, "rgba(0,0,0,0)"],
    ]);
    g.beginPath();
    g.moveTo(sx, sy);
    g.lineTo(sx + Math.cos(a - w) * len, sy + Math.sin(a - w) * len);
    g.lineTo(sx + Math.cos(a + w) * len, sy + Math.sin(a + w) * len);
    g.fill();
  }
  g.restore();
}

function petals(g: G, n: number, seed: number, color: string) {
  const r = rnd(seed);
  for (let i = 0; i < n; i++) {
    const x = r() * W,
      y = r() * H * 0.9,
      s = 1.5 + r() * 2.5;
    g.save();
    g.translate(x, y);
    g.rotate(r() * 6);
    g.globalAlpha = 0.5 + r() * 0.5;
    g.fillStyle = color;
    g.beginPath();
    g.ellipse(0, 0, s, s * 0.55, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
}

// ───────────── 맵 ─────────────

function yard(g: G) {
  const hz = Y(150); // 지평선
  g.fillStyle = vgrad(g, 0, hz, [
    [0, "#2B1E5A"],
    [0.35, "#7A3F86"],
    [0.65, "#E0728A"],
    [0.88, "#FFB37A"],
    [1, "#FFE0A8"],
  ]);
  g.fillRect(0, 0, W, hz + 2);
  glow(g, 860, hz - 70, 360, "rgba(255,190,120,0.55)");
  glow(g, 860, hz - 70, 90, "rgba(255,244,214,1)");
  g.fillStyle = "#FFF4DA";
  g.beginPath();
  g.arc(860, hz - 70, 34, 0, Math.PI * 2);
  g.fill();
  blurred(g, 3, (g) => {
    cloud(g, 200, 110, 1.3, "rgba(150,90,150,0.55)", "rgba(255,170,170,0.45)", 3);
    cloud(g, 560, 70, 1, "rgba(150,90,150,0.45)", "rgba(255,180,170,0.4)", 5);
    cloud(g, 1010, 150, 1.1, "rgba(170,100,140,0.5)", "rgba(255,200,170,0.5)", 8);
  });
  rays(g, 860, hz - 70, [3.5, 3.75, 4.0, 4.3, 4.65, 5.0, 5.35, 5.7], 700, "rgba(255,220,170,0.35)", 0.5);
  blurred(g, 4, (g) => skyline(g, hz + 4, 30, 110, 11, "rgba(110,70,120,0.55)", ["rgba(255,220,160,0.6)"], 0.12));
  blurred(g, 1.5, (g) => ridge(g, hz + 10, 40, 4, "rgba(70,40,80,0.6)"));
  // 학교 건물
  const top = hz - 230,
    bx0 = 90,
    bx1 = 760;
  g.fillStyle = lin(g, bx0, 0, bx1, 0, [
    [0, "#C9A9B8"],
    [0.7, "#F0D2C0"],
    [1, "#FFE2C6"],
  ]);
  g.fillRect(bx0, top, bx1 - bx0, hz - top + 4);
  g.fillStyle = "rgba(80,40,70,0.25)";
  g.fillRect(bx0, top, bx1 - bx0, 12);
  for (let r = 0; r < 4; r++) {
    windows(g, bx0 + 24, bx1 - 20, top + 30 + r * 52, 34, 30, 14, 20 + r, "#FFE9B0", "#5B4A6E", "#8E6E7E");
    g.fillStyle = "rgba(120,80,100,0.35)";
    g.fillRect(bx0, top + 66 + r * 52, bx1 - bx0, 4);
  }
  // 시계탑
  g.fillStyle = lin(g, 380, 0, 470, 0, [
    [0, "#B693A6"],
    [1, "#F2D5C4"],
  ]);
  g.fillRect(380, top - 90, 90, 92);
  g.fillStyle = "#6E4A62";
  g.beginPath();
  g.moveTo(370, top - 90);
  g.lineTo(425, top - 140);
  g.lineTo(480, top - 90);
  g.fill();
  g.fillStyle = "#FFF6E6";
  g.beginPath();
  g.arc(425, top - 48, 22, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#4A3348";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(425, top - 48);
  g.lineTo(425, top - 62);
  g.moveTo(425, top - 48);
  g.lineTo(436, top - 44);
  g.stroke();
  glow(g, 760, top + 100, 200, "rgba(255,190,140,0.3)");
  // 벚나무
  const tree = (g: G, x: number, s: number, seed: number) => {
    const r = rnd(seed);
    g.fillStyle = "#4A2E3A";
    g.beginPath();
    g.moveTo(x - 6 * s, hz + 8);
    g.quadraticCurveTo(x - 2 * s, hz - 60 * s, x - 18 * s, hz - 120 * s);
    g.lineTo(x - 10 * s, hz - 122 * s);
    g.quadraticCurveTo(x + 6 * s, hz - 60 * s, x + 6 * s, hz + 8);
    g.fill();
    for (let i = 0; i < 26; i++) {
      const a = r() * Math.PI * 2,
        d = r() * 70 * s;
      const cx = x - 10 * s + Math.cos(a) * d * 1.2,
        cy = hz - 140 * s + Math.sin(a) * d * 0.6;
      g.fillStyle = r() < 0.5 ? "rgba(240,150,180,0.85)" : "rgba(255,200,215,0.85)";
      g.beginPath();
      g.arc(cx, cy, (16 + r() * 18) * s, 0, Math.PI * 2);
      g.fill();
    }
    glow(g, x + 20 * s, hz - 160 * s, 80 * s, "rgba(255,210,190,0.25)");
  };
  blurred(g, 2.5, (g) => tree(g, 840, 0.9, 2));
  tree(g, 1060, 1.15, 6);
  tree(g, 40, 1.05, 9);
  // 펜스
  g.strokeStyle = "rgba(60,40,70,0.45)";
  g.lineWidth = 1;
  for (let x = 0; x < W; x += 9) {
    g.beginPath();
    g.moveTo(x, hz - 34);
    g.lineTo(x + 9, hz + 6);
    g.moveTo(x + 9, hz - 34);
    g.lineTo(x, hz + 6);
    g.stroke();
  }
  g.fillStyle = "rgba(60,40,70,0.7)";
  g.fillRect(0, hz - 36, W, 3);
  // 운동장 흙
  g.fillStyle = vgrad(g, hz, H, [
    [0, "#D79A6E"],
    [0.4, "#B97A52"],
    [1, "#7E4E36"],
  ]);
  g.fillRect(0, hz, W, H - hz);
  glow(g, 860, hz + 10, 300, "rgba(255,190,130,0.25)");
  g.strokeStyle = "rgba(255,245,230,0.55)";
  g.lineWidth = 3;
  g.beginPath();
  g.ellipse(W / 2, hz + 60, 520, 52, 0, 0, Math.PI * 2);
  g.stroke();
  const r = rnd(12);
  g.fillStyle = "rgba(80,40,30,0.25)";
  for (let i = 0; i < 400; i++) g.fillRect(r() * W, hz + r() * (H - hz), 2, 1.2);
  blurred(g, 1.2, (g) => petals(g, 70, 31, "#FFC6D8"));
  grain(g, 0.12);
}

function gym(g: G) {
  g.fillStyle = vgrad(g, 0, H, [
    [0, "#3A2620"],
    [0.5, "#6E4A36"],
    [1, "#8E6444"],
  ]);
  g.fillRect(0, 0, W, H);
  // 천장 트러스
  g.strokeStyle = "rgba(30,20,18,0.8)";
  g.lineWidth = 3;
  for (let x = 0; x < W; x += 96) {
    g.beginPath();
    g.moveTo(x, 40);
    g.lineTo(x + 48, 8);
    g.lineTo(x + 96, 40);
    g.stroke();
  }
  g.fillStyle = "#24170F";
  g.fillRect(0, 36, W, 6);
  // 높은 창 + 빛줄기
  for (let i = 0; i < 9; i++) {
    const x = 30 + i * 126;
    g.fillStyle = "#2A1C14";
    g.fillRect(x - 3, 58, 76, 70);
    g.fillStyle = vgrad(g, 60, 126, [
      [0, "#FFF6E0"],
      [1, "#FFC98A"],
    ]);
    g.fillRect(x, 61, 70, 64);
    g.fillStyle = "#2A1C14";
    g.fillRect(x + 34, 61, 2, 64);
    g.fillRect(x, 92, 70, 2);
  }
  g.save();
  g.globalCompositeOperation = "lighter";
  for (let i = 0; i < 9; i++) {
    const x = 30 + i * 126;
    g.fillStyle = lin(g, x, 120, x + 160, H, [
      [0, "rgba(255,220,160,0.22)"],
      [1, "rgba(255,200,140,0)"],
    ]);
    g.beginPath();
    g.moveTo(x, 125);
    g.lineTo(x + 70, 125);
    g.lineTo(x + 230, H - 40);
    g.lineTo(x + 120, H - 40);
    g.fill();
  }
  g.restore();
  // 벽 판넬
  for (let x = 0; x < W; x += 48) {
    g.fillStyle = lin(g, x, 0, x + 48, 0, [
      [0, "rgba(0,0,0,0.12)"],
      [0.5, "rgba(255,230,200,0.05)"],
      [1, "rgba(0,0,0,0.12)"],
    ]);
    g.fillRect(x, 140, 48, H - 200);
  }
  // 무대 커튼
  const cx0 = 380,
    cx1 = 772,
    ct = 150;
  g.fillStyle = "#3C0A16";
  g.fillRect(cx0 - 20, ct - 14, cx1 - cx0 + 40, Y(150) - ct + 14);
  for (let x = cx0; x < cx1; x += 16) {
    g.fillStyle = lin(g, x, 0, x + 16, 0, [
      [0, "#5E1022"],
      [0.45, "#C2324E"],
      [1, "#5E1022"],
    ]);
    g.fillRect(x, ct, 16, Y(150) - ct);
  }
  g.fillStyle = lin(g, 0, ct - 18, 0, ct + 34, [
    [0, "#7E1A2E"],
    [1, "#B02A44"],
  ]);
  for (let x = cx0 - 20; x < cx1 + 20; x += 40) {
    g.beginPath();
    g.moveTo(x, ct - 16);
    g.quadraticCurveTo(x + 20, ct + 44, x + 40, ct - 16);
    g.fill();
  }
  g.fillStyle = "#E8C24A";
  g.fillRect(cx0 - 26, ct - 22, cx1 - cx0 + 52, 8);
  glow(g, (cx0 + cx1) / 2, ct + 40, 260, "rgba(255,200,150,0.25)");
  // 현수막
  g.fillStyle = "#F6F0E2";
  g.fillRect(470, 196, 212, 40);
  g.fillStyle = "#1E2F66";
  g.font = "bold 24px sans-serif";
  g.textAlign = "center";
  g.fillText("체육대회", 576, 225);
  // 마루 (광택)
  const fy = Y(56);
  g.fillStyle = vgrad(g, fy, H, [
    [0, "#E3B077"],
    [1, "#A86E3E"],
  ]);
  g.fillRect(0, fy, W, H - fy);
  g.strokeStyle = "rgba(110,60,25,0.35)";
  g.lineWidth = 1;
  for (let x = -W; x < W * 2; x += 36) {
    g.beginPath();
    g.moveTo(x, fy);
    g.lineTo(W / 2 + (x - W / 2) * 1.6, H);
    g.stroke();
  }
  g.fillStyle = "rgba(255,240,210,0.25)";
  g.fillRect(0, fy + 4, W, 3);
  g.strokeStyle = "rgba(255,255,255,0.7)";
  g.lineWidth = 2.5;
  g.beginPath();
  g.ellipse(W / 2, fy + 30, 120, 18, 0, 0, Math.PI * 2);
  g.stroke();
  // 먼지
  const r = rnd(4);
  g.save();
  g.globalCompositeOperation = "lighter";
  for (let i = 0; i < 140; i++) {
    g.fillStyle = `rgba(255,230,180,${0.15 + r() * 0.35})`;
    g.beginPath();
    g.arc(r() * W, 130 + r() * (H - 200), 0.8 + r() * 1.4, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
  grain(g, 0.1);
}

function roof(g: G) {
  g.fillStyle = vgrad(g, 0, H, [
    [0, "#060A22"],
    [0.55, "#1C2552"],
    [0.85, "#3C3F78"],
    [1, "#5A4A80"],
  ]);
  g.fillRect(0, 0, W, H);
  const r = rnd(9);
  for (let i = 0; i < 260; i++) {
    const s = r();
    g.fillStyle = `rgba(255,255,255,${0.25 + s * 0.75})`;
    g.fillRect(r() * W, r() * 360, s > 0.9 ? 2 : 1.2, s > 0.9 ? 2 : 1.2);
  }
  // 달
  glow(g, 210, 120, 260, "rgba(150,170,255,0.35)");
  g.fillStyle = radial(g, 200, 112, 46, [
    [0, "#FFFDF0"],
    [0.85, "#EDE7C8"],
    [1, "#C9C2A0"],
  ]);
  g.beginPath();
  g.arc(210, 120, 46, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "rgba(180,170,140,0.35)";
  for (const [dx, dy, rr] of [
    [-12, -8, 9],
    [10, 12, 7],
    [16, -14, 5],
  ]) {
    g.beginPath();
    g.arc(210 + dx, 120 + dy, rr, 0, Math.PI * 2);
    g.fill();
  }
  blurred(g, 6, (g) => {
    g.fillStyle = "rgba(120,110,190,0.25)";
    g.fillRect(0, 300, W, 40);
  });
  // 먼 도시 (흐림)
  blurred(g, 3, (g) =>
    skyline(g, Y(30), 120, 300, 21, "rgba(40,44,96,0.9)", ["rgba(255,210,140,0.7)", "rgba(140,200,255,0.7)"], 0.18)
  );
  blurred(g, 1, (g) => skyline(g, Y(-10), 90, 220, 23, "#141838", ["#FFD98A", "#9FD3FF", "#FF8FC2"], 0.3));
  // 네온 빛
  glow(g, 300, Y(160), 120, "rgba(255,90,170,0.35)");
  glow(g, 900, Y(200), 140, "rgba(80,200,255,0.3)");
  // 아래 안개 (뚫린 틈 아래로 아득하게)
  g.fillStyle = vgrad(g, Y(120), H, [
    [0, "rgba(90,80,150,0)"],
    [1, "rgba(150,130,200,0.75)"],
  ]);
  g.fillRect(0, Y(120), W, 120);
  grain(g, 0.1);
}

function sky(g: G) {
  g.fillStyle = vgrad(g, 0, H, [
    [0, "#3E8EE0"],
    [0.5, "#8EC8F2"],
    [0.8, "#D6EEFA"],
    [1, "#FFF4E2"],
  ]);
  g.fillRect(0, 0, W, H);
  glow(g, 960, 70, 420, "rgba(255,250,220,0.75)");
  rays(g, 960, 70, [1.8, 2.05, 2.3, 2.6, 2.9, 3.15], 1100, "rgba(255,250,225,0.4)", 0.55);
  blurred(g, 7, (g) => {
    cloud(g, 160, 520, 2.6, "rgba(200,220,240,0.9)", "rgba(255,255,255,0.9)", 2);
    cloud(g, 640, 600, 3, "rgba(200,220,240,0.9)", "rgba(255,255,255,0.95)", 4);
    cloud(g, 1060, 540, 2.4, "rgba(190,210,235,0.9)", "rgba(255,255,255,0.9)", 6);
  });
  blurred(g, 3, (g) => {
    cloud(g, 300, 150, 1.4, "rgba(220,235,250,0.85)", "rgba(255,255,255,0.95)", 8);
    cloud(g, 760, 210, 1.1, "rgba(220,235,250,0.8)", "rgba(255,255,255,0.9)", 10);
  });
  // 멀리 떠 있는 교사 조각 (흐림)
  blurred(g, 2.5, (g) => {
    g.fillStyle = "rgba(120,140,170,0.55)";
    g.fillRect(560, 240, 120, 90);
    g.beginPath();
    g.moveTo(560, 330);
    g.lineTo(620, 400);
    g.lineTo(680, 330);
    g.fill();
    g.fillStyle = "rgba(220,235,250,0.55)";
    for (let y = 252; y < 320; y += 22) for (let x = 570; x < 670; x += 24) g.fillRect(x, y, 14, 12);
  });
  // 아래 구름 바다
  g.fillStyle = vgrad(g, Y(80), H, [
    [0, "rgba(255,255,255,0)"],
    [1, "rgba(255,255,255,0.95)"],
  ]);
  g.fillRect(0, Y(80), W, 80);
  grain(g, 0.08);
}

const DRAW: Record<string, (g: G) => void> = { yard, gym, roof, sky };

export function drawStage(g: G, m: MapDef) {
  (DRAW[m.id] ?? yard)(g);
}

// ───────────── 발판 ─────────────

function softShadow(g: G, x0: number, x1: number, y: number, h = 10) {
  blurred(g, 4, (g) => {
    g.fillStyle = "rgba(0,0,0,0.35)";
    g.fillRect(x0 + 6, y, x1 - x0 - 12, h);
  });
}

/** 발판 (월드 좌표, 윗면 y) */
export function drawPlat(g: G, p: Plat) {
  const x0 = p.x0,
    x1 = p.x1,
    w = x1 - x0;
  const t = Y(p.y);
  const r = rnd(Math.round(x0 * 7 + p.y));
  switch (p.kind) {
    case "dirt":
    case "wood": {
      g.fillStyle = "rgba(255,255,255,0.18)";
      g.fillRect(x0, t, w, 2);
      return;
    }
    case "stand": {
      // 스탠드 의자 (철골 다리)
      g.strokeStyle = "#3A3F52";
      g.lineWidth = 4;
      for (let x = x0 + 16; x < x1; x += 56) {
        g.beginPath();
        g.moveTo(x, t + 10);
        g.lineTo(x, Y(64));
        g.stroke();
      }
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(x0 + 16, t + 40);
      g.lineTo(x1 - 16, Y(64) - 10);
      g.stroke();
      softShadow(g, x0, x1, t + 10);
      g.fillStyle = vgrad(g, t, t + 12, [
        [0, "#7FB4F2"],
        [1, "#2E5FA8"],
      ]);
      g.fillRect(x0, t, w, 12);
      for (let x = x0; x < x1; x += 30) {
        g.fillStyle = "rgba(255,255,255,0.25)";
        g.fillRect(x + 2, t + 1, 24, 2);
        g.fillStyle = "rgba(0,0,30,0.3)";
        g.fillRect(x + 27, t, 3, 12);
      }
      g.fillStyle = "#283048";
      g.fillRect(x0, t + 12, w, 4);
      return;
    }
    case "bar": {
      // 응원 현수막 거는 트러스
      g.strokeStyle = "#5A6278";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(x0 + 8, t + 6);
      g.lineTo(x0 + 8, Y(64));
      g.moveTo(x1 - 8, t + 6);
      g.lineTo(x1 - 8, Y(64));
      g.stroke();
      g.fillStyle = vgrad(g, t, t + 10, [
        [0, "#C9D2E6"],
        [1, "#6E7890"],
      ]);
      g.fillRect(x0, t, w, 10);
      g.strokeStyle = "rgba(60,66,90,0.8)";
      g.lineWidth = 1.2;
      for (let x = x0; x < x1 - 10; x += 14) {
        g.beginPath();
        g.moveTo(x, t + 10);
        g.lineTo(x + 7, t);
        g.lineTo(x + 14, t + 10);
        g.stroke();
      }
      const bx = x0 + 18,
        bw = w - 36;
      g.fillStyle = vgrad(g, t + 14, t + 64, [
        [0, "#FFF4E8"],
        [1, "#F2D9C6"],
      ]);
      g.beginPath();
      g.moveTo(bx, t + 12);
      g.lineTo(bx + bw, t + 12);
      g.quadraticCurveTo(bx + bw - 4, t + 40, bx + bw, t + 62);
      g.lineTo(bx, t + 62);
      g.quadraticCurveTo(bx + 4, t + 40, bx, t + 12);
      g.fill();
      g.fillStyle = "#C2324E";
      g.font = "bold 20px sans-serif";
      g.textAlign = "center";
      g.fillText(x0 < W / 2 ? "청팀 화이팅" : "백팀 필승", bx + bw / 2, t + 44);
      return;
    }
    case "stage": {
      const bot = Y(56);
      g.fillStyle = lin(g, 0, t, 0, bot, [
        [0, "#B07A48"],
        [1, "#6E4528"],
      ]);
      g.fillRect(x0, t + 8, w, bot - t - 8);
      for (let x = x0; x < x1; x += 52) {
        g.strokeStyle = "rgba(50,28,14,0.5)";
        g.lineWidth = 1.5;
        g.strokeRect(x + 6, t + 18, 40, bot - t - 26);
      }
      g.fillStyle = vgrad(g, t, t + 8, [
        [0, "#E8B880"],
        [1, "#B47E4A"],
      ]);
      g.fillRect(x0 - 4, t, w + 8, 9);
      g.fillStyle = "#F2D44A";
      g.beginPath();
      g.arc((x0 + x1) / 2, (t + bot) / 2 + 4, 18, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#6E4528";
      g.font = "bold 16px sans-serif";
      g.textAlign = "center";
      g.fillText("學", (x0 + x1) / 2, (t + bot) / 2 + 10);
      return;
    }
    case "catwalk": {
      g.strokeStyle = "rgba(30,24,20,0.8)";
      g.lineWidth = 1.5;
      for (const x of [x0 + 20, x1 - 20]) {
        g.beginPath();
        g.moveTo(x, t);
        g.lineTo(x, 40);
        g.stroke();
      }
      softShadow(g, x0, x1, t + 8);
      g.fillStyle = vgrad(g, t, t + 10, [
        [0, "#8A8F9E"],
        [1, "#3E424E"],
      ]);
      g.fillRect(x0, t, w, 10);
      g.strokeStyle = "rgba(20,20,26,0.6)";
      g.lineWidth = 1;
      for (let x = x0; x < x1; x += 8) {
        g.beginPath();
        g.moveTo(x, t + 2);
        g.lineTo(x + 6, t + 9);
        g.stroke();
      }
      g.strokeStyle = "#5A5F6E";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(x0, t - 26);
      g.lineTo(x1, t - 26);
      g.stroke();
      g.lineWidth = 1.4;
      for (let x = x0 + 4; x < x1; x += 24) {
        g.beginPath();
        g.moveTo(x, t);
        g.lineTo(x, t - 26);
        g.stroke();
      }
      return;
    }
    case "hoop": {
      g.fillStyle = "#2A2A30";
      g.fillRect((x0 + x1) / 2 - 3, 40, 6, t - 40);
      g.fillStyle = vgrad(g, t, t + 64, [
        [0, "#FFFFFF"],
        [1, "#D8DCE4"],
      ]);
      g.fillRect(x0, t, w, 64);
      g.strokeStyle = "#2A2A30";
      g.lineWidth = 3;
      g.strokeRect(x0, t, w, 64);
      g.strokeStyle = "#E8344E";
      g.strokeRect((x0 + x1) / 2 - 18, t + 26, 36, 26);
      g.strokeStyle = "#FF7A1A";
      g.lineWidth = 3;
      g.beginPath();
      g.ellipse((x0 + x1) / 2, t + 70, 18, 4, 0, 0, Math.PI * 2);
      g.stroke();
      g.strokeStyle = "rgba(255,255,255,0.8)";
      g.lineWidth = 1;
      for (let i = -3; i <= 3; i++) {
        g.beginPath();
        g.moveTo((x0 + x1) / 2 + i * 5, t + 72);
        g.lineTo((x0 + x1) / 2 + i * 3, t + 96);
        g.stroke();
      }
      return;
    }
    case "roof": {
      // 건물 옥상 + 벽면
      g.fillStyle = lin(g, x0, 0, x1, 0, [
        [0, "#2A2F4E"],
        [1, "#3E4470"],
      ]);
      g.fillRect(x0, t + 10, w, H - t);
      for (let yy = t + 40; yy < H; yy += 46)
        windows(g, x0 + 20, x1 - 20, yy, 26, 24, 22, Math.round(yy + x0), "#FFE2A0", "#1A1E38", "#22264A");
      g.fillStyle = vgrad(g, t, t + 12, [
        [0, "#9AA2C0"],
        [1, "#5A6084"],
      ]);
      g.fillRect(x0, t, w, 12);
      // 난간 철망
      g.strokeStyle = "rgba(170,180,210,0.45)";
      g.lineWidth = 1;
      const fx0 = x0 + (x0 === 0 ? 0 : 6),
        fx1 = x1 - (x1 >= W ? 0 : 6);
      for (let x = fx0; x < fx1; x += 9) {
        g.beginPath();
        g.moveTo(x, t - 46);
        g.lineTo(x + 9, t);
        g.moveTo(x + 9, t - 46);
        g.lineTo(x, t);
        g.stroke();
      }
      g.fillStyle = "#8A93B6";
      g.fillRect(fx0, t - 48, fx1 - fx0, 3);
      for (let x = fx0; x <= fx1; x += 76) g.fillRect(x, t - 48, 3, 48);
      return;
    }
    case "tank": {
      const bot = Y(96);
      g.strokeStyle = "#3A4060";
      g.lineWidth = 5;
      for (const x of [x0 + 18, x1 - 18]) {
        g.beginPath();
        g.moveTo(x, t + 70);
        g.lineTo(x, bot);
        g.stroke();
      }
      g.fillStyle = lin(g, x0, 0, x1, 0, [
        [0, "#5A6488"],
        [0.35, "#C9D2EA"],
        [1, "#4A5276"],
      ]);
      g.fillRect(x0, t + 6, w, 70);
      g.fillStyle = "#9AA4C6";
      g.beginPath();
      g.ellipse((x0 + x1) / 2, t + 6, w / 2, 8, 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "rgba(40,46,70,0.6)";
      g.lineWidth = 1.5;
      for (let y = t + 22; y < t + 76; y += 16) {
        g.beginPath();
        g.moveTo(x0, y);
        g.lineTo(x1, y);
        g.stroke();
      }
      g.fillStyle = "#2E3454";
      g.font = "bold 13px sans-serif";
      g.textAlign = "center";
      g.fillText("給水", (x0 + x1) / 2, t + 48);
      return;
    }
    case "unit": {
      const bot = Y(96);
      g.fillStyle = lin(g, x0, 0, x1, 0, [
        [0, "#8C93AE"],
        [1, "#C9CEE0"],
      ]);
      g.fillRect(x0, t, w, bot - t);
      g.strokeStyle = "#4A5070";
      g.lineWidth = 2;
      g.strokeRect(x0, t, w, bot - t);
      g.fillStyle = "#3A3F58";
      g.beginPath();
      g.arc(x0 + w * 0.36, (t + bot) / 2, (bot - t) * 0.34, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#7A80A0";
      for (let k = 0; k < 4; k++) {
        const a = k * 1.57 + 0.4;
        g.beginPath();
        g.moveTo(x0 + w * 0.36, (t + bot) / 2);
        g.lineTo(x0 + w * 0.36 + Math.cos(a) * 20, (t + bot) / 2 + Math.sin(a) * 20);
        g.stroke();
      }
      for (let y = t + 10; y < bot - 6; y += 6) {
        g.fillStyle = "rgba(40,44,66,0.5)";
        g.fillRect(x0 + w * 0.72, y, w * 0.2, 2);
      }
      return;
    }
    case "sign": {
      // 네온 간판 (기둥)
      const pink = r() < 0.5;
      const neon = pink ? "#FF5AB0" : "#5AD8FF";
      g.fillStyle = "#1A1E36";
      g.fillRect((x0 + x1) / 2 - 4, t + 40, 8, H - t);
      glow(g, (x0 + x1) / 2, t + 22, w * 0.8, pink ? "rgba(255,90,176,0.5)" : "rgba(90,216,255,0.5)", 0.6);
      g.fillStyle = "#121630";
      g.fillRect(x0, t, w, 44);
      g.strokeStyle = neon;
      g.lineWidth = 3;
      g.strokeRect(x0 + 4, t + 4, w - 8, 36);
      g.fillStyle = neon;
      g.font = "bold 20px sans-serif";
      g.textAlign = "center";
      g.fillText(r() < 0.5 ? "能力開發" : "學園都市", (x0 + x1) / 2, t + 30);
      g.fillStyle = "#8A93B6";
      g.fillRect(x0 - 4, t - 2, w + 8, 4);
      return;
    }
    case "island":
    case "chunk": {
      // 떠 있는 교정 조각 (흙·뿌리·깨진 바닥 타일)
      const depth = p.kind === "island" ? 120 : 64;
      g.fillStyle = lin(g, x0, t, x0 + w * 0.3, t + depth, [
        [0, "#8A6A52"],
        [1, "#4A3428"],
      ]);
      g.beginPath();
      g.moveTo(x0, t + 4);
      g.lineTo(x1, t + 4);
      const n = 7;
      for (let i = 0; i <= n; i++) {
        const xx = x1 - (w * i) / n;
        const d = depth * (0.45 + 0.55 * Math.sin((i / n) * Math.PI)) * (0.8 + r() * 0.3);
        g.lineTo(xx, t + d);
      }
      g.closePath();
      g.fill();
      g.strokeStyle = "rgba(40,28,20,0.6)";
      g.lineWidth = 1.2;
      for (let i = 0; i < 6; i++) {
        const xx = x0 + 12 + r() * (w - 24);
        g.beginPath();
        g.moveTo(xx, t + 8);
        g.quadraticCurveTo(xx + (r() - 0.5) * 20, t + depth * 0.6, xx + (r() - 0.5) * 30, t + depth * (0.8 + r() * 0.5));
        g.stroke();
      }
      // 깨진 바닥 타일 (교정)
      g.fillStyle = vgrad(g, t, t + 10, [
        [0, "#E8E2D6"],
        [1, "#B8AE9E"],
      ]);
      g.fillRect(x0, t, w, 9);
      g.strokeStyle = "rgba(90,80,70,0.45)";
      g.lineWidth = 1;
      for (let x = x0 + 18; x < x1; x += 22) {
        g.beginPath();
        g.moveTo(x, t);
        g.lineTo(x, t + 9);
        g.stroke();
      }
      // 풀
      g.fillStyle = "#6FBF5A";
      for (let x = x0; x < x1; x += 5) {
        const hh = 3 + r() * 6;
        g.beginPath();
        g.moveTo(x, t + 1);
        g.lineTo(x + 2.5, t - hh);
        g.lineTo(x + 5, t + 1);
        g.fill();
      }
      g.fillStyle = "rgba(255,255,255,0.35)";
      g.fillRect(x0, t, w, 1.5);
      return;
    }
    default:
      g.fillStyle = "#888";
      g.fillRect(x0, t, w, 10);
  }
}
