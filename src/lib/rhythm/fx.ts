/**
 * 타격음 종류와 노트 스킨.
 * 타격음은 샘플 파일 없이 직접 계산해서 짧은 AudioBuffer로 만든다(한 번 만들어 재사용).
 */

// ───────────────────────── 타격음 ─────────────────────────

export type HitSound = "wood" | "soft" | "tock" | "thump" | "glass";

/**
 * 타격음: 음악을 덮지 않게 은은하지만, 친 순간은 확실히 느껴지게.
 * 고음 금속성·잔향은 빼고 어택만 또렷하게 → 전부 60~100ms 안에 사라지는 짧고 둥근 소리.
 */
export const HIT_SOUNDS: { key: HitSound; label: string }[] = [
  { key: "wood", label: "우드블록" },
  { key: "soft", label: "소프트" },
  { key: "tock", label: "톡" },
  { key: "thump", label: "툭" },
  { key: "glass", label: "틱" },
];

/** 상태 변수 필터(밴드패스) – 노이즈를 원하는 음역만 남길 때 */
function svf(fc: number, q: number, sr: number) {
  const f = 2 * Math.sin((Math.PI * Math.min(fc, sr / 6)) / sr);
  let low = 0;
  let band = 0;
  return (x: number) => {
    low += f * band;
    const high = x - low - q * band;
    band += f * high;
    return { low, band, high };
  };
}

function noiseGen(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s / 2147483647) * 2 - 1;
  };
}

const LEN: Record<HitSound, number> = {
  wood: 0.12,
  soft: 0.07,
  tock: 0.09,
  thump: 0.1,
  glass: 0.07,
};

export function makeHitSound(ctx: BaseAudioContext, kind: HitSound = "wood") {
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * LEN[kind]);
  const buf = ctx.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  const rnd = noiseGen(7);
  const TAU = 2 * Math.PI;
  /** 1ms 어택 — 바로 0→최대면 '틱' 하는 날카로운 클릭이 생겨서 */
  const atk = (t: number) => Math.min(1, t / 0.001);

  if (kind === "wood") {
    // 우드블록: 높은 공명 두 개가 빠르게 사그라듦
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const x =
        Math.sin(TAU * 820 * t) * Math.exp(-t * 55) +
        Math.sin(TAU * 2210 * t) * Math.exp(-t * 110) * 0.35 +
        rnd() * Math.exp(-t * 900) * 0.3;
      d[i] = Math.tanh(x * 1.2) * 0.75;
    }
  } else if (kind === "soft") {
    // 소프트: 펠트 덮인 키를 살짝 누른 듯한 "톡" — 먹먹한 노이즈 + 아주 짧은 중음
    let lp = 0;
    let lp2 = 0;
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      lp += (rnd() - lp) * 0.22;
      lp2 += (lp - lp2) * 0.35;
      const x =
        lp2 * Math.exp(-t * 240) * 2.2 + Math.sin(TAU * 1100 * t) * Math.exp(-t * 95) * 0.25;
      d[i] = Math.tanh(x * 1.6 * atk(t)) * 0.7;
    }
  } else if (kind === "tock") {
    // 톡: 우드블록보다 낮고 둥근 나무 소리, 고음 배음 없이
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      lp += (rnd() - lp) * 0.3;
      const x =
        Math.sin(TAU * 640 * t) * Math.exp(-t * 62) +
        Math.sin(TAU * 1290 * t) * Math.exp(-t * 130) * 0.18 +
        lp * Math.exp(-t * 500) * 0.35;
      d[i] = Math.tanh(x * atk(t)) * 0.5;
    }
  } else if (kind === "thump") {
    // 툭: 손가락으로 책상 두드리는 낮은 소리 — 음악 위에선 '느낌'으로 존재
    let lp = 0;
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      phase += (TAU * (95 + 70 * Math.exp(-t * 60))) / sr;
      lp += (rnd() - lp) * 0.12;
      const x = Math.sin(phase) * Math.exp(-t * 38) + lp * Math.exp(-t * 260) * 0.9;
      d[i] = Math.tanh(x * 1.3 * atk(t)) * 0.6;
    }
  } else {
    // 틱: 작은 유리구슬 부딪히는 맑은 소리, 아주 짧고 작게
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const x =
        Math.sin(TAU * 2650 * t) * Math.exp(-t * 115) * 0.7 +
        Math.sin(TAU * 4100 * t) * Math.exp(-t * 200) * 0.15;
      d[i] = x * atk(t) * 0.6;
    }
  }
  // 끝부분 클릭 방지
  const fade = Math.floor(sr * 0.004);
  for (let i = 0; i < fade; i++) d[len - 1 - i] *= i / fade;
  return buf;
}

