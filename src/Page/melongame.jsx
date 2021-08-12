import React, { Component} from "react";
import FadeIn from "../effect/FadeIn";
import tmImg1 from '../../src/img/melongame/tm1.png';
import tmImg2 from '../../src/img/melongame/tm2.png';
import tmImg3 from '../../src/img/melongame/tm3.png';
import tmImg4 from '../../src/img/melongame/tm4.png';
import tmImg5 from '../../src/img/melongame/tm5.png';
import tmImg6 from '../../src/img/melongame/tm6.png';
import tmImg7 from '../../src/img/melongame/tm7.png';
import tmImg8 from '../../src/img/melongame/tm8.png';
import tmImg9 from '../../src/img/melongame/tm9.png';
import tmImg_score from '../../src/img/melongame/tm_score.png';
import tmT from '../../src/img/melongame/tm_t.png';
import bbyong_sound from '../../src/sounds/melongame/bbyong.mp3';
import bsbgm from '../../src/sounds/melongame/bgm.mp3';
import endbgm from '../../src/sounds/melongame/endbgm.mp3';

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
var bbyong = new Audio(bbyong_sound);
var bgm = new Audio(bsbgm);
var end_bgm = new Audio(endbgm);
bgm.loop=true;
bgm.volume=0.7;
bbyong.volume=0.5;
var c_width = 1030;

var cnt=0;
var canvas;
var context;
var hiddenCanvas;
var hiddenContext;
var backCanvas;
var backContext;
class melongame extends Component {
  componentDidMount() {
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
  }
  test2()
  {
    var exiter=document.getElementById('exit');
    exiter.innerText="stop";
  }
  test() {
    cnt=0;
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
    var time=130;
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
		if(melon_first==1) {hiddenContext.drawImage(img_1 ,100+40*p, 100+q*40, 40, 40);}
		else if(melon_first==2) {hiddenContext.drawImage(img_2 ,100+40*p, 100+q*40, 40, 40);}
		else if(melon_first==3) {hiddenContext.drawImage(img_3 ,100+40*p, 100+q*40, 40, 40);}
		else if(melon_first==4) {hiddenContext.drawImage(img_4 ,100+40*p, 100+q*40, 40, 40);}
		else if(melon_first==5) {hiddenContext.drawImage(img_5 ,100+40*p, 100+q*40, 40, 40);}
		else if(melon_first==6) {hiddenContext.drawImage(img_6 ,100+40*p, 100+q*40, 40, 40);}
		else if(melon_first==7) {hiddenContext.drawImage(img_7 ,100+40*p, 100+q*40, 40, 40);}
		else if(melon_first==8) {hiddenContext.drawImage(img_8 ,100+40*p, 100+q*40, 40, 40);}
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
        if(exiter.innerText==="stop") {
          backContext.fillStyle="#00D8FF";
          backContext.fillRect(980,80,40,40);
          exiter.innerText="go";
          time=0;
          bgm.pause();
          return;
        }
        if(time<0) {
          backContext.fillStyle="#00D8FF";
            backContext.fillRect(980,80,40,40);
      bgm.pause();
      end_bgm.play();
			context.fillStyle="white";
			context.drawImage(img_score,400,200,250,250);
      context.font="bold 80px Arial, sans-serif";
      context.textAlign="center";
			context.fillText(cnt, 520, 380, 100); 
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
    var stX,stY,startX,startY,endX,endY;
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
				if(t==ss_x && s==ss_y) {
					t_sx=t;
					t_sy=s;
				}
				if(t==ee_x && s==ee_y) {
				t_ex=t;
				t_ey=s;
				}
            }
			}
        }

        function mDown(me)
        {
            startX = me.offsetX;
            startY = me.offsetY;
            stX = me. offsetX ; //눌렀을 때 현재 마우스 X좌표를 stX에 담음
            stY = me. offsetY ; //눌렀을 때 현재 마우스 Y좌표를 stY에 담음
            drag = true ; //그림 그리기는 그리는 상태로 변경
        }

        function mUp(me)
        {
            endX = me.offsetX
            endY = me.offsetY
            drag=false;
            context.clearRect(0,0,context.canvas.width,context.canvas.height);
            context.drawImage(hiddenCanvas,0,0);
        }
        function mOut(me)
        {
            drag = false ; //마우스가 캔버스 밖으로 벗어났을 때 그리기 중지
        }

        function canvasDraw(currentX,currentY)
        {
          if(time!=0) {
            context.clearRect(0,0,context.canvas.width,context.canvas.height) //설정된 영역만큼 캔버스에서 지움
            context.drawImage(hiddenCanvas,0,0);
			for(var t=t_sx;t<=t_ex;t++) {
              for(var s=t_sy;s<=t_ey;s++) {
			  if(t>=0 && s>=0 && t<=20 && s<=11)
				if(melon_info[t][s]!=0)
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
        if(time!=0) {
          mDown(e);
          const rect = canvas.getBoundingClientRect()
          down_mouse_x=e.clientX-rect.left-100;
          down_mouse_y=e.clientY-rect.top-100;
        }
      }
      canvas.onmouseup = (e) => {
        if(time!=0) {
          mUp(e);
          /*const rect = canvas.getBoundingClientRect()
          up_mouse_x=e.clientX-rect.left-100;
          up_mouse_y=e.clientY-rect.top-100;
          var e_x=Math.max(up_mouse_x, down_mouse_x);
          var s_x=Math.min(up_mouse_x, down_mouse_x);
          var e_y=Math.max(up_mouse_y, down_mouse_y);
          var s_y=Math.min(up_mouse_y, down_mouse_y);*/
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
                if(t>=0 && s>=0 && t<=20 && s<=11) {
                        cnt++;
                        melon_info[t][s]=0;
                }
                if(t==ss_x && s==ss_y) bbyong.play();
              }
            }
            context.fillStyle="#00D8FF";
            context.fillRect(980,80,40,40);
            context.fillStyle="white";
            context.font="bold 20px Arial, sans-serif";
            context.textAlign="center";
            context.fillText(cnt, 999, 100, 30); 
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
    const wrapStyle = {
      position:'absolute',
      top: '30%', right: '50%',
      transform:'translateX(-50%,-50%)'
    };
    const canvasStyle= {
      width:'1030px',
      height:'700px',
      borderRadius: '30px',
      position: 'absolute',
      zIndex: '700',
      backgroundColor: 'transparent',
    };
    const hiddenCanvasStyle= {
      width:'1030px',
      height:'700px',
      display:'none',
      borderRadius: '30px'
    };
    const backCanvasStyle= {
      width:'1030px',
      height:'700px',
      borderRadius: '30px',
      zIndex: '500',
      backgroundColor: '#00D8FF',
      position:'absolute',
    };
    return (
      <div>
      <div style={wrapStyle}>
        <div id="exit" style={{display:'none'}}>go</div>
        <br/>
        드래그하여 합이 10또는 20이 되도록 하면됩니다.
        <div style={{height:'0px'}}></div>
        <canvas style={canvasStyle} id='melonCanvas'>

        </canvas>
        <canvas style={hiddenCanvasStyle} id='hiddenCanvas'>

        </canvas>
        <canvas style={backCanvasStyle} id='backCanvas'>

        </canvas>
        <button style={{marginTop:'740px',marginLeft:'400px'}} onClick={this.test}>시작</button>
        <button onClick={this.test2}>종료</button>
      </div>
      <div style={{height:'1200px'}}></div>
      </div>
    );
  }
}

export default melongame;
