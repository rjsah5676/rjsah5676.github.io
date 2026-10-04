/**
 * 학교 맵 배경 그리기 (캔버스 벡터, 화면 해상도에 맞춰 한 번 그려 두고 재사용).
 * 월드 좌표 320×180 기준으로 그림 — 바닥 띠는 BASE_Y - z1 (안쪽 끝) ~ 화면 아래.
 * 발판(단상·뜀틀·물탱크·벤치)은 캐릭터와 앞뒤가 섞여야 해서 drawPlat으로 따로 그림.
 */
import { BASE_Y, VIEW_H, VIEW_W } from "@/lib/fight/sim";
import type { MapDef, Plat } from "@/lib/fight/maps";

type G = CanvasRenderingContext2D;

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

function grad(g: G, y0: number, y1: number, stops: [number, string][]) {
  const l = g.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([o, c]) => l.addColorStop(o, c));
  return l;
}

/** 원근 바닥 줄 (안쪽 끝 y0 ~ 화면 아래) */
function floorLines(g: G, y0: number, color: string, rows: number, cols: number) {
  g.strokeStyle = color;
  g.lineWidth = 0.5;
  for (let i = -cols; i <= cols; i++) {
    g.beginPath();
    g.moveTo(160 + i * 14, y0);
    g.lineTo(160 + i * 30, VIEW_H);
    g.stroke();
  }
  for (let r = 1; r <= rows; r++) {
    const y = y0 + (VIEW_H - y0) * Math.pow(r / rows, 1.4);
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(VIEW_W, y);
    g.stroke();
  }
}

function windowsRow(g: G, x0: number, x1: number, y: number, w: number, h: number, gap: number, lit: string, frame: string) {
  for (let x = x0; x + w <= x1; x += w + gap) {
    g.fillStyle = frame;
    g.fillRect(x - 0.6, y - 0.6, w + 1.2, h + 1.2);
    g.fillStyle = lit;
    g.fillRect(x, y, w, h);
    g.fillStyle = "rgba(255,255,255,0.25)";
    g.fillRect(x + 0.6, y + 0.6, w * 0.35, h - 1.2);
  }
}

