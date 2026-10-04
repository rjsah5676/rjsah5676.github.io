"""
픽셀 격투 오리지널 캐릭터 도트를 코드로 그려서 스프라이트 시트로 만든다 (애니풍 2.5등신).

  python3 scripts/draw-fight-chars.py          # public/fight/<id>.png + <id>.json 생성
  python3 scripts/draw-fight-chars.py --preview  # /tmp/fight-preview.png 에 전체 동작 미리보기

만드는 방식
  - 관절(골반·몸통·목·머리, 팔·다리 두 마디씩) 각도로 포즈를 정하고, 키 포즈 사이를 보간해 프레임을 뽑음
  - 부위마다 1배 크기로 직접 채워 그린 뒤(안티에일리어싱 없음) 오른쪽 아래 1px을 그림자색으로(위·왼쪽 광원),
    테두리를 진한 선으로 → 셀 셰이딩 도트 느낌
  - 머리카락·목도리는 프레임마다 흔들림을 더함
결과 형식은 src/lib/fight/sprites.ts 의 SpriteSheet (동작마다 한 줄, 모든 칸 같은 크기, 오른쪽을 봄).
"""
import json, math, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "public" / "fight"
CW, CH = 96, 80          # 칸 크기
AX, AY = 40, 76          # 발 가운데 기준점

# ───────────── 색 ─────────────
def hx(c):
    c = c.lstrip("#")
    return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4)) + (255,)

def shade(c, k):
    return tuple(max(0, min(255, int(v * k))) for v in c[:3]) + (255,)

LINE = (36, 26, 46, 255)  # 공통 외곽선 (진한 보라)

# ───────────── 기하 ─────────────
def d(a, l=1.0):
    """각도 a(도): 0=아래, 90=앞(오른쪽), 180=위, -90=뒤"""
    r = math.radians(a)
    return (math.sin(r) * l, math.cos(r) * l)

def add(p, q, k=1.0):
    return (p[0] + q[0] * k, p[1] + q[1] * k)

def lerp(a, b, t):
    return a + (b - a) * t

def ease(t):
    return t * t * (3 - 2 * t)

# ───────────── 부위 그리기 (마스크 단위) ─────────────
class Layer:
    """한 부위: 마스크를 그리고 색(밝은·그림자·선)을 입혀 합성"""

    def __init__(self):
        self.img = Image.new("L", (CW, CH), 0)
        self.dr = ImageDraw.Draw(self.img)

    def capsule(self, a, b, w):
        self.dr.line([a, b], fill=255, width=max(1, int(round(w))))
        r = w / 2 - 0.3
        for p in (a, b):
            self.dr.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=255)

    def poly(self, pts):
        self.dr.polygon([(round(x), round(y)) for x, y in pts], fill=255)

    def ellipse(self, c, rx, ry):
        self.dr.ellipse([c[0] - rx, c[1] - ry, c[0] + rx, c[1] + ry], fill=255)

    def mask(self):
        return np.array(self.img) > 127


def erode(m):
    e = m.copy()
    e[1:, :] &= m[:-1, :]
    e[:-1, :] &= m[1:, :]
    e[:, 1:] &= m[:, :-1]
    e[:, :-1] &= m[:, 1:]
    return e


def paint(canvas, m, base, dark=None, line=None, hi=None):
    """셀 셰이딩: 오른쪽 아래 가장자리는 그림자, 바깥 테두리는 선, 왼쪽 위는 하이라이트"""
    if not m.any():
        return
    dark = dark or shade(base, 0.74)
    line = line or LINE
    light = m.copy()
    # 왼쪽 위 이웃이 같은 부위면 밝은 면
    up = np.zeros_like(m)
    up[2:, 2:] = m[:-2, :-2]
    light &= up
    canvas[m] = dark
    canvas[light] = base
    if hi:
        h = m & ~np.pad(m, ((1, 0), (1, 0)))[:-1, :-1]
        h &= erode(m) | m
        canvas[h & light] = hi
    edge = m & ~erode(m)
    canvas[edge] = line


