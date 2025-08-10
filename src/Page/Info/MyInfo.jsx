import React from "react";
import Faded from "../../effect/Faded";
import InfoBox from "./InfoBox";

import airBoardImg from "../../img/Page/info/AirBoard.png";
import yoriJoriImg from "../../img/Page/info/YoriJori.png";
import logoImg from "../../img/Page/info/logo.PNG";
import taxImg from "../../img/Page/info/yctest/slide_1.jpg";
import acmicpcImg from "../../img/Page/info/acmicpc.png";
import unityImg from "../../img/Page/info/unity.png";
import dbImg from "../../img/Page/info/dbproj.png";
import artpartImg from "../../img/Page/info/artpart/artpart.jpg";
import kickeatImg from "../../img/Page/info/kickeat/img_kickeat_0.jpg";
import mimyoImg from "../../img/Page/info/mimyo/mimyo.jpg";
import wooriboardImg from "../../img/Page/info/wooriboard.jpg";
function MyInfo(props) {
  function clickPersonal() {
    let pbutton = document.getElementById("personal-button");
    let tbutton = document.getElementById("team-button");

    let pb = document.getElementById("info-personal");
    let tb = document.getElementById("info-team");

    pb.style.transform = "translateX(-960px)";
    tb.style.transform = "translateX(-960px)";

    tbutton.style.backgroundColor = "#121212";
    tbutton.style.color = "white";
    tbutton.style.fontWeight = 400;

    pbutton.style.backgroundColor = "white";
    pbutton.style.color = "#121212";
    pbutton.style.fontWeight = 600;
  }

  function clickTeam() {
    let pbutton = document.getElementById("personal-button");
    let tbutton = document.getElementById("team-button");

    let pb = document.getElementById("info-personal");
    let tb = document.getElementById("info-team");

    pb.style.transform = "translateX(0px)";
    tb.style.transform = "translateX(0px)";

    pbutton.style.backgroundColor = "#121212";
    pbutton.style.color = "white";
    pbutton.style.fontWeight = 400;

    tbutton.style.backgroundColor = "white";
    tbutton.style.color = "#121212";
    tbutton.style.fontWeight = 600;
  }
  return (
    <Faded>
      <div className="info-wrap">
        <div className="info-container">
          <div className="project-index-button">
            <div id="team-button" onClick={clickTeam}>
              Team
            </div>
            <div id="personal-button" onClick={clickPersonal}>
              Personal
            </div>
          </div>
          <div id="pl-viewer">
            <div id="pl-list">
              <div className="info-class" id="info-team">
                <ul>
                  <li>
                    <InfoBox
                      imgLink={mimyoImg}
                      gitLink={"https://github.com/rjsah5676/MIMYO"}
                      title={"커머스 핸드메이드 쇼핑몰 [MIMYO]"}
                      desc={
                        "[실시간] [커뮤니케이션] [편의성]을 제공하는 핸드메이드 쇼핑몰"
                      }
                      tech={
                        <div className="info-tech">
                          <div className="info-tech-box">React</div>
                          <div className="info-tech-box">SpringBoot</div>
                          <div className="info-tech-box">Redux</div>
                          <div className="info-tech-box">WebSocket</div>
                          <div className="info-tech-box">JPA</div>
                        </div>
                      }
                      idx={10}
                    />
                  </li>
                  <li>
                    <InfoBox
                      imgLink={airBoardImg}
                      gitLink={
                        "https://github.com/rjsah5676/Capstone-Design-2021-1-"
                      }
                      title={"캠 필기 웹 화상 회의 서비스 [AirBoard]"}
                      desc={
                        "웹 캠을 통한 필기 기능을 제공하는 화상 회의 플랫폼입니다."
                      }
                      tech={
                        <div className="info-tech">
                          <div className="info-tech-box">Javascript</div>
                          <div className="info-tech-box">WebRTC</div>
                          <div className="info-tech-box">OpenCV</div>
                          <div className="info-tech-box">NodeJS</div>
                          <div className="info-tech-box">MongoDB</div>
                        </div>
                      }
                      idx={1}
                    />
                  </li>
                  <li>
                    <li>
                      <InfoBox
                        imgLink={kickeatImg}
                        gitLink={"https://github.com/rjsah5676/KickEat"}
                        title={"당신을 위한 맛집 도우미 [KickEat]"}
                        desc={"서울시 음식점 검색 및 추천 사이트입니다."}
                        tech={
                          <div className="info-tech">
                            <div className="info-tech-box">React</div>
                            <div className="info-tech-box">Springboot</div>
                            <div className="info-tech-box">JPA</div>
                            <div className="info-tech-box">MySQL</div>
                          </div>
                        }
                        idx={9}
                      />
                    </li>
                  </li>
                  <li>
                    <InfoBox
                      imgLink={artpartImg}
                      gitLink={"https://github.com/rjsah5676/ArtPart"}
                      title={"예술과 호텔의 만남 [ArtPart]"}
                      desc={"예술을 접할수 있는 호텔 사이트입니다."}
                      tech={
                        <div className="info-tech">
                          <div className="info-tech-box">JSP</div>
                          <div className="info-tech-box">Spring</div>
                          <div className="info-tech-box">MyBatis</div>
                          <div className="info-tech-box">MySQL</div>
                        </div>
                      }
                      idx={8}
                    />
                  </li>
                  <li>
                    <InfoBox
                      imgLink={taxImg}
                      gitLink={"https://github.com/rjsah5676/Tax-Investigation"}
                      title={"[영천시 세무조사 홈페이지]"}
                      desc={
                        "세무 신고서 작성 및 조회기능을 제공하는 영천시 세무조사 웹 사이트 입니다."
                      }
                      tech={
                        <div className="info-tech">
                          <div className="info-tech-box">JSP</div>
                          <div className="info-tech-box">Spring</div>
                          <div className="info-tech-box">Javascript</div>
                          <div className="info-tech-box">MySQL</div>
                        </div>
                      }
                      idx={2}
                    />
                  </li>
                </ul>
              </div>
              <div className="info-class" id="info-personal">
                <InfoBox
                  imgLink={wooriboardImg}
                  gitLink={"https://github.com/rjsah5676/WooriBoard"}
                  title={"음성채팅 커뮤니티 [Oh! Sori]"}
                  desc={`실시간 채팅 음성채팅 제공 커뮤니티 사이트`}
                  tech={
                    <div className="info-tech">
                      <div className="info-tech-box">NextJS</div>
                      <div className="info-tech-box">Express</div>
                      <div className="info-tech-box">WebRTC</div>
                      <div className="info-tech-box">TailWind</div>
                      <div className="info-tech-box">MongoDB</div>
                    </div>
                  }
                  idx={11}
                />
                <InfoBox
                  imgLink={yoriJoriImg}
                  gitLink={"https://github.com/rjsah5676/WebProject"}
                  title={"음식 레시피 공유 사이트 [요리조리]"}
                  desc={`음식 레시피를 공유하는 커뮤니티 웹 사이트입니다.`}
                  tech={
                    <div className="info-tech">
                      <div className="info-tech-box">React</div>
                      <div className="info-tech-box">NodeJS</div>
                      <div className="info-tech-box">Ajax</div>
                      <div className="info-tech-box">JQuery</div>
                      <div className="info-tech-box">MongoDB</div>
                    </div>
                  }
                  idx={3}
                />
                <InfoBox
                  imgLink={logoImg}
                  gitLink={"https://github.com/rjsah5676/rjsah5676.github.io"}
                  title={"[Gunmo's Dev Life]"}
                  desc={"React를 사용하여 만든 나를 소개하는 사이트입니다."}
                  tech={
                    <div className="info-tech">
                      <div className="info-tech-box">React</div>
                      <div className="info-tech-box">Firebase</div>
                      <div className="info-tech-box">NodeJS</div>
                    </div>
                  }
                  idx={4}
                />
                <InfoBox
                  imgLink={acmicpcImg}
                  gitLink={"https://github.com/rjsah5676/ACMICPC"}
                  title={"알고리즘 [BAEKJOON Online Judge]"}
                  desc={"알고리즘을 배우기 위해 문제를 푼 사이트 입니다."}
                  tech={
                    <div className="info-tech">
                      <div className="info-tech-box">C++</div>
                      <div className="info-tech-box">Java</div>
                      <div className="info-tech-box">Python</div>
                    </div>
                  }
                  idx={5}
                />
                <InfoBox
                  imgLink={dbImg}
                  gitLink={"https://github.com/rjsah5676/DBProject"}
                  title={"[GM Movie]"}
                  desc={"MySQL 학습을 위한 영화 정보 검색 사이트 "}
                  tech={
                    <div className="info-tech">
                      <div className="info-tech-box">Python</div>
                      <div className="info-tech-box">Flask</div>
                      <div className="info-tech-box">MySQL</div>
                    </div>
                  }
                  idx={7}
                />
                <InfoBox
                  imgLink={unityImg}
                  gitLink={"https://github.com/rjsah5676/Unity-Programming"}
                  title={"[일단 뭔가 만든 Unity 게임]"}
                  desc={"Unity를 사용하여 만든 간단한 게임입니다."}
                  tech={
                    <div className="info-tech">
                      <div className="info-tech-box">Unity</div>
                      <div className="info-tech-box">C#</div>
                    </div>
                  }
                  idx={6}
                />
                <br />
                <br />
                <br />
              </div>
            </div>
            <div></div>
          </div>
        </div>
      </div>
    </Faded>
  );
}

export default MyInfo;
