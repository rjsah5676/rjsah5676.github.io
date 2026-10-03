"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Faded from "@/components/Faded";
import tmImg1 from "@/img/melongame/tm1.png";
import tmImg2 from "@/img/melongame/tm2.png";
import tmImg3 from "@/img/melongame/tm3.png";
import tmImg4 from "@/img/melongame/tm4.png";
import tmImg5 from "@/img/melongame/tm5.png";
import tmImg6 from "@/img/melongame/tm6.png";
import tmImg7 from "@/img/melongame/tm7.png";
import tmImg8 from "@/img/melongame/tm8.png";
import tmImg9 from "@/img/melongame/tm9.png";
import tmImg_score from "@/img/melongame/tm_score.png";
import tmT from "@/img/melongame/tm_t.png";
import tmMain from "@/img/melongame/mainMelon.png";
import bbyong_sound from "@/sounds/melongame/bbyong.mp3";
import bsbgm from "@/sounds/melongame/bgm.mp3";
import endbgm from "@/sounds/melongame/endbgm.mp3";
import { getTopMelonScores, addMelonScore } from "@/firestore/melonGame";
import "@/css/Page/melon.css";

// 이 게임은 캔버스를 직접 그리는 명령형 코드라 React state가 아니라
// 모듈 스코프 변수로 상태를 들고 있음(원본 클래스 컴포넌트도 마찬가지였음).
// 단, new Image()/new Audio()는 브라우저 API라서 선언만 여기 두고
// 실제 생성은 컴포넌트의 useEffect(마운트, 클라이언트 전용) 안에서 함.
let gameFlag = false;
let userName = "익명";

let img_1: HTMLImageElement, img_2: HTMLImageElement, img_3: HTMLImageElement;
let img_4: HTMLImageElement, img_5: HTMLImageElement, img_6: HTMLImageElement;
let img_7: HTMLImageElement, img_8: HTMLImageElement, img_9: HTMLImageElement;
let img_score: HTMLImageElement;
let main_melon: HTMLImageElement;
let imgFlag = [false, false, false, false, false, false, false, false, false];

let bbyong: HTMLAudioElement | undefined;
let bgm: HTMLAudioElement | undefined;
let end_bgm: HTMLAudioElement | undefined;
const c_width = 1030;

let time = 130;
let cnt = 0;
let tenth_rank = 0;

let ct = 1;

let startButton: HTMLElement;
let exitButton: HTMLElement;
let exitButton2: HTMLElement;

let canvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D;
let hiddenCanvas: HTMLCanvasElement;
let hiddenContext: CanvasRenderingContext2D;
let backCanvas: HTMLCanvasElement;
let backContext: CanvasRenderingContext2D;

let rankBox: HTMLElement;

let timerId: ReturnType<typeof setTimeout> | null = null;

// 페이지 이동(언마운트) 시 게임 루프/bgm 정리.
// bgm이 모듈 스코프라 컴포넌트가 사라져도 계속 재생되던 문제 수정.
function stopMelonGame() {
  gameFlag = false;
  if (timerId) clearTimeout(timerId);
  timerId = null;
  [bgm, end_bgm].forEach((a) => {
    if (!a) return;
    a.pause();
    a.currentTime = 0;
  });
}

// 화면이 1030px보다 좁으면 게임 영역을 transform: scale로 줄여서 보여줌.
// 포인터 좌표는 offsetX 대신 캔버스의 실제 표시 크기(getBoundingClientRect) 기준으로
// 1030 좌표계로 환산 -> 축소 배율과 무관하게 항상 정확함.
function toCanvasPoint(cv: HTMLCanvasElement, e: MouseEvent) {
  const rect = cv.getBoundingClientRect();
  const k = c_width / rect.width;
  return { x: (e.clientX - rect.left) * k, y: (e.clientY - rect.top) * k };
}

