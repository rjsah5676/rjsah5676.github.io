import React, { Component} from "react";
import FadeIn from "../../effect/FadeIn";
import tmImg1 from '../../img/melongame/tm1.png';
import tmImg2 from '../../img/melongame/tm2.png';
import tmImg3 from '../../img/melongame/tm3.png';
import tmImg4 from '../../img/melongame/tm4.png';
import tmImg5 from '../../img/melongame/tm5.png';
import tmImg6 from '../../img/melongame/tm6.png';
import tmImg7 from '../../img/melongame/tm7.png';
import tmImg8 from '../../img/melongame/tm8.png';
import tmImg9 from '../../img/melongame/tm9.png';
import tmImg_score from '../../img/melongame/tm_score.png';
import tmT from '../../img/melongame/tm_t.png';
import tmMain from '../../img/melongame/mainMelon.png';
import bbyong_sound from '../../sounds/melongame/bbyong.mp3';
import bsbgm from '../../sounds/melongame/bgm.mp3';
import endbgm from '../../sounds/melongame/endbgm.mp3';
import firebase from "../../firebase";
import Faded from "../../effect/Faded";

var gameFlag = false;
var userName = "익명";

var img_1 = new Image();
var img_2 = new Image();
var img_3 = new Image();
var img_4 = new Image();
var img_5 = new Image();
var img_6 = new Image();
var img_7 = new Image();
var img_8 = new Image();
var img_9 = new Image();
var img_score = new Image();
var main_melon;

img_1.src=tmImg1;
img_2.src=tmImg2;
img_3.src=tmImg3;
img_4.src=tmImg4;
img_5.src=tmImg5;
img_6.src=tmImg6;
img_7.src=tmImg7;
img_8.src=tmImg8;
img_9.src=tmImg9;
img_score.src=tmImg_score;
var imgFlag = [false,false,false,false,false,false,false,false,false];
img_1.onload = function(){
  imgFlag[0]=true;
}
img_2.onload = function(){
  imgFlag[1]=true;
}
img_3.onload = function(){
  imgFlag[2]=true;
}
img_4.onload = function(){
  imgFlag[3]=true;
}
img_5.onload = function(){
  imgFlag[4]=true;
}
img_6.onload = function(){
  imgFlag[5]=true;
}
img_7.onload = function(){
  imgFlag[6]=true;
}
img_8.onload = function(){
  imgFlag[7]=true;
}
img_9.onload = function(){
  imgFlag[8]=true;
}

var stX,stY,endX,endY;

var bbyong = new Audio(bbyong_sound);
var bgm = new Audio(bsbgm);
var end_bgm = new Audio(endbgm);
end_bgm.loop=false;
bgm.loop=true;
bgm.volume=0.7;
bbyong.volume=0.5;
var c_width = 1030;

var time=130;
var cnt=0;
var tenth_rank=0;

var ct=1;

var startButton;
var exitButton;
var exitButton2;

var canvas;
var context;
var hiddenCanvas;
var hiddenContext;
var backCanvas;
var backContext;

var rankBox;

