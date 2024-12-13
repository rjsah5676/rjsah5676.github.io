import React from "react";
import Faded from "../../effect/Faded";
import '../../css/Page/info.css';
import InfoBox from './InfoBox';

import airBoardImg from '../../img/Page/info/AirBoard.png';
import yoriJoriImg from '../../img/Page/info/YoriJori.png';
import logoImg from '../../img/Page/info/logo.PNG';
import taxImg from '../../img/Page/info/TaxProject.png';

function MyInfo(props) {

    return (
        <Faded>
            <div className="info-wrap">
                  <div className="info-container">
                      <div className="info-class">Team Project</div>
                      <InfoBox imgLink={airBoardImg}
                                gitLink={"https://github.com/rjsah5676/Capstone-Design-2021-1-"}
                                title={"캠 필기 웹 화상 회의 서비스 [AirBoard]"}
                                desc={"웹 캠을 통한 필기 기능을 제공하는 화상 회의 플랫폼입니다."}
                                tech={<div className='info-tech'><div className='info-tech-box'>Javascript</div><div className='info-tech-box'>WebRTC</div><div className='info-tech-box'>OpenCV</div><div className='info-tech-box'>NodeJS</div><div className='info-tech-box'>MongoDB</div></div>}
                                idx={1}/>
                     <InfoBox imgLink={taxImg}
                                gitLink={"https://github.com/rjsah5676"}
                                title={"[영천시 세무조사 홈페이지]"}
                                desc={"세무 신고서 작성 및 조회기능을 제공하는 영천시 세무조사 웹 사이트 입니다."}
                                tech={<div className='info-tech'><div className='info-tech-box'>JSP</div><div className='info-tech-box'>Spring</div><div className='info-tech-box'>Javascript</div><div className='info-tech-box'>MySQL</div></div>}
                                idx={2}/>
                      <div className="info-class">Personal Project</div>
                     <InfoBox imgLink={yoriJoriImg}
                                gitLink={"https://github.com/rjsah5676/WebProject"}
                                title={"음식 레시피 공유 사이트 [요리조리]"}
                                desc={"음식 레시피를 공유하는 커뮤니티 웹 사이트입니다. 이용자들은 음식 레시피를 등록할 수 있고 자유롭게 음식에 대한 리뷰를 남길 수 있습니다."}
                                tech={<div className='info-tech'><div className='info-tech-box'>React</div><div className='info-tech-box'>NodeJS</div><div className='info-tech-box'>Ajax</div><div className='info-tech-box'>JQuery</div><div className='info-tech-box'>MongoDB</div></div>}
                                idx={3}/>
                     <InfoBox imgLink={logoImg}
                                gitLink={"https://github.com/rjsah5676/rjsah5676.github.io"}
                                title={"[Gunmo's Dev Life]"}
                                desc={"React를 사용하여 만든 나를 소개하는 사이트입니다."}
                                tech={<div className='info-tech'><div className='info-tech-box'>React</div><div className='info-tech-box'>Firebase</div><div className='info-tech-box'>NodeJS</div></div>}
                                idx={4}/>
                </div>
              <div style={{height:'50px'}}></div>
            </div>
        </Faded>
    )
}

export default MyInfo;