function drawMainMenuMelons() {
  let dx = 500;
  let dy = 300;
  for (let i = 0; i < 8; i++) {
    const randImg = Math.trunc(Math.random() * 9) + 1;
    const tf = Math.trunc(Math.random() * 9) + 1;
    if (i === 4) {
      dy += 100;
      dx = 500;
    }
    if (tf >= 2) {
      if (randImg === 1) backContext.drawImage(img_1, dx, dy, 100, 100);
      else if (randImg === 2) backContext.drawImage(img_2, dx, dy, 100, 100);
      else if (randImg === 3) backContext.drawImage(img_3, dx, dy, 100, 100);
      else if (randImg === 4) backContext.drawImage(img_4, dx, dy, 100, 100);
      else if (randImg === 5) backContext.drawImage(img_5, dx, dy, 100, 100);
      else if (randImg === 6) backContext.drawImage(img_6, dx, dy, 100, 100);
      else if (randImg === 7) backContext.drawImage(img_7, dx, dy, 100, 100);
      else if (randImg === 8) backContext.drawImage(img_8, dx, dy, 100, 100);
      else backContext.drawImage(img_9, dx, dy, 100, 100);
    }
    dx += 100;
  }
  context.drawImage(main_melon, 100, 100, 350, 350);
}

function drawMainMenuBackground() {
  backContext.fillStyle = "#E6FFFF";
  backContext.fillRect(60, 60, 910, 580);
  backContext.fillRect(995, 160, 10, 481);
  backContext.fillStyle = "#86E57F";
  backContext.font = "120px Jua, sans-serif";
  backContext.textAlign = "center";
  backContext.fillText("멜론 게임", 700, 250, 600);
}

function goHome() {
  gameFlag = false;
  exitButton2.style.display = "none";
  exitButton.style.display = "none";
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  backContext.clearRect(0, 0, context.canvas.width, context.canvas.height);
  startButton.style.display = "block";
  drawMainMenuBackground();
  drawMainMenuMelons();
}

function test2() {
  gameFlag = false;
}

