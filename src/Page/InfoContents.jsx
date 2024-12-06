import React, { useState, Component} from "react";
import '../css/Page/info.css';
import InfoContentsDetail from './InfoContentsDetail';

function InfoContents({idx}) {
    if(idx===1)
        return (
            <div className='info-contents'>
                <div className='info-contents-title'>AIR BOARD</div>
                <div className='info-contents-period'>2021.03 - 2021.06</div>
                <div className='info-contents-tech'>Javascript  WebRTC  OpenCV  NodeJS MongoDB</div>
                <div claSSName='info-contents-img'>이미지 테스트</div>
                <InfoContentsDetail title={'타이틀'} text={'텍스트'}/>
                <InfoContentsDetail title={'타이틀'} text={'텍스트'}/>
            </div>
        )
    if(idx===2)
        return (
            <div className='info-contents'>
                <div className='info-contents-title'>영천시 세무조사 사이트</div>
                <div className='info-contents-period'>2021.10 - 2022.01</div>
                <div className='info-contents-tech'>JSP  Spring  Javascript  MySQL</div>
                <div claSSName='info-contents-img'>이미지 테스트</div>
                <InfoContentsDetail title={'타이틀'} text={'텍스트'}/>
                <InfoContentsDetail title={'타이틀'} text={'텍스트'}/>
            </div>
        )
    if(idx===3)
        return (
            <div className='info-contents'>
                <div className='info-contents-title'>요리조리</div>
                <div className='info-contents-period'>2019.10 - 2019.12</div>
                <div className='info-contents-tech'>React  NodeJS  Ajax  JQuery  MongoDB</div>
                <div claSSName='info-contents-img'>이미지 테스트</div>
                <InfoContentsDetail title={'타이틀'} text={'텍스트'}/>
                <InfoContentsDetail title={'타이틀'} text={'텍스트'}/>
            </div>
        )
    if(idx===4)
        return (
            <div className='info-contents'>
                <div className='info-contents-title'>Gunmo's Dev Life</div>
                <div className='info-contents-period'>2021.12 - </div>
                <div className='info-contents-tech'>React   Firebase   NodeJS</div>
                <div claSSName='info-contents-img'>이미지 테스트</div>
                <InfoContentsDetail title={'타이틀'} text={'텍스트'}/>
                <InfoContentsDetail title={'타이틀'} text={'텍스트'}/>
            </div>
        )
    return <div></div>
}

export default InfoContents;