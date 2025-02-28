import React from "react";
import InfoContentsDetail from './InfoContentsDetail';
import InfoSlide from './InfoSlide';

import calendarImg from '../../img/Page/info/info_calendar.png';

import airBoardImg from '../../img/Page/info/AirBoard.png';

import img_airboard_1 from '../../img/Page/info/airboard/img_1.png';
import img_airboard_2 from '../../img/Page/info/airboard/img_2.png';
import img_airboard_3 from '../../img/Page/info/airboard/img_3.png';
import img_airboard_4 from '../../img/Page/info/airboard/img_4.png';
import img_airboard_5 from '../../img/Page/info/airboard/img_5.png';
import img_airboard_6 from '../../img/Page/info/airboard/img_6.png';

import img_yorijori_1 from '../../img/Page/info/yorijori/img_signup.png';
import img_yorijori_2 from '../../img/Page/info/yorijori/img_main.png';
import img_yorijori_3 from '../../img/Page/info/yorijori/img_write.png';
import img_yorijori_4 from '../../img/Page/info/yorijori/img_writen.png';
import img_yorijori_5 from '../../img/Page/info/yorijori/img_board.png';
import img_yorijori_6 from '../../img/Page/info/yorijori/img_mine.png';

import img_db_1 from '../../img/Page/info/dbproject/img_1.png';
import img_db_2 from '../../img/Page/info/dbproject/img_diagram.png';
import img_db_3 from '../../img/Page/info/dbproject/img_create_1.png';
import img_db_4 from '../../img/Page/info/dbproject/img_read.png';
import img_db_5 from '../../img/Page/info/dbproject/img_update.png';

import img_slide_4 from '../../img/Page/info/yorijori/img_slide_4.png';
import img_slide_5 from '../../img/Page/info/yorijori/img_slide_5.png';

import img_gm_1 from '../../img/Page/info/gmlee/img01.jpg';
import img_gm_2 from '../../img/Page/info/gmlee/img02.jpg';
import img_gm_3 from '../../img/Page/info/gmlee/img03.jpg';
import img_gm_4 from '../../img/Page/info/gmlee/img04.jpg';
import img_gm_5 from '../../img/Page/info/gmlee/img05.jpg';
import img_gm_6 from '../../img/Page/info/gmlee/img06.jpg';
import img_gm_7 from '../../img/Page/info/gmlee/img07.jpg';
import img_gm_8 from '../../img/Page/info/gmlee/img08.jpg';
import img_gm_9 from '../../img/Page/info/gmlee/img09.jpg';

