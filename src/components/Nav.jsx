"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Nav() {
  useEffect(() => {
    const onScroll = () => {
      const scrollpos = window.pageYOffset;
      const nav = document.getElementById("test-nav");
      const header = document.querySelector(".header");
      if (!nav || !header) return;
      if (scrollpos >= 373) {
        nav.style.position = "fixed";
        nav.style.top = "47px";
        nav.style.opacity = 0.8;
        header.style.marginBottom = "53px";
      } else {
        nav.style.position = "relative";
        nav.style.top = 0;
        nav.style.opacity = 1;
        header.style.marginBottom = "0px";
      }
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    return () => document.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <ul id="test-nav">
      <li>
        <Link href="/about">
          <div className="nav-text">ABOUT</div>
        </Link>
      </li>
      <li>
        <Link href="/project">
          <div className="nav-text">PROJECT</div>
        </Link>
        <ul className="test-sub-game">
          <li>
            <Link href="/project">프로젝트</Link>
          </li>
          <li>
            <Link href="/study">개인공부</Link>
          </li>
        </ul>
      </li>
      <li>
        <Link className="test-menu" href="/melongame">
          <div className="nav-text">GAMES</div>
        </Link>
        <ul className="test-sub-game">
          <li>
            <Link href="/melongame">멜론 게임</Link>
          </li>
          <li>
            <Link href="/rspeed">반응속도 테스트</Link>
          </li>
          <li>
            <Link href="/mine">지뢰찾기</Link>
          </li>
          <li>
            <Link href="/sketch">스케치 퀴즈(미구현)</Link>
          </li>
        </ul>
      </li>
      <li>
        <Link href="/guest">
          <div className="nav-text">GUEST BOX</div>
        </Link>
      </li>
      <li>
        <Link href="/gallery">
          <div className="nav-text">GALLERY</div>
        </Link>
      </li>
      <div id="tesst"></div>
    </ul>
  );
}