# ───────────── 캐릭터 정의 ─────────────
CHARS = {
    "haru": {
        "skin": hx("#F8D6BE"), "hair": hx("#E0405C"), "eye": hx("#F2B33D"),
        "top": hx("#F3F1F8"), "trim": hx("#E0405C"), "bottom": hx("#2E3150"), "boots": hx("#3A2A35"),
        "skirt": hx("#C7344F"),
        "weapon": "katana", "blade": hx("#E8EEF8"), "hilt": hx("#2B1E2A"), "fx": hx("#FFD166"),
        "hairStyle": "ponytail",
    },
    "ren": {
        "skin": hx("#F3CDB2"), "hair": hx("#3E4F8F"), "eye": hx("#59E1FF"),
        "top": hx("#4C5585"), "trim": hx("#9B7BFF"), "bottom": hx("#343A5E"), "boots": hx("#262A44"),
        "weapon": "kunai", "blade": hx("#D8E0F0"), "hilt": hx("#7C5CFF"), "fx": hx("#B9A3FF"),
        "hairStyle": "spiky", "scarf": hx("#E63950"),
    },
    "mio": {
        "skin": hx("#FAD9C4"), "hair": hx("#8CCBFF"), "eye": hx("#3D7BD9"),
        "top": hx("#3D7BD9"), "trim": hx("#F4F7FF"), "bottom": hx("#F4F7FF"), "boots": hx("#2B4F8F"),
        "skirt": hx("#3D7BD9"),
        "weapon": "spear", "blade": hx("#EAF4FF"), "hilt": hx("#D9A928"), "fx": hx("#7FE3FF"),
        "hairStyle": "twintail",
    },
}

LEG = 9.5   # 허벅지·정강이 (짧게 → 2.5등신)
ARM1, ARM2 = 7.0, 6.5
TORSO = 10.5

# 포즈 기본값 (각도는 도)
BASE = dict(hx=0, hy=0, t=6, h=0,
            fa1=40, fa2=80, ba1=-10, ba2=40,
            fl1=18, fl2=-4, bl1=-16, bl2=-6,
            w=95, wb=None, ground=1, fx=None, eye=1)


def rig(p):
    """관절 위치 계산 (기준점 기준, 발이 땅에 닿게)"""
    H = (p["hx"], -2 * LEG + p["hy"])
    N = add(H, d(180 - p["t"], TORSO))
    C = add(N, d(180 - p["t"] - p["h"], 10.5))
    Sf, Sb = add(N, (1.5, 1.5)), add(N, (-1.5, 1.5))
    Ef = add(Sf, d(p["fa1"], ARM1)); Hf = add(Ef, d(p["fa2"], ARM2))
    Eb = add(Sb, d(p["ba1"], ARM1)); Hb = add(Eb, d(p["ba2"], ARM2))
    Jf, Jb = add(H, (1.5, 0)), add(H, (-1.5, 0))
    Kf = add(Jf, d(p["fl1"], LEG)); Ff = add(Kf, d(p["fl2"], LEG))
    Kb = add(Jb, d(p["bl1"], LEG)); Fb = add(Kb, d(p["bl2"], LEG))
    j = dict(H=H, N=N, C=C, Sf=Sf, Sb=Sb, Ef=Ef, Hf=Hf, Eb=Eb, Hb=Hb, Jf=Jf, Jb=Jb, Kf=Kf, Ff=Ff, Kb=Kb, Fb=Fb)
    dy = -max(Ff[1], Fb[1]) if p["ground"] else 0
    return {k: (v[0] + AX, v[1] + AY + dy) for k, v in j.items()}


