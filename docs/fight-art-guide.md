# 격투게임 그림 만들기 (AI 이미지 → 게임)

엔진(판정·롤백·발판·AI)은 그대로 두고, 그림만 AI 이미지로 뽑아서 넣는다.
코드로 그린 캐릭터(하루·렌)와 배경은 그림이 들어오면 바로 교체.

## 캐릭터 시트

### 규칙 (이걸 지켜야 자동으로 잘림)
- 단색 배경 한 가지 색 (그라데이션·격자·글자 없음)
- 모든 프레임 **오른쪽을 봄**
- **딱 12줄**, 한 줄 = 동작 하나, 왼쪽→오른쪽 순서
- 프레임끼리, 줄끼리 서로 안 닿게 (이펙트도 다음 줄에 안 닿게)
- 캐릭터 크기 모든 프레임 같게 (키 100~150px 정도면 충분)
- 워터마크(별)는 오른쪽 아래 — 캐릭터랑 안 겹치면 자동으로 지움 (`--wm`)

| 줄 | 동작 | 프레임 |
|---|---|---|
| 1 | 서 있기 (숨쉬기) | 4~6 |
| 2 | 걷기 | 6~8 |
| 3 | 점프 (웅크림·상승·꼭대기·낙하) | 4 |
| 4 | 약공격 (주먹/짧은 베기) | 4~5 |
| 5 | 강공격 (무기 크게 휘두르기) | 5~6 |
| 6 | 공중 공격 | 2~3 |
| 7 | 필살기 — 능력 탄 쏘는 동작 (탄은 손앞에 작게) | 5 |
| 8 | 초필살기 (큰 이펙트) | 6~8 |
| 9 | 맞음 | 3 |
| 10 | 가드 | 1 |
| 11 | 다운 (쓰러져서 바닥에 누움) | 4~6 |
| 12 | 승리 포즈 | 4~6 |

### 프롬프트 (영어가 잘 먹힘, [ ] 부분만 바꾸기)

```
Pixel art sprite sheet for a 2D platform fighting game, high quality anime style,
original character: [CHARACTER].
Flat solid background color #46415A, no gradient, no grid, no text, no labels.
The character faces RIGHT in every frame. Same character size in every frame.
Exactly 12 horizontal rows, one animation per row, frames evenly spaced left to right,
at least 24px empty gap between frames and between rows, nothing overlaps.
Row 1: idle breathing (5 frames)
Row 2: walk cycle (6 frames)
Row 3: jump - crouch, rise, apex, fall (4 frames)
Row 4: quick light attack (5 frames)
Row 5: heavy attack swinging [WEAPON] (5 frames)
Row 6: jumping attack in mid-air (3 frames)
Row 7: casting [ABILITY] projectile from the hand (5 frames)
Row 8: super special move with big [ABILITY] effect (8 frames)
Row 9: getting hit (3 frames)
Row 10: guard pose (1 frame)
Row 11: knocked down, falling to lying on the ground (5 frames)
Row 12: victory pose (5 frames)
```

### 캐릭터 설정 (학원 능력자 배틀, 오리지널)
- **하루** — 검도부 · 불꽃
  `[CHARACTER]` = `high school girl, red long ponytail, navy sailor school uniform with red scarf, kendo club ace, fire ability user, confident`
  `[WEAPON]` = `a wooden kendo sword (bokken) wreathed in flames` / `[ABILITY]` = `fire`
- **렌** — 야구부 · 번개
  `[CHARACTER]` = `high school boy, spiky blond hair, black gakuran school uniform open jacket, baseball club cleanup hitter, lightning ability user, cocky grin`
  `[WEAPON]` = `a metal baseball bat crackling with electricity` / `[ABILITY]` = `lightning (an electrified baseball)`
- **미오** — 학생회 · 물과 바람 (예시 시트로 이미 들어가 있음)

### 넣기
```
python3 scripts/import-fight-sheet.py 받은그림.png haru
python3 scripts/import-fight-sheet.py 받은그림.png ren --wm 840,930,905,1000
```
→ `public/fight/<id>.webp/.json` 생성. 줄이 12개로 안 잡히면 에러 — 붙은 줄은 `--split y`로 자름.
배치가 다른 시트는 `PRESETS`에 줄·프레임을 직접 적음 (미오가 그 예).

## 맵 배경

### 규칙
- 16:9 한 장 (1920×1080 정도)
- 발판 배치 가이드 그림(`scripts/fight-map-guides.py`로 생성)을 참고 이미지로 같이 넣기
  - 베이지 막대 = 떠 있는 발판(밑에서 뚫고 올라감), 갈색 덩어리 = 바닥
  - 빨간 상자 = 캐릭터 키 (크기 감 잡기용, 그리지 말 것)

### 프롬프트
```
2D side-view platform fighting game stage background, 16:9, high quality anime
background art, painterly, detailed, atmospheric lighting.
Scene: [SCENE].
Use the attached layout image: beige bars are floating platforms and brown blocks are
solid ground. Paint them as [PLATFORM OBJECTS] at exactly the same positions and sizes.
Do not add other platforms. No characters, no text, no UI.
```
- **운동장** — `school sports ground at sunset, cherry blossom trees, school building and clock tower` / `metal bleachers and banner trusses`
- **체육관** — `school gymnasium interior, afternoon light through high windows, red stage curtain` / `wooden stage, steel catwalks, basketball backboards`
- **옥상** — `school rooftop at night in a futuristic academy city, neon skyline, full moon, a gap between two buildings` / `rooftop floors, water tank, AC unit, neon signboards`
- **공중 교정** — `pieces of a school campus floating in a bright sky above a sea of clouds after an ability explosion` / `floating rock islands with broken courtyard tiles and grass`

### 넣기
```
python3 scripts/import-fight-bg.py 받은그림.png roof
```
→ `public/fight/bg/roof.webp`. `src/lib/fight/maps.ts` 해당 맵에 `bg`, `bgPlats: true` 넣고
발판 좌표를 그림에 맞춰 조금씩 옮김.
