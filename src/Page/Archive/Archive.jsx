import React from "react";
import Faded from "../../effect/Faded";

import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import ArchiveBox from './ArchiveBox';


function Archive() {
    const settings = {
          dots: true,
          infinite: true,
          speed: 500,
          slidesToShow: 1,
          slidesToScroll: 1
        };
    return (
      <Faded className='archive-wrap'>
          <div className='archive-container'>
              <div className='archive-title'>Archive</div>
              <Slider {...settings}>
                <ArchiveBox date={'2024-12-13'} text={<div><p>첫 Archive의 글입니다. 이곳은 저의 그냥 일기장 입니다.<br/>
                    만든지 얼마 안됐기 때문에 어느정도 채워질지는 잘 모르겠습니다.<br/>
                    그래도 생각 날 때마다 채워 나가 볼게요.<br/>
                    아직도 만들어보고 싶은게 많거든요.<br/>
                    페이지는 넘기면서 확인 가능합니다.<br/>

                    </p><p style={{fontFamily:'Prompt', fontSize:'15px'}}>＼＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿／<br/>
                                                                                       　　ｏ<br/>
                                                                                       　　 。<br/>
                                                                                       　　　｡<br/>
                                                                                       　　∧＿∧<br/>
                                                                                       　 (*　･ω･)<br/>
                                                                                       ＿(__つ/￣￣￣/_<br/>
                                                                                       　　＼/　　　/<br/></p></div>}/>
                <ArchiveBox date={'2024-12-16'} text={(<p>벌써 월요일이다. 언제나 월요일은 새롭고 좋진 않다.<br/>
                    오늘은 오픈소스 react-slick을 활용하여 Archive 페이지를 생성해보았다.<br/>
                    그저께 먹은 고기 사진이랑 MBTI 사진을 추가하였다.<br/>
                    오늘 부로 모든 페이지의 기능들을 다 완성하였다.<br/>
                    구조도 정리하고 최대한 문제 없게 돌아가도록 정리를 더해 볼 예정이다.<br/>
                    아직 소개 페이지, 프로젝트 페이지 등등 채울 내용도 너무 많이 남았다.<br/>
                    아무튼 열심히 만들어 나가보자 . . .</p>)}/>
              </Slider>
          </div>
      </Faded>
    );
}

export default Archive;
