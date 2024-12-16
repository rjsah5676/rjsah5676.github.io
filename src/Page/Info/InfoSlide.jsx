import React, { useState } from "react";

import leftArrowImg from '../../img/Page/info/left_arrow.png';
import rightArrowImg from '../../img/Page/info/right_arrow.png';

function InfoSlide({slideImages}) {
    const [currentIdx, setCurrentIdx] = useState(0);

    /* 자동 넘겨주기 함수
          useEffect(() => {
            const interval = setInterval(() => {
              nextSlide();
            }, 10000);

            return () => clearInterval(interval);
          }, [currentIdx]);
      */
      const preSlide = () => {
        setCurrentIdx(
          (preIdx) => (preIdx - 1 + slideImages.length) % slideImages.length
        );
      };
      const nextSlide = () => {
        setCurrentIdx((preIdx) => (preIdx + 1) % slideImages.length);
      };
    return(
        <div className='info-contents-img'>
            <div className='banner_wrap'>
              <div className='slide_banner'>
                {slideImages.map((image, index) => (
                  <img
                    key={index}
                    className={`${'banner_image'} ${
                      index === currentIdx ? 'active' : ""
                    }`}
                    src={image.img}
                    alt={`slide ${index}`}
                  />
                ))}
                <div className='pre_arrow'>
                  <img onClick={preSlide} src={leftArrowImg} alt=""/>
                </div>
                <div className='next_arrow'>
                  <img onClick={nextSlide} src={rightArrowImg} alt=""/>
                </div>
              </div>
            </div>
            {`◁ ▷ 이미지를 좌/우로 슬라이드 가능합니다.`}
        </div>
    );
}

export default InfoSlide;