import img_artpart_1 from '../../img/Page/info/artpart/slide_1.jpg';
import img_artpart_2 from '../../img/Page/info/artpart/slide_2.jpg';
import img_artpart_3 from '../../img/Page/info/artpart/slide_3.jpg';
import img_artpart_4 from '../../img/Page/info/artpart/slide_4.jpg';
import img_artpart_5 from '../../img/Page/info/artpart/slide_5.jpg';
import img_artpart_6 from '../../img/Page/info/artpart/slide_6.jpg';

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
          id: 5,
          img: img_airboard_6,
        },
      ];
    const slideImages_yorijori = [
            {
              id: 0,
              img: img_yorijori_2,
            },
            {
              id: 1,
              img: img_yorijori_1,
            },
            {
              id: 2,
              img: img_yorijori_3,
            },
            {
              id: 3,
              img: img_slide_4,
            },
            {
              id: 4,
              img: img_slide_5,
            },
          ];
     const slideImages_db = [
              {
                id: 0,
                img: img_db_1,
              },
              {
                id: 1,
                img: img_db_2,
              },
            ];
    const slideImages_gmlee = [
      {
        id: 0,
        img: img_gm_1,
      },
      {
        id: 1,
        img: img_gm_2,
      },      {
        id: 2,
        img: img_gm_3,
      },      {
        id: 3,
        img: img_gm_4,
      },      {
        id: 4,
        img: img_gm_5,
      },      {
        id: 5,
        img: img_gm_6,
      },      {
        id: 6,
        img: img_gm_7,
      },      {
        id: 7,
        img: img_gm_8,
      }
    ];
    const slideImages_artpart = [
      {
        id: 0,
        img: img_artpart_1,
      },
      {
        id: 1,
        img: img_artpart_2,
      },      {
        id: 2,
        img: img_artpart_3,
      },      {
        id: 3,
        img: img_artpart_4,
      },      {
        id: 4,
        img: img_artpart_5,
      },      {
        id: 5,
        img: img_artpart_6,
      }
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
                <InfoSlide slideImages={slideImages_yorijori}/>
                <InfoContentsDetail title={'1. 개요'} text={`요리조리는 음식 레시피를 공유할 수 있는 커뮤니티 사이트이다.
현재 사회는 많은 배달 시스템과 인프라가 잘 구축되어 있다. 하지만 음식을 직접 하려고 한다면 음식 레시피를
찾아봐야 한다. 음식에 대한 레시피를 찾아보기 위해서는 여전히 음식 레시피 책을 찾아보거나 포털 사이트 안에서
음식 레시피를 검색을 하는 방식으로 찾아보고 있다. 이 경우에는 레시피를 찾기가 번거로울 뿐더러 그 레시피가
맛이 좋은 레시피인지도 알기 위해서는 번거롭게 더 많은 정보를 찾아보아야 한다.
이러한 불편한 점을 통해 음식의 레시피를 공유할 수 있는 사이트를 개발하면 좋을 것이라 생각하였고, 별점 리뷰
시스템을 제공하여 양질의 레시피인지도 확인이 가능하도록 하였다.
`}/>
                <InfoContentsDetail title={'2. 기능 설명'} />
                <div style={{marginLeft:'15px'}}>
                <InfoContentsDetail title={'2-1. 회원 가입'} titleFont={'30px'} titleMargin={'20px'}/>
                <img src={img_yorijori_1} style={{width:'1000px'}} alt=""/>
                <InfoContentsDetail text={`비 회원은 글 읽기 까지만 가능하며, 회원 가입 진행 후 커뮤니티 이용이 가능하다.

    1. Email 주소는 알맞은 형식만 입력해야 하며, 올바르지 않은 형식 제출시 재 입력을 받는다.
    2. 별명은 중복되지 않도록 처리하며, 중복된 별명 제출시 재 입력을 받는다.
    3. 비밀번호는 숫자,문자,특수문자가 포함되어야 하며 제출시 암호화 처리를 한다.`}/>
                <InfoContentsDetail title={'2-2. 메인 화면'} titleFont={'30px'} titleMargin={'20px'}/>
                <img src={img_yorijori_2} style={{width:'1000px'}} alt=""/>
                <InfoContentsDetail text={`로그인 후 확인할 수 있는 메인 페이지이다.

    1. 최근에 올라온 순으로 나열된 최신 레시피목록을 확인할 수 있다.
    2. 평점이 높은 순으로 나열된 HOT 레시피 목록을 확인할 수 있다.
`}/>
                <InfoContentsDetail title={'2-3. 글쓰기'} titleFont={'30px'} titleMargin={'20px'}/>
                <img src={img_yorijori_3} style={{width:'1000px'}} alt=""/>
                <InfoContentsDetail text={`회원은 자유롭게 글쓰기가 가능하다.

    1. 레시피의 분류를 한식, 중식, 일식, 양식, 기타 중 선택할 수 있다.
    2. 본문에는 이미지를 첨부할 수 있으며 내용을 자유롭게 작성할 수 있다.
`}/>
                <InfoContentsDetail title={'2-4. 작성글'} titleFont={'30px'} titleMargin={'20px'}/>
                <img src={img_yorijori_4} style={{width:'1000px'}} alt=""/>
                <InfoContentsDetail text={`회원은 글을 확인하고 댓글과 평점을 남길 수 있다.

    1. 평점 작성 인원과 평점 정보를 확인할 수 있다.
    2. 평점을 1, 1.5, 2 ..., 5까지 작성 가능하다. (중복 제출은 불가능하다.)
    3. 댓글을 자유롭게 작성 가능하다.
    4. 작성한 댓글을 확인할 수 있고, 본인이 작성한 댓글이라면 삭제가 가능하다.
`}/>
                <InfoContentsDetail title={'2-5. 게시판'} titleFont={'30px'} titleMargin={'20px'}/>
                <img src={img_yorijori_5} style={{width:'1000px'}} alt=""/>
                <InfoContentsDetail text={`게시판에서 정렬된 글 목록들을 확인 가능하다.

    1. 사용자는 글의 분류를 확인 가능하다.
    2. 글을 최근순, 평점순으로 정렬이 가능하다.
    3. 레시피의 분류를 한식, 일식, 중식, 양식, 기타, 전체로 지정 가능하고 검색이 가능하다.
    4. 글을 10개 기준으로 페이지를 나누어 정렬하였다.
    5. 회원은 글 작성이 가능하다. (비 회원은 불가능)
`}/>
                <InfoContentsDetail title={'2-6. 내가 쓴 글'} titleFont={'30px'} titleMargin={'20px'}/>
                <img src={img_yorijori_6} style={{width:'1000px'}} alt=""/>
                <InfoContentsDetail text={`본인이 쓴 글을 확인 가능하고, 글의 삭제 및 수정이 용이하게 하였다.
`}/>
            </div>
            <InfoContentsDetail title={'3. -----'} />
            </div>
        )
    if(idx===4)
        return (
            <div className='info-contents'>
                <div className='info-contents-title'>Gunmo's Dev Life</div>
                <div className='info-contents-period'>{cImg} 2021.12 ~ </div>
                <div className='info-contents-tech'><div className='tech-box'>React</div><div className='tech-box'>Firebase</div><div className='tech-box'>NodeJS</div></div>
                <InfoSlide slideImages={slideImages_gmlee}/>
                <InfoContentsDetail title={'1. 개요'} text={`웹 프로젝트들을 진행해보며 나도 실제로 내 관련 이야기들을 담을 수 있는 사이트를 
하나 남길 수 있었으면 좋겠다고 생각하였다. 그렇지만 개인용 사이트를 만든다 하면 서버 비용 등 생각할 것이 많아서
고민하던 찰나에 깃허브 페이지라는 서비스를 알게 되었고 이것을 통해 내 사이트를 한번 만들어 보자 하고 시작하였다.
대부분의 프론트 기반 움직임은 리액트를 통하여 구현하였고, 데이터 베이스가 필요한 작업들은 작게나마 파이어베이스의
파이어 스토어를 통하여 구현하였다.
`}/>
                                <InfoContentsDetail title={'2. 페이지 설명'} />
                <div style={{marginLeft:'15px'}}>
                <InfoContentsDetail title={'2-1. MAIN'} titleFont={'30px'} titleMargin={'20px'}/>
                <img src={img_gm_1} style={{width:'1000px'}} alt=""/>
                <InfoContentsDetail text={`사이트에 접속시 처음으로 볼 수 있는 페이지이다.
나에 대한 전반적인 정보를 담고있다. 최대한 화면 크기에 맞게 반응하도록 페이지를 설계하였다.`}/></div>
                <div style={{marginLeft:'15px'}}>
                <InfoContentsDetail title={'2-2. ABOUT'} titleFont={'30px'} titleMargin={'20px'}/>
                <img src={img_gm_2} style={{width:'1000px'}} alt=""/>
                <InfoContentsDetail text={`메뉴 중 'ABOUT' 버튼을 클릭시 렌더링 되는 페이지이다.
나에 대한 세부적인 정보를 담고있다.`}/></div>
                <div style={{marginLeft:'15px'}}>
                <InfoContentsDetail title={'2-3. PROJECT'} titleFont={'30px'} titleMargin={'20px'}/>
                <img src={img_gm_3} style={{width:'1000px'}} alt=""/>
                <InfoContentsDetail text={`메뉴 중 'PROJECT' 버튼을 클릭시 렌더링 되는 페이지이다.
내가 진행했던 개인/팀프로젝트에 대한 내용을 확인해볼 수 있다.`}/></div>
                <div style={{marginLeft:'15px'}}>
                <InfoContentsDetail title={'2-4. GAMES-멜론게임'} titleFont={'30px'} titleMargin={'20px'}/>
                <img src={img_gm_4} style={{width:'1000px'}} alt=""/>
                <InfoContentsDetail text={`메뉴 중 'GAMES'의 멜론 게임을 클릭시 렌더링 되는 페이지이다.
HTML의 캔버스로 작업을 했고 직접 하나하나 고민해가며 만든 게임이라 애정이 있는 게임이다.
나름 재밌으므로 한번쯤 해보는 것을 추천한다.`}/></div>
                <div style={{marginLeft:'15px'}}>
                <InfoContentsDetail title={'2-5. GAMES-반응속도 테스트'} titleFont={'30px'} titleMargin={'20px'}/>
                <img src={img_gm_5} style={{width:'1000px'}} alt=""/>
                <InfoContentsDetail text={`메뉴 중 'GAMES'의 반응속도 테스트를를 클릭시 렌더링 되는 페이지이다.
가끔 심심할 때 마다 반응속도 테스트를 타 사이트에서 해보았는데 나도 만들어볼 수 있을 것 같아서 만든 게임이다.
`}/></div>
                <div style={{marginLeft:'15px'}}>
                <InfoContentsDetail title={'2-6. GUEST BOX'} titleFont={'30px'} titleMargin={'20px'}/>
                <img src={img_gm_6} style={{width:'1000px'}} alt=""/>
                <InfoContentsDetail text={`메뉴 중 'GUEST BOX'를 클릭시 렌더링 되는 페이지이다.
방명록 하나 쯤 있으면 좋을 것 같아서 만들어 봤다. 실제 있는 패드를 CSS를 이용해 디자인 해보았다.`}/></div>
                <div style={{marginLeft:'15px'}}>
                <InfoContentsDetail title={'2-7. GALLERY'} titleFont={'30px'} titleMargin={'20px'}/>
                <img src={img_gm_7} style={{width:'1000px'}} alt=""/>
                <InfoContentsDetail text={`메뉴 중 'GALLERY'를 클릭시 렌더링 되는 페이지이다.
내가 찍은 사진들을 넣어보았다. 생각보다 사진이 많지는 않지만 나름 추가해 보았다.
클릭하면 사진을 크게 볼 수 있다.`}/></div>
                <div style={{marginLeft:'15px'}}>
                <InfoContentsDetail title={'2-8. Archive'} titleFont={'30px'} titleMargin={'20px'}/>
                <img src={img_gm_8} style={{width:'1000px'}} alt=""/>
                <InfoContentsDetail text={`헤더 메뉴 중 'Archive'를 클릭시 렌더링 되는 페이지이다.
주저리 주저리 그 날 생각나는 것들을 적어보았다.`}/></div>
                <div style={{marginLeft:'15px'}}>
                <InfoContentsDetail title={'2-9. Etc'} titleFont={'30px'} titleMargin={'20px'}/>
                <img src={img_gm_9} style={{width:'1000px'}} alt=""/>
                <InfoContentsDetail text={`기타 추가적인 기능들이다.
헤더 메뉴 중 Contact를 누르면 내 연락처가 화면에 보이게 하였고, Floating 버튼을 화면에 추가하여
도움을 주는 기능들을 추가하였다.`}/></div>
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
        if(idx===6)
            return (
                <div className='info-contents'>
                    <div className='info-contents-title'>일단 뭔가 만든 Unity 게임</div>
                    <div className='info-contents-period'>{cImg} 2019.03 ~ 2019.04</div>
                    <div className='info-contents-tech'><div className='tech-box'>Unity</div><div className='tech-box'>C#</div></div>
                    <InfoSlide slideImages={slideImages}/>
                    <InfoContentsDetail title={'타이틀'} text={'텍스트'}/>
                    <InfoContentsDetail title={'타이틀'} text={'텍스트'}/>
                </div>
            )
        if(idx===7)
            return (
                <div className='info-contents'>
                    <div className='info-contents-title'>GM Movie</div>
                    <div className='info-contents-period'>{cImg} 2020.09 ~ 2020.12</div>
                    <div className='info-contents-tech'><div className='tech-box'>Python</div><div className='tech-box'>Flask</div><div className='tech-box'>MySQL</div></div>
                    <InfoSlide slideImages={slideImages_db}/>
                    <InfoContentsDetail title={'1. 개요'} text={`GM Movie는 2020년 2학기 데이터 베이스 수업 중 MySQL 을 활용 해보기 위해 진행한 프로젝트 이다.
혼자서 진행한 소규모 프로젝트 였으나 기본적인 CRUD / DDL, DML문 학습 및 Flask를 써볼 수 있는 기회였다.`}/>
                    <InfoContentsDetail title={'2. 기능 설명'} />
            <div style={{marginLeft:'15px'}}>
            <InfoContentsDetail title={'2-1. CREATE'} titleFont={'30px'} titleMargin={'20px'}/>
            <img src={img_db_3} style={{width:'1000px'}} alt=""/>
            <InfoContentsDetail text={`각 요소들의 특성에 따라 제약 조건을 설정하여 테이블을 생성하였다.
추가적으로 ACTORS, MOVIES, ORDERS, MOVIEQUEUE, APPEARED_IN 테이블이 있다.
                `}/></div>
            <div style={{marginLeft:'15px'}}>
            <InfoContentsDetail title={'2-2. READ'} titleFont={'30px'} titleMargin={'20px'}/>
            <img src={img_db_4} style={{width:'1000px'}} alt=""/>
            <InfoContentsDetail text={`구현하려는 기능들을 위해 필요한 READ 쿼리문이다.
`}/></div>
<div style={{marginLeft:'15px'}}>
      <InfoContentsDetail title={'2-3. UPDATE'} titleFont={'30px'} titleMargin={'20px'}/>
      <img src={img_db_5} style={{width:'1000px'}} alt=""/>
      <InfoContentsDetail text={`구현하려는 기능들을 위해 필요한 UPDATE 쿼리문이다.
`}/></div>
<InfoContentsDetail title={'3. DB 모델링'} />
<img src={img_db_2} style={{width:'1000px'}} alt=""/>
                </div>
            )
            if(idx===8)
              return (
                  <div className='info-contents'>
                      <div className='info-contents-title'>ArtPart</div>
                      <div className='info-contents-period'>{cImg} 2025.02 - 2025.02</div>
                      <div className='info-contents-tech'><div className='tech-box'>JSP</div><div className='tech-box'>Spring</div><div className='tech-box'>MyBatis</div><div className='tech-box'>MySQL</div></div>
                      <InfoSlide slideImages={slideImages_artpart}/>
                      <InfoContentsDetail title={'1. 개요'} text={`ArtPart`}/>
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
    return <div></div>
}

export default InfoContents;