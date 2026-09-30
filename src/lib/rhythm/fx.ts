/**
 * 타격음 종류와 노트 스킨.
 * 타격음은 샘플 파일 없이 직접 계산해서 짧은 AudioBuffer로 만든다(한 번 만들어 재사용).
 */

// ───────────────────────── 타격음 ─────────────────────────

export type HitSound = "thud" | "pebble" | "wood" | "rim" | "clap" | "bell";

export const HIT_SOUNDS: { key: HitSound; label: string }[] = [
  { key: "thud", label: "북소리" },
  { key: "pebble", label: "조약돌" },
  { key: "wood", label: "우드블록" },
  { key: "rim", label: "림샷" },
  { key: "clap", label: "클랩" },
  { key: "bell", label: "벨" },
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
  thud: 0.14,
  pebble: 0.09,
  wood: 0.12,
  rim: 0.1,
  clap: 0.16,
  bell: 0.45,
};

export function makeHitSound(ctx: BaseAudioContext, kind: HitSound = "thud") {
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * LEN[kind]);
  const buf = ctx.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  const rnd = noiseGen(7);
  const TAU = 2 * Math.PI;

  if (kind === "thud") {
    // 190Hz → 70Hz로 빠르게 떨어지는 사인 + 뭉갠 노이즈 "퍽"
    let lp = 0;
    let lp2 = 0;
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      phase += (TAU * (70 + 120 * Math.exp(-t * 45))) / sr;
      const body = Math.sin(phase) * Math.exp(-t * 26);
      lp += (rnd() - lp) * 0.08;
      lp2 += (lp - lp2) * 0.08;
      d[i] = Math.tanh((body * 0.85 + lp2 * Math.exp(-t * 90) * 3) * 1.4) * 0.8;
    }
  } else if (kind === "pebble") {
    // 리니어(밀키) 키보드 "톡": 둥근 저음 몸통 + 짧게 막힌 플라스틱 딸깍, 고음은 깎아서 부드럽게
    const bp = svf(1900, 0.9, sr);
    const bp2 = svf(620, 1.2, sr);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const n = rnd();
      const click = bp(n).band * Math.exp(-t * 700) * 1.4;
      const thock = bp2(n).band * Math.exp(-t * 160) * 1.1;
      const body =
        Math.sin(TAU * 380 * t) * Math.exp(-t * 110) * 0.55 +
        Math.sin(TAU * 1050 * t) * Math.exp(-t * 260) * 0.2;
      // 바닥 치고 올라오는 작은 두 번째 탁 (6ms 뒤)
      const t2 = t - 0.006;
      const bottom = t2 > 0 ? Math.sin(TAU * 520 * t2) * Math.exp(-t2 * 220) * 0.25 : 0;
      const x = click + thock + body + bottom;
      lp += (x - lp) * 0.45; // 살짝 먹먹하게
      d[i] = Math.tanh(lp * 1.6) * 0.85;
    }
  } else if (kind === "wood") {
    // 우드블록: 높은 공명 두 개가 빠르게 사그라듦
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const x =
        Math.sin(TAU * 820 * t) * Math.exp(-t * 55) +
        Math.sin(TAU * 2210 * t) * Math.exp(-t * 110) * 0.35 +
        rnd() * Math.exp(-t * 900) * 0.3;
      d[i] = Math.tanh(x * 1.2) * 0.75;
    }
  } else if (kind === "rim") {
    // 림샷: 딱! 하는 금속성 짧은 소리
    const bp = svf(3200, 0.6, sr);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const x =
        bp(rnd()).band * Math.exp(-t * 180) * 1.3 +
        Math.sin(TAU * 1720 * t) * Math.exp(-t * 70) * 0.45 +
        Math.sin(TAU * 440 * t) * Math.exp(-t * 90) * 0.35;
      d[i] = Math.tanh(x * 1.4) * 0.75;
    }
  } else if (kind === "clap") {
    // 손뼉: 짧은 노이즈 세 번 겹치고 꼬리
    const bp = svf(1300, 0.7, sr);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      let env = Math.exp(-t * 28) * 0.6;
      for (const o of [0, 0.009, 0.018]) if (t >= o) env += Math.exp(-(t - o) * 260);
      d[i] = Math.tanh(bp(rnd()).band * env * 1.6) * 0.75;
    }
  } else {
    // 벨: 맑은 "띵" (배음이 정수배가 아니라 종 느낌)
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const f = 1568;
      const x =
        Math.sin(TAU * f * t) * Math.exp(-t * 9) +
        Math.sin(TAU * f * 2.76 * t) * Math.exp(-t * 22) * 0.3 +
        Math.sin(TAU * f * 5.4 * t) * Math.exp(-t * 45) * 0.12;
      const atk = Math.min(1, t / 0.002);
      d[i] = x * atk * 0.45;
    }
  }
  // 끝부분 클릭 방지
  const fade = Math.floor(sr * 0.004);
  for (let i = 0; i < fade; i++) d[len - 1 - i] *= i / fade;
  return buf;
}

