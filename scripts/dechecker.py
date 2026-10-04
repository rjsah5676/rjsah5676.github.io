"""그려진 체크무늬(흰·회색) 배경 → 진짜 투명 PNG"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

def run(src, dst):
    a = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
    mx, mn = a.max(2), a.min(2)
    lum = a.mean(2)
    bgl = (mx - mn < 16) & (mn > 190)          # 밝은 무채색
    lab, n = ndimage.label(bgl)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    isbg = np.zeros(n + 1, bool)
    isbg[list(edge)] = True
    # 갇힌 덩어리: 체크무늬(밝은 칸과 회색 칸이 둘 다 많음)면 배경
    sz = ndimage.sum(np.ones_like(lum), lab, range(n + 1))
    # 체크무늬는 칸마다 밝기가 툭툭 바뀜 → 덩어리 안 이웃 픽셀끼리 밝기 차가 큰 비율이 높음 (셔츠는 매끈)
    dx = np.zeros_like(lum); dy = np.zeros_like(lum)
    dx[:, 1:] = np.where(lab[:, 1:] == lab[:, :-1], np.abs(lum[:, 1:] - lum[:, :-1]), 0)
    dy[1:] = np.where(lab[1:] == lab[:-1], np.abs(lum[1:] - lum[:-1]), 0)
    jump = ((dx > 12) | (dy > 12)).astype(float)
    jf = ndimage.sum(jump, lab, range(n + 1)) / np.maximum(sz, 1)
    for i in range(1, n + 1):
        if not isbg[i] and sz[i] > 160 and jf[i] > 0.47:
            isbg[i] = True
    bg = isbg[lab]
    # 2차: 이펙트 빛이 살짝 덮인(옅은 색이 섞인) 체크무늬 — 채도 조금 허용, 체크 질감 있는 덩어리만
    soft = (mn > 165) & (mx - mn < 70) & ~bg
    l3, n3 = ndimage.label(soft)
    if n3:
        s3 = ndimage.sum(np.ones_like(lum), l3, range(n3 + 1))
        dx3 = np.zeros_like(lum); dy3 = np.zeros_like(lum)
        dx3[:, 1:] = np.where(l3[:, 1:] == l3[:, :-1], np.abs(lum[:, 1:] - lum[:, :-1]), 0)
        dy3[1:] = np.where(l3[1:] == l3[:-1], np.abs(lum[1:] - lum[:-1]), 0)
        j3 = ndimage.sum(((dx3 > 10) | (dy3 > 10)).astype(float), l3, range(n3 + 1)) / np.maximum(s3, 1)
        ok = (s3 > 160) & (j3 > 0.42)
        ok[0] = False
        bg |= ok[l3]
    fg = ~bg
    # 부스러기 지우기
    l2, n2 = ndimage.label(fg, structure=np.ones((3, 3)))
    if n2:
        s2 = ndimage.sum(np.ones_like(lum), l2, range(1, n2 + 1))
        keep = np.zeros(n2 + 1, bool)
        keep[1:] = s2 >= 25
        fg = keep[l2]
    # 바깥 테두리의 밝은 무채색 한 겹 벗기기 (흰 번짐)
    rim = fg & ~ndimage.binary_erosion(fg, np.ones((3, 3)))
    fg &= ~(rim & bgl)
    out = np.dstack([a, fg * 255.0]).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(dst)

for f in sys.argv[1:]:
    run(f, f.replace(".png", "-a.png"))

    print(f)
