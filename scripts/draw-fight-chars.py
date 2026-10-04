"""
픽셀 격투(학원 능력자 배틀) 캐릭터를 코드로 그려서 스프라이트 시트로 만든다 — 애니 셀화 느낌의 벡터 그림.

  pip install pycairo pillow numpy
  python3 scripts/draw-fight-chars.py            # public/fight/<id>.webp + <id>.json
  python3 scripts/draw-fight-chars.py --preview  # /tmp/fight-preview.png 에 전체 동작 미리보기

만드는 방식
  - 관절(골반·몸통·목·머리, 팔·다리 두 마디) 각도로 키 포즈를 정하고 사이를 보간해 프레임을 뽑음
  - 부위마다 매끈한 곡선 도형(cairo)으로 칠하고, 오른쪽 아래를 그림자색으로(왼쪽 위 광원) + 진한 외곽선 → 셀화
  - 머리카락은 여러 갈래 다발 + 광택 띠, 눈은 큰 홍채·하이라이트, 교복·부활동 무기·능력 이펙트
  - 월드 1px = 시트 SCALE px 로 그려서 게임에서 부드럽게 축소해 보여 줌
결과 형식은 src/lib/fight/sprites.ts 의 SpriteSheet (동작마다 한 줄, 모든 칸 같은 크기, 오른쪽을 봄, scale).
"""
import json, math, sys, zlib
from pathlib import Path
import cairo
import numpy as np
from PIL import Image

OUT = Path(__file__).resolve().parent.parent / "public" / "fight"
SCALE = 3                 # 월드 1px = 시트 3px
WW, WH = 112, 92          # 칸 크기 (월드 px)
AX, AY = 46, 88           # 발 가운데 기준점 (월드 px)
CW, CH = WW * SCALE, WH * SCALE


def hx(c, a=1.0):
    c = c.lstrip("#")
    return (int(c[0:2], 16) / 255, int(c[2:4], 16) / 255, int(c[4:6], 16) / 255, a)


def mul(c, k):
    return (min(1, c[0] * k), min(1, c[1] * k), min(1, c[2] * k), c[3])


def mix(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(4))


LINE = hx("#2A1E33")


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


# ───────────── 캐릭터 ─────────────
CHARS = {
    "haru": {  # 검도부 · 불꽃
        "skin": hx("#FBE1D0"), "hair": hx("#D9334F"), "hair2": hx("#FF8C9C"), "eye": hx("#F5A623"),
        "top": hx("#F7F7FB"), "collar": hx("#283A73"), "tie": hx("#E8344E"), "skirt": hx("#283A73"),
        "legs": hx("#2A2333"), "shoes": hx("#4A3030"), "weapon": "bokken", "wood": hx("#C99A5B"),
        "fx": hx("#FF7A2A"), "fx2": hx("#FFE066"), "hairStyle": "ponytail", "uniform": "sailor",
    },
    "ren": {  # 야구부 · 번개
        "skin": hx("#F6D4BC"), "hair": hx("#2E3350"), "hair2": hx("#7A86C0"), "eye": hx("#FFC93F"),
        "top": hx("#33375A"), "collar": hx("#33375A"), "tie": hx("#E8C547"), "skirt": hx("#33375A"),
        "legs": hx("#2C3050"), "shoes": hx("#EDEDED"), "weapon": "bat", "wood": hx("#D8DEE8"),
        "fx": hx("#FFE45C"), "fx2": hx("#FFFFFF"), "hairStyle": "spiky", "uniform": "gakuran",
        "shirt": hx("#E8344E"),
    },
    "mio": {  # 학생회 봉술 · 얼음
        "skin": hx("#FCE4D6"), "hair": hx("#A6DBFF"), "hair2": hx("#EAF8FF"), "eye": hx("#3E7FE0"),
        "top": hx("#2C3D6E"), "collar": hx("#F7F7FB"), "tie": hx("#3E7FE0"), "skirt": hx("#7A8BB8"),
        "legs": hx("#F2F4FA"), "shoes": hx("#2A3050"), "weapon": "staff", "wood": hx("#6B4A33"),
        "fx": hx("#6FDCFF"), "fx2": hx("#FFFFFF"), "hairStyle": "long", "uniform": "blazer",
    },
}

# 비율 (월드 px): 약 5.5등신
THIGH, SHIN = 13.5, 13.5
ARM1, ARM2 = 10.5, 10.0
TORSO = 17.0
NECK = 3.0
HEAD_R = 6.4

BASE = dict(hx=0, hy=0, t=6, h=0,
            fa1=40, fa2=80, ba1=-10, ba2=40,
            fl1=16, fl2=-4, bl1=-14, bl2=-6,
            w=95, ground=1, fx=None, eye=1)


