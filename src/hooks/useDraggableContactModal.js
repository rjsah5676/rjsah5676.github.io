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
// 기존 TopHome/TopNone/TopArchive에 3번 복붙되어 있던 로직을 하나로 합침.
export function useDraggableContactModal() {
  useEffect(() => {
    const modal = document.getElementById("contact-container");
    if (!modal) return;

    let clicked = false;
    let f_x = 0;
    let f_y = 0;
    let m_x = 0;
    let m_y = 0;
    let c_x = 0;
    let c_y = 0;

    const onMouseDown = () => {
      if (!clicked) {
        c_x = getNumberFromPixel(modal.style.left);
        c_y = getNumberFromPixel(modal.style.top);
        modal.style.cursor = "grabbing";
        clicked = true;
      }

      const moveModal = () => {
        modal.style.left = c_x + m_x - f_x + "px";
        modal.style.top = c_y + m_y - f_y + "px";
        c_x = getNumberFromPixel(modal.style.left);
        c_y = getNumberFromPixel(modal.style.top);
        f_x = m_x;
        f_y = m_y;
        timeoutId = setTimeout(moveModal, 10);
      };
      let timeoutId = setTimeout(moveModal, 10);

      const onMouseUp = () => {
        clicked = false;
        modal.style.cursor = "grab";
        clearTimeout(timeoutId);
        window.removeEventListener("mouseup", onMouseUp);
        window.removeEventListener("mousemove", onMouseMove);
      };
      const onMouseMove = (e) => {
        if (clicked) {
          m_x = e.clientX;
          m_y = e.clientY;
        }
      };
      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("mousemove", onMouseMove);
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
  ct.style.zIndex = open === 1 ? 10 : -1;
}
