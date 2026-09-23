"use client";

import { useState } from "react";
import Faded from "@/components/Faded";

import img_1 from "@/img/Gallery/img_1.jpg";
import img_2 from "@/img/Gallery/img_2.jpg";
import img_3 from "@/img/Gallery/img_3.jpg";
import img_4 from "@/img/Gallery/img_4.jpg";
import img_5 from "@/img/Gallery/img_5.jpg";
import img_6 from "@/img/Gallery/img_6.jpg";
import img_7 from "@/img/Gallery/img_7.jpg";
import img_8 from "@/img/Gallery/img_8.jpg";
import img_9 from "@/img/Gallery/img_9.jpg";
import img_10 from "@/img/Gallery/img_10.jpg";
import img_11 from "@/img/Gallery/img_11.jpg";
import img_12 from "@/img/Gallery/img_12.jpg";
import img_13 from "@/img/Gallery/img_13.jpg";
import img_14 from "@/img/Gallery/img_14.jpg";
import img_15 from "@/img/Gallery/img_15.jpg";
import img_16 from "@/img/Gallery/img_16.jpg";
import img_17 from "@/img/Gallery/img_17.jpg";
import img_18 from "@/img/Gallery/img_18.jpg";
import img_19 from "@/img/Gallery/img_19.jpg";
import img_20 from "@/img/Gallery/img_20.jpg";

const arr = [
  img_1, img_2, img_3, img_4, img_5, img_6, img_7, img_8, img_9, img_10,
  img_11, img_12, img_13, img_14, img_15, img_16, img_17, img_18, img_19, img_20,
].map((img) => img.src);

const PER_PAGE = 8;

export default function GalleryPage() {
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(arr.length / PER_PAGE);
  const pageImages = arr
    .map((src, i) => ({ src, i }))
    .slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  return (
    <Faded>
      <div className="mx-auto max-w-4xl px-6 pt-16 pb-24">
        <div className="mb-10 font-mono text-sm text-[#8B84FF]">gallery</div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
          {pageImages.map(({ src, i }) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              className="aspect-square cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-cover bg-center transition-transform duration-300 hover:scale-[1.03]"
              style={{ backgroundImage: `url(${src})` }}
              aria-label={`사진 ${i + 1}`}
            />
          ))}
        </div>

        <div className="mt-10 flex items-center justify-center gap-4 font-mono text-sm text-white/60">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 transition-colors hover:border-[#6C63FF]/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            ◀
          </button>
          <span>
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 transition-colors hover:border-[#6C63FF]/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            ▶
          </button>
        </div>
      </div>

      {selected !== null && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-6"
          onClick={() => setSelected(null)}
        >
          <img
            src={arr[selected]}
            alt=""
            className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="absolute top-6 right-6 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 font-mono text-white transition-colors hover:bg-white/20"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
      )}
    </Faded>
  );
}
