#!/usr/bin/env python3
"""
격투게임 화면용 그림 잘라내기 (캐릭터 설정화·이펙트 그림 → 배경 지운 webp)

  python3 scripts/extract-fight-art.py <캐릭터설정화.png> <화염구.png> <맵.png>

만드는 것 (public/fight/)
  art/<id>.webp       캐릭터 선택 화면 전신 그림
  art/<id>-face.webp  체력바·선택 화면 얼굴 그림
  fx/igna-fireball.webp  이그나 화염구 (오른쪽을 보는 그림)
  bg/<맵>-thumb.webp  맵 선택 화면 썸네일
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

OUT = Path("public/fight")

# 설정화(1536×1024) 안의 위치
ART = {
    "kai": dict(full=(4, 88, 291, 742), face=(35, 911, 135, 989), keep_dark=True),
    "igna": dict(full=(775, 84, 1058, 739), face=(804, 911, 906, 989), keep_dark=False),
}
FIREBALL = (340, 270, 850, 570)


def cutout(im: Image.Image, keep_dark: bool, near_t=32) -> Image.Image:
    """테두리와 이어진 배경색 영역을 지우고 그림만 남김"""
    a = np.asarray(im.convert("RGB")).astype(np.float32)
    q = (a // 4).astype(int).reshape(-1, 3)
    vals, cnt = np.unique(q, axis=0, return_counts=True)
    bg = a.reshape(-1, 3)[(q == vals[cnt.argmax()]).all(1)].mean(0)
    dist = np.abs(a - bg).sum(2)
    near = dist < near_t
    if keep_dark:
        near &= a.mean(2) >= bg.mean() - 10
    lab, n = ndimage.label(near)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    hard = np.isin(lab, list(edge))
    fg = ~hard
    # 작은 부스러기 지우고 구멍 메우기
    lab2, n2 = ndimage.label(fg, structure=np.ones((3, 3)))
    if n2:
        sizes = ndimage.sum(np.ones_like(dist), lab2, range(1, n2 + 1))
        keep = np.zeros(n2 + 1, bool)
        keep[1:] = sizes >= 40
        fg = keep[lab2]
    fg = ndimage.binary_fill_holes(fg)
    # 배경 격자선 조각: 가늘고(열기 연산에 지워짐) 배경보다 살짝만 어두운 픽셀
    thin = fg & ~ndimage.binary_opening(fg, np.ones((3, 3)))
    fg &= ~(thin & (a.mean(2) >= bg.mean() - 18))
    # 바깥 가장자리 중 배경색에 가까운 픽셀을 두 겹까지 벗겨 냄 (지저분한 테두리 방지)
    for _ in range(2):
        rim = fg & ~ndimage.binary_erosion(fg, np.ones((3, 3)))
        fg &= ~(rim & (dist < 60))
    alpha = fg.astype(np.float32)
    out = np.dstack([a, alpha * 255]).astype(np.uint8)
    ys, xs = np.where(fg)
    return Image.fromarray(out, "RGBA").crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def glow_cutout(im: Image.Image) -> Image.Image:
    """빛나는 이펙트: 어두운 배경과의 밝기 차이를 알파로 (번짐 유지)"""
    a = np.asarray(im.convert("RGB")).astype(np.float32)
    bg = np.median(a.reshape(-1, 3), axis=0)
    d = np.clip((a - bg).max(2), 0, None)
    alpha = np.clip((d - 22) / 35, 0, 1)
    alpha[ndimage.binary_fill_holes(alpha > 0.5)] = 1
    rgb = np.clip(bg + (a - bg) / np.maximum(alpha, 1e-3)[..., None], 0, 255)
    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    ys, xs = np.where(alpha > 0.04)
    return Image.fromarray(out, "RGBA").crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def main(sheet: str, fireball: str, map_img: str):
    (OUT / "art").mkdir(parents=True, exist_ok=True)
    (OUT / "fx").mkdir(parents=True, exist_ok=True)
    src = Image.open(sheet).convert("RGB")
    for cid, d in ART.items():
        full = cutout(src.crop(d["full"]), d["keep_dark"])
        full.save(OUT / "art" / f"{cid}.webp", "WEBP", quality=90, method=6)
        face = src.crop(d["face"]).resize((160, 128), Image.NEAREST)
        face.save(OUT / "art" / f"{cid}-face.webp", "WEBP", quality=90, method=6)
        print(cid, full.size)
    fb = glow_cutout(Image.open(fireball).crop(FIREBALL))
    fb.save(OUT / "fx" / "igna-fireball.webp", "WEBP", quality=90, method=6)
    print("fireball", fb.size)
    Image.open(map_img).convert("RGB").resize((480, 270), Image.LANCZOS).save(
        OUT / "bg" / "temple-thumb.webp", "WEBP", quality=85, method=6
    )


if __name__ == "__main__":
    main(*sys.argv[1:4])