// ───────────────────────── 노트 스킨 ─────────────────────────

export type Skin = "bar" | "neon" | "circle" | "arrow" | "gem";

export const SKINS: { key: Skin; label: string }[] = [
  { key: "bar", label: "기본" },
  { key: "neon", label: "네온" },
  { key: "circle", label: "원형" },
  { key: "arrow", label: "화살표" },
  { key: "gem", label: "다이아" },
];

/** 스킨별 레인 색: 기본은 가운데 두 줄만 곡 색 */
export function laneColors(skin: Skin, accent: string): string[] {
  if (skin === "neon") return ["#F472B6", "#22D3EE", "#22D3EE", "#F472B6"];
  if (skin === "arrow") return ["#C084FC", "#38BDF8", "#4ADE80", "#FB7185"];
  if (skin === "gem") return ["#E6E8EF", accent, accent, "#E6E8EF"];
  return ["#E6E8EF", accent, accent, "#E6E8EF"];
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

/** 화살표 방향: ← ↓ ↑ → (라디안, 위쪽 기준 회전) */
const ARROW_ROT = [-Math.PI / 2, Math.PI, 0, Math.PI / 2];

function arrowPath(g: CanvasRenderingContext2D, cx: number, cy: number, s: number, rot: number) {
  g.save();
  g.translate(cx, cy);
  g.rotate(rot);
  g.beginPath();
  g.moveTo(0, -s);
  g.lineTo(s, 0);
  g.lineTo(s * 0.42, 0);
  g.lineTo(s * 0.42, s * 0.9);
  g.lineTo(-s * 0.42, s * 0.9);
  g.lineTo(-s * 0.42, 0);
  g.lineTo(-s, 0);
  g.closePath();
  g.restore();
}

/** 노트 머리(단노트·롱노트 머리) 그리기. x: 레인 왼쪽, y: 노트 중심 */
export function drawHead(
  g: CanvasRenderingContext2D,
  skin: Skin,
  lane: number,
  x: number,
  y: number,
  laneW: number,
  color: string
) {
  const cx = x + laneW / 2;
  switch (skin) {
    case "bar":
      g.fillStyle = color;
      roundRect(g, x + 4, y - 8, laneW - 8, 16, 4);
      g.fill();
      break;
    case "neon": {
      g.save();
      g.shadowColor = color;
      g.shadowBlur = 14;
      g.strokeStyle = color;
      g.lineWidth = 3;
      roundRect(g, x + 6, y - 7, laneW - 12, 14, 7);
      g.stroke();
      g.shadowBlur = 0;
      g.fillStyle = "rgba(255,255,255,0.9)";
      roundRect(g, x + 12, y - 1.5, laneW - 24, 3, 1.5);
      g.fill();
      g.restore();
      break;
    }
    case "circle": {
      const r = Math.min(laneW * 0.36, 22);
      const grad = g.createRadialGradient(cx - r * 0.3, y - r * 0.35, r * 0.1, cx, y, r);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.35, color);
      grad.addColorStop(1, color);
      g.fillStyle = grad;
      g.beginPath();
      g.arc(cx, y, r, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "rgba(0,0,0,0.35)";
      g.lineWidth = 2;
      g.stroke();
      break;
    }
    case "arrow": {
      const s = Math.min(laneW * 0.34, 22);
      arrowPath(g, cx, y, s, ARROW_ROT[lane]);
      g.fillStyle = color;
      g.fill();
      g.strokeStyle = "rgba(255,255,255,0.85)";
      g.lineWidth = 2;
      g.stroke();
      break;
    }
    case "gem": {
      const w = Math.min(laneW * 0.4, 26);
      const h = 13;
      g.beginPath();
      g.moveTo(cx, y - h);
      g.lineTo(cx + w, y);
      g.lineTo(cx, y + h);
      g.lineTo(cx - w, y);
      g.closePath();
      g.fillStyle = color;
      g.fill();
      // 윗면 반사
      g.beginPath();
      g.moveTo(cx, y - h);
      g.lineTo(cx + w, y);
      g.lineTo(cx - w, y);
      g.closePath();
      g.fillStyle = "rgba(255,255,255,0.35)";
      g.fill();
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
  g.save();
  g.globalAlpha = alpha;
  g.fillStyle = color;
  switch (skin) {
    case "bar":
      g.fillRect(x + laneW * 0.22, yTail, laneW * 0.56, h);
      g.globalAlpha = Math.min(1, alpha + 0.3);
      g.fillRect(x + laneW * 0.22, yTail - 3, laneW * 0.56, 6);
      break;
    case "neon": {
      const grad = g.createLinearGradient(x, 0, x + laneW, 0);
      grad.addColorStop(0, `${color}00`);
      grad.addColorStop(0.5, `${color}cc`);
      grad.addColorStop(1, `${color}00`);
      g.fillStyle = grad;
      g.fillRect(x + laneW * 0.15, yTail, laneW * 0.7, h);
      g.shadowColor = color;
      g.shadowBlur = 10;
      g.fillStyle = "rgba(255,255,255,0.8)";
      g.fillRect(x + laneW / 2 - 1.5, yTail, 3, h);
      break;
    }
    case "circle": {
      const r = Math.min(laneW * 0.3, 18);
      roundRect(g, x + laneW / 2 - r, yTail - r, r * 2, h + r, r);
      g.fill();
      break;
    }
    case "arrow":
    case "gem": {
      const w = laneW * (skin === "gem" ? 0.34 : 0.3);
      g.fillRect(x + (laneW - w) / 2, yTail, w, h);
      g.globalAlpha = Math.min(1, alpha + 0.3);
      g.fillRect(x + laneW * 0.2, yTail - 2, laneW * 0.6, 4);
      break;
    }
  }
  g.restore();
}

/** 판정선 위의 수신부(빈 노트 모양) – 원형·화살표·다이아 스킨에서 어디서 치는지 보이게 */
export function drawReceptor(
  g: CanvasRenderingContext2D,
  skin: Skin,
  lane: number,
  x: number,
  y: number,
  laneW: number,
  pressed: boolean
) {
  if (skin === "bar" || skin === "neon") return;
  const cx = x + laneW / 2;
  g.save();
  g.strokeStyle = pressed ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.28)";
  g.lineWidth = 2;
  if (skin === "circle") {
    g.beginPath();
    g.arc(cx, y, Math.min(laneW * 0.36, 22), 0, Math.PI * 2);
    g.stroke();
  } else if (skin === "arrow") {
    arrowPath(g, cx, y, Math.min(laneW * 0.34, 22), ARROW_ROT[lane]);
    g.stroke();
  } else {
    const w = Math.min(laneW * 0.4, 26);
    g.beginPath();
    g.moveTo(cx, y - 13);
    g.lineTo(cx + w, y);
    g.lineTo(cx, y + 13);
    g.lineTo(cx - w, y);
    g.closePath();
    g.stroke();
  }
  g.restore();
}
