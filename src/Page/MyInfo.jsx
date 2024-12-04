import React, { Component} from "react";
import Faded from "../effect/Faded";
import '../css/Page/info.css';
import airBoardImg from '../img/Page/info/AirBoard.png';
import yoriJoriImg from '../img/Page/info/YoriJori.png';
import gitImg from '../img/Page/info/github.png';
import testImg from '../img/Page/info/Test.png';

class MyInfo extends Component {
  render (){
    return (
      <Faded>
        <div className="info-wrap">
              <div className="info-container">
                  <div className="info-class">Team Project</div>
                  <div className="info-item">
                      <div style={{backgroundImage:`url(${airBoardImg})`}} className="info-image"/>
                      <div className="info-title">캠 필기 웹 화상 회의 서비스 [AirBoard]</div>
                      <div className="info-desc">웹 캠을 통한 필기 기능을 제공하는 화상 회의 플랫폼입니다.</div>
                      <div className="info-tech"><pre>Javascript   PeerJS   OpenCV   NodeJS   MongoDB</pre></div>
                      <div style={{backgroundImage:`url(${gitImg})`}} className="info-link"/>
                  </div>
                  <div className="info-item">
                      <div style={{backgroundImage:`url(${testImg})`}} className="info-image"/>
                      <div className="info-title">TEST</div>
                      <div className="info-desc">Test 중입니다.</div>
                      <div className="info-tech"><pre>테스트 중</pre></div>
                      <div style={{backgroundImage:`url(${gitImg})`}} className="info-link"/>
                  </div>
                  <div className="info-class">Personal Project</div>
                  <div className="info-item">
                      <div style={{backgroundImage:`url(${yoriJoriImg})`}} className="info-image"/>
                      <div className="info-title">음식 레시피 공유 사이트 [요리조리]</div>
                      <div className="info-desc">음식 레시피를 공유하는 커뮤니티 웹 사이트입니다.
                          이용자들은 음식 레시피를 등록할 수 있고 자유롭게 음식에 대한 리뷰를 남길 수 있습니다.</div>
                      <div className="info-tech"><pre>React   NodeJS   Ajax   JQuery   MongoDB</pre></div>
                      <div style={{backgroundImage:`url(${gitImg})`}} className="info-link"/>
                  </div>
                  <div className="info-item">
                      <div style={{backgroundImage:`url(${testImg})`}} className="info-image"/>
                      <div className="info-title">TEST</div>
                      <div className="info-desc">Test 중입니다.</div>
                      <div className="info-tech"><pre>테스트 중</pre></div>
                      <div style={{backgroundImage:`url(${gitImg})`}} className="info-link"/>
                  </div>
              </div>
          <div style={{height:'50px'}}></div>
        </div>
      </Faded>
    );
  }
}

export default MyInfo;
