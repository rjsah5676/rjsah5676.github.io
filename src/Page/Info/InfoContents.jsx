import React from "react";
import InfoContentsDetail from './InfoContentsDetail';
import InfoSlide from './InfoSlide';

import calendarImg from '../../img/Page/info/info_calendar.png';

import airBoardImg from '../../img/Page/info/AirBoard.png';
import yoriJoriImg from '../../img/Page/info/YoriJori.png';
import testImg from '../../img/Page/info/Test.png';
import taxImg from '../../img/Page/info/TaxProject.png';

import img_airboard_1 from '../../img/Page/info/airboard/img_1.png';
import img_airboard_2 from '../../img/Page/info/airboard/img_2.png';
import img_airboard_3 from '../../img/Page/info/airboard/img_3.png';
import img_airboard_4 from '../../img/Page/info/airboard/img_4.png';
import img_airboard_5 from '../../img/Page/info/airboard/img_5.png';
import img_airboard_6 from '../../img/Page/info/airboard/img_6.png';

function InfoContents({idx}) {
    const cImg = (<img alt="" src={calendarImg} style={{width:'30px'}}/>);
      const slideImages = [
        {
          id: 0,
          img: airBoardImg,
        },
        {
          id: 1,
          img: img_airboard_1,
        },
        {
          id: 2,
          img: img_airboard_2,
        },
        {
          id: 3,
          img: img_airboard_3,
        },
        {
          id: 4,
          img: img_airboard_4,
        },
        {
          id: 4,
          img: img_airboard_6,
        },
      ];

    if(idx===1)
        return (
            <div className='info-contents'>
                <div className='info-contents-title'>AIR BOARD</div>
                <div className='info-contents-period'>{cImg} 2021.03 - 2021.06</div>
                <div className='info-contents-tech'><div className='tech-box'>Javascript</div><div className='tech-box'>WebRTC</div><div className='tech-box'>OpenCV</div><div className='tech-box'>NodeJS</div><div className='tech-box'>MongoDB</div></div>
                <InfoSlide slideImages={slideImages}/>
                <InfoContentsDetail title={'1. 개요'} text={`AirBoard는 웹캠을 이용해 필기와 제스처 기능을 지원하는 화상 회의 플랫폼이다.
실시간 수업 중 부정확하고 느린 속도로 마우스로 필기하는 것을 보고 새로운 입력 방식에 대해 고민해 보게 되었다.
비대면 수업이 많아지면서 코로나19로 인해 전 국민 1인 1웹캠 시대다. 우리 팀은 모두가 갖고 있는 웹캠에 대해
단순 영상 입력 장치에서 한 단계 더 나아간 활용 방법을 제시하기 위해 AirBoard를 기획했다. AirBoard는 실시간 카메라 공유,
화면 공유, 음성 채팅, 문자 채팅 등 Google Meet나 Zoom 등에 있는 기본적인 화상 희의 기능을 전부 제공한다.
여기에 더해 웹캠 앞에서 손이나 펜 등을 들고 그림을 그리면 그 궤적을 웹캠이 읽어 칠판에 글씨 쓰듯 그림을 그리거나 필기를 할 수 있다. `}/>
      <InfoContentsDetail title={'2. 기능 설명'} />
      <div style={{marginLeft:'15px'}}>
      <InfoContentsDetail title={'2-1. 로그인 이전'} titleFont={'30px'} titleMargin={'20px'}/>
      <img src={img_airboard_1} style={{width:'1000px'}} alt=""/>
      <InfoContentsDetail text={`로그인 전에는 3가지 메뉴가 있고, 각 메뉴의 기능은 다음과 같다.

      1. 회의 생성 : 회의를 생성한다. 만약 로그인을 하지 않았다면 회의를 만들 수 없다.
      2. 로그인 : 로그인 기능을 제공한다.
      3. 회원가입 : 회원가입 기능을 제공한다. 회원가입은 이메일을 이용해 실시한다.`}/>
      <InfoContentsDetail title={'2-2. 로그인 이후'} titleFont={'30px'} titleMargin={'20px'}/>
      <img src={img_airboard_2} style={{width:'1000px'}} alt=""/>
      <InfoContentsDetail text={`로그인 후에는 4가지 메뉴가 있고, 각 메뉴의 기능은 다음과 같다.

      1. 회의 생성: 회의를 생성한다. 로그인을 한 후에는 회의를 생성할 수 있다.
      2. 로그아웃 : 로그아웃 기능을 제공한다.
      3. 계정 정보 : 로그인 한 계정의 정보를 확인할 수 있다. 자신의 이름을 바꿀 수 있다.
      4. 제스처 추가 : 자신이 설정하는 커스텀 제스처를 만들 수 있다.`}/>
      <InfoContentsDetail title={'2-3. 회의 생성'} titleFont={'30px'} titleMargin={'20px'}/>
      <img src={img_airboard_3} style={{width:'1000px'}} alt=""/>
      <InfoContentsDetail text={`회의를 생성한 후 화상회의 방의 모습이다. 화상회의 방은 크게 4부분으로 나눌 수 있다.

         1.사용자 기능 버튼 : 사용자가 이용할 수 있는 기능들이 있는 버튼이다. 호스트 유저는 다른 유저들의 권한을 컨트롤 하기 위한
                                         버튼을 추가적으로 가지고 있다. 각 기능들의 설명은 다음과 같다.

          ○호스트 전용 버튼
            ㅁ유저 리스트 보기 : 해당 버튼을 눌러 다른 사용자들의 캠, 오디오를 켜고 끌 수 있다. 다른 사용자를 강퇴시킬 수 있다.
            ㅁ각자 캔버스 사용 : 회의 방에 참가한 사람들이 공유된 캔버스를 이용하는 것이 아닌, 각자의 캔버스에 필기할 수 있다.
            ㅁ호스트만 캔버스 사용 : 회의 방의 캔버스를 호스트만 쓸 수 있도록 설정한다.
            ㅁ모든 사용자 캔버스 사용 : 회의 방의 사람들이 공유되는 캔버스에 자유롭게 필기할 수 있다.
          ○공통 버튼
            ㅁ스크린샷 : 캔버스에 그려진 내용들을 사진 파일로 저장한다.
            ㅁ캠 필기 좌우 반전 : 자신이 사용하는 캠 필기 기능을 좌우 반전시킨다.
            ㅁ자신의 보이는 이름 변경 : 해당 회의에서 보이는 자신의 이름을 변경한다.
            ㅁ방에서 퇴장 : 방에서 퇴장한다.

         2.사용자 회의 기능 버튼 : 사용자가 이용할 수 있는 회의 기능들이 있는 버튼이다. 각 기능들의 설명은 다음과 같다.
          ○캠 켜기/끄기 : 자신의 캠을 키거나 끌 수 있다.
          ○마이크 켜기/끄기 : 자신의 마이크를 키거나 끌 수 있다.
          ○화면 공유 켜기/끄기 : 자신이 보여주고 싶은 화면을 공유하고, 공유를 취소할 수 있다.
          ○캠 필기 켜기/끄기 : 자신의 캠을 이용해서 인식한 필기구를 이용해, 허공에 그리는 것으로
                                            캔버스에 그릴 수 있는 캠 필기 기능을 키거나 끌 수 있다.
          ○제스처 켜기/끄기 : 자신의 캠을 이용해서 인식한 손 제스처로 다양한 회의 기능들을
                                            이용할 수 있게 하는 기능을 키거나 끌 수 있다.
          ○제스처 불러오기 : 자신이 설정한 나만의 제스처를 불러와 기능을 사용할 수 있게 한다.
                                            현재 나만의 제스처로 사용할 수 있는 기능은 마이크 켜기/끄기 기능이다.
          ○캔버스 영역 : 사용자가 다른 사용자들과 함께 이용할 수 있는 캔버스이다.
                                            아래쪽에는 캔버스에서 이용할 수 있는 다양한 기능 버튼들이 있다.
          ○채팅 영역 : 다른 사용자들과 채팅을 나눌 수 있는 영역이다.`}/>
          <InfoContentsDetail title={'2-4. 캠 필기'} titleFont={'30px'} titleMargin={'20px'}/>
          <img src={img_airboard_6} style={{width:'1000px'}} alt=""/>
          <InfoContentsDetail text={`회의실 내에서 웹캠을 이용한 캔버스 필기가 가능하다.

         1. 캠 필기 켜기 버튼을 누른다.
         2. 인식할 도구의 색을 화면에서 4번 클릭한다. 이때 선택한 색을 가진 물체 중 화면에 인식되는 가장 큰 물체를 트래킹한다.
             (화면에서 유일하고, 빛에 영향을 적게 받는 물체를 사용하는 것이 좋다.)
         3. 키보드의 \`키를 입력하여 필기 또는 캔버스 기능에 접근할 수 있다.`}/>
         <InfoContentsDetail title={'2-5. 제스처 인식'} titleFont={'30px'} titleMargin={'20px'}/>
         <img src={img_airboard_5} style={{width:'1000px'}} alt=""/>
         <InfoContentsDetail text={`회의실 내에서 제스처 인식 기능 사용이 가능하다.

         1. 제스처 켜기 버튼을 누른다.
         2. 웹캠에서 등록된 제스처를 인식하게 한다.
`}/>
        </div>
        <InfoContentsDetail title={'3. -----'} />
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
    if(idx===5)
        return (
            <div className='info-contents'>
                <div className='info-contents-title'>BAEKJOON Online Judge</div>
                <div className='info-contents-period'>{cImg} 2016.06 ~ </div>
                <div className='info-contents-tech'><div className='tech-box'>React</div><div className='tech-box'>Firebase</div><div className='tech-box'>NodeJS</div></div>
                <InfoSlide slideImages={slideImages}/>
                <InfoContentsDetail title={'타이틀'} text={'텍스트'}/>
                <InfoContentsDetail title={'타이틀'} text={'텍스트'}/>
            </div>
        )
    return <div></div>
}

export default InfoContents;