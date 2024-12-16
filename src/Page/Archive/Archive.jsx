import React from "react";
import Faded from "../../effect/Faded";
import '../../css/archive.css';

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
                <ArchiveBox date={'2024-12-12'} text={'안녕하세요'}/>
                <ArchiveBox date={'2024-12-14'} text={'저는 이건모입니다.'}/>
                <ArchiveBox date={'2024-12-16'} text={'테스트좀 할게요'}/>
              </Slider>
          </div>
      </Faded>
    );
}

export default Archive;
