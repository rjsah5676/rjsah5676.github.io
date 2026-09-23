"use client";

import { useEffect } from "react";

function getNumberFromPixel(px) {
  if (px === null || px === "") return 0;
  px = px + "";
  if (px.indexOf("px") > -1) px = px.replace("px", "");
  if (px.indexOf("PX") > -1) px = px.replace("PX", "");
  const result = parseInt(px, 10);
  return Number.isNaN(result) ? 0 : result;
}

// 상단바(Top)의 Contact 모달을 마우스로 드래그해서 옮길 수 있게 해주는 훅.
export function useDraggableContactModal() {
  useEffect(() => {
    const modal = document.getElementById("contact-container");
    if (!modal) return;

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let originLeft = 0;
    let originTop = 0;

    const onMouseMove = (e) => {
      if (!dragging) return;
      modal.style.left = originLeft + (e.clientX - startX) + "px";
      modal.style.top = originTop + (e.clientY - startY) + "px";
    };

    const onMouseUp = () => {
      dragging = false;
      modal.style.cursor = "grab";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    const onMouseDown = (e) => {
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      originLeft = getNumberFromPixel(modal.style.left);
      originTop = getNumberFromPixel(modal.style.top);
      modal.style.cursor = "grabbing";
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    };

    modal.addEventListener("mousedown", onMouseDown);
    return () => modal.removeEventListener("mousedown", onMouseDown);
  }, []);
}

export function openContactModal(open) {
  const ct = document.getElementById("contact-container");
  if (!ct) return;
  ct.style.left = (window.innerWidth - ct.offsetWidth) / 2 + "px";
  ct.style.top = window.innerHeight / 4 + "px";
  ct.style.opacity = open;
  // Top(z-50)/Nav(z-30)보다 위에 떠야 함
  ct.style.zIndex = open === 1 ? 60 : -1;
}