def rig(p):
    H = (p["hx"], -(THIGH + SHIN) + p["hy"])
    N = add(H, d(180 - p["t"], TORSO))
    C = add(N, d(180 - p["t"] - p["h"], NECK + HEAD_R))
    sh = add(N, d(180 - p["t"], -1.8))
    Sf, Sb = add(sh, (1.4, 0)), add(sh, (-1.4, 0))
    Ef = add(Sf, d(p["fa1"], ARM1)); Hf = add(Ef, d(p["fa2"], ARM2))
    Eb = add(Sb, d(p["ba1"], ARM1)); Hb = add(Eb, d(p["ba2"], ARM2))
    Jf, Jb = add(H, (1.6, 0)), add(H, (-1.6, 0))
    Kf = add(Jf, d(p["fl1"], THIGH)); Ff = add(Kf, d(p["fl2"], SHIN))
    Kb = add(Jb, d(p["bl1"], THIGH)); Fb = add(Kb, d(p["bl2"], SHIN))
    j = dict(H=H, N=N, C=C, Sf=Sf, Sb=Sb, Ef=Ef, Hf=Hf, Eb=Eb, Hb=Hb, Jf=Jf, Jb=Jb, Kf=Kf, Ff=Ff, Kb=Kb, Fb=Fb)
    dy = -max(Ff[1], Fb[1]) if p["ground"] else 0
    return {key: (v[0] + AX, v[1] + AY + dy) for key, v in j.items()}


# ───────────── 그리기 도구 ─────────────
class Pen:
    def __init__(self):
        self.surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, CW, CH)
        self.c = cairo.Context(self.surf)
        self.c.scale(SCALE, SCALE)
        self.c.set_line_join(cairo.LINE_JOIN_ROUND)
        self.c.set_line_cap(cairo.LINE_CAP_ROUND)

    def capsule(self, a, b, ra, rb=None):
        rb = ra if rb is None else rb
        c = self.c
        ang = math.atan2(b[1] - a[1], b[0] - a[0])
        c.new_sub_path()
        c.arc(a[0], a[1], ra, ang + math.pi / 2, ang + 3 * math.pi / 2)
        c.arc(b[0], b[1], rb, ang - math.pi / 2, ang + math.pi / 2)
        c.close_path()

    def poly(self, pts, smooth=False):
        c = self.c
        c.new_sub_path()
        if not smooth:
            c.move_to(*pts[0])
            for q in pts[1:]:
                c.line_to(*q)
        else:
            n = len(pts)
            c.move_to(*pts[0])
            for i in range(n):
                p0, p1, p2, p3 = pts[i - 1], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
                c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
                c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
                c.curve_to(*c1, *c2, *p2)
        c.close_path()

    def ellipse(self, cx, cy, rx, ry, rot=0.0):
        c = self.c
        c.save()
        c.translate(cx, cy)
        c.rotate(rot)
        c.scale(rx, ry)
        c.new_sub_path()
        c.arc(0, 0, 1, 0, math.tau)
        c.restore()

    def part(self, build, base, shade=None, line=LINE, lw=0.7, sh=1.1):
        """그림자로 채우고 → 왼쪽 위로 밀린 같은 모양과 겹치는 곳만 밝게 → 외곽선 (셀 셰이딩)"""
        c = self.c
        shade = shade or mul(base, 0.78)
        c.new_path()
        build()
        path = c.copy_path()
        # 외곽선을 두 배 굵기로 먼저 긋고 그 위를 채우면 바깥 절반만 남음 → 겹친 도형도 겉테두리만
        if line:
            c.set_source_rgba(*line)
            c.set_line_width(lw * 2)
            c.stroke_preserve()
        c.set_source_rgba(*shade)
        c.fill_preserve()
        c.save()
        c.clip()
        c.translate(-sh, -sh)
        c.new_path()
        c.append_path(path)
        c.set_source_rgba(*base)
        c.fill()
        c.restore()
        c.new_path()

    def flat(self, build, color, line=None, lw=0.5):
        c = self.c
        c.new_path()
        build()
        c.set_source_rgba(*color)
        if line:
            c.fill_preserve()
            c.set_source_rgba(*line)
            c.set_line_width(lw)
            c.stroke()
        else:
            c.fill()

    def to_array(self):
        self.surf.flush()
        buf = np.frombuffer(self.surf.get_data(), np.uint8).reshape(CH, CW, 4).astype(float)
        b, g, r, a = buf[..., 0], buf[..., 1], buf[..., 2], buf[..., 3]
        af = np.maximum(a, 1) / 255
        out = np.stack([np.clip(r / af, 0, 255), np.clip(g / af, 0, 255), np.clip(b / af, 0, 255), a], -1)
        return out.astype(np.uint8)