// ───────────────────────── 노트 스킨 ─────────────────────────
// 모양은 전부 기본 바 노트를 따르고, 색·질감만 조금씩 다르게

export type Skin = "bar" | "neon" | "metal" | "pastel" | "pixel";

export const SKINS: { key: Skin; label: string }[] = [
  { key: "bar", label: "기본" },
  { key: "neon", label: "네온" },
  { key: "metal", label: "메탈" },
  { key: "pastel", label: "파스텔" },
  { key: "pixel", label: "픽셀" },
];

/** 스킨별 레인 색: 기본은 가운데 두 줄만 곡 색 */
export function laneColors(skin: Skin, accent: string): string[] {
  switch (skin) {
    case "neon":
      return ["#F472B6", "#22D3EE", "#22D3EE", "#F472B6"];
    case "metal":
      return ["#D6DAE3", "#F2C66D", "#F2C66D", "#D6DAE3"];
    case "pastel":
      return ["#FBCFE8", "#BAE6FD", "#BBF7D0", "#FDE68A"];
    case "pixel":
      return ["#FF6B6B", "#4ECDC4", "#FFE66D", "#A78BFA"];
    default:
      return ["#E6E8EF", accent, accent, "#E6E8EF"];
  }
}

function roundRect(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  r = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** 계단 모서리 사각형 (픽셀 느낌) */
function pixelRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const p = 3;
  g.beginPath();
  g.moveTo(x + p, y);
  g.lineTo(x + w - p, y);
  g.lineTo(x + w - p, y + p);
  g.lineTo(x + w, y + p);
  g.lineTo(x + w, y + h - p);
  g.lineTo(x + w - p, y + h - p);
  g.lineTo(x + w - p, y + h);
  g.lineTo(x + p, y + h);
  g.lineTo(x + p, y + h - p);
  g.lineTo(x, y + h - p);
  g.lineTo(x, y + p);
  g.lineTo(x + p, y + p);
  g.closePath();
}