function yard(g: G, m: MapDef) {
  const back = BASE_Y - m.z1;
  g.fillStyle = grad(g, 0, back, [
    [0, "#3B2A6B"],
    [0.45, "#C0577A"],
    [0.85, "#F6A86B"],
    [1, "#FFD39A"],
  ]);
  g.fillRect(0, 0, VIEW_W, back);
  // 해
  g.fillStyle = "rgba(255,236,180,0.9)";
  g.beginPath();
  g.arc(250, back - 30, 16, 0, Math.PI * 2);
  g.fill();
  // 구름
  g.fillStyle = "rgba(255,210,200,0.55)";
  for (const [x, y, s] of [
    [50, 26, 1],
    [140, 16, 0.8],
    [210, 34, 1.2],
  ]) {
    g.beginPath();
    g.ellipse(x, y, 22 * s, 5 * s, 0, 0, Math.PI * 2);
    g.ellipse(x + 10 * s, y - 3 * s, 12 * s, 5 * s, 0, 0, Math.PI * 2);
    g.fill();
  }
  // 학교 건물
  const top = back - 62;
  g.fillStyle = "#E9D7C8";
  g.fillRect(20, top, 220, 62);
  g.fillStyle = "#C9B3A4";
  g.fillRect(20, top + 58, 220, 4);
  g.fillStyle = "#D9C4B5";
  g.fillRect(110, top - 18, 40, 20); // 시계탑
  g.fillStyle = "#FFF7EC";
  g.beginPath();
  g.arc(130, top - 8, 6, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#5A4A44";
  g.lineWidth = 0.7;
  g.beginPath();
  g.moveTo(130, top - 8);
  g.lineTo(130, top - 12);
  g.moveTo(130, top - 8);
  g.lineTo(133, top - 7);
  g.stroke();
  for (let r = 0; r < 3; r++) windowsRow(g, 26, 236, top + 6 + r * 17, 12, 9, 5, "#9FC7E8", "#8A7468");
  // 나무
  for (const [x, s] of [
    [262, 1.1],
    [298, 0.9],
    [8, 0.8],
  ]) {
    g.fillStyle = "#5B3A2E";
    g.fillRect(x - 1.5, back - 22 * s, 3, 22 * s);
    g.fillStyle = "#E58FA8";
    g.beginPath();
    g.arc(x, back - 26 * s, 12 * s, 0, Math.PI * 2);
    g.arc(x - 8 * s, back - 20 * s, 8 * s, 0, Math.PI * 2);
    g.arc(x + 8 * s, back - 20 * s, 8 * s, 0, Math.PI * 2);
    g.fill();
  }
  // 펜스
  g.strokeStyle = "rgba(60,60,80,0.5)";
  g.lineWidth = 0.4;
  for (let x = 0; x < VIEW_W; x += 4) {
    g.beginPath();
    g.moveTo(x, back - 10);
    g.lineTo(x + 4, back);
    g.moveTo(x + 4, back - 10);
    g.lineTo(x, back);
    g.stroke();
  }
  // 운동장 흙
  g.fillStyle = grad(g, back, VIEW_H, [
    [0, "#C9925E"],
    [1, "#A86F43"],
  ]);
  g.fillRect(0, back, VIEW_W, VIEW_H - back);
  g.strokeStyle = "rgba(255,255,255,0.7)";
  g.lineWidth = 0.8;
  g.beginPath();
  g.ellipse(160, back + 26, 150, 18, 0, 0, Math.PI * 2);
  g.stroke();
  const r = rnd(3);
  g.fillStyle = "rgba(90,50,30,0.25)";
  for (let i = 0; i < 120; i++) g.fillRect(r() * VIEW_W, back + r() * (VIEW_H - back), 0.8, 0.5);
}

function gym(g: G, m: MapDef) {
  const back = BASE_Y - m.z1;
  g.fillStyle = grad(g, 0, back, [
    [0, "#6B4A3A"],
    [1, "#9C7458"],
  ]);
  g.fillRect(0, 0, VIEW_W, back);
  // 위쪽 창
  windowsRow(g, 12, 312, 8, 24, 14, 12, "#CFE8FF", "#4A3328");
  // 벽 판넬
  g.strokeStyle = "rgba(60,35,25,0.5)";
  g.lineWidth = 0.6;
  for (let x = 0; x < VIEW_W; x += 20) {
    g.beginPath();
    g.moveTo(x, 30);
    g.lineTo(x, back);
    g.stroke();
  }
  // 무대 뒤 커튼 (단상 위쪽)
  g.fillStyle = "#8E1F35";
  g.fillRect(112, 30, 96, back - 30 - 14);
  g.fillStyle = "#B23048";
  for (let x = 112; x < 208; x += 8) g.fillRect(x, 30, 3, back - 30 - 14);
  g.fillStyle = "#E8C547";
  g.fillRect(108, 28, 104, 4);
  // 농구 골대
  for (const x of [40, 280]) {
    g.fillStyle = "#F7F7F7";
    g.fillRect(x - 12, 38, 24, 16);
    g.strokeStyle = "#E8344E";
    g.lineWidth = 1;
    g.strokeRect(x - 5, 44, 10, 7);
    g.strokeStyle = "#FF8A2A";
    g.beginPath();
    g.ellipse(x, 56, 5, 1.4, 0, 0, Math.PI * 2);
    g.stroke();
  }
  // 현수막
  g.fillStyle = "#F4F1E8";
  g.fillRect(232, 64, 60, 12);
  g.fillStyle = "#283A73";
  g.font = "bold 7px sans-serif";
  g.textAlign = "center";
  g.fillText("체육대회", 262, 72.5);
  // 마루
  g.fillStyle = grad(g, back, VIEW_H, [
    [0, "#D9A86B"],
    [1, "#B9824A"],
  ]);
  g.fillRect(0, back, VIEW_W, VIEW_H - back);
  floorLines(g, back, "rgba(120,70,30,0.35)", 6, 14);
  g.strokeStyle = "rgba(255,255,255,0.75)";
  g.lineWidth = 0.8;
  g.beginPath();
  g.moveTo(160, back);
  g.lineTo(160, VIEW_H);
  g.stroke();
  g.beginPath();
  g.ellipse(160, back + 28, 30, 9, 0, 0, Math.PI * 2);
  g.stroke();
}

function roof(g: G, m: MapDef) {
  const back = BASE_Y - m.z1;
  g.fillStyle = grad(g, 0, back, [
    [0, "#0B1030"],
    [0.7, "#24305E"],
    [1, "#3E4A7A"],
  ]);
  g.fillRect(0, 0, VIEW_W, back);
  const r = rnd(9);
  for (let i = 0; i < 70; i++) {
    g.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.7})`;
    g.fillRect(r() * VIEW_W, r() * (back - 40), 0.8, 0.8);
  }
  // 달
  g.fillStyle = "#FFF6D8";
  g.beginPath();
  g.arc(60, 30, 12, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#24305E";
  g.beginPath();
  g.arc(65, 27, 10, 0, Math.PI * 2);
  g.fill();
  // 도시 불빛
  for (let x = 0; x < VIEW_W; ) {
    const w = 10 + r() * 18;
    const h = 14 + r() * 36;
    g.fillStyle = "#151A3A";
    g.fillRect(x, back - h, w, h);
    for (let yy = back - h + 3; yy < back - 2; yy += 4)
      for (let xx = x + 2; xx < x + w - 2; xx += 3)
        if (r() < 0.35) {
          g.fillStyle = r() < 0.5 ? "#FFD98A" : "#9FD3FF";
          g.fillRect(xx, yy, 1.2, 1.6);
        }
    x += w + 1;
  }
  // 철망
  g.fillStyle = "rgba(20,24,40,0.55)";
  g.fillRect(0, back - 22, VIEW_W, 22);
  g.strokeStyle = "rgba(180,190,210,0.45)";
  g.lineWidth = 0.35;
  for (let x = -22; x < VIEW_W + 22; x += 3.5) {
    g.beginPath();
    g.moveTo(x, back - 22);
    g.lineTo(x + 22, back);
    g.moveTo(x + 22, back - 22);
    g.lineTo(x, back);
    g.stroke();
  }
  g.fillStyle = "#8A93AE";
  g.fillRect(0, back - 23, VIEW_W, 1.5);
  for (let x = 0; x <= VIEW_W; x += 40) g.fillRect(x, back - 23, 1.5, 23);
  // 콘크리트 바닥
  g.fillStyle = grad(g, back, VIEW_H, [
    [0, "#59607A"],
    [1, "#3B4058"],
  ]);
  g.fillRect(0, back, VIEW_W, VIEW_H - back);
  floorLines(g, back, "rgba(20,24,40,0.45)", 5, 10);
}

function hall(g: G, m: MapDef) {
  const back = BASE_Y - m.z1;
  g.fillStyle = grad(g, 0, back, [
    [0, "#EDE6D8"],
    [1, "#D9CFBE"],
  ]);
  g.fillRect(0, 0, VIEW_W, back);
  // 창문 (오후 햇살)
  for (let x = 10; x < VIEW_W; x += 52) {
    g.fillStyle = "#6E7F95";
    g.fillRect(x - 1, 40, 40, 70);
    g.fillStyle = grad(g, 40, 110, [
      [0, "#BFE3FF"],
      [1, "#FFE9C2"],
    ]);
    g.fillRect(x, 41, 38, 68);
    g.fillStyle = "#6E7F95";
    g.fillRect(x + 18.5, 41, 1, 68);
    g.fillRect(x, 74, 38, 1);
  }
  // 사물함
  g.fillStyle = "#9AA7B8";
  g.fillRect(0, back - 26, VIEW_W, 26);
  g.strokeStyle = "#7A8698";
  g.lineWidth = 0.5;
  for (let x = 0; x < VIEW_W; x += 10) {
    g.strokeRect(x, back - 26, 10, 13);
    g.strokeRect(x, back - 13, 10, 13);
  }
  // 햇살 띠
  g.fillStyle = "rgba(255,240,200,0.18)";
  for (let x = 10; x < VIEW_W; x += 52) {
    g.beginPath();
    g.moveTo(x, 110);
    g.lineTo(x + 38, 110);
    g.lineTo(x + 70, VIEW_H);
    g.lineTo(x + 30, VIEW_H);
    g.fill();
  }
  // 반질반질한 바닥
  g.fillStyle = grad(g, back, VIEW_H, [
    [0, "#C9B79A"],
    [1, "#9E8A6A"],
  ]);
  g.fillRect(0, back, VIEW_W, VIEW_H - back);
  floorLines(g, back, "rgba(255,255,255,0.18)", 4, 12);
  g.fillStyle = "rgba(255,255,255,0.12)";
  g.fillRect(0, back + 6, VIEW_W, 3);
}

const DRAW: Record<string, (g: G, m: MapDef) => void> = { yard, gym, roof, hall };

export function drawStage(g: G, m: MapDef) {
  (DRAW[m.id] ?? yard)(g, m);
}

const PLAT_COLOR: Record<string, [string, string, string]> = {
  단상: ["#C08A55", "#8E5F35", "#5A3A22"],
  뜀틀: ["#F2E9DA", "#C9653E", "#7A3A20"],
  물탱크: ["#C7D0DE", "#8A95AA", "#4A5268"],
  벤치: ["#9C6A43", "#6E4628", "#3E2716"],
};

/** 발판 (윗면 + 앞면) */
export function drawPlat(g: G, p: Plat) {
  const [topC, frontC, line] = PLAT_COLOR[p.name] ?? ["#AAA", "#777", "#333"];
  const x0 = p.x0,
    x1 = p.x1;
  const yTop1 = BASE_Y - p.z1 - p.h,
    yTop0 = BASE_Y - p.z0 - p.h,
    yBot = BASE_Y - p.z0;
  g.fillStyle = "rgba(0,0,0,0.25)";
  g.fillRect(x0 + 2, yBot - 1, x1 - x0, 3);
  g.fillStyle = frontC;
  g.fillRect(x0, yTop0, x1 - x0, yBot - yTop0);
  g.fillStyle = topC;
  g.fillRect(x0, yTop1, x1 - x0, yTop0 - yTop1);
  g.strokeStyle = line;
  g.lineWidth = 0.7;
  g.strokeRect(x0, yTop1, x1 - x0, yBot - yTop1);
  g.beginPath();
  g.moveTo(x0, yTop0);
  g.lineTo(x1, yTop0);
  g.stroke();
  if (p.name === "뜀틀") {
    g.strokeStyle = "rgba(90,40,20,0.5)";
    for (let y = yTop0 + 3; y < yBot; y += 3) {
      g.beginPath();
      g.moveTo(x0, y);
      g.lineTo(x1, y);
      g.stroke();
    }
  } else if (p.name === "물탱크") {
    g.fillStyle = "rgba(255,255,255,0.25)";
    g.fillRect(x0 + 4, yTop0 + 2, 4, yBot - yTop0 - 4);
  } else if (p.name === "단상") {
    g.fillStyle = "rgba(255,255,255,0.12)";
    g.fillRect(x0, yTop1, x1 - x0, 2);
  }
}