def ability_sparks(c, k, ch, center, a0, a1, r, phase):
    """능력별 장식: 불꽃 혀 / 번개 지그재그 / 얼음 조각"""
    rnd = np.random.default_rng(int(phase * 1000) + zlib.crc32(ch.encode()) % 97)
    for i in range(5):
        a = lerp(a0, a1, (i + 0.5) / 5) + rnd.uniform(-10, 10)
        p0 = add(center, d(a, r + rnd.uniform(-2, 2)))
        if ch == "haru":
            h = rnd.uniform(3, 6)
            c.new_path()
            c.move_to(p0[0] - 1.4, p0[1])
            c.curve_to(p0[0] - 1.6, p0[1] - h * 0.6, p0[0] + 0.3, p0[1] - h * 0.8, p0[0] + rnd.uniform(-0.8, 0.8),
                       p0[1] - h)
            c.curve_to(p0[0] + 1.2, p0[1] - h * 0.6, p0[0] + 1.6, p0[1] - h * 0.3, p0[0] + 1.4, p0[1])
            c.close_path()
            c.set_source_rgba(*k["fx"][:3], 0.85)
            c.fill()
        elif ch == "ren":
            c.new_path()
            c.move_to(*p0)
            q = p0
            for _ in range(3):
                q = add(q, (rnd.uniform(-2.5, 2.5), rnd.uniform(-3, 1)))
                c.line_to(*q)
            c.set_source_rgba(*k["fx"][:3], 0.95)
            c.set_line_width(0.6)
            c.stroke()
        else:
            s = rnd.uniform(1.2, 2.4)
            c.new_path()
            c.move_to(p0[0], p0[1] - s * 1.6)
            c.line_to(p0[0] + s * 0.7, p0[1])
            c.line_to(p0[0], p0[1] + s * 1.6)
            c.line_to(p0[0] - s * 0.7, p0[1])
            c.close_path()
            c.set_source_rgba(*k["fx2"][:3], 0.95)
            c.fill_preserve()
            c.set_source_rgba(*k["fx"][:3], 1)
            c.set_line_width(0.3)
            c.stroke()