const db = firebase.firestore();
//db.collection("myName").add({name:"이석호"}); 
class melongame extends Component {
  componentDidMount() {
    startButton=document.getElementById('startButton');
    exitButton=document.getElementById('exitButton');
    exitButton2=document.getElementById('exitButton2');

    backCanvas = document.getElementById('backCanvas');
    backContext = backCanvas.getContext("2d");
    canvas = document.getElementById('melonCanvas');
    hiddenCanvas = document.getElementById('hiddenCanvas');
    hiddenCanvas.width=c_width;
    hiddenCanvas.height=700;
    canvas.width=c_width;
    canvas.height=700;
    backCanvas.width=c_width;
    backCanvas.height=700;
    context = canvas.getContext("2d");
    hiddenContext = hiddenCanvas.getContext("2d");
    backContext.fillStyle="#E6FFFF";
    backContext.fillRect(60,60,910,580);
    backContext.fillRect(995,160,10,481);
    backContext.fillStyle="#86E57F";
    backContext.font="120px Jua, sans-serif";
    backContext.textAlign="center";
    backContext.fillText("멜론 게임", 700, 250, 600);
    var dx=500;
    var dy=300;
    main_melon=new Image();
    main_melon.src=tmMain;
    main_melon.onload = function() {
      for(var i=0; i<8;i++) {
        var randImg = parseInt(Math.random()*9)+1;
        var tf = parseInt(Math.random()*9)+1;
        if(i===4) {dy += 100;dx=500;}
        if(tf>=2) {
          if(randImg === 1) backContext.drawImage(img_1 ,dx, dy, 100, 100);
          else if(randImg === 2) backContext.drawImage(img_2 ,dx, dy, 100, 100);
          else if(randImg === 3) backContext.drawImage(img_3 ,dx, dy, 100, 100);
          else if(randImg === 4) backContext.drawImage(img_4 ,dx, dy, 100, 100);
          else if(randImg === 5) backContext.drawImage(img_5 ,dx, dy, 100, 100);
          else if(randImg === 6) backContext.drawImage(img_6 ,dx, dy, 100, 100);
          else if(randImg === 7) backContext.drawImage(img_7 ,dx, dy, 100, 100);
          else if(randImg === 8) backContext.drawImage(img_8 ,dx, dy, 100, 100);
          else backContext.drawImage(img_9 ,dx, dy, 100, 100);
        }
        dx+=100;
      }
      context.drawImage(main_melon,100,100,350,350);
    }
    rankBox = document.getElementById('rankBox');
    ct = 1;
    db.collection("score").orderBy("score",'desc').limit(10).get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        rankBox.innerHTML += "<div id='rank-info'>"+ct+"위: "+doc.data().name+" "+doc.data().score+"점</div>";
        if(ct===10) tenth_rank=doc.data().score; 
        ct+=1;
      });
    });
  }
  goHome()
  {
    gameFlag=false;
    exitButton2.style.display = 'none';
    exitButton.style.display = 'none';
    context.clearRect(0,0,context.canvas.width,context.canvas.height);
    backContext.clearRect(0,0,context.canvas.width,context.canvas.height);
    startButton.style.display = 'block';
    backContext.fillStyle="#E6FFFF";
    backContext.fillRect(60,60,910,580);
    backContext.fillRect(995,160,10,481);
    backContext.fillStyle="#86E57F";
    backContext.font="120px Jua, sans-serif";
    backContext.textAlign="center";
    backContext.fillText("멜론 게임", 700, 250, 600);
    var dx=500;
    var dy=300;
    for(var i=0; i<8;i++) {
      var randImg = parseInt(Math.random()*9)+1;
      var tf = parseInt(Math.random()*9)+1;
      if(i===4) {dy += 100;dx=500;}
      if(tf>=2) {
        if(randImg === 1) backContext.drawImage(img_1 ,dx, dy, 100, 100);
        else if(randImg === 2) backContext.drawImage(img_2 ,dx, dy, 100, 100);
        else if(randImg === 3) backContext.drawImage(img_3 ,dx, dy, 100, 100);
        else if(randImg === 4) backContext.drawImage(img_4 ,dx, dy, 100, 100);
        else if(randImg === 5) backContext.drawImage(img_5 ,dx, dy, 100, 100);
        else if(randImg === 6) backContext.drawImage(img_6 ,dx, dy, 100, 100);
        else if(randImg === 7) backContext.drawImage(img_7 ,dx, dy, 100, 100);
        else if(randImg === 8) backContext.drawImage(img_8 ,dx, dy, 100, 100);
        else backContext.drawImage(img_9 ,dx, dy, 100, 100);
      }
      dx+=100;
    }
    context.drawImage(main_melon,100,100,350,350);
  }
  test2()
  {
    gameFlag=false;
  }
  test() {
    for(var i=0; i<9;i++) if(!imgFlag[i]) return;
    gameFlag = true;
    startButton.style.display='none';
    exitButton.style.display='block';
    cnt=0;
    context.clearRect(0,0,context.canvas.width,context.canvas.height);
    backContext.clearRect(0,0,context.canvas.width,context.canvas.height);
    backContext.fillStyle="#E6FFFF";
    backContext.fillRect(60,60,910,580);
    backContext.fillStyle="white";
    backContext.font="bold 20px Arial, sans-serif";
    backContext.textAlign="center";
		backContext.fillText(cnt, 999, 100, 30); 
    backContext.fillStyle="#E6FFFF";
    backContext.fillRect(995,160,10,481);
    bgm.play();
    time = 130;
    var exiter=document.getElementById('exit');
    exiter.innerText="go";
    var melon_info=new Array(40);
    for(var i=0;i<40;i++){
      melon_info[i] = new Array(30);
    }
    var melon_first;
    for(var p=0;p<40;p++)
      for(var q=0;q<30;q++) {
		if(p<21 && q<12) {
        melon_info[p][q]=parseInt(Math.random()*9)+1;
        melon_first=melon_info[p][q];
		if(melon_first===1) {hiddenContext.drawImage(img_1 ,100+40*p, 100+q*40, 40, 40);}
		else if(melon_first===2) {hiddenContext.drawImage(img_2 ,100+40*p, 100+q*40, 40, 40);}
		else if(melon_first===3) {hiddenContext.drawImage(img_3 ,100+40*p, 100+q*40, 40, 40);}
		else if(melon_first===4) {hiddenContext.drawImage(img_4 ,100+40*p, 100+q*40, 40, 40);}
		else if(melon_first===5) {hiddenContext.drawImage(img_5 ,100+40*p, 100+q*40, 40, 40);}
		else if(melon_first===6) {hiddenContext.drawImage(img_6 ,100+40*p, 100+q*40, 40, 40);}
		else if(melon_first===7) {hiddenContext.drawImage(img_7 ,100+40*p, 100+q*40, 40, 40);}
		else if(melon_first===8) {hiddenContext.drawImage(img_8 ,100+40*p, 100+q*40, 40, 40);}
		else {hiddenContext.drawImage(img_9 ,100+40*p, 100+q*40, 40, 40);}
		}
		else {
			melon_info[p][q] = 0;
		}
      }
    
	//hiddenContext.clearRect(0,0,140,700);
	context.drawImage(hiddenCanvas,0,0);
	x();
    var down_mouse_x = 0;
    var down_mouse_y = 0;
    var up_mouse_x = 0;
    var up_mouse_y = 0;
    var drag = false;
    function timeF()
    {
        time-=0.11;
        backContext.fillStyle="#00D8FF";
        backContext.fillRect(995,100,10,100+(120-time)*3.67);
        if(gameFlag === false) {
          time = -1;
          cnt = 0;
          bgm.currentTime = 0;
          bgm.pause();
          context.clearRect(0,0,context.canvas.width,context.canvas.height);
          backContext.clearRect(0,0,context.canvas.width,context.canvas.height);
          startButton.style.display = 'block';
          exitButton.style.display = 'none';
          backContext.fillStyle="#E6FFFF";
          backContext.fillRect(60,60,910,580);
          backContext.fillRect(995,160,10,481);
          backContext.fillStyle="#86E57F";
          backContext.font="120px Jua, sans-serif";
          backContext.textAlign="center";
          backContext.fillText("멜론 게임", 700, 250, 600);
          var dx=500;
          var dy=300;
          for(var i=0; i<8;i++) {
            var randImg = parseInt(Math.random()*9)+1;
            var tf = parseInt(Math.random()*9)+1;
            if(i===4) {dy += 100;dx=500;}
            if(tf>=2) {
              if(randImg === 1) backContext.drawImage(img_1 ,dx, dy, 100, 100);
              else if(randImg === 2) backContext.drawImage(img_2 ,dx, dy, 100, 100);
              else if(randImg === 3) backContext.drawImage(img_3 ,dx, dy, 100, 100);
              else if(randImg === 4) backContext.drawImage(img_4 ,dx, dy, 100, 100);
              else if(randImg === 5) backContext.drawImage(img_5 ,dx, dy, 100, 100);
              else if(randImg === 6) backContext.drawImage(img_6 ,dx, dy, 100, 100);
              else if(randImg === 7) backContext.drawImage(img_7 ,dx, dy, 100, 100);
              else if(randImg === 8) backContext.drawImage(img_8 ,dx, dy, 100, 100);
              else backContext.drawImage(img_9 ,dx, dy, 100, 100);
            }
            dx+=100;
          }
          context.drawImage(main_melon,100,100,350,350);
          return;
        }
        else if(time<0) {  //종료
          exitButton.style.display = 'none';
          exitButton2.style.display = 'block';
          backContext.fillStyle="#00D8FF";
            backContext.fillRect(980,80,40,40);
      bgm.currentTime = 0;
      bgm.pause();
      end_bgm.play();
			context.fillStyle="white";
			context.drawImage(img_score,400,200,250,250);
      context.font="bold 80px Arial, sans-serif";
      context.textAlign="center";
			context.fillText(cnt, 520, 380, 100);
      if(cnt > tenth_rank) {
        userName = window.prompt(cnt+"점으로 10위안에 랭크되셨습니다. 이름을 입력해주세요.");
        if(userName !== null) {
          while(userName >= 10 || userName < 1) {
            userName = window.prompt("1글자 이상 9글자 이하로 이름을 입력해주세요.");
          }
          db.collection("score").add({name:userName, score: cnt});
          userName = "익명";
          rankBox.innerText = "랭킹\n";
          ct=1;
          db.collection("score").orderBy("score",'desc').limit(10).get()
          .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
              rankBox.innerText += ct+"위: "+doc.data().name+" "+doc.data().score+"점\n";
              if(ct===10) tenth_rank=doc.data().score; 
              ct+=1;
            });                          // "testcol" 컬렉션내 도큐먼트 조회 후 출력
          });
        }
      }
			return;
		}
      setTimeout(timeF,100);
    }
	var t_img = new Image();
	  t_img.src = tmT;
    function x()
    {
	    var canvas = document.getElementById('melonCanvas');
		var hiddenCanvas = document.getElementById('hiddenCanvas');
		var context = canvas.getContext("2d");
		var hiddenContext = hiddenCanvas.getContext("2d");
	  var t_sx;
	  var t_sy;
	  var t_ex;
	  var t_ey;
    timeF();
    var startX,startY;
    context.lineWidth = 2; // 컨버스에 그리는 라인의 두께 설정
    context.strokeStyle = "#006cb7"
    canvas.addEventListener ( "mousemove" , function (me) {
          mMove (me)}, false );
      canvas.addEventListener ( "mouseout" , function (me) {
          mOut (me)}, false );
		
		var e_x;
		var s_x;
		var e_y;
		var s_y;
        function mMove(me)
        {
            if (!drag)
            {
                return ;
            }
            var nowX = me.offsetX ;
            var nowY = me.offsetY ;
            canvasDraw (nowX,nowY);
            stX = nowX;
            stY = nowY;
			const rect = canvas.getBoundingClientRect();
			up_mouse_x=me.clientX-rect.left-100;
			up_mouse_y=me.clientY-rect.top-100;
			e_x=Math.max(up_mouse_x, down_mouse_x);
			s_x=Math.min(up_mouse_x, down_mouse_x);
			e_y=Math.max(up_mouse_y, down_mouse_y);
			s_y=Math.min(up_mouse_y, down_mouse_y);
			
			var ss_x=parseInt(s_x/40),ss_y=parseInt(s_y/40);
            var ee_x=parseInt(e_x/40),ee_y=parseInt(e_y/40);
            for(var t=ss_x;t<=ee_x;t++) {
              for(var s=ss_y;s<=ee_y;s++) {
				if(t===ss_x && s===ss_y) {
					t_sx=t;
					t_sy=s;
				}
				if(t===ee_x && s===ee_y) {
				t_ex=t;
				t_ey=s;
				}
            }
			}
        }

        function mDown(me)
        {
          if(time<0) return;
            startX = me.offsetX;
            startY = me.offsetY;
            stX = me.offsetX ; //눌렀을 때 현재 마우스 X좌표를 stX에 담음
            stY = me.offsetY ; //눌렀을 때 현재 마우스 Y좌표를 stY에 담음
            drag = true ; //그림 그리기는 그리는 상태로 변경
        }

        function mUp(me)
        {
          if(time<0) return;
            endX = me.offsetX
            endY = me.offsetY
            drag=false;
            context.clearRect(0,0,context.canvas.width,context.canvas.height);
            context.drawImage(hiddenCanvas,0,0);
        }
        function mOut(me)
        {
          if(time<0) return;
            drag = false ; //마우스가 캔버스 밖으로 벗어났을 때 그리기 중지
        }

        function canvasDraw(currentX,currentY)
        {
          if(time<0) return;
          else {
            context.clearRect(0,0,context.canvas.width,context.canvas.height) //설정된 영역만큼 캔버스에서 지움
            context.drawImage(hiddenCanvas,0,0);
			for(var t=t_sx;t<=t_ex;t++) {
              for(var s=t_sy;s<=t_ey;s++) {
			  if(t>=0 && s>=0 && t<=20 && s<=11)
				if(melon_info[t][s]!==0)
					context.drawImage(t_img,140+(t-1)*40,100+s*40, 40,40);
              }
            }
            context.strokeRect(startX,startY,currentX-startX,currentY-startY) //시작점과 끝점의 좌표 정보로 사각형을 그려준다.
            context.fillStyle="yellow";
            context.globalAlpha="0.3";
            context.fillRect(startX,startY,currentX-startX,currentY-startY);
            context.globalAlpha="1";
          }
        }
      canvas.onmousedown = (e) => {
        if(time<0) return;
        else {
          mDown(e);
          const rect = canvas.getBoundingClientRect()
          down_mouse_x=e.clientX-rect.left-100;
          down_mouse_y=e.clientY-rect.top-100;
        }
      }
      canvas.onmouseup = (e) => {
        if(time<0) return;
        else {
          mUp(e);
          var sum=0;
          for(var i=parseInt(s_x/40);i<=parseInt(e_x/40);i++) {
            for(var j=parseInt(s_y/40);j<=parseInt(e_y/40);j++) {
			if(i>=0 && j>=0 && i<=20 && j<=11)
              sum+=melon_info[i][j];
            }
          }
          if(sum===10 || sum===20) {
            var ss_x=parseInt(s_x/40),ss_y=parseInt(s_y/40);
            var ee_x=parseInt(e_x/40),ee_y=parseInt(e_y/40);
            for(var t=ss_x;t<=ee_x;t++) {
              for(var s=ss_y;s<=ee_y;s++) {
                if(t>=0 && s>=0 && t<=20 && s<=11 && melon_info[t][s] !== 0) {
                        cnt++;
                        melon_info[t][s]=0;
                }
                if(t===ss_x && s===ss_y) bbyong.play();
              }
            }
            backContext.fillStyle="#00D8FF";
            backContext.fillRect(980,80,40,40);
            backContext.fillStyle="white";
            backContext.font="bold 20px Arial, sans-serif";
            backContext.textAlign="center";
            backContext.fillText(cnt, 999, 100, 30); 
            context.clearRect(140+(ss_x-1)*40,100+ss_y*40, (ee_x-ss_x+1)*40,(ee_y-ss_y+1)*40);
            hiddenContext.clearRect(0,0,hiddenContext.canvas.width,hiddenContext.canvas.height);
            hiddenContext.drawImage(canvas,0,0);
          }
        }
      }/*
      if(time != 0 && exiter.innerText==="go")
        setTimeout(x,50);
      else {
        exiter.innerText="go";
        context.clearRect(0,0,c_width,700);
        return;
      }*/
    }
  }
  render (){

    const canvasStyle= {
      width:'1030px',
      height:'700px',
      borderRadius: '30px',
      position: 'absolute',
      zIndex: '2',
      backgroundColor: 'transparent',
    };
    const hiddenCanvasStyle= {
      width:'1030px',
      height:'700px',
      display:'none',
      borderRadius: '30px',
      position:'absolute'
    };
    const backCanvasStyle= {
      width:'1030px',
      height:'700px',
      borderRadius: '30px',
      zIndex: '1',
      backgroundColor: '#00D8FF',
      position:'absolute',
    };
    const startButtonStyle = {
      position:'absolute',
      zIndex:'2',
      marginTop:'480px',
      marginLeft:'190px',
      width: '200px',
      height: '60px',
      border: '2px solid #86E57F',
      cursor: 'pointer',
      fontSize: '35px',
      fontFamily: 'Jua, sans-serif',
      lineHeight: '65px',
      backgroundColor: '#98F791',
      color: '#E0FFDB',
      borderRadius: '10px'
    }
    const exitButtonStyle = {
      display:'none',
      position:'absolute',
      zIndex:'2',
      marginTop:'655px',
      marginLeft:'130px',
      width: '100px',
      height: '30px',
      cursor: 'pointer',
      fontSize: '18px',
      fontFamily: 'Jua, sans-serif',
      lineHeight: '28px',
      backgroundColor: '#5CD1E5',
      color: '#D4F4FA',
      borderRadius: '10px',
      border: '2px solid #D4F4FA'
    }
    const exitButtonStyle2 = {
      display:'none',
      position:'absolute',
      zIndex:'1000',
      marginTop:'455px',
      marginLeft:'420px',
      width: '200px',
      height: '60px',
      cursor: 'pointer',
      border: '2px solid #E0FFDB',
      fontSize: '30px',
      fontFamily: 'Jua, sans-serif',
      lineHeight: '60px',
      backgroundColor: '#9DD327',
      color: '#E0FFDB',
      borderRadius: '10px',
    }
    return (
      <Faded>
        <div id='blocking'></div>
      <div id='melon-wrap'>
          <div id='melon-container'>
            <div id="rankBox">
                <div id='rank-title'>랭킹</div>
            </div>
            <div id="melon-box">
              <div id='melon-title'>드래그하여 합이 10또는 20이 되도록 하면됩니다.<br/></div>
              <div id='melon-text'>
              개발: lee gm / 디자인: tae hb / 음악: lee sh<br/>
              게임실행에 문제가 있는경우 새로고침 후 시작을 눌러주세요<br/>
              시간은 2분이 주어지며 종료시 스코어가 나옵니다.<br/>
              랭킹 10위 안에드는 점수를 받을 시 랭킹 등록 창이 나옵니다.<br/>
            </div>
        <br/>
        <div id="exit" style={{display:'none'}}>go</div>
        </div></div>
        <canvas style={canvasStyle} id='melonCanvas'>

        </canvas>
        <canvas style={hiddenCanvasStyle} id='hiddenCanvas'>

        </canvas>
        <canvas style={backCanvasStyle} id='backCanvas'>

        </canvas>
        <button style={startButtonStyle} id="startButton" onClick={this.test}>시작하기</button>
        <button id="exitButton" style={exitButtonStyle} onClick={this.test2}>홈으로</button>
        <button id="exitButton2" style={exitButtonStyle2} onClick={this.goHome}>홈으로</button>
      </div>
      </Faded>
    );
  }
}

export default melongame;