def draw_frame(ch, p, phase=0.0):
    """포즈 p로 한 칸 그림. phase: 0~1 머리카락 흔들림 위상"""
    c = CHARS[ch]
    J = rig(p)
    can = np.zeros((CH, CW, 4), np.uint8)
    sway = math.sin(phase * math.tau) * 1.2
    lean = p["t"]

    def part(fn, base, **kw):
        L = Layer()
        fn(L)
        paint(can, L.mask(), base, **kw)

    def limb_back(L):
        pass

    # ── 뒤 머리카락 (몸 뒤) ──
    C = J["C"]
    hb = shade(c["hair"], 1.0)
    def back_hair(L):
        st = c["hairStyle"]
        if st == "ponytail":
            root = add(C, (-7, -3))
            mid = add(root, (-6 + sway * 0.5, 6))
            tip = add(mid, (-5 + sway, 9))
            L.capsule(root, mid, 5)
            L.capsule(mid, tip, 3.6)
            L.ellipse(add(C, (-1, 0)), 8.6, 8.4)
        elif st == "twintail":
            for side in (-1, 1):
                root = add(C, (-5 + side * 2, -4))
                mid = add(root, (-4 + side * 1.5 + sway * 0.4, 9))
                tip = add(mid, (-2 + sway, 9))
                L.capsule(root, mid, 4.5)
                L.capsule(mid, tip, 3.4)
            L.ellipse(add(C, (-1, 0)), 8.6, 8.4)
        else:
            L.ellipse(add(C, (-1, 0)), 8.6, 8.4)
    part(back_hair, hb, hi=shade(hb, 1.25))

    # ── 목도리 꼬리 (렌) ──
    if "scarf" in c:
        def scarf_tail(L):
            a = add(J["N"], (-1, 1))
            b = add(a, (-7, 2 + sway))
            e = add(b, (-7 + sway, 3 - sway))
            L.capsule(a, b, 3.4)
            L.capsule(b, e, 2.6)
        part(scarf_tail, c["scarf"])

    # ── 뒤 다리·뒤 팔 (조금 어둡게) ──
    dim = 0.82
    def leg(L, J1, K, F, w1=5.8, w2=4.8):
        L.capsule(J1, K, w1)
        L.capsule(K, F, w2)
    part(lambda L: leg(L, J["Jb"], J["Kb"], J["Fb"]), shade(c["bottom"], dim))
    part(lambda L: L.poly([add(J["Fb"], (-2, -1)), add(J["Fb"], (4, -1)), add(J["Fb"], (4, 1)), add(J["Fb"], (-2, 1))]),
         shade(c["boots"], dim))

    def weapon(L_hand, ang, depth_dim=1.0):
        # 무기 (손 위치 기준)
        w = c["weapon"]
        if w == "katana":
            hilt_end = add(L_hand, d(ang, 3.5))
            tip = add(L_hand, d(ang, 22))
            part(lambda L: L.capsule(add(L_hand, d(ang, -2)), hilt_end, 2.2), shade(c["hilt"], depth_dim))
            part(lambda L: L.capsule(hilt_end, tip, 2.8), shade(c["blade"], depth_dim), line=shade(c["blade"], 0.5),
                 hi=hx("#FFFFFF"))
            part(lambda L: L.capsule(add(hilt_end, d(ang + 90, 2)), add(hilt_end, d(ang - 90, 2)), 1.6),
                 hx("#D9A928"))
        elif w == "kunai":
            tip = add(L_hand, d(ang, 9))
            part(lambda L: L.capsule(add(L_hand, d(ang, -2)), add(L_hand, d(ang, 1)), 2), shade(c["hilt"], depth_dim))
            part(lambda L: L.poly([add(L_hand, d(ang + 90, 1.8)), tip, add(L_hand, d(ang - 90, 1.8))]),
                 shade(c["blade"], depth_dim), line=shade(c["blade"], 0.5))
        else:  # spear: 두 손 사이로 긴 자루
            tail = add(L_hand, d(ang, -16))
            head = add(L_hand, d(ang, 20))
            tip = add(head, d(ang, 9))
            part(lambda L: L.capsule(tail, head, 2.8), shade(c["hilt"], depth_dim), line=shade(c["hilt"], 0.45))
            part(lambda L: L.poly([add(head, d(ang + 90, 2.6)), tip, add(head, d(ang - 90, 2.6))]),
                 shade(c["blade"], depth_dim), line=shade(c["blade"], 0.5), hi=hx("#FFFFFF"))
            part(lambda L: L.capsule(add(head, d(ang + 90, 2.4)), add(head, d(ang - 90, 2.4)), 1.6), c["trim"])

    # 뒤 팔 (렌은 뒤 손에도 쿠나이)
    part(lambda L: (L.capsule(J["Sb"], J["Eb"], 4.0), L.capsule(J["Eb"], J["Hb"], 3.6)), shade(c["top"], dim))
    if c["weapon"] == "kunai" and p.get("wb") is not None:
        weapon(J["Hb"], p["wb"], 0.85)
    part(lambda L: L.ellipse(J["Hb"], 1.6, 1.6), shade(c["skin"], dim), line=shade(c["skin"], 0.6))

    # ── 몸통·옷 ──
    N, H = J["N"], J["H"]
    t_dir = d(180 - lean)
    side = d(90 - lean)  # 몸통 옆 방향
    def torso(L):
        sh_w, wa_w = 5.0, 4.0
        L.poly([add(N, side, sh_w), add(N, side, -sh_w), add(H, side, -wa_w), add(H, side, wa_w)])
    part(torso, c["top"], hi=shade(c["top"], 1.1))
    # 치마/옷자락
    def skirt(L):
        swing = (p["fl1"] + p["bl1"]) * 0.05
        L.poly([add(H, side, 4.4), add(H, side, -4.4),
                add(add(H, (0, 6)), side, -7.5 + swing), add(add(H, (0, 6)), side, 7.5 + swing)])
    # 허리띠·장식
    part(lambda L: L.capsule(add(H, side, -3.8), add(H, side, 3.8), 2), c["trim"])
    if ch == "mio":
        part(lambda L: L.poly([add(N, side, 3.5), add(N, side, -3.5), add(N, (0, 4))]), c["trim"])

    # ── 앞 다리 ──
    part(lambda L: leg(L, J["Jf"], J["Kf"], J["Ff"]), c["bottom"] if ch != "mio" else c["skin"])
    if ch == "mio":  # 스타킹
        part(lambda L: L.capsule(J["Kf"], J["Ff"], 4.3), c["trim"])
    part(lambda L: L.poly([add(J["Ff"], (-2, -1.5)), add(J["Ff"], (4.5, -1.5)), add(J["Ff"], (4.5, 1)),
                           add(J["Ff"], (-2, 1))]), c["boots"])

    if "skirt" in c:
        part(skirt, c["skirt"], hi=shade(c["skirt"], 1.15))

    # ── 목도리 앞 (렌) ──
    if "scarf" in c:
        part(lambda L: L.capsule(add(N, side, -3), add(N, side, 3), 3.4), c["scarf"])

    # ── 머리 ──
    part(lambda L: L.capsule(N, add(N, t_dir, 2.5), 3), c["skin"])
    def face(L):
        L.ellipse(add(C, (0.5, 0.8)), 8.0, 7.4)
    part(face, c["skin"], hi=shade(c["skin"], 1.04))
    # 앞머리·머리 윗부분
    def front_hair(L):
        top = add(C, (0, -4.2))
        L.ellipse(add(top, (-1.6, -0.6)), 8.6, 5.0)
        st = c["hairStyle"]
        # 앞머리 삐침 (얼굴 쪽으로 늘어진 몇 가닥)
        tips = [(6.2, 2.2), (3.4, 2.6), (0.6, 2.0)]
        for tx, ty in tips:
            L.poly([add(top, (tx - 2.4, 0)), add(top, (tx + 2.0, 0)), add(top, (tx - 0.4, ty + 1.2))])
        if st == "spiky":
            for sx, sy, tx, ty in [(-8, -3, -13, -6), (-5, -7, -9, -13), (-1, -8, -2, -14), (3, -7, 6, -12),
                                   (-8, 2, -13, 3)]:
                L.poly([add(C, (sx - 2.5, sy + 2)), add(C, (sx + 2.5, sy + 2)), add(C, (tx + sway * 0.3, ty))])
        # 옆머리 (귀 앞)
        L.poly([add(C, (-8, -2)), add(C, (-4.5, -2)), add(C, (-6.5, 7))])
        if st == "twintail":
            for s in (-1, 1):
                L.ellipse(add(C, (-3 + s * 3, -6.5)), 2, 1.6)
    part(front_hair, c["hair"], hi=shade(c["hair"], 1.3))
    # 머리띠 (렌)
    if ch == "ren":
        part(lambda L: L.capsule(add(C, (-6.5, -2.8)), add(C, (5.5, -3.6)), 1.6), c["trim"])
    # 눈·입 (선 없이 픽셀 직접)
    ex, ey = int(round(C[0] + 3)), int(round(C[1] + 1))
    DK = hx("#1C1424")
    if p["eye"] == 1:
        can[ey - 2, ex - 1:ex + 2] = DK              # 속눈썹
        can[ey - 1:ey + 2, ex:ex + 2] = DK
        can[ey:ey + 2, ex:ex + 2] = c["eye"]
        can[ey + 1, ex + 1] = shade(c["eye"], 0.7)
        can[ey - 1, ex] = hx("#FFFFFF")              # 반짝
        can[ey - 2, ex - 5:ex - 3] = DK              # 반대쪽 눈 (3/4 시점)
        can[ey - 1:ey + 2, ex - 4] = DK
        can[ey:ey + 2, ex - 4] = c["eye"]
    elif p["eye"] == 0:  # 감은 눈 (맞음·다운)
        can[ey, ex - 1:ex + 2] = DK
        can[ey + 1, ex + 2] = DK
        can[ey, ex - 5:ex - 3] = DK
    else:  # 기합 (힘준 눈)
        can[ey - 2, ex - 1:ex + 3] = DK
        can[ey - 1, ex:ex + 2] = DK
        can[ey, ex:ex + 2] = c["eye"]
        can[ey - 2, ex - 5:ex - 3] = DK
        can[ey - 1:ey + 1, ex - 4] = DK
    mx_, my_ = int(round(C[0] + 3)), int(round(C[1] + 5))
    can[my_, mx_:mx_ + (2 if p["eye"] == 2 else 1)] = shade(c["skin"], 0.5)
    can[ey + 3, ex + 2] = hx("#F59AA8")  # 볼터치

    # ── 앞 팔 + 무기 ──
    if c["weapon"] == "spear":
        weapon(J["Hf"], p["w"])
    part(lambda L: (L.capsule(J["Sf"], J["Ef"], 4.3), L.capsule(J["Ef"], J["Hf"], 3.8)), c["top"],
         hi=shade(c["top"], 1.1))
    part(lambda L: L.capsule(add(J["Ef"], d(p["fa2"], 4.5)), add(J["Ef"], d(p["fa2"], 6)), 3.6), c["trim"])
    if c["weapon"] != "spear":
        weapon(J["Hf"], p["w"])
    part(lambda L: L.ellipse(J["Hf"], 1.8, 1.8), c["skin"], line=shade(c["skin"], 0.6))

    # ── 이펙트 (베기 궤적·기 모으기) ──
    fx = p.get("fx")
    if fx:
        kind = fx[0]
        if kind == "arc":
            _, a0, a1, r, th = fx
            center = J["Sf"]
            outer, inner = [], []
            n = 14
            for i in range(n + 1):
                a = lerp(a0, a1, i / n)
                w = th * math.sin(math.pi * i / n) + 0.5
                outer.append(add(center, d(a, r + w / 2)))
                inner.append(add(center, d(a, r - w / 2)))
            L = Layer(); L.poly(outer + inner[::-1]); m = L.mask()
            core = Layer(); core.poly([add(center, d(lerp(a0, a1, i / n), r + th * 0.15 * math.sin(math.pi * i / n)))
                                       for i in range(n + 1)] + inner[::-1]); mc = core.mask() & m
            can[m] = c["fx"]
            can[mc] = hx("#FFFFFF")
        elif kind == "glow":
            _, rad = fx
            L = Layer(); L.ellipse(J["Hf"], rad, rad); m = L.mask()
            can[m & ~erode(m)] = c["fx"]
            Li = Layer(); Li.ellipse(J["Hf"], max(1, rad - 2.5), max(1, rad - 2.5)); can[Li.mask()] = hx("#FFFFFF")
        elif kind == "burst":
            _, rad = fx
            for k in range(8):
                a = k * 45 + phase * 30
                a_p, b_p = add(J["C"], d(a, rad - 6)), add(J["C"], d(a, rad))
                L = Layer(); L.capsule(a_p, b_p, 1.5); can[L.mask()] = c["fx"]
    return can


