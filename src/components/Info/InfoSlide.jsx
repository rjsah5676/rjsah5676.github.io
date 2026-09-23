"use client";

import { useState } from "react";

import leftArrowImg from "@/img/Page/info/left_arrow.png";
import rightArrowImg from "@/img/Page/info/right_arrow.png";

export default function InfoSlide({ slideImages }) {
  const [currentIdx, setCurrentIdx] = useState(0);

  const preSlide = () => {
    setCurrentIdx((preIdx) => (preIdx - 1 + slideImages.length) % slideImages.length);
  };
  const nextSlide = () => {
    setCurrentIdx((preIdx) => (preIdx + 1) % slideImages.length);
  };
  return (
    <div className="info-contents-img">
      <div className="banner_wrap">
        <div className="slide_banner">
          {slideImages.map((image, index) => (
            <img
              key={index}
              className={`banner_image ${index === currentIdx ? "active" : ""}`}
              src={image.img.src}
              alt={`slide ${index}`}
            />
          ))}
          <div className="pre_arrow">
            <img onClick={preSlide} src={leftArrowImg.src} alt="" />
          </div>
          <div className="next_arrow">
            <img onClick={nextSlide} src={rightArrowImg.src} alt="" />
          </div>
        </div>
      </div>
      {"◁ ▷ 이미지를 좌/우로 슬라이드 가능합니다."}
    </div>
  );
}
