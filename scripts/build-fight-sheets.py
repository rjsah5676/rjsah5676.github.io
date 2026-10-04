"""
격투게임 캐릭터 스프라이트 시트 만들기 (한 번만 돌리면 됨, 결과물은 public/fight/ 에 커밋)

원본: Open Duelyst (https://github.com/open-duelyst/duelyst) 유닛 도트 — CC0 1.0 (자유 이용)
  git clone --depth 1 --filter=blob:none --sparse https://github.com/open-duelyst/duelyst od
  cd od && git sparse-checkout set --no-cone 'app/resources/units/f1_general.*' \
      'app/resources/units/f2_general.*' 'app/resources/units/f3_altgeneral.*'
  python3 scripts/build-fight-sheets.py od/app/resources/units

원본 그림은 왼쪽을 보고 있음(facing: left). 원본 아틀라스(plist)를 "동작별로 한 줄씩, 모든 칸 같은 크기"인 격자 시트로 다시 펼치고
게임이 읽는 설정(json)을 같이 만든다. 나중에 직접 그린 그림으로 바꿀 때도 같은 형식이면
public/fight/<id>.png 와 <id>.json 만 바꾸면 됨 (src/lib/fight/sprites.ts 의 SpriteSheet 형식 참고).
"""
import json, plistlib, re, sys
from pathlib import Path
from PIL import Image
import numpy as np

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else "od/app/resources/units")
OUT = Path(__file__).resolve().parent.parent / "public" / "fight"

# 원본 동작 이름 → 시트 줄 이름
ROWS = [
    ("idle", "breathing"),
    ("stance", "idle"),
    ("walk", "run"),
    ("attack", "attack"),
    ("hit", "hit"),
    ("death", "death"),
    ("cast", "cast"),
    ("castStart", "caststart"),
    ("castLoop", "castloop"),
    ("castEnd", "castend"),
]

# 기술별로 쓸 프레임 구간 (impact = 판정이 나오는 첫 프레임에 보일 칸)
CHARS = {
    "sol": {
        "src": "f1_general",
        # 왼쪽 큰 칼 때문에 자동 계산이 몸통보다 왼쪽으로 쏠려서 직접 지정
        "anchorX": 49,
        "moves": {
            "L": {"anim": "attack", "from": 1, "impact": 5, "to": 8},
            "H": {"anim": "cast", "from": 0, "impact": 8, "to": 11},
            "J": {"anim": "attack", "from": 3, "impact": 5, "to": 8},
            "S": {"anim": "castStart", "from": 0, "impact": 8, "to": 8},
            "X": {"anim": "attack", "from": 9, "impact": 15, "to": 22},
        },
    },
    "kage": {
        "src": "f2_general",
        "moves": {
            "L": {"anim": "attack", "from": 3, "impact": 5, "to": 8},
            "H": {"anim": "attack", "from": 8, "impact": 11, "to": 17},
            "J": {"anim": "attack", "from": 4, "impact": 6, "to": 9},
            "S": {"anim": "castStart", "from": 0, "impact": 8, "to": 8},
            "X": {"anim": "attack", "from": 4, "impact": 9, "to": 17},
        },
    },
    "sera": {
        "src": "f3_altgeneral",
        "moves": {
            "L": {"anim": "attack", "from": 13, "impact": 14, "to": 16},
            "H": {"anim": "attack", "from": 7, "impact": 9, "to": 12},
            "J": {"anim": "attack", "from": 5, "impact": 7, "to": 8},
            "S": {"anim": "cast", "from": 0, "impact": 3, "to": 6},
            "X": {"anim": "attack", "from": 16, "impact": 17, "to": 21},
        },
    },
}

# 상태별 그림 (frame이 있으면 그 칸 고정)
STATES = {
    "idle": {"anim": "idle"},
    "walk": {"anim": "walk"},
    "jump": {"anim": "walk", "frame": 3},
    "hit": {"anim": "hit"},
    "block": {"anim": "hit", "frame": 0},
    "down": {"anim": "death"},
    "ko": {"anim": "death"},
    "win": {"anim": "castLoop"},
}

FPS = {"idle": 10, "stance": 10, "walk": 12, "attack": 16, "hit": 12, "death": 12, "cast": 14,
       "castStart": 14, "castLoop": 10, "castEnd": 14}


def rect(s):
    return list(map(int, re.findall(r"-?\d+", s)))


for cid, cfg in CHARS.items():
    plist = plistlib.load(open(SRC / f"{cfg['src']}.plist", "rb"))
    atlas = Image.open(SRC / f"{cfg['src']}.png").convert("RGBA")
    frames = plist["frames"]
    cw, ch = rect(next(iter(frames.values()))["sourceSize"])
    anims = {}
    for k in sorted(frames):
        name = re.sub(r"_\d+\.png$", "", k)[len(cfg["src"]) + 1:]
        anims.setdefault(name, []).append(k)
    cols = max(len(anims[src]) for _, src in ROWS)
    sheet = Image.new("RGBA", (cols * cw, len(ROWS) * ch), (0, 0, 0, 0))
    meta_anims = {}
    for r, (name, src) in enumerate(ROWS):
        for c, k in enumerate(anims[src]):
            f = frames[k]
            assert not f["rotated"]
            x, y, w, h = rect(f["frame"])
            ox, oy, _, _ = rect(f["sourceColorRect"])
            sheet.alpha_composite(atlas.crop((x, y, x + w, y + h)), (c * cw + ox, r * ch + oy))
        meta_anims[name] = {"row": r, "frames": len(anims[src]), "fps": FPS[name],
                            "loop": name in ("idle", "stance", "walk", "castLoop")}
    # 기준점: 서 있는 첫 칸의 발끝(가장 아래 불투명 줄)과 몸통 가운데(아래쪽 절반의 x 중앙값)
    a = np.array(sheet.crop((0, 0, cw, ch)))[:, :, 3] > 40
    ys, xs = np.nonzero(a)
    feet = int(ys.max()) + 1
    lower = xs[ys > (ys.min() + ys.max()) / 2]
    cx = cfg.get("anchorX", int(np.median(lower)))
    OUT.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT / f"{cid}.png", optimize=True)
    meta = {"image": f"/fight/{cid}.png", "cell": [cw, ch], "anchor": [cx, feet], "facing": "left",
            "anims": meta_anims, "moves": cfg["moves"], "states": STATES,
            "credit": "Open Duelyst (CC0 1.0)"}
    (OUT / f"{cid}.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n")
    print(cid, sheet.size, "anchor", cx, feet)
