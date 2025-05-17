import React, { Component} from "react";
import { Route } from "react-router-dom";
import MainPage from "./Page/MainPage";
import MyInfo from "./Page/Info/MyInfo";
import './css/Transition.css';


import './css/floatstyle.css';

import melongame from "./Page/Game/melongame";
import rspeed from "./Page/Game/RspeedGame";
import Sketch from "./Page/Game/Sketch/Sketch";

import infoPage from "./Page/Info/InfoPage";
import GalleryPage from "./Page/Gallery/GalleryPage";
import GuestBox from "./Page/GuestBox";
import About from "./Page/About";
import Archive from "./Page/Archive/Archive";

import Menu from './Menu';

import Item from './Item';
import StudyIndex from "./Page/study/StudyIndex";
import StudyWrite from "./Page/study/StudyWrite";
import Minesweeper from "./Page/Game/Minesweeper";

class Body extends Component {
  componentDidMount() {
    function getNumberFromPixel(_px) {
      if (_px === null || _px === "") {
          return 0;
      }
     
      _px = _px + "";
     
      if (_px.indexOf("px") > -1) {
          _px = _px.replace("px", "");
      }
     
      if (_px.indexOf("PX") > -1) {
          _px = _px.replace("PX", "");
      }
     
      var result = parseInt(_px, 10);
      if ((result + "") === "NaN") {
          return 0;
      }
     
      return result;
  }
    var menu = new Menu("#myMenu");
    var item1 = new Item("list", "fas fa-bars", "");
    var item2 = new Item("home", "fas fa-sign-out-alt", "", "");
    var item3 = new Item("up", "fas fa-id-card", "", "");
    var item4 = new Item("my-info", "fas fa-exchange-alt", "",
        ``);
    var item5 = new Item("info-contents", "fas fa-exchange-alt", "","");

      menu.add(item1);
      menu.add(item2);
      menu.add(item3);
      menu.add(item4);
      menu.add(item5);

      let menuList=document.getElementById("list");

      let homeButton=document.getElementById("home");
      var upButton=document.getElementById("up");
      var myInfoButton=document.getElementById("my-info");
      var contents=document.getElementById("info-contents");
  
      contents.innerHTML=
      `
      <div id='contents-line'></div>
      <ul>
          <li><div id='dot'>●</div><div id='contents-date'>1997.12 ~ </div><div id='contents-text'>출생</div></li>
          <li><div id='dot'>●</div><div id='contents-date'>2013.03 ~ 2016.02</div><div id='contents-text'>풍생고등학교 입학</div></li>
          <li><div id='dot'>●</div><div id='contents-date'>2016.03 ~ 2022.02</div><div id='contents-text'>아주대학교 소프트웨어학과 입학</div></li>
          <li><div id='dot'>●</div><div id='contents-date'>2017.03 ~ 2018.12</div><div id='contents-text'>육군 5사단 근무</div></li>
          <li><div id='dot'>●</div><div id='contents-date'>2021.06 ~ 2021.08</div><div id='contents-text'>(주) 트루피플 인턴 실습</div></li>
          <li><div id='dot'>●</div><div id='contents-date'>2025.03 ~ 2025.05</div><div id='contents-text'>미묘 핸드메이드 프로젝트 팀장</div></li>
      </ul>
      `
      ;
  
      homeButton.addEventListener('click', () => {
          window.location.href = '/';
      });
  
      upButton.addEventListener('click', () => {
          window.scrollTo({top:0,left:0,behavior:'smooth'});
      });
      var clicked=false;
  
      menuList.addEventListener('mousedown', () => {
          if(clicked) {
              contents.style.opacity=0;
              clicked = !clicked;
          }
      });
  
      myInfoButton.addEventListener('click', () => {
          if(!clicked) {
              contents.style.left=getNumberFromPixel(myInfoButton.style.left)-470+'px';
              contents.style.top=getNumberFromPixel(myInfoButton.style.top)-220+'px';
              contents.style.opacity=1;
          }
          else {
              contents.style.opacity=0;
          }
          clicked = !clicked;
      });
  }
  render (){
    return (
            <div>
            <Route exact path="/" component={MainPage}></Route>
            <Route exact path="/project" component={MyInfo}></Route>
            <Route exact path="/gallery" component={GalleryPage}></Route>
            <Route exact path="/guest" component={GuestBox}></Route>
            <Route exact path="/melongame" component={melongame}></Route>
            <Route exact path="/about" component={About}></Route>
            <Route exact path="/infoPage" component={infoPage}></Route>
            <Route exact path="/archive" component={Archive}></Route>
            <Route exact path="/rspeed" component={rspeed}></Route>
            <Route exact path="/sketch" component={Sketch}></Route>
            <Route exact path="/study" component={StudyIndex}></Route>
            <Route exact path="/mine" component={Minesweeper}></Route>
            <Route exact path="/study/write" component={StudyWrite}></Route>
            </div>
    );
  }
}

export default Body;