# ───────────── 동작 (키 포즈) ─────────────
def P(**kw):
    q = dict(BASE)
    q.update(kw)
    return q


def interp(a, b, t):
    out = {}
    for k in a:
        va, vb = a[k], b.get(k, a[k])
        if isinstance(va, (int, float)) and isinstance(vb, (int, float)) and k not in ("ground", "eye"):
            out[k] = lerp(va, vb, t)
        elif va is None or vb is None:
            out[k] = va if t < 0.5 else vb
        else:
            out[k] = va if t < 0.5 else vb
    return out


def seq(keys, n, loop=False):
    """keys: [(시점0~1, 포즈)], n프레임으로 펼침"""
    frames = []
    for i in range(n):
        t = i / n if loop else (i / (n - 1) if n > 1 else 0)
        for k in range(len(keys) - 1):
            t0, p0 = keys[k]
            t1, p1 = keys[k + 1]
            if t0 <= t <= t1:
                u = (t - t0) / max(1e-6, t1 - t0)
                frames.append(interp(p0, p1, ease(u)))
                break
        else:
            frames.append(dict(keys[-1][1]))
    return frames


def anims(ch):
    spear = CHARS[ch]["weapon"] == "spear"
    kun = CHARS[ch]["weapon"] == "kunai"
    wb = 100 if kun else None
    # 기본 자세: 칼은 앞으로 비스듬히, 창은 두 손으로 앞을 겨눔
    if spear:
        stance = P(fa1=30, fa2=95, ba1=10, ba2=85, w=100, t=8)
    elif kun:
        stance = P(fa1=35, fa2=110, ba1=-5, ba2=70, w=120, wb=60, t=10)
    else:
        stance = P(fa1=30, fa2=105, ba1=10, ba2=95, w=140, t=6)
    st2 = interp(stance, P(hy=1, t=stance["t"] + 2, fa1=stance["fa1"] + 3, ba1=stance["ba1"] + 3,
                           fl1=20, fl2=-2, bl1=-14, bl2=-4), 1)
    # 원래 무기 각도는 유지
    st2.update(w=stance["w"], wb=stance["wb"], fa2=stance["fa2"] + 4, ba2=stance["ba2"] + 4)

    A = {}
    A["idle"] = seq([(0, stance), (0.5, st2), (1, stance)], 6, loop=True)
    walk = []
    for i in range(8):
        ph = i / 8 * math.tau
        q = dict(stance)
        q.update(fl1=8 + 26 * math.sin(ph), fl2=-6 + 12 * min(0, math.cos(ph)) - 8 * max(0, math.sin(ph)),
                 bl1=8 - 26 * math.sin(ph), bl2=-6 + 12 * min(0, -math.cos(ph)) - 8 * max(0, -math.sin(ph)),
                 hy=-abs(math.sin(ph)) * 1.2, t=stance["t"] + 4)
        walk.append(q)
    A["walk"] = walk
    jump = dict(stance)
    jump.update(fl1=60, fl2=-30, bl1=10, bl2=-50, ground=0, hy=-4, t=stance["t"] + 6)
    jump2 = dict(jump); jump2.update(fl1=40, fl2=-10, bl1=-10, bl2=-30)
    A["jump"] = [jump, jump2]

    # 약공격: 빠르게 앞으로 베기/찌르기
    if spear:
        L0 = dict(stance); L0.update(fa1=20, ba1=0, w=95, hx=-2)
        L1 = dict(stance); L1.update(fa1=85, fa2=92, ba1=60, ba2=90, w=92, hx=7, t=18, fl1=42, bl1=-30, eye=2)
        A["light"] = seq([(0, stance), (0.3, L0), (0.5, L1), (1, stance)], 6)
    elif kun:
        L0 = dict(stance); L0.update(fa1=-20, fa2=60, w=160)
        L1 = dict(stance); L1.update(fa1=80, fa2=90, w=95, t=20, hx=6, fl1=40, bl1=-30, eye=2,
                                       fx=("arc", 160, 60, 14, 4))
        A["light"] = seq([(0, stance), (0.3, L0), (0.55, L1), (1, stance)], 6)
    else:
        L0 = dict(stance); L0.update(fa1=150, fa2=170, w=200, t=0)
        L1 = dict(stance); L1.update(fa1=75, fa2=85, w=90, t=18, hx=6, fl1=40, bl1=-30, eye=2,
                                       fx=("arc", 170, 70, 18, 5))
        A["light"] = seq([(0, stance), (0.3, L0), (0.5, L1), (1, stance)], 6)
    # 마지막 프레임에 이펙트가 남지 않게
    for f in A["light"]:
        if f is not A["light"][2] and f is not A["light"][3]:
            f["fx"] = None

    # 강공격: 크게 젖혔다가 크게 휘두름
    if spear:
        H0 = dict(stance); H0.update(fa1=-40, fa2=-10, ba1=-60, ba2=-20, w=-30, t=-8, hx=-3, fl1=10, bl1=-30)
        H1 = dict(stance); H1.update(fa1=110, fa2=120, ba1=90, ba2=110, w=120, t=22, hx=5, fl1=40, bl1=-30,
                                       eye=2, fx=("arc", -30, 130, 26, 6))
        H2 = dict(H1); H2.update(fa1=95, w=100, fx=None)
    else:
        H0 = dict(stance); H0.update(fa1=190, fa2=200, ba1=170, ba2=190, w=210, wb=200 if kun else None,
                                       t=-8, hx=-3, hy=0, fl1=12, bl1=-26)
        H1 = dict(stance); H1.update(fa1=70, fa2=60, ba1=40, ba2=50, w=50, wb=60 if kun else None, t=26, hx=6,
                                       hy=2, fl1=44, fl2=-20, bl1=-30, eye=2, fx=("arc", 200, 40, 20, 7))
        H2 = dict(H1); H2.update(fa1=55, w=35, fx=None)
    A["heavy"] = seq([(0, stance), (0.35, H0), (0.5, H1), (0.62, H1), (0.75, H2), (1, stance)], 8)
    A["heavy"][4]["fx"] = A["heavy"][4].get("fx")  # 그대로

    # 공중 공격: 아래로 비스듬히
    J0 = dict(jump); J0.update(fa1=170, fa2=180, w=190, eye=2)
    J1 = dict(jump); J1.update(fa1=60, fa2=50, w=40, t=20, eye=2, fx=("arc", 180, 40, 18, 5))
    A["air"] = seq([(0, jump), (0.35, J0), (0.6, J1), (1, jump)], 4)

    # 필살기: 기 모으기 → 앞으로 내지름
    C0 = dict(stance); C0.update(fa1=-60, fa2=-90, w=-80 if not spear else -40, t=-4, hx=-2, eye=2, fx=("glow", 4))
    C1 = dict(C0); C1.update(fx=("glow", 6))
    C2 = dict(stance); C2.update(fa1=88, fa2=90, w=90, t=18, hx=4, fl1=36, eye=2, fx=("glow", 5))
    A["cast"] = seq([(0, stance), (0.3, C0), (0.6, C1), (0.75, C2), (1, stance)], 7)
    A["cast"][-1]["fx"] = None
    A["cast"][0]["fx"] = None

    # 초필살기: 기합 → 돌진 회전 베기
    X0 = dict(stance); X0.update(fa1=170, fa2=175, ba1=-170, ba2=-175, w=180, wb=180 if kun else None,
                                   t=0, eye=2, fx=("burst", 18))
    X1 = dict(stance); X1.update(fa1=95, fa2=95, ba1=-60, ba2=-40, w=95, t=30, hx=8, fl1=50, fl2=-30, bl1=-40,
                                   eye=2, fx=("arc", 240, 30, 24, 8))
    X2 = dict(X1); X2.update(fa1=40, w=10, fx=("arc", 30, -60, 22, 6))
    A["super"] = seq([(0, stance), (0.25, X0), (0.42, X0), (0.55, X1), (0.7, X2), (1, stance)], 9)
    A["super"][-1]["fx"] = None
    A["super"][0]["fx"] = None

    # 피격
    h1 = dict(stance); h1.update(t=-14, h=-10, hx=-3, fa1=-30, fa2=-10, ba1=-50, ba2=-20, eye=0, fl1=8, bl1=-24)
    h2 = dict(h1); h2.update(t=-8, h=-5, hx=-2)
    A["hit"] = [h1, h2, dict(stance, eye=0)]
    # 가드
    g = dict(stance); g.update(fa1=60, fa2=160, ba1=50, ba2=150, w=180 if not spear else 170, wb=170 if kun else None,
                                t=-4, hx=-2, eye=2)
    A["block"] = [g]
    # 다운 (뒤로 넘어져 눕기까지)
    downs = []
    for i in range(6):
        u = i / 5
        q = dict(stance)
        q.update(t=lerp(-10, -80, u), h=lerp(-10, -20, u), hx=lerp(-3, -14, u), hy=lerp(0, 16, u),
                 fa1=lerp(-30, -120, u), fa2=lerp(-10, -140, u), ba1=lerp(-50, -130, u), ba2=lerp(-20, -150, u),
                 fl1=lerp(10, 70, u), fl2=lerp(-4, 80, u), bl1=lerp(-20, 60, u), bl2=lerp(-6, 90, u),
                 w=lerp(stance["w"], -120, u), ground=1 if u < 0.4 else 0, eye=0)
        downs.append(q)
    A["down"] = downs
    # 승리 포즈
    w0 = dict(stance); w0.update(fa1=170, fa2=170, w=180, t=0, eye=1, ba1=-20, ba2=10)
    w1 = dict(w0); w1.update(hy=-1, fa1=165)
    A["win"] = seq([(0, w0), (0.5, w1), (1, w0)], 6, loop=True)
    # 다운 마지막은 땅에 붙게 보정
    for q in A["down"][2:]:
        q["ground"] = 0
    return A