# ───────────── 한 칸 그리기 ─────────────
def draw_frame(ch, p, phase=0.0):
    k = CHARS[ch]
    J = rig(p)
    P = Pen()
    c = P.c
    sway = math.sin(phase * math.tau)
    lean = p["t"]
    up = d(180 - lean)
    side = d(90 - lean)
    C, N, H = J["C"], J["N"], J["H"]
    dim = 0.8
    hair, hair_sh = k["hair"], mul(k["hair"], 0.72)
    st = k["hairStyle"]
    u = k["uniform"]

    # ── 뒤 머리카락 ──
    def back_hair():
        if st == "ponytail":
            root = add(C, (-5.5, -3.5))
            P.poly([add(root, (0, -2)), add(root, (-7 + sway, 3)), add(root, (-11 + sway * 2, 11)),
                    add(root, (-8 + sway * 2.5, 17)), add(root, (-5 + sway, 9)), add(root, (1, 2))], smooth=True)
            P.ellipse(C[0] - 0.8, C[1] - 0.2, 7.2, 7.4)
        elif st == "long":
            P.poly([add(C, (-6, -5)), add(C, (-9 + sway * 0.6, 6)), add(C, (-10 + sway, 18)),
                    add(C, (-5 + sway, 21)), add(C, (-1, 14)), add(C, (2, 4)), add(C, (1, -6))], smooth=True)
            P.ellipse(C[0] - 0.8, C[1] - 0.2, 7.4, 7.6)
        else:
            P.ellipse(C[0] - 0.8, C[1] - 0.3, 7.2, 7.2)
    P.part(back_hair, hair, hair_sh)

    # ── 뒤 다리 ──
    def leg(J1, K, F):
        P.capsule(J1, K, 2.9, 2.4)
        P.capsule(K, F, 2.3, 1.9)
    def shoe(F):
        P.poly([add(F, (-2.2, -1.2)), add(F, (2.5, -1.6)), add(F, (4.6, 0)), add(F, (4.6, 1.3)), add(F, (-2.2, 1.3))],
               smooth=True)
    P.part(lambda: leg(J["Jb"], J["Kb"], J["Fb"]), mul(k["legs"], dim))
    P.part(lambda: shoe(J["Fb"]), mul(k["shoes"], dim))

    # ── 무기 ──
    def weapon(hand, ang, depth=1.0):
        w = k["weapon"]
        if w == "bokken":
            tip = add(hand, d(ang, 27))
            guard = add(hand, d(ang, 3))
            P.part(lambda: P.capsule(add(hand, d(ang, -4)), guard, 1.0), mul(hx("#5A3E2B"), depth), sh=0.5)
            P.part(lambda: P.capsule(guard, tip, 1.15, 0.8), mul(k["wood"], depth), sh=0.6)
            dv = d(ang)
            P.part(lambda: P.ellipse(guard[0], guard[1], 2.1, 0.8, math.atan2(dv[1], dv[0]) + math.pi / 2),
                   hx("#3A2A22"), sh=0.3)
        elif w == "bat":
            tip = add(hand, d(ang, 22))
            P.part(lambda: P.capsule(add(hand, d(ang, -3.5)), add(hand, d(ang, 4)), 0.9), mul(hx("#222533"), depth),
                   sh=0.4)
            P.part(lambda: P.capsule(add(hand, d(ang, 4)), tip, 1.0, 2.0), mul(k["wood"], depth), sh=0.7)
        else:
            a_ = add(hand, d(ang, -20))
            b_ = add(hand, d(ang, 24))
            P.part(lambda: P.capsule(a_, b_, 1.0), mul(k["wood"], depth), sh=0.5)
            for t in (-17, 21):
                P.part(lambda t=t: P.capsule(add(hand, d(ang, t)), add(hand, d(ang, t + 3)), 1.15),
                       mul(hx("#E6EEF8"), depth), sh=0.4)

    # ── 뒤 팔 ──
    def arm(S, E, Hd, w=2.4):
        P.capsule(S, E, w, 2.0)
        P.capsule(E, Hd, 2.0, 1.6)
    P.part(lambda: arm(J["Sb"], J["Eb"], J["Hb"]), mul(k["top"], dim))
    P.part(lambda: P.ellipse(*J["Hb"], 1.9, 1.8), mul(k["skin"], dim), sh=0.5)

    # ── 몸통 ──
    def torso():
        P.poly([add(N, side, 4.8), add(add(N, up, -6), side, 5.3), add(H, side, 3.9), add(H, side, -3.9),
                add(add(N, up, -6), side, -4.8), add(N, side, -4.5)], smooth=True)
    P.part(torso, k["top"])
    if u == "sailor":
        P.part(lambda: P.poly([add(N, side, 4.2), add(N, side, -5.4), add(add(N, up, -5), side, -4.8),
                               add(add(N, up, -3.4), side, 0.5)]), k["collar"], sh=0.5)
        P.part(lambda: P.poly([add(add(N, up, -3.5), side, 0.2), add(add(N, up, -5.5), side, 2.4),
                               add(add(N, up, -9 + sway * 0.3), side, 1.0), add(add(N, up, -6), side, -0.8)]),
               k["tie"], sh=0.5)
    elif u == "gakuran":
        P.part(lambda: P.poly([add(add(N, up, -1.5), side, 0.2), add(add(N, up, -7), side, 2.4),
                               add(add(N, up, -7), side, -0.8)]), k["shirt"], sh=0.4)
        P.part(lambda: P.capsule(add(N, side, -3.2), add(N, side, 3.4), 1.5), k["top"], sh=0.4)
        for i in range(3):
            pt = add(add(N, up, -4.5 - i * 4.0), side, 2.6)
            P.flat(lambda pt=pt: P.ellipse(pt[0], pt[1], 0.6, 0.6), k["tie"])
    else:
        P.part(lambda: P.poly([add(N, side, 2.6), add(add(N, up, -7), side, 1.0), add(N, side, -1.6)]),
               k["collar"], sh=0.4)
        P.part(lambda: P.poly([add(add(N, up, -2), side, 1.0), add(add(N, up, -4.2), side, 3.0),
                               add(add(N, up, -4.2), side, -1.0)], smooth=True), k["tie"], sh=0.4)

    # ── 앞 다리 · 치마 ──
    P.part(lambda: leg(J["Jf"], J["Kf"], J["Ff"]), k["legs"])
    P.part(lambda: shoe(J["Ff"]), k["shoes"])
    if u in ("sailor", "blazer"):
        sw = (p["fl1"] + p["bl1"]) * 0.04 + sway * 0.3
        hem = add(H, (0, 8.5))
        def skirt():
            P.poly([add(H, side, 4.4), add(H, side, -4.4), add(add(hem, side, -7.2), (sw - 0.6, 0)),
                    add(add(hem, side, -2.4), (sw, 0.8)), add(add(hem, side, 2.4), (sw, 0.8)),
                    add(add(hem, side, 7.4), (sw + 0.6, 0))])
        P.part(skirt, k["skirt"], sh=1.0)
        c.set_source_rgba(*mul(k["skirt"], 0.6))
        c.set_line_width(0.35)
        for t in (-3.5, 0, 3.5):
            c.move_to(*add(H, side, t * 0.6))
            c.line_to(*add(add(hem, side, t * 1.3), (sw, 0)))
        c.stroke()
    else:  # 학랜 아랫단
        P.part(lambda: P.poly([add(H, side, 4.2), add(H, side, -4.2), add(add(H, (0, 3)), side, -4.6),
                               add(add(H, (0, 3)), side, 4.8)]), k["top"], sh=0.6)

    # ── 목 · 얼굴 ──
    P.part(lambda: P.capsule(N, add(N, up, NECK + 1.5), 1.6), k["skin"], sh=0.5)
    fc = add(C, (0.6, 0.6))
    def face():
        P.poly([add(fc, (-6, -2)), add(fc, (-3, -6.2)), add(fc, (3.5, -5.6)), add(fc, (6.1, -1)), add(fc, (5.2, 3.2)),
                add(fc, (2.4, 6.1)), add(fc, (-1.5, 5.5)), add(fc, (-5.2, 2.6))], smooth=True)
    P.part(face, k["skin"], sh=0.7)

    def eye(E, w, h, front):
        if p["eye"] == 0:
            c.set_source_rgba(*LINE)
            c.set_line_width(0.6)
            c.move_to(E[0] - w, E[1] + 0.2)
            c.curve_to(E[0] - w * 0.3, E[1] + 1.0, E[0] + w * 0.3, E[1] + 1.0, E[0] + w, E[1] + 0.1)
            c.stroke()
            return
        hh = h * (0.6 if p["eye"] == 2 else 1.0)
        P.flat(lambda: P.ellipse(E[0], E[1] + 0.3, w, hh), hx("#FFFFFF"))
        g = cairo.LinearGradient(E[0], E[1] - hh, E[0], E[1] + hh)
        g.add_color_stop_rgba(0, *mul(k["eye"], 0.45))
        g.add_color_stop_rgba(0.55, *k["eye"])
        g.add_color_stop_rgba(1, *mix(k["eye"], hx("#FFFFFF"), 0.4))
        c.save()
        c.new_path()
        P.ellipse(E[0], E[1] + 0.3, w, hh)
        c.clip()
        c.new_path()
        P.ellipse(E[0] + (0.3 if front else 0.1), E[1] + 0.4, w * 0.8, hh * 0.95)
        c.set_source(g)
        c.fill()
        P.flat(lambda: P.ellipse(E[0] + 0.35, E[1] + 0.5, w * 0.35, hh * 0.45), hx("#1A1022"))
        P.flat(lambda: P.ellipse(E[0] - w * 0.25, E[1] - hh * 0.35, w * 0.3, hh * 0.28), hx("#FFFFFF"))
        P.flat(lambda: P.ellipse(E[0] + w * 0.35, E[1] + hh * 0.45, w * 0.15, hh * 0.13), hx("#FFFFFF", 0.9))
        c.restore()
        c.set_source_rgba(*LINE)
        c.set_line_width(0.9 if front else 0.7)
        c.move_to(E[0] - w - 0.3, E[1] - hh * 0.55)
        c.curve_to(E[0] - w * 0.4, E[1] - hh * 1.25, E[0] + w * 0.6, E[1] - hh * 1.2, E[0] + w + 0.5, E[1] - hh * 0.35)
        c.stroke()
        if p["eye"] == 2:
            c.set_line_width(0.6)
            c.move_to(E[0] - w, E[1] - hh - 1.6)
            c.line_to(E[0] + w + 0.4, E[1] - hh - 0.6)
            c.stroke()
    E1 = add(fc, (2.5, 1.0))
    E2 = add(fc, (-2.1, 0.8))
    eye(E1, 1.8, 2.3, True)
    eye(E2, 1.2, 2.1, False)
    if p["eye"] == 1:
        c.set_source_rgba(*mul(k["hair"], 0.55))
        c.set_line_width(0.45)
        c.move_to(E1[0] - 1.8, E1[1] - 3.6)
        c.curve_to(E1[0] - 0.6, E1[1] - 4.2, E1[0] + 1, E1[1] - 4.1, E1[0] + 2.2, E1[1] - 3.5)
        c.stroke()
    c.set_source_rgba(*mul(k["skin"], 0.55))
    c.set_line_width(0.35)
    c.move_to(fc[0] + 4.7, fc[1] + 1.4)
    c.line_to(fc[0] + 5.1, fc[1] + 2.2)
    c.stroke()
    mx, my = fc[0] + 3.4, fc[1] + 4.3
    c.set_source_rgba(*hx("#A8455A"))
    c.set_line_width(0.45)
    if p["eye"] == 2:
        P.flat(lambda: P.poly([(mx - 1.2, my - 0.3), (mx + 1.3, my - 0.4), (mx + 1.0, my + 0.6), (mx - 0.9, my + 0.6)]),
               hx("#FFFFFF"), line=hx("#A8455A"), lw=0.35)
    elif p["eye"] == 0:
        c.move_to(mx - 0.8, my + 0.3)
        c.curve_to(mx - 0.2, my - 0.4, mx + 0.4, my - 0.4, mx + 1.0, my + 0.3)
        c.stroke()
    else:
        c.move_to(mx - 0.9, my)
        c.curve_to(mx - 0.3, my + 0.5, mx + 0.4, my + 0.5, mx + 0.9, my - 0.1)
        c.stroke()
    P.flat(lambda: P.ellipse(fc[0] + 3.0, fc[1] + 2.4, 1.3, 0.55), hx("#FF8FA3", 0.45))

    # ── 앞머리 ──
    def front_hair():
        P.poly([add(C, (-7.4, 1)), add(C, (-7.2, -5)), add(C, (-3, -8.6)), add(C, (2.5, -8.4)), add(C, (6.8, -5.2)),
                add(C, (7.4, -1.6)), add(C, (6.0, -2.6)), add(C, (4.4, -1.8)), add(C, (2.6, -3.2)), add(C, (0.8, -1.6)),
                add(C, (-1.4, -3.0)), add(C, (-3.6, -1.0)), add(C, (-4.8, 1.8))], smooth=True)
        for x0, x1, tip in [(4.4, 7.6, (7.4, -0.2)), (1.4, 4.6, (3.6, -0.6)), (-1.8, 1.4, (0.4, -0.2))]:
            P.poly([add(C, (x0, -5)), add(C, (x1, -5)), add(C, tip)])
        P.poly([add(C, (-7.4, -2)), add(C, (-4.0, -3)), add(C, (-3.6, 5)), add(C, (-5.5, 9.5 + sway * 0.3)),
                add(C, (-7.6, 4))], smooth=True)
        if st == "spiky":
            for sx, sy, tx, ty in [(-6, -6, -11 + sway * 0.3, -9), (-2, -8, -4, -13.5), (2.5, -8, 5, -12.5),
                                   (6, -5, 10, -7.5), (-7, -2, -12, -2)]:
                P.poly([add(C, (sx - 2.4, sy + 2)), add(C, (sx + 2.4, sy + 2)), add(C, (tx, ty))])
        if st == "long":
            P.poly([add(C, (5.8, -3)), add(C, (7.6, -1)), add(C, (7.2, 7)), add(C, (5.6, 9.5)), add(C, (5.4, 2))],
                   smooth=True)
    P.part(front_hair, hair, hair_sh, sh=1.0)
    c.save()
    c.set_source_rgba(*k["hair2"][:3], 0.85)
    c.set_line_width(0.8)
    c.new_path()
    c.arc(C[0] - 0.6, C[1] - 1.5, 5.4, math.radians(205), math.radians(285))
    c.stroke()
    c.restore()
    if st == "ponytail":
        P.part(lambda: P.ellipse(*add(C, (-6, -3.2)), 1.1, 1.4), k["tie"], sh=0.3)
    if st == "long":
        P.part(lambda: P.poly([add(C, (3, -6.4)), add(C, (5.6, -5.4)), add(C, (4.2, -4.4))]), k["fx"], sh=0.2)

    # ── 앞 팔 + 무기 ──
    if k["weapon"] == "staff":
        weapon(J["Hf"], p["w"])
    P.part(lambda: arm(J["Sf"], J["Ef"], J["Hf"], 2.5), k["top"])
    cuff = k["collar"] if u == "sailor" else (k["tie"] if u == "gakuran" else k["top"])
    P.part(lambda: P.capsule(add(J["Ef"], d(p["fa2"], 6.6)), add(J["Ef"], d(p["fa2"], 8.0)), 1.9), cuff, sh=0.4)
    if k["weapon"] != "staff":
        weapon(J["Hf"], p["w"])
    P.part(lambda: P.ellipse(*J["Hf"], 2.0, 1.9), k["skin"], sh=0.5)

    # ── 능력 이펙트 ──
    fx = p.get("fx")
    if fx:
        kind = fx[0]
        if kind == "arc":
            _, a0, a1, r, th = fx
            center = J["Sf"]
            n = 24
            outer = [add(center, d(lerp(a0, a1, i / n), r + th * math.sin(math.pi * i / n) / 2)) for i in range(n + 1)]
            inner = [add(center, d(lerp(a0, a1, i / n), r - th * math.sin(math.pi * i / n) / 2)) for i in range(n + 1)]
            g = cairo.LinearGradient(*outer[0], *outer[-1])
            g.add_color_stop_rgba(0, *k["fx"][:3], 0.0)
            g.add_color_stop_rgba(0.7, *k["fx"][:3], 0.85)
            g.add_color_stop_rgba(1, *k["fx2"][:3], 1.0)
            c.new_path()
            c.move_to(*outer[0])
            for q in outer[1:]:
                c.line_to(*q)
            for q in inner[::-1]:
                c.line_to(*q)
            c.close_path()
            c.set_source(g)
            c.fill()
            c.set_source_rgba(*k["fx2"][:3], 0.9)
            c.set_line_width(0.6)
            c.new_path()
            c.move_to(*outer[n // 2])
            for q in outer[n // 2:]:
                c.line_to(*q)
            c.stroke()
            ability_sparks(c, k, ch, center, a0, a1, r, phase)
        elif kind == "glow":
            _, rad = fx
            g = cairo.RadialGradient(*J["Hf"], 0, *J["Hf"], rad)
            g.add_color_stop_rgba(0, *k["fx2"][:3], 1)
            g.add_color_stop_rgba(0.45, *k["fx"][:3], 0.9)
            g.add_color_stop_rgba(1, *k["fx"][:3], 0)
            c.new_path()
            c.arc(*J["Hf"], rad, 0, math.tau)
            c.set_source(g)
            c.fill()
            ability_sparks(c, k, ch, J["Hf"], 0, 360, rad * 0.8, phase)
        elif kind == "aura":
            _, rad = fx
            cen = add(J["H"], (0, -12))
            g = cairo.RadialGradient(*cen, rad * 0.3, *cen, rad)
            g.add_color_stop_rgba(0, *k["fx"][:3], 0.0)
            g.add_color_stop_rgba(0.7, *k["fx"][:3], 0.35)
            g.add_color_stop_rgba(1, *k["fx"][:3], 0)
            c.new_path()
            c.arc(*cen, rad, 0, math.tau)
            c.set_source(g)
            c.fill()
            ability_sparks(c, k, ch, cen, 0, 360, rad * 0.75, phase)
    return P.to_array()


# ───────────── 동작 (키 포즈) ─────────────
def P_(**kw):
    q = dict(BASE)
    q.update(kw)
    return q


def interp(a, b, t):
    out = {}
    for key in a:
        va, vb = a[key], b.get(key, a[key])
        if isinstance(va, (int, float)) and isinstance(vb, (int, float)) and key not in ("ground", "eye"):
            out[key] = lerp(va, vb, t)
        else:
            out[key] = va if t < 0.5 else vb
    return out


def seq(keys, n, loop=False):
    frames = []
    for i in range(n):
        t = i / n if loop else (i / (n - 1) if n > 1 else 0)
        for j in range(len(keys) - 1):
            t0, p0 = keys[j]
            t1, p1 = keys[j + 1]
            if t0 <= t <= t1:
                frames.append(interp(p0, p1, ease((t - t0) / max(1e-6, t1 - t0))))
                break
        else:
            frames.append(dict(keys[-1][1]))
    return frames


def anims(ch):
    w = CHARS[ch]["weapon"]
    staff = w == "staff"
    if staff:
        stance = P_(fa1=30, fa2=95, ba1=10, ba2=85, w=75, t=8)
    elif w == "bat":
        stance = P_(fa1=20, fa2=150, ba1=0, ba2=140, w=205, t=8)
    else:
        stance = P_(fa1=32, fa2=110, ba1=12, ba2=100, w=135, t=6)
    st2 = dict(stance)
    st2.update(hy=0.8, t=stance["t"] + 2, fa1=stance["fa1"] + 3, ba1=stance["ba1"] + 3, fl1=18, bl1=-12)

    A = {}
    A["idle"] = seq([(0, stance), (0.5, st2), (1, stance)], 8, loop=True)
    walk = []
    for i in range(8):
        ph = i / 8 * math.tau
        q = dict(stance)
        q.update(fl1=6 + 26 * math.sin(ph), fl2=-6 + 14 * min(0, math.cos(ph)) - 8 * max(0, math.sin(ph)),
                 bl1=6 - 26 * math.sin(ph), bl2=-6 + 14 * min(0, -math.cos(ph)) - 8 * max(0, -math.sin(ph)),
                 hy=-abs(math.sin(ph)) * 1.4, t=stance["t"] + 4)
        walk.append(q)
    A["walk"] = walk
    jump = dict(stance)
    jump.update(fl1=62, fl2=-30, bl1=8, bl2=-52, ground=0, hy=-4, t=stance["t"] + 6)
    jump2 = dict(jump)
    jump2.update(fl1=40, fl2=-12, bl1=-10, bl2=-30)
    A["jump"] = [jump, jump2]

    if staff:
        L0 = dict(stance); L0.update(fa1=15, ba1=0, w=80, hx=-2)
        L1 = dict(stance); L1.update(fa1=85, fa2=90, ba1=65, ba2=88, w=88, hx=8, t=18, fl1=42, bl1=-30, eye=2,
                                       fx=("arc", 120, 80, 26, 4))
    else:
        L0 = dict(stance); L0.update(fa1=150, fa2=170, w=195, t=0)
        L1 = dict(stance); L1.update(fa1=75, fa2=85, w=88, t=18, hx=7, fl1=42, bl1=-30, eye=2,
                                       fx=("arc", 170, 70, 22, 5))
    A["light"] = seq([(0, stance), (0.3, L0), (0.5, L1), (1, stance)], 6)
    for i, f in enumerate(A["light"]):
        if i not in (2, 3):
            f["fx"] = None

    if staff:
        H0 = dict(stance); H0.update(fa1=-40, fa2=-10, ba1=-60, ba2=-20, w=-30, t=-8, hx=-3, fl1=10, bl1=-30)
        H1 = dict(stance); H1.update(fa1=110, fa2=125, ba1=90, ba2=115, w=125, t=22, hx=8, fl1=44, bl1=-32,
                                       eye=2, fx=("arc", -30, 135, 27, 7))
        H2 = dict(H1); H2.update(fa1=95, w=105, fx=None)
    else:
        H0 = dict(stance); H0.update(fa1=190, fa2=200, ba1=170, ba2=190, w=210, t=-8, hx=-3, fl1=12, bl1=-26)
        H1 = dict(stance); H1.update(fa1=70, fa2=60, ba1=40, ba2=50, w=48, t=26, hx=9, hy=2, fl1=48, fl2=-22,
                                       bl1=-32, eye=2, fx=("arc", 205, 40, 25, 8))
        H2 = dict(H1); H2.update(fa1=55, w=35, fx=None)
    A["heavy"] = seq([(0, stance), (0.35, H0), (0.5, H1), (0.62, H1), (0.75, H2), (1, stance)], 8)

    J0 = dict(jump); J0.update(fa1=170, fa2=180, w=190, eye=2)
    J1 = dict(jump); J1.update(fa1=60, fa2=50, w=40, t=20, eye=2, fx=("arc", 180, 40, 22, 6))
    A["air"] = seq([(0, jump), (0.35, J0), (0.6, J1), (1, jump)], 4)

    C0 = dict(stance); C0.update(fa1=-60, fa2=-95, w=-80 if not staff else -40, t=-4, hx=-2, eye=2, fx=("glow", 5))
    C1 = dict(C0); C1.update(fx=("glow", 7.5))
    C2 = dict(stance); C2.update(fa1=88, fa2=90, w=90, t=18, hx=6, fl1=40, eye=2, fx=("glow", 6))
    A["cast"] = seq([(0, stance), (0.3, C0), (0.6, C1), (0.75, C2), (1, stance)], 7)
    A["cast"][0]["fx"] = None
    A["cast"][-1]["fx"] = None

    X0 = dict(stance); X0.update(fa1=170, fa2=175, ba1=-170, ba2=-175, w=180, t=0, eye=2, fx=("aura", 26))
    X1 = dict(stance); X1.update(fa1=95, fa2=95, ba1=-60, ba2=-40, w=95, t=30, hx=10, fl1=52, fl2=-30, bl1=-42,
                                   eye=2, fx=("arc", 240, 30, 30, 10))
    X2 = dict(X1); X2.update(fa1=40, w=10, fx=("arc", 30, -60, 28, 8))
    A["super"] = seq([(0, stance), (0.25, X0), (0.42, X0), (0.55, X1), (0.7, X2), (1, stance)], 9)
    A["super"][0]["fx"] = None
    A["super"][-1]["fx"] = None

    h1 = dict(stance); h1.update(t=-14, h=-10, hx=-3, fa1=-30, fa2=-10, ba1=-50, ba2=-20, eye=0, fl1=8, bl1=-24)
    h2 = dict(h1); h2.update(t=-8, h=-5, hx=-2)
    A["hit"] = [h1, h2, dict(stance, eye=0)]
    g = dict(stance); g.update(fa1=60, fa2=165, ba1=50, ba2=150, w=178 if not staff else 170, t=-4, hx=-2, eye=2)
    A["block"] = [g]
    downs = []
    for i in range(6):
        t_ = i / 5
        q = dict(stance)
        q.update(t=lerp(-10, -82, t_), h=lerp(-10, -20, t_), hx=lerp(-3, -18, t_), hy=lerp(0, 22, t_),
                 fa1=lerp(-30, -120, t_), fa2=lerp(-10, -140, t_), ba1=lerp(-50, -130, t_), ba2=lerp(-20, -150, t_),
                 fl1=lerp(10, 70, t_), fl2=lerp(-4, 82, t_), bl1=lerp(-20, 62, t_), bl2=lerp(-6, 92, t_),
                 w=lerp(stance["w"], -120, t_), ground=1 if t_ < 0.4 else 0, eye=0)
        downs.append(q)
    A["down"] = downs
    w0 = dict(stance); w0.update(fa1=170, fa2=170, w=180, t=0, eye=1, ba1=-20, ba2=10)
    w1 = dict(w0); w1.update(hy=-1, fa1=165)
    A["win"] = seq([(0, w0), (0.5, w1), (1, w0)], 6, loop=True)
    return A


ORDER = ["idle", "walk", "jump", "light", "heavy", "air", "cast", "super", "hit", "block", "down", "win"]
FPS = {"idle": 8, "walk": 12, "jump": 8, "light": 18, "heavy": 16, "air": 16, "cast": 14, "super": 14,
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
    cols = max(len(A[name]) for name in ORDER)
    sheet = np.zeros((CH * len(ORDER), CW * cols, 4), np.uint8)
    meta = {}
    for r, name in enumerate(ORDER):
        fr = A[name]
        for i, p in enumerate(fr):
            img = draw_frame(ch, p, phase=i / max(1, len(fr)))
            if name == "down" and not p["ground"]:
                ys = np.nonzero(img[:, :, 3] > 30)[0]
                if len(ys):
                    shift = AY * SCALE - ys.max()
                    if shift > 0:
                        img = np.roll(img, shift, axis=0)
            sheet[r * CH:(r + 1) * CH, i * CW:(i + 1) * CW] = img
        meta[name] = {"row": r, "frames": len(fr), "fps": FPS[name], "loop": name in LOOP}
    return Image.fromarray(sheet, "RGBA"), meta


IMPORTED = {"mio"}


def main():
    preview = "--preview" in sys.argv
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    OUT.mkdir(parents=True, exist_ok=True)
    sheets = {}
    for ch in CHARS:
        if only and ch not in only:
            continue
        # 이미 그림 시트를 받아 import-fight-sheet.py 로 넣은 캐릭터는 덮어쓰지 않음
        if not only and not preview and ch in IMPORTED:
            continue
        img, meta = build(ch)
        sheets[ch] = img
        if not preview:
            img.save(OUT / f"{ch}.webp", "WEBP", quality=84, method=6)
            j = {"image": f"/fight/{ch}.webp", "cell": [CW, CH], "anchor": [AX * SCALE, int((AY + 1.6) * SCALE)],
                 "scale": SCALE, "facing": "right", "anims": meta, "moves": MOVES, "states": STATES,
                 "credit": "오리지널 (scripts/draw-fight-chars.py로 그림)"}
            (OUT / f"{ch}.json").write_text(json.dumps(j, ensure_ascii=False, indent=2) + "\n")
        print(ch, img.size)
    if preview:
        w = max(s.width for s in sheets.values())
        h = sum(s.height for s in sheets.values())
        out = Image.new("RGBA", (w, h), (70, 64, 90, 255))
        y = 0
        for s in sheets.values():
            out.alpha_composite(s, (0, y))
            y += s.height
        out.save("/tmp/fight-preview.png")
        print("/tmp/fight-preview.png")


if __name__ == "__main__":
    main()
