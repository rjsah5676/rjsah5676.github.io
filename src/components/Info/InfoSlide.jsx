"use client";

import { useState } from "react";

export default function InfoSlide({ slideImages }) {
  const [currentIdx, setCurrentIdx] = useState(0);

  const preSlide = () => {
    setCurrentIdx((preIdx) => (preIdx - 1 + slideImages.length) % slideImages.length);
  };
  const nextSlide = () => {
    setCurrentIdx((preIdx) => (preIdx + 1) % slideImages.length);
  };

  return (
    <div className="mb-8">
      <div className="relative mb-2 aspect-video overflow-hidden rounded-xl border border-white/10 bg-[#1C1E24]">
        {slideImages.map((image, index) => (
          <img
            key={index}
            src={image.img.src}
            alt={`slide ${index + 1}`}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              index === currentIdx ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        {/* hover로만 보이면 터치 기기에서 못 눌러서 항상 보이게 함 */}
        <button
          type="button"
          onClick={preSlide}
          aria-label="이전 이미지"
          className="absolute top-1/2 left-2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/40 font-mono text-white transition-colors hover:bg-black/60"
        >
          ◁
        </button>
        <button
          type="button"
          onClick={nextSlide}
          aria-label="다음 이미지"
          className="absolute top-1/2 right-2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/40 font-mono text-white transition-colors hover:bg-black/60"
        >
          ▷
        </button>
      </div>
      <p className="text-center font-mono text-xs text-white/30">
        ◁ ▷ 이미지를 좌/우로 슬라이드 가능합니다.
      </p>
    </div>
  );
}
