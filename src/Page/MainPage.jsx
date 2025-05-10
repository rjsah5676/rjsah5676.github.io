import React, { useEffect} from "react";
import Faded from "../effect/Faded";

function MainPage() {  
    useEffect(()=>{
      window.scrollTo({top:400,left:0,behavior:'smooth'});
            handleMain(window.innerWidth);
            },[]);
    window.addEventListener('resize', function() {
      handleMain(this.window.innerWidth);
    });
    function handleMain(winWidth) {
      let mc = document.getElementById('main-page-box');
      let bt = document.getElementById('plus-button');
      if(mc!==null && bt!==null) {
        if(winWidth<1024) {
            mc.style.display='none';
            bt.style.display='block';
        } else {
            mc.style.display='block';
            bt.style.display='none';
        }
        }
    }

    const openModal = () => {
        var left=Math.ceil((window.screen.width-1200)/2);
        var top=Math.ceil((window.screen.height-660)/2);
      window.open('/',"gunmo-lee","location=no,width=1200,height=660,left="+left+",top="+top);
    };

    return (
      <Faded>
        <div className="main-page-container">
        <h3>ABOUT ME</h3>
        <h5>안녕하세요🖐<br/>풀스택 개발자를 목표하는 <b style={{color:'white'}}>이건모</b> 입니다.🙂</h5>
        <div><button id="plus-button" style={{display:'none'}} onClick={openModal}>+</button></div>

        <div id="main-page-box">
            <div id="main-page-left-box"></div>
            <div id="main-page-right-box">
                <ul>
                    <li>
                        <h4 className="yy">PROFILE</h4>
                        <ul>
                            <li className="lists">
                                <div className="left-msg">이름</div>
                                <div className="right-msg">이건모</div>
                            </li>
                            <li className="lists">
                                <div className="left-msg">생년월일</div>
                                <div className="right-msg">1997.12.10</div>
                            </li>
                            <li className="lists">
                                <div className="left-msg">거주지</div>
                                <div className="right-msg">경기도 성남시 수정구</div>
                            </li>
                            <li className="lists">
                                <div className="left-msg">최종학력</div>
                                <div className="right-msg">아주대학교 소프트웨어학과 졸업</div>
                            </li>
                        </ul>
                    </li>
                    <li>
                        <h4 className="xx">TECH</h4>
                        <ul>
                            <li className="lists">
                                <div className="left-msg">Frontend</div>
                                <div className="right-msg">React, JSP, JS</div>
                            </li>
                            <li className="lists">
                                <div className="left-msg">Backend</div>
                                <div className="right-msg">NodeJS, Flask, Spring</div>
                            </li>
                            <li className="lists">
                                <div className="left-msg">Database</div>
                                <div className="right-msg">MySQL, MongoDB, FireStore</div>
                            </li>
                        </ul>
                    </li>
                    <li>
                        <h4 className="xx">SITE</h4>
                        <ul id="sites">
                            <li className="lists">
                                <a href="https://github.com/rjsah5676"><div id="git-img" src="../../img/page/mainPage/github.png"></div></a>
                            </li>
                            <li className="lists">
                                <a href="https://rjsah5676.github.io/"><div id="gm-img" src="../../img/page/mainPage/logo.png"></div></a>
                            </li>
                            <li className="lists">
                                <a href="https://www.acmicpc.net/user/rjsah5676"><div id="acm-img" src="../../img/page/mainPage/acmicpc.png"></div></a>
                            </li>
                            <li className="lists">
                                <a href="https://mimyo.my"><div id="mimyo-img" src="../../img/page/mimyo/mimyo_logo.jpg"></div></a>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    </div>
      </Faded>
    );
}

export default MainPage;