function test() {
  for (let i = 0; i < 9; i++) if (!imgFlag[i]) return;
  gameFlag = true;
  startButton.style.display = "none";
  exitButton.style.display = "block";
  cnt = 0;
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  backContext.clearRect(0, 0, context.canvas.width, context.canvas.height);
  backContext.fillStyle = "#E6FFFF";
  backContext.fillRect(60, 60, 910, 580);
  backContext.fillStyle = "white";
  backContext.font = "bold 20px Arial, sans-serif";
  backContext.textAlign = "center";
  backContext.fillText(String(cnt), 999, 100, 30);
  backContext.fillStyle = "#E6FFFF";
  backContext.fillRect(995, 160, 10, 481);
  bgm?.play();
  time = 130;
  const exiter = document.getElementById("exit")!;
  exiter.innerText = "go";
  const melon_info: number[][] = new Array(40);
  for (let i = 0; i < 40; i++) {
    melon_info[i] = new Array(30);
  }
  let melon_first: number;
  for (let p = 0; p < 40; p++)
    for (let q = 0; q < 30; q++) {
      if (p < 21 && q < 12) {
        melon_info[p][q] = Math.trunc(Math.random() * 9) + 1;
        melon_first = melon_info[p][q];
        if (melon_first === 1) {
          hiddenContext.drawImage(img_1, 100 + 40 * p, 100 + q * 40, 40, 40);
        } else if (melon_first === 2) {
          hiddenContext.drawImage(img_2, 100 + 40 * p, 100 + q * 40, 40, 40);
        } else if (melon_first === 3) {
          hiddenContext.drawImage(img_3, 100 + 40 * p, 100 + q * 40, 40, 40);
        } else if (melon_first === 4) {
          hiddenContext.drawImage(img_4, 100 + 40 * p, 100 + q * 40, 40, 40);
        } else if (melon_first === 5) {
          hiddenContext.drawImage(img_5, 100 + 40 * p, 100 + q * 40, 40, 40);
        } else if (melon_first === 6) {
          hiddenContext.drawImage(img_6, 100 + 40 * p, 100 + q * 40, 40, 40);
        } else if (melon_first === 7) {
          hiddenContext.drawImage(img_7, 100 + 40 * p, 100 + q * 40, 40, 40);
        } else if (melon_first === 8) {
          hiddenContext.drawImage(img_8, 100 + 40 * p, 100 + q * 40, 40, 40);
        } else {
          hiddenContext.drawImage(img_9, 100 + 40 * p, 100 + q * 40, 40, 40);
        }
      } else {
        melon_info[p][q] = 0;
      }
    }

  context.drawImage(hiddenCanvas, 0, 0);
  x();
  let down_mouse_x = 0;
  let down_mouse_y = 0;
  let up_mouse_x = 0;
  let up_mouse_y = 0;
  let drag = false;
  function timeF() {
    time -= 0.11;
    backContext.fillStyle = "#00D8FF";
    backContext.fillRect(995, 100, 10, 100 + (120 - time) * 3.67);
    if (gameFlag === false) {
      time = -1;
      cnt = 0;
      if (bgm) {
        bgm.currentTime = 0;
        bgm.pause();
      }
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      backContext.clearRect(0, 0, context.canvas.width, context.canvas.height);
      startButton.style.display = "block";
      exitButton.style.display = "none";
      drawMainMenuBackground();
      drawMainMenuMelons();
      return;
    } else if (time < 0) {
      // 종료
      exitButton.style.display = "none";
      exitButton2.style.display = "block";
      backContext.fillStyle = "#00D8FF";
      backContext.fillRect(980, 80, 40, 40);
      if (bgm) {
        bgm.currentTime = 0;
        bgm.pause();
      }
      end_bgm?.play();
      context.fillStyle = "white";
      context.drawImage(img_score, 400, 200, 250, 250);
      context.font = "bold 80px Arial, sans-serif";
      context.textAlign = "center";
      context.fillText(String(cnt), 520, 380, 100);
      if (cnt > tenth_rank) {
        let input = window.prompt(cnt + "점으로 10위안에 랭크되셨습니다. 이름을 입력해주세요.");
        while (input !== null && (input.length < 1 || input.length >= 10)) {
          input = window.prompt("1글자 이상 9글자 이하로 이름을 입력해주세요.");
        }
        if (input !== null) {
          userName = input;
          addMelonScore(userName, cnt);
          userName = "익명";
          rankBox.innerText = "랭킹\n";
          ct = 1;
          getTopMelonScores(10).then((scores) => {
            scores.forEach((data) => {
              rankBox.innerText += ct + "위: " + data.name + " " + data.score + "점\n";
              if (ct === 10) tenth_rank = data.score;
              ct += 1;
            });
          });
        }
      }
      return;
    }
    timerId = setTimeout(timeF, 100);
  }
  const t_img = new Image();
  t_img.src = tmT.src;
  function x() {
    const canvas = document.getElementById("melonCanvas") as HTMLCanvasElement;
    const hiddenCanvas = document.getElementById("hiddenCanvas") as HTMLCanvasElement;
    const context = canvas.getContext("2d")!;
    const hiddenContext = hiddenCanvas.getContext("2d")!;
    // 원래 undefined로 시작 -> 첫 드래그 전엔 루프가 안 돌아야 해서 NaN으로 동일 동작 유지
    let t_sx = NaN;
    let t_sy = NaN;
    let t_ex = NaN;
    let t_ey = NaN;
    timeF();
    let startX = 0,
      startY = 0;
    context.lineWidth = 2;
    context.strokeStyle = "#006cb7";
    // 마우스·터치 공통으로 포인터 이벤트 사용 (모바일 드래그 지원)
    canvas.addEventListener("pointermove", (me: PointerEvent) => mMove(me), false);
    canvas.addEventListener("pointercancel", () => mOut(), false);

    let e_x = NaN;
    let s_x = NaN;
    let e_y = NaN;
    let s_y = NaN;
    function mMove(me: MouseEvent) {
      if (!drag) {
        return;
      }
      const p = toCanvasPoint(canvas, me);
      canvasDraw(p.x, p.y);
      up_mouse_x = p.x - 100;
      up_mouse_y = p.y - 100;
      e_x = Math.max(up_mouse_x, down_mouse_x);
      s_x = Math.min(up_mouse_x, down_mouse_x);
      e_y = Math.max(up_mouse_y, down_mouse_y);
      s_y = Math.min(up_mouse_y, down_mouse_y);

      const ss_x = Math.trunc(s_x / 40),
        ss_y = Math.trunc(s_y / 40);
      const ee_x = Math.trunc(e_x / 40),
        ee_y = Math.trunc(e_y / 40);
      for (let t = ss_x; t <= ee_x; t++) {
        for (let s = ss_y; s <= ee_y; s++) {
          if (t === ss_x && s === ss_y) {
            t_sx = t;
            t_sy = s;
          }
          if (t === ee_x && s === ee_y) {
            t_ex = t;
            t_ey = s;
          }
        }
      }
    }

    function mDown(me: MouseEvent) {
      if (time < 0) return;
      const p = toCanvasPoint(canvas, me);
      startX = p.x;
      startY = p.y;
      drag = true;
    }

    function mUp() {
      if (time < 0) return;
      drag = false;
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      context.drawImage(hiddenCanvas, 0, 0);
    }
    function mOut() {
      if (time < 0) return;
      drag = false;
    }

    function canvasDraw(currentX: number, currentY: number) {
      if (time < 0) return;
      else {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        context.drawImage(hiddenCanvas, 0, 0);
        for (let t = t_sx; t <= t_ex; t++) {
          for (let s = t_sy; s <= t_ey; s++) {
            if (t >= 0 && s >= 0 && t <= 20 && s <= 11)
              if (melon_info[t][s] !== 0)
                context.drawImage(t_img, 140 + (t - 1) * 40, 100 + s * 40, 40, 40);
          }
        }
        context.strokeRect(startX, startY, currentX - startX, currentY - startY);
        context.fillStyle = "yellow";
        context.globalAlpha = 0.3;
        context.fillRect(startX, startY, currentX - startX, currentY - startY);
        context.globalAlpha = 1;
      }
    }
    canvas.onpointerdown = (e) => {
      if (time < 0) return;
      else {
        // 손가락이 캔버스 밖으로 나가도 move/up을 계속 받도록
        canvas.setPointerCapture(e.pointerId);
        mDown(e);
        const p = toCanvasPoint(canvas, e);
        down_mouse_x = p.x - 100;
        down_mouse_y = p.y - 100;
      }
    };
    canvas.onpointerup = () => {
      if (time < 0) return;
      else {
        mUp();
        let sum = 0;
        for (let i = Math.trunc(s_x / 40); i <= Math.trunc(e_x / 40); i++) {
          for (let j = Math.trunc(s_y / 40); j <= Math.trunc(e_y / 40); j++) {
            if (i >= 0 && j >= 0 && i <= 20 && j <= 11) sum += melon_info[i][j];
          }
        }
        if (sum === 10 || sum === 20) {
          const ss_x = Math.trunc(s_x / 40),
            ss_y = Math.trunc(s_y / 40);
          const ee_x = Math.trunc(e_x / 40),
            ee_y = Math.trunc(e_y / 40);
          for (let t = ss_x; t <= ee_x; t++) {
            for (let s = ss_y; s <= ee_y; s++) {
              if (t >= 0 && s >= 0 && t <= 20 && s <= 11 && melon_info[t][s] !== 0) {
                cnt++;
                melon_info[t][s] = 0;
              }
              if (t === ss_x && s === ss_y) bbyong?.play();
            }
          }
          backContext.fillStyle = "#00D8FF";
          backContext.fillRect(980, 80, 40, 40);
          backContext.fillStyle = "white";
          backContext.font = "bold 20px Arial, sans-serif";
          backContext.textAlign = "center";
          backContext.fillText(String(cnt), 999, 100, 30);
          context.clearRect(
            140 + (ss_x - 1) * 40,
            100 + ss_y * 40,
            (ee_x - ss_x + 1) * 40,
            (ee_y - ss_y + 1) * 40
          );
          hiddenContext.clearRect(0, 0, hiddenContext.canvas.width, hiddenContext.canvas.height);
          hiddenContext.drawImage(canvas, 0, 0);
        }
      }
    };
  }
}

