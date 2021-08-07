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
class melon extends Component{

}

class melongame extends Component {
  test2()
  {
    var exiter=document.getElementById('exit');
    exiter.innerText="stop";
  }
  test() {
    var time=120;
    var cnt=0;
    var score=document.getElementById('score');
    var timer=document.getElementById('time');
    var exiter=document.getElementById('exit');
    exiter.innerText="go";
    score.innerHTML="점수: 0";
    var melon_info=new Array(21);
    for(var i=0;i<21;i++){
      melon_info[i] = new Array(12);
    }
    var canvas = document.getElementById('melonCanvas');
    var hiddenCanvas = document.getElementById('hiddenCanvas');
    hiddenCanvas.width=1200;
    hiddenCanvas.height=700;
    canvas.width=1200;
    canvas.height=700;
    var context = canvas.getContext("2d");
    var hiddenContext = hiddenCanvas.getContext("2d");
    var i=0;
    var j=0;
    var img = new Image();
    var melon_first;
    for(var p=0;p<21;p++)
      for(var q=0;q<12;q++) {
        melon_info[p][q]=parseInt(Math.random()*9)+1;
        if(p===0&&q===0) melon_first=melon_info[p][q];
      }
    if(melon_first==1) {img.src=tmImg1;}
    else if(melon_first==2) {img.src=tmImg2;}
    else if(melon_first==3) {img.src=tmImg3;}
    else if(melon_first==4) {img.src=tmImg4;}
    else if(melon_first==5) {img.src=tmImg5;}
    else if(melon_first==6) {img.src=tmImg6; }
    else if(melon_first==7) {img.src=tmImg7;}
    else if(melon_first==8) {img.src=tmImg8; }
    else {img.src=tmImg9;}
    img.onload = function() {
      context.drawImage(img ,100+40*i, 100+j*40, 40, 40);
      i++;
      if(j!=12){
        if(i!=20 || j!=11) {
          if(melon_info[i][j]==1) {img.src=tmImg1;}
          else if(melon_info[i][j]==2) {img.src=tmImg2;}
          else if(melon_info[i][j]==3) {img.src=tmImg3;}
          else if(melon_info[i][j]==4) {img.src=tmImg4;}
          else if(melon_info[i][j]==5) {img.src=tmImg5;}
          else if(melon_info[i][j]==6) {img.src=tmImg6; }
          else if(melon_info[i][j]==7) {img.src=tmImg7;}
          else if(melon_info[i][j]==8) {img.src=tmImg8; }
          else {img.src=tmImg9;}
        }
      }
      if(i===20){
        i=0;
        j++;
      }
      if(j===12) {
        context.clearRect(0,0,140,700);
        hiddenContext.drawImage(canvas,0,0);
        x();
      }
    };
    var down_mouse_x = 0;
    var down_mouse_y = 0;
    var up_mouse_x = 0;
    var up_mouse_y = 0;
    var drag = false;
    function timeF()
    {
        time-=1;
        timer.innerHTML="시간: "+time;
        if(exiter.innerText==="stop") {
          exiter.innerText="go";
          time=0;
          return;
        }
        if(time==0) return;
      setTimeout(timeF,1000);
    }
    function x()
    {
      timeF();
      var stX,stY,startX,startY,endX,endY;
      context.lineWidth = 3; // 컨버스에 그리는 라인의 두께 설정
      context.strokeStyle = "#006cb7"
      console.log(drag);
      canvas.addEventListener ( "mousemove" , function (me) {
            mMove (me)}, false );
        canvas.addEventListener ( "mouseout" , function (me) {
            mOut (me)}, false );


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
          console.log("!");
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
            context.strokeRect(startX,startY,currentX-startX,currentY-startY) //시작점과 끝점의 좌표 정보로 사각형을 그려준다.
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
          const rect = canvas.getBoundingClientRect()
          up_mouse_x=e.clientX-rect.left-100;
          up_mouse_y=e.clientY-rect.top-100;
          var e_x=Math.max(up_mouse_x, down_mouse_x);
          var s_x=Math.min(up_mouse_x, down_mouse_x);
          var e_y=Math.max(up_mouse_y, down_mouse_y);
          var s_y=Math.min(up_mouse_y, down_mouse_y);
          var sum=0;
          for(var i=parseInt((s_x+20)/40);i<=parseInt((e_x-20)/40);i++) {
            for(var j=parseInt((s_y+20)/40);j<=parseInt((e_y-20)/40);j++) {
              sum+=melon_info[i][j];
            }
          }
          if(sum===10 || sum===20) {
            var ss_x=parseInt(s_x/40),ss_y=parseInt(s_y/40);
            var ee_x=parseInt(e_x/40),ee_y=parseInt(e_y/40);
            for(var t=ss_x;t<=ee_x;t++) {
              for(var s=ss_y;s<=ee_y;s++) {
                cnt++;
                melon_info[t][s]=0;
              }
            }
            score.innerText="점수: " + cnt;
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
        context.clearRect(0,0,1200,700);
        return;
      }*/
    }
  }
  render (){
    const wrapStyle = {
      
    };
    const canvasStyle= {
      border:'1px solid black',
      margin:'auto',
      width:'1200px',
      height:'700px',
      display:'block'
    };
    const hiddenCanvasStyle= {
      margin:'auto',
      width:'1200px',
      height:'700px',
      display:'none',
    };
    return (
      <div style={wrapStyle}>
        <div id="exit" style={{display:'none'}}>go</div>
        드래그하여 합이 10또는 20이 되도록 하면됩니다.
        <div style={{height:'200px'}}></div>
        <div id="score" style={{marginLeft:'200px',fontWeight:'900',fontSize:'30px'}}>점수: 0</div>
        <div id="time" style={{marginLeft:'400px',fontWeight:'900',fontSize:'30px'}}>시간: 120</div>
        <canvas style={canvasStyle} id='melonCanvas'>

        </canvas>
        <canvas style={hiddenCanvasStyle} id='hiddenCanvas'>

        </canvas>
        <button style={{marginLeft:'400px'}} onClick={this.test}>시작</button>
        <button onClick={this.test2}>종료</button>
        <div style={{height:'200px'}}></div>
      </div>
    );
  }
}

export default melongame;
