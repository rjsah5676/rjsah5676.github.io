import React from "react";
import InfoContentsDetail from './InfoContentsDetail';
import InfoSlide from './InfoSlide';

import calendarImg from '../../img/Page/info/info_calendar.png';

import airBoardImg from '../../img/Page/info/AirBoard.png';
import yoriJoriImg from '../../img/Page/info/YoriJori.png';
import testImg from '../../img/Page/info/Test.png';
import taxImg from '../../img/Page/info/TaxProject.png';

function InfoContents({idx}) {
    const cImg = (<img alt="" src={calendarImg} style={{width:'30px'}}/>);
      const slideImages = [
        {
          id: 0,
          img: airBoardImg,
        },
        {
          id: 1,
          img: yoriJoriImg,
        },
        {
          id: 2,
          img: testImg,
        },
        {
          id: 3,
          img: taxImg,
        },
      ];

    if(idx===1)
        return (
            <div className='info-contents'>
                <div className='info-contents-title'>AIR BOARD</div>
                <div className='info-contents-period'>{cImg} 2021.03 - 2021.06</div>
                <div className='info-contents-tech'><div className='tech-box'>Javascript</div><div className='tech-box'>WebRTC</div><div className='tech-box'>OpenCV</div><div className='tech-box'>NodeJS</div><div className='tech-box'>MongoDB</div></div>
                <InfoSlide slideImages={slideImages}/>
                <InfoContentsDetail title={'1. 개요'} text={`아 배고프다. 아무말 대잔치 아무말
                    대잔치 아무말 대잔치 아무말 대잔치 아무말 대잔치 아무말 대잔치 아무말 대잔치 아무말
                    대잔치 아무말 대잔치 아무말 대잔치 아무말 대잔치 아무말 대잔치 아무말 대잔치 아무말
                    대잔치 아무말 대잔치 아무말 대잔치 아무말 대잔치 아무말 대잔치 아무말 대잔치 아무말
                    대잔치 아무말 대잔치 아무말 대잔치 아무말 대잔치 아무말 대잔치 아무말 대잔치 아무말
                    대잔치 아무말 대잔치 아무말 대잔치 아무말 대잔치 아무말 대잔치 아무말 대잔치 아무말
                    대잔치 아무말 대잔치 `}/>
                <InfoContentsDetail title={'2. 기능 설명'} text={'오늘 점심 뭐먹지.'}/>
            </div>
        )
    if(idx===2)
        return (
            <div className='info-contents'>
                <div className='info-contents-title'>영천시 세무조사 홈페이지</div>
                <div className='info-contents-period'>{cImg} 2021.10 - 2022.01</div>
                <div className='info-contents-tech'><div className='tech-box'>JSP</div><div className='tech-box'>Spring</div><div className='tech-box'>Javascript</div><div className='tech-box'>MySQL</div></div>
                <InfoSlide slideImages={slideImages}/>
                <InfoContentsDetail title={'타이틀'} text={'텍스트'}/>
                <InfoContentsDetail title={'타이틀'} text={'텍스트'}/>
            </div>
        )
    if(idx===3)
        return (
            <div className='info-contents'>
                <div className='info-contents-title'>요리조리</div>
                <div className='info-contents-period'>{cImg} 2019.10 - 2019.12</div>
                <div className='info-contents-tech'><div className='tech-box'>React</div><div className='tech-box'>NodeJS</div><div className='tech-box'>Ajax</div><div className='tech-box'>JQuery</div><div className='tech-box'>MongoDB</div></div>
                <InfoSlide slideImages={slideImages}/>
                <InfoContentsDetail title={'타이틀'} text={'텍스트'}/>
                <InfoContentsDetail title={'타이틀'} text={'텍스트'}/>
            </div>
        )
    if(idx===4)
        return (
            <div className='info-contents'>
                <div className='info-contents-title'>Gunmo's Dev Life</div>
                <div className='info-contents-period'>{cImg} 2021.12 ~ </div>
                <div className='info-contents-tech'><div className='tech-box'>React</div><div className='tech-box'>Firebase</div><div className='tech-box'>NodeJS</div></div>
                <InfoSlide slideImages={slideImages}/>
                <InfoContentsDetail title={'타이틀'} text={'텍스트'}/>
                <InfoContentsDetail title={'타이틀'} text={'텍스트'}/>
            </div>
        )
    return <div></div>
}

export default InfoContents;