/** 노트 머리(단노트·롱노트 머리). x: 레인 왼쪽, y: 노트 중심 */
export function drawHead(
  g: CanvasRenderingContext2D,
  skin: Skin,
  x: number,
  y: number,
  laneW: number,
  color: string
) {
  const nx = x + 4;
  const nw = laneW - 8;
  const top = y - 8;
  const h = 16;
  switch (skin) {
    case "bar":
      g.fillStyle = color;
      roundRect(g, nx, top, nw, h, 4);
      g.fill();
      break;
    case "neon": {
      // 속이 빈 빛나는 테두리 + 가운데 흰 심지
      g.save();
      g.shadowColor = color;
      g.shadowBlur = 14;
      g.strokeStyle = color;
      g.lineWidth = 3;
      roundRect(g, nx + 1.5, top + 1.5, nw - 3, h - 3, 4);
      g.stroke();
      g.shadowBlur = 0;
      g.fillStyle = "rgba(255,255,255,0.9)";
      g.fillRect(nx + 8, y - 1, nw - 16, 2);
      g.restore();
      break;
    }
    case "metal": {
      // 위는 밝고 아래는 어두운 금속 광택 + 얇은 테두리
      const grad = g.createLinearGradient(0, top, 0, top + h);
      grad.addColorStop(0, "#FFFFFF");
      grad.addColorStop(0.35, color);
      grad.addColorStop(0.55, shade(color, -0.35));
      grad.addColorStop(1, shade(color, -0.1));
      g.fillStyle = grad;
      roundRect(g, nx, top, nw, h, 2);
      g.fill();
      g.strokeStyle = "rgba(0,0,0,0.45)";
      g.lineWidth = 1;
      g.stroke();
      break;
    }
    case "pastel": {
      // 알약처럼 끝이 둥글고, 위에 흰 반사
      g.fillStyle = color;
      roundRect(g, nx, top, nw, h, 8);
      g.fill();
      g.fillStyle = "rgba(255,255,255,0.55)";
      roundRect(g, nx + 6, top + 3, nw - 12, 4, 2);
      g.fill();
      break;
    }
    case "pixel": {
      // 계단 모서리 + 위 밝은 줄·아래 어두운 줄 (8비트 게임 느낌)
      g.fillStyle = color;
      pixelRect(g, nx, top, nw, h);
      g.fill();
      g.fillStyle = "rgba(255,255,255,0.45)";
      g.fillRect(nx + 3, top + 3, nw - 6, 3);
      g.fillStyle = "rgba(0,0,0,0.3)";
      g.fillRect(nx + 3, top + h - 6, nw - 6, 3);
      break;
    }
  }
}

/** 롱노트 몸통 (yTail 위쪽 ~ yHead 아래쪽) */
export function drawHoldBody(
  g: CanvasRenderingContext2D,
  skin: Skin,
  x: number,
  yHead: number,
  yTail: number,
  laneW: number,
  color: string,
  alpha: number
) {
  const h = Math.max(0, yHead - yTail);
  const bx = x + laneW * 0.22;
  const bw = laneW * 0.56;
  g.save();
  g.globalAlpha = alpha;
  g.fillStyle = color;
  switch (skin) {
    case "neon": {
      const grad = g.createLinearGradient(bx, 0, bx + bw, 0);
      grad.addColorStop(0, `${color}22`);
      grad.addColorStop(0.5, `${color}aa`);
      grad.addColorStop(1, `${color}22`);
      g.fillStyle = grad;
      g.fillRect(bx, yTail, bw, h);
      g.shadowColor = color;
      g.shadowBlur = 8;
      g.fillStyle = "rgba(255,255,255,0.75)";
      g.fillRect(x + laneW / 2 - 1, yTail, 2, h);
      break;
    }
    case "metal": {
      const grad = g.createLinearGradient(bx, 0, bx + bw, 0);
      grad.addColorStop(0, shade(color, -0.3));
      grad.addColorStop(0.4, "#FFFFFF");
      grad.addColorStop(0.6, color);
      grad.addColorStop(1, shade(color, -0.3));
      g.fillStyle = grad;
      g.fillRect(bx, yTail, bw, h);
      break;
    }
    case "pastel":
      roundRect(g, bx, yTail - 4, bw, h + 4, bw / 2);
      g.fill();
      break;
    case "pixel":
      g.fillRect(bx, yTail, bw, h);
      // 가로 줄무늬
      g.fillStyle = "rgba(0,0,0,0.18)";
      for (let yy = yTail + 6; yy < yHead; yy += 12) g.fillRect(bx, yy, bw, 4);
      break;
    default:
      g.fillRect(bx, yTail, bw, h);
  }
  // 꼬리 끝 표시
  g.globalAlpha = Math.min(1, alpha + 0.3);
  g.fillStyle = color;
  if (skin !== "pastel") g.fillRect(bx, yTail - 3, bw, 6);
  g.restore();
}

/** "#rrggbb"를 밝게(+)/어둡게(-) */
function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1, 7), 16);
  const f = (c: number) =>
    Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)
      .toString(16)
      .padStart(2, "0");
  return `#${f(n >> 16)}${f((n >> 8) & 255)}${f(n & 255)}`;
}
