#!/usr/bin/env python3
"""
AI로 뽑은 격투 스프라이트 시트(단색 배경, 줄마다 동작 여러 개 섞여 있는 그림)를
게임 시트 형식(public/fight/<id>.webp + .json)으로 바꿔 준다.

  python3 scripts/import-fight-sheet.py <원본.png> <캐릭터id>

하는 일
  1. 배경색(가장 흔한 색) 키 아웃 → 부드러운 알파, 테두리 배경색 번짐 제거
  2. 워터마크 영역 지우기 (WATERMARKS)
  3. 빈 가로띠로 줄, 빈 세로띠로 프레임 나누기 (SPLITS 로 붙은 줄 강제 분리)
  4. 프레임마다 발끝(몸 픽셀 맨 아래)·머리 중심을 기준점으로 맞춰 같은 칸에 재배치
  5. ANIMS 설정대로 (원본 줄, 프레임 번호) 를 동작별 줄로 다시 묶어 저장

원본 레이아웃이 바뀌면 ANIMS / MOVES 만 고치면 된다.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

# 원본 기준 좌표(px). 오른쪽 아래 별 워터마크.
WATERMARKS = [(840, 930, 905, 1000)]
# 붙어서 한 줄로 잡히는 곳을 이 y에서 자름
SPLITS = [638]
# 이 거리 이하로 떨어진 조각은 같은 프레임으로 합침 (물방울 등)
MERGE_GAP = 10

# 동작 이름 → [(원본 줄, 프레임 번호), ...]  (0부터, 왼쪽→오른쪽)
ANIMS = {
    "idle": dict(src=[(0, i) for i in range(5)], fps=6, loop=True),
    "walk": dict(src=[(0, 5), (0, 6), (0, 7), (1, 5), (1, 6), (1, 7)], fps=10, loop=True),
    "jump": dict(src=[(2, 0), (2, 1), (2, 2), (2, 3)], fps=8, loop=False),
    "light": dict(src=[(6, 4), (6, 5), (6, 6), (6, 7), (6, 8)], fps=20, loop=False),
    "heavy": dict(src=[(4, i) for i in range(5)], fps=14, loop=False),
    "air": dict(src=[(8, 2), (8, 3)], fps=12, loop=False),
    "cast": dict(src=[(8, 0), (8, 1), (8, 4), (8, 5), (8, 6)], fps=12, loop=False),
    "super": dict(src=[(3, 1), (3, 2), (3, 3), (3, 4), (5, 0), (5, 1), (5, 2), (5, 3)], fps=12, loop=False),
    "hit": dict(src=[(10, 2), (10, 3), (10, 4)], fps=12, loop=False),
    "block": dict(src=[(9, 0)], fps=1, loop=False),
    "down": dict(src=[(10, i) for i in range(2, 6)], fps=12, loop=False),
    "win": dict(src=[(11, i) for i in range(6)], fps=5, loop=True),
}
MOVES = {
    "L": dict(anim="light", **{"from": 0}, impact=2, to=4),
    "H": dict(anim="heavy", **{"from": 0}, impact=2, to=4),
    "J": dict(anim="air", **{"from": 0}, impact=1, to=1),
    "S": dict(anim="cast", **{"from": 0}, impact=3, to=4),
    "X": dict(anim="super", **{"from": 0}, impact=6, to=7),
}
STATES = {
    "idle": {"anim": "idle"},
    "walk": {"anim": "walk"},
    "jump": {"anim": "jump", "frame": 1},
    "hit": {"anim": "hit"},
    "block": {"anim": "block", "frame": 0},
    "down": {"anim": "down"},
    "ko": {"anim": "down"},
    "win": {"anim": "win"},
}
# 원본 몸 키(px) ÷ 게임 몸 키(px)
SCALE = 1.12


def bands(a, gap):
    out, s, e = [], None, 0
    for i, v in enumerate(a):
        if v:
            if s is None:
                s = i
            e = i
        elif s is not None and i - e > gap:
            out.append([s, e])
            s = None
    if s is not None:
        out.append([s, e])
    return out


def main(src: str, cid: str):
    rgba = Image.open(src).convert("RGB")
    im = np.asarray(rgba).astype(np.float32)
    H, W, _ = im.shape
    q = (im // 4).astype(int).reshape(-1, 3)
    vals, cnt = np.unique(q, axis=0, return_counts=True)
    key = (q == vals[cnt.argmax()]).all(1).reshape(H, W)
    bg = im[key].mean(0)
    dist = np.abs(im - bg).sum(2)
    # 배경 = 배경색에 가까운 픽셀 중 테두리와 이어진 덩어리 (+ 갇힌 틈 중 거의 배경색인 것).
    # 남색 블레이저처럼 배경과 비슷한 옷이 투명해지지 않게, 색만으로 지우지 않는다.
    near = dist < 34
    lab, n = ndimage.label(near)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    sizes = ndimage.sum(np.ones_like(dist), lab, range(n + 1))
    means = ndimage.mean(dist, lab, range(n + 1))
    isbg = np.zeros(n + 1, bool)
    for i in range(1, n + 1):
        isbg[i] = i in edge or (sizes[i] >= 12 and means[i] < 14)
    hard = isbg[lab]
    # 경계 1px만 부드럽게
    alpha = np.where(hard, 0.0, 1.0)
    rim = hard & ndimage.binary_dilation(~hard)
    alpha[rim] = np.clip((dist[rim] - 10) / 30, 0, 0.8)
    for x0, y0, x1, y1 in WATERMARKS:
        alpha[y0:y1, x0:x1] = 0
    a3 = np.maximum(alpha, 1e-3)[..., None]
    rgb = np.clip((im - (1 - a3) * bg) / a3, 0, 255)
    mask = alpha > 0.35

    # 몸 픽셀: 하늘색 이펙트(파랑 강하고 밝음) 제외
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    fx = (b > 150) & (b - r > 45)
    body = mask & ~fx

    rows = bands(mask.any(1), 3)
    for sy in SPLITS:
        for i, (a, z) in enumerate(rows):
            if a < sy < z:
                rows[i:i + 1] = [[a, sy - 1], [sy, z]]
                break
    frames = []
    for a, z in rows:
        cols = bands(mask[a:z + 1].any(0), MERGE_GAP)
        fr = []
        for c0, c1 in cols:
            m = mask[a:z + 1, c0:c1 + 1]
            # 납작한 바닥 그림자 조각은 버림
            lb, k = ndimage.label(m)
            for sl_i, sl in enumerate(ndimage.find_objects(lb), 1):
                if sl[0].stop - sl[0].start <= 10 and sl[1].stop - sl[1].start > 14:
                    seg = lb == sl_i
                    m[seg] = False
                    alpha[a:z + 1, c0:c1 + 1][seg] = 0
            mask[a:z + 1, c0:c1 + 1] = m
            ys = np.where(m.any(1))[0]
            fr.append((c0, a + ys[0], c1, a + ys[-1]))
        frames.append(fr)
        print(f"줄 {len(frames) - 1}: y{a}-{z} 프레임 {len(fr)}")

    def anchor(box):
        x0, y0, x1, y1 = box
        bm = body[y0:y1 + 1, x0:x1 + 1]
        ys, xs = np.where(bm)
        if len(ys) == 0:
            ys, xs = np.where(mask[y0:y1 + 1, x0:x1 + 1])
        top = ys.min()
        head = xs[ys < top + 18]
        foot = ys.max()
        return x0 + head.mean(), y0 + foot

    picks = {}
    left = right = up = down = 0
    for name, ad in ANIMS.items():
        lst = []
        for ri, fi in ad["src"]:
            box = frames[ri][fi]
            ax, ay = anchor(box)
            left = max(left, ax - box[0])
            right = max(right, box[2] + 1 - ax)
            up = max(up, ay - box[1])
            down = max(down, box[3] + 1 - ay)
            lst.append((box, ax, ay))
        picks[name] = lst
    pad = 2
    L, R, U, D = (int(np.ceil(v)) + pad for v in (left, right, up, down))
    cw, ch = L + R, U + D
    ncol = max(len(v) for v in picks.values())
    out = np.zeros((ch * len(ANIMS), cw * ncol, 4), np.uint8)
    src_rgba = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    for row, (name, lst) in enumerate(picks.items()):
        for col, (box, ax, ay) in enumerate(lst):
            x0, y0, x1, y1 = box
            piece = src_rgba[y0:y1 + 1, x0:x1 + 1].copy()
            piece[~mask[y0:y1 + 1, x0:x1 + 1] & (alpha[y0:y1 + 1, x0:x1 + 1] < 0.05)] = 0
            dx = int(round(col * cw + L - (ax - x0)))
            dy = int(round(row * ch + U - (ay - y0)))
            ph, pw = piece.shape[:2]
            dst = out[dy:dy + ph, dx:dx + pw]
            sel = piece[..., 3] > dst[..., 3]
            dst[sel] = piece[sel]
    outdir = Path("public/fight")
    Image.fromarray(out, "RGBA").save(outdir / f"{cid}.webp", "WEBP", quality=90, method=6)
    meta = {
        "image": f"/fight/{cid}.webp",
        "cell": [cw, ch],
        "anchor": [L, U],
        "scale": SCALE,
        "pixel": True,
        "facing": "right",
        "anims": {
            n: {"row": i, "frames": len(picks[n]), "fps": ad["fps"], "loop": ad["loop"]}
            for i, (n, ad) in enumerate(ANIMS.items())
        },
        "moves": MOVES,
        "states": STATES,
    }
    (outdir / f"{cid}.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n")
    print(f"칸 {cw}x{ch}, 기준점 ({L},{U}), 시트 {out.shape[1]}x{out.shape[0]}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