ORDER = ["idle", "walk", "jump", "light", "heavy", "air", "cast", "super", "hit", "block", "down", "win"]
FPS = {"idle": 7, "walk": 12, "jump": 8, "light": 18, "heavy": 16, "air": 16, "cast": 14, "super": 14,
       "hit": 12, "block": 1, "down": 12, "win": 8}
LOOP = {"idle", "walk", "win"}
MOVES = {
    "L": {"anim": "light", "from": 0, "impact": 2, "to": 5},
    "H": {"anim": "heavy", "from": 0, "impact": 3, "to": 7},
    "J": {"anim": "air", "from": 0, "impact": 2, "to": 3},
    "S": {"anim": "cast", "from": 0, "impact": 4, "to": 6},
    "X": {"anim": "super", "from": 0, "impact": 4, "to": 8},
}
STATES = {
    "idle": {"anim": "idle"}, "walk": {"anim": "walk"}, "jump": {"anim": "jump", "frame": 0},
    "hit": {"anim": "hit"}, "block": {"anim": "block", "frame": 0}, "down": {"anim": "down"},
    "ko": {"anim": "down"}, "win": {"anim": "win"},
}


def build(ch):
    A = anims(ch)
    cols = max(len(A[k]) for k in ORDER)
    sheet = np.zeros((CH * len(ORDER), CW * cols, 4), np.uint8)
    meta = {}
    for r, name in enumerate(ORDER):
        fr = A[name]
        for i, p in enumerate(fr):
            # 다운 마지막 프레임들은 바닥에 눕게: 몸이 기준선까지 내려오도록
            img = draw_frame(ch, p, phase=i / max(1, len(fr)))
            if name == "down" and not p["ground"]:
                ys = np.nonzero(img[:, :, 3])[0]
                if len(ys):
                    shift = AY - 1 - ys.max()
                    img = np.roll(img, shift, axis=0) if shift > 0 else img
            sheet[r * CH:(r + 1) * CH, i * CW:(i + 1) * CW] = img
        meta[name] = {"row": r, "frames": len(fr), "fps": FPS[name], "loop": name in LOOP}
    return Image.fromarray(sheet, "RGBA"), meta


def main():
    preview = "--preview" in sys.argv
    OUT.mkdir(parents=True, exist_ok=True)
    sheets = {}
    for ch in CHARS:
        img, meta = build(ch)
        sheets[ch] = img
        if not preview:
            img.save(OUT / f"{ch}.png", optimize=True)
            j = {"image": f"/fight/{ch}.png", "cell": [CW, CH], "anchor": [AX, AY + 2], "facing": "right",
                 "anims": meta, "moves": MOVES, "states": STATES, "credit": "오리지널 (코드로 그림)"}
            (OUT / f"{ch}.json").write_text(json.dumps(j, ensure_ascii=False, indent=2) + "\n")
        print(ch, img.size)
    if preview:
        w = max(s.width for s in sheets.values())
        h = sum(s.height for s in sheets.values())
        out = Image.new("RGBA", (w, h), (52, 46, 66, 255))
        y = 0
        for s in sheets.values():
            out.alpha_composite(s, (0, y))
            y += s.height
        out = out.resize((w * 2, h * 2), Image.NEAREST)
        out.save("/tmp/fight-preview.png")
        print("/tmp/fight-preview.png")


if __name__ == "__main__":
    main()
