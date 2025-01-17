import React from 'react';

const Modal = (props) => {
  // 열기, 닫기, 모달 헤더 텍스트를 부모로부터 받아옴
  const { open, close, header } = props;

  return (
    // 모달이 열릴때 openModal 클래스가 생성된다.
    <div className={open ? 'openModal modal' : 'modal'}>
      {open ? (
        <div>
          <div>        
            <div class="main-page-container" style={{width:'600px',position:'absolute',zIndex:'200'}}>
            <button className="close" onClick={close}>
              &times;
            </button>
          <div id="main-page-box" style={{display: 'block', marginLeft:'0px'}}>
              <div id="main-page-left-box"></div>
              <div id="main-page-right-box">
                  <ul>
                      <li>
                          <h4 class="yy">PROFILE</h4>
                          <ul>
                              <li class="lists">
                                  <div class="left-msg">이름</div>
                                  <div class="right-msg">이건모</div>
                              </li>
                              <li class="lists">
                                  <div class="left-msg">생년월일</div>
                                  <div class="right-msg">1997.12.10</div>
                              </li>
                              <li class="lists">
                                  <div class="left-msg">거주지</div>
                                  <div class="right-msg">경기도 성남시 수정구</div>
                              </li>
                              <li class="lists">
                                  <div class="left-msg">최종학력</div>
                                  <div class="right-msg">아주대학교 소프트웨어학과 졸업</div>
                              </li>
                          </ul>
                      </li>
                      <li>
                          <h4 class="xx">TECH</h4>
                          <ul>
                              <li class="lists">
                                  <div class="left-msg">Frontend</div>
                                  <div class="right-msg">React, JSP, JS</div>
                              </li>
                              <li class="lists">
                                  <div class="left-msg">Backend</div>
                                  <div class="right-msg">NodeJS, Flask, Spring</div>
                              </li>
                              <li class="lists">
                                  <div class="left-msg">Database</div>
                                  <div class="right-msg">MySQL, MongoDB, FireStore</div>
                              </li>
                          </ul>
                      </li>
                      <li>
                          <h4 class="xx">SITE</h4>
                          <ul id="sites">
                              <li class="lists">
                                  <a href="https://github.com/rjsah5676"><div id="git-img" src="../../img/page/mainPage/github.png"></div></a>
                              </li>
                              <li class="lists">
                                  <a href="https://rjsah5676.github.io/"><div id="gm-img" src="../../img/page/mainPage/logo.png"></div></a>
                              </li>
                              <li class="lists">
                                  <a href="https://www.acmicpc.net/user/rjsah5676"><div id="acm-img" src="../../img/page/mainPage/acmicpc.png"></div></a>
                              </li>
                          </ul>
                      </li>
                  </ul>
              </div>
          </div>
      </div></div>
        </div>
      ) : null}
    </div>
  );
};

export default Modal;