export default function MelonGamePage() {
  const initialized = useRef(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  // 최초 진입 때 한 번만 게임 영역 배율을 정하고 유지 (회전·리사이즈에도 그대로).
  // window.innerWidth는 1030px 캔버스가 먼저 그려지면 모바일에서 레이아웃 폭이 같이
  // 넓어져 버려서(→ 거의 원본 크기로 보이던 원인) overflow:hidden 컨테이너의 폭을 잰다.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const cs = getComputedStyle(el);
    const w = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    // 마운트 시 1회 측정
    setScale(Math.min(1, w / c_width));
  }, []);
  const s = scale ?? 1;

  // 가드(initialized) 있는 init effect에 cleanup을 달면 StrictMode 두 번째 마운트에서
  // early return 되면서 cleanup이 등록 안 됨 -> 별도 effect로 분리
  useEffect(() => stopMelonGame, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // new Image()/new Audio()는 브라우저 API라 정적 export 빌드(Node) 중에
    // 실행되면 크래시남 -> 여기(마운트, 클라이언트 전용)에서만 생성.
    img_1 = new Image();
    img_2 = new Image();
    img_3 = new Image();
    img_4 = new Image();
    img_5 = new Image();
    img_6 = new Image();
    img_7 = new Image();
    img_8 = new Image();
    img_9 = new Image();
    img_score = new Image();

    img_1.src = tmImg1.src;
    img_2.src = tmImg2.src;
    img_3.src = tmImg3.src;
    img_4.src = tmImg4.src;
    img_5.src = tmImg5.src;
    img_6.src = tmImg6.src;
    img_7.src = tmImg7.src;
    img_8.src = tmImg8.src;
    img_9.src = tmImg9.src;
    img_score.src = tmImg_score.src;

    img_1.onload = () => (imgFlag[0] = true);
    img_2.onload = () => (imgFlag[1] = true);
    img_3.onload = () => (imgFlag[2] = true);
    img_4.onload = () => (imgFlag[3] = true);
    img_5.onload = () => (imgFlag[4] = true);
    img_6.onload = () => (imgFlag[5] = true);
    img_7.onload = () => (imgFlag[6] = true);
    img_8.onload = () => (imgFlag[7] = true);
    img_9.onload = () => (imgFlag[8] = true);

    bbyong = new Audio(bbyong_sound);
    bgm = new Audio(bsbgm);
    end_bgm = new Audio(endbgm);
    end_bgm.loop = false;
    bgm.loop = true;
    bgm.volume = 0.7;
    bbyong.volume = 0.5;

    startButton = document.getElementById("startButton")!;
    exitButton = document.getElementById("exitButton")!;
    exitButton2 = document.getElementById("exitButton2")!;

    backCanvas = document.getElementById("backCanvas") as HTMLCanvasElement;
    backContext = backCanvas.getContext("2d")!;
    canvas = document.getElementById("melonCanvas") as HTMLCanvasElement;
    hiddenCanvas = document.getElementById("hiddenCanvas") as HTMLCanvasElement;
    hiddenCanvas.width = c_width;
    hiddenCanvas.height = 700;
    canvas.width = c_width;
    canvas.height = 700;
    backCanvas.width = c_width;
    backCanvas.height = 700;
    context = canvas.getContext("2d")!;
    hiddenContext = hiddenCanvas.getContext("2d")!;
    drawMainMenuBackground();

    main_melon = new Image();
    main_melon.src = tmMain.src;
    main_melon.onload = () => drawMainMenuMelons();

    rankBox = document.getElementById("rankBox")!;
    ct = 1;
    getTopMelonScores(10).then((scores) => {
      scores.forEach((data) => {
        // 이름은 사용자 입력이라 innerHTML로 넣으면 저장형 XSS -> textContent로 삽입
        const row = document.createElement("div");
        row.id = "rank-info";
        row.textContent = ct + "위: " + data.name + " " + data.score + "점";
        rankBox.appendChild(row);
        if (ct === 10) tenth_rank = data.score;
        ct += 1;
      });
    });
  }, []);

  const canvasStyle: CSSProperties = {
    width: "1030px",
    height: "700px",
    borderRadius: "30px",
    position: "absolute",
    zIndex: "2",
    backgroundColor: "transparent",
    touchAction: "none", // 캔버스 위 드래그 중 페이지 스크롤 방지
  };
  const hiddenCanvasStyle: CSSProperties = {
    width: "1030px",
    height: "700px",
    display: "none",
    borderRadius: "30px",
    position: "absolute",
  };
  const backCanvasStyle: CSSProperties = {
    width: "1030px",
    height: "700px",
    borderRadius: "30px",
    zIndex: "1",
    backgroundColor: "#00D8FF",
    position: "absolute",
  };
  const startButtonStyle: CSSProperties = {
    position: "absolute",
    zIndex: "2",
    marginTop: "480px",
    marginLeft: "190px",
    width: "200px",
    height: "60px",
    border: "2px solid #86E57F",
    cursor: "pointer",
    fontSize: "35px",
    fontFamily: "Jua, sans-serif",
    lineHeight: "65px",
    backgroundColor: "#98F791",
    color: "#E0FFDB",
    borderRadius: "10px",
  };
  const exitButtonStyle: CSSProperties = {
    display: "none",
    position: "absolute",
    zIndex: "2",
    marginTop: "655px",
    marginLeft: "130px",
    width: "100px",
    height: "30px",
    cursor: "pointer",
    fontSize: "18px",
    fontFamily: "Jua, sans-serif",
    lineHeight: "28px",
    backgroundColor: "#5CD1E5",
    color: "#D4F4FA",
    borderRadius: "10px",
    border: "2px solid #D4F4FA",
  };
  const exitButtonStyle2: CSSProperties = {
    display: "none",
    position: "absolute",
    zIndex: "2",
    marginTop: "455px",
    marginLeft: "420px",
    width: "200px",
    height: "60px",
    cursor: "pointer",
    border: "2px solid #E0FFDB",
    fontSize: "30px",
    fontFamily: "Jua, sans-serif",
    lineHeight: "60px",
    backgroundColor: "#9DD327",
    color: "#E0FFDB",
    borderRadius: "10px",
  };

  return (
    <Faded>
      <div className="mx-auto mt-10 w-full max-w-[1030px] px-4 lg:px-0">
        <div id="melon-container">
          <div id="rankBox">
            <div id="rank-title">랭킹</div>
          </div>
          <div id="melon-box">
            <div id="melon-title">
              드래그하여 합이 10또는 20이 되도록 하면됩니다.
              <br />
            </div>
            <div id="melon-text">
              개발: lee gm / 디자인: tae hb / 음악: lee sh
              <br />
              게임실행에 문제가 있는경우 새로고침 후 시작을 눌러주세요
              <br />
              시간은 2분이 주어지며 종료시 스코어가 나옵니다.
              <br />
              랭킹 10위 안에드는 점수를 받을 시 랭킹 등록 창이 나옵니다.
              <br />
            </div>
            <br />
            <div id="exit" style={{ display: "none" }}>
              go
            </div>
          </div>
        </div>
        <p className="mb-3 text-center font-mono text-xs text-white/30 lg:hidden">
          화면 폭에 맞춰 게임 화면이 축소됩니다 · 손가락으로 드래그해서 플레이
        </p>
      </div>
      {/* 게임 영역: 1030x700 원본 좌표계를 그대로 두고 통째로 축소 */}
      <div
        ref={stageRef}
        className="mx-auto mb-24 w-full max-w-[1030px] overflow-hidden px-4 lg:px-0"
        style={{ height: `${700 * s}px` }}
      >
        <div
          id="melon-wrap"
          className="select-none"
          style={{
            transform: `scale(${s})`,
            transformOrigin: "top left",
            visibility: scale === null ? "hidden" : "visible",
          }}
        >
          <canvas style={canvasStyle} id="melonCanvas"></canvas>
          <canvas style={hiddenCanvasStyle} id="hiddenCanvas"></canvas>
          <canvas style={backCanvasStyle} id="backCanvas"></canvas>
          <button style={startButtonStyle} id="startButton" onClick={test}>
            시작하기
          </button>
          <button id="exitButton" style={exitButtonStyle} onClick={test2}>
            홈으로
          </button>
          <button id="exitButton2" style={exitButtonStyle2} onClick={goHome}>
            홈으로
          </button>
        </div>
      </div>
    </Faded>
  );
}
