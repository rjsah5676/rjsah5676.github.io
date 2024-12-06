import React, { useState, Component} from "react";
import '../css/Page/info.css';
import InfoContentsDetail from './InfoContentsDetail';
import calendarImg from '../img/Page/info/info_calendar.png';

function InfoContents({idx}) {
    const cImg = (<img src={calendarImg} style={{width:'30px'}}/>);
    if(idx===1)
        return (
            <div className='info-contents'>
                <div className='info-contents-title'>AIR BOARD</div>
                <div className='info-contents-period'>{cImg} 2021.03 - 2021.06</div>
                <div className='info-contents-tech'><div className='tech-box'>Javascript</div><div className='tech-box'>WebRTC</div><div className='tech-box'>OpenCV</div><div className='tech-box'>NodeJS</div><div className='tech-box'>MongoDB</div></div>
                <div className='info-contents-img'>이미지 테스트</div>
                <InfoContentsDetail title={'타이틀'} text={'텍스트'}/>
                <InfoContentsDetail title={'타이틀'} text={'텍스트'}/>
            </div>
        )
    if(idx===2)
        return (
            <div className='info-contents'>
                <div className='info-contents-title'>영천시 세무조사 사이트</div>
                <div className='info-contents-period'>{cImg} 2021.10 - 2022.01</div>
                <div className='info-contents-tech'><div className='tech-box'>JSP</div><div className='tech-box'>Spring</div><div className='tech-box'>Javascript</div><div className='tech-box'>MySQL</div></div>
                <div className='info-contents-img'>이미지 테스트</div>
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
                <div className='info-contents-img'>이미지 테스트</div>
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
                <div className='info-contents-img'>이미지 테스트</div>
                <InfoContentsDetail title={'타이틀'} text={'텍스트'}/>
                <InfoContentsDetail title={'타이틀'} text={'텍스트'}/>
            </div>
        )
    return <div></div>
}

export default InfoContents;