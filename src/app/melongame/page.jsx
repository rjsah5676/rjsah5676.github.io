"use client";

import { useEffect, useRef } from "react";
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

let img_1, img_2, img_3, img_4, img_5, img_6, img_7, img_8, img_9, img_score;
let main_melon;
let imgFlag = [false, false, false, false, false, false, false, false, false];

let stX, stY, endX, endY;

let bbyong, bgm, end_bgm;
const c_width = 1030;

let time = 130;
let cnt = 0;
let tenth_rank = 0;

let ct = 1;

let startButton;
let exitButton;
let exitButton2;

let canvas;
let context;
let hiddenCanvas;
let hiddenContext;
let backCanvas;
let backContext;

let rankBox;

function drawMainMenuMelons() {
  let dx = 500;
  let dy = 300;
  for (let i = 0; i < 8; i++) {
    const randImg = parseInt(Math.random() * 9) + 1;
    const tf = parseInt(Math.random() * 9) + 1;
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
  backContext.fillText(cnt, 999, 100, 30);
  backContext.fillStyle = "#E6FFFF";
  backContext.fillRect(995, 160, 10, 481);
  bgm.play();
  time = 130;
  const exiter = document.getElementById("exit");
  exiter.innerText = "go";
  const melon_info = new Array(40);
  for (let i = 0; i < 40; i++) {
    melon_info[i] = new Array(30);
  }
  let melon_first;
  for (let p = 0; p < 40; p++)
    for (let q = 0; q < 30; q++) {
      if (p < 21 && q < 12) {
        melon_info[p][q] = parseInt(Math.random() * 9) + 1;
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
      bgm.currentTime = 0;
      bgm.pause();
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
      bgm.currentTime = 0;
      bgm.pause();
      end_bgm.play();
      context.fillStyle = "white";
      context.drawImage(img_score, 400, 200, 250, 250);
      context.font = "bold 80px Arial, sans-serif";
      context.textAlign = "center";
      context.fillText(cnt, 520, 380, 100);
      if (cnt > tenth_rank) {
        userName = window.prompt(cnt + "점으로 10위안에 랭크되셨습니다. 이름을 입력해주세요.");
        if (userName !== null) {
          while (userName >= 10 || userName < 1) {
            userName = window.prompt("1글자 이상 9글자 이하로 이름을 입력해주세요.");
          }
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
    setTimeout(timeF, 100);
  }
  const t_img = new Image();
  t_img.src = tmT.src;
  function x() {
    const canvas = document.getElementById("melonCanvas");
    const hiddenCanvas = document.getElementById("hiddenCanvas");
    const context = canvas.getContext("2d");
    const hiddenContext = hiddenCanvas.getContext("2d");
    let t_sx;
    let t_sy;
    let t_ex;
    let t_ey;
    timeF();
    let startX, startY;
    context.lineWidth = 2;
    context.strokeStyle = "#006cb7";
    canvas.addEventListener(
      "mousemove",
      function (me) {
        mMove(me);
      },
      false
    );
    canvas.addEventListener(
      "mouseout",
      function (me) {
        mOut(me);
      },
      false
    );

    let e_x;
    let s_x;
    let e_y;
    let s_y;
    function mMove(me) {
      if (!drag) {
        return;
      }
      const nowX = me.offsetX;
      const nowY = me.offsetY;
      canvasDraw(nowX, nowY);
      stX = nowX;
      stY = nowY;
      const rect = canvas.getBoundingClientRect();
      up_mouse_x = me.clientX - rect.left - 100;
      up_mouse_y = me.clientY - rect.top - 100;
      e_x = Math.max(up_mouse_x, down_mouse_x);
      s_x = Math.min(up_mouse_x, down_mouse_x);
      e_y = Math.max(up_mouse_y, down_mouse_y);
      s_y = Math.min(up_mouse_y, down_mouse_y);

      const ss_x = parseInt(s_x / 40),
        ss_y = parseInt(s_y / 40);
      const ee_x = parseInt(e_x / 40),
        ee_y = parseInt(e_y / 40);
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

    function mDown(me) {
      if (time < 0) return;
      startX = me.offsetX;
      startY = me.offsetY;
      stX = me.offsetX;
      stY = me.offsetY;
      drag = true;
    }

    function mUp(me) {
      if (time < 0) return;
      endX = me.offsetX;
      endY = me.offsetY;
      drag = false;
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      context.drawImage(hiddenCanvas, 0, 0);
    }
    function mOut(me) {
      if (time < 0) return;
      drag = false;
    }

    function canvasDraw(currentX, currentY) {
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
        context.globalAlpha = "0.3";
        context.fillRect(startX, startY, currentX - startX, currentY - startY);
        context.globalAlpha = "1";
      }
    }
    canvas.onmousedown = (e) => {
      if (time < 0) return;
      else {
        mDown(e);
        const rect = canvas.getBoundingClientRect();
        down_mouse_x = e.clientX - rect.left - 100;
        down_mouse_y = e.clientY - rect.top - 100;
      }
    };
    canvas.onmouseup = (e) => {
      if (time < 0) return;
      else {
        mUp(e);
        let sum = 0;
        for (let i = parseInt(s_x / 40); i <= parseInt(e_x / 40); i++) {
          for (let j = parseInt(s_y / 40); j <= parseInt(e_y / 40); j++) {
            if (i >= 0 && j >= 0 && i <= 20 && j <= 11) sum += melon_info[i][j];
          }
        }
        if (sum === 10 || sum === 20) {
          const ss_x = parseInt(s_x / 40),
            ss_y = parseInt(s_y / 40);
          const ee_x = parseInt(e_x / 40),
            ee_y = parseInt(e_y / 40);
          for (let t = ss_x; t <= ee_x; t++) {
            for (let s = ss_y; s <= ee_y; s++) {
              if (t >= 0 && s >= 0 && t <= 20 && s <= 11 && melon_info[t][s] !== 0) {
                cnt++;
                melon_info[t][s] = 0;
              }
              if (t === ss_x && s === ss_y) bbyong.play();
            }
          }
          backContext.fillStyle = "#00D8FF";
          backContext.fillRect(980, 80, 40, 40);
          backContext.fillStyle = "white";
          backContext.font = "bold 20px Arial, sans-serif";
          backContext.textAlign = "center";
          backContext.fillText(cnt, 999, 100, 30);
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

    startButton = document.getElementById("startButton");
    exitButton = document.getElementById("exitButton");
    exitButton2 = document.getElementById("exitButton2");

    backCanvas = document.getElementById("backCanvas");
    backContext = backCanvas.getContext("2d");
    canvas = document.getElementById("melonCanvas");
    hiddenCanvas = document.getElementById("hiddenCanvas");
    hiddenCanvas.width = c_width;
    hiddenCanvas.height = 700;
    canvas.width = c_width;
    canvas.height = 700;
    backCanvas.width = c_width;
    backCanvas.height = 700;
    context = canvas.getContext("2d");
    hiddenContext = hiddenCanvas.getContext("2d");
    drawMainMenuBackground();

    main_melon = new Image();
    main_melon.src = tmMain.src;
    main_melon.onload = () => drawMainMenuMelons();

    rankBox = document.getElementById("rankBox");
    ct = 1;
    getTopMelonScores(10).then((scores) => {
      scores.forEach((data) => {
        rankBox.innerHTML +=
          "<div id='rank-info'>" + ct + "위: " + data.name + " " + data.score + "점</div>";
        if (ct === 10) tenth_rank = data.score;
        ct += 1;
      });
    });
  }, []);

  const canvasStyle = {
    width: "1030px",
    height: "700px",
    borderRadius: "30px",
    position: "absolute",
    zIndex: "2",
    backgroundColor: "transparent",
  };
  const hiddenCanvasStyle = {
    width: "1030px",
    height: "700px",
    display: "none",
    borderRadius: "30px",
    position: "absolute",
  };
  const backCanvasStyle = {
    width: "1030px",
    height: "700px",
    borderRadius: "30px",
    zIndex: "1",
    backgroundColor: "#00D8FF",
    position: "absolute",
  };
  const startButtonStyle = {
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
  const exitButtonStyle = {
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
  const exitButtonStyle2 = {
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
      <div id="blocking"></div>
      <div id="melon-wrap">
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
    </Faded>
  );
}
