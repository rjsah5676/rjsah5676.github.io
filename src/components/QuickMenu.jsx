"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

function getNumberFromPixel(px) {
  if (px === null || px === "") return 0;
  px = px + "";
  if (px.indexOf("px") > -1) px = px.replace("px", "");
  if (px.indexOf("PX") > -1) px = px.replace("PX", "");
  const result = parseInt(px, 10);
  return Number.isNaN(result) ? 0 : result;
}

export default function QuickMenu() {
  const router = useRouter();
  const initialized = useRef(false);

  useEffect(() => {
    // React 19 StrictMode(dev)는 effect를 두 번 실행하는데, jQuery로 만든 버튼들이
    // 중복 생성되면 안 되니 한 번만 초기화되게 막음.
    if (initialized.current) return;
    initialized.current = true;

    let cleanupFns = [];

    (async () => {
      // jquery/jquery-ui-dist/animejs는 window를 직접 참조하기 때문에
      // 정적 export 빌드(Node 환경)에서 로드되면 안 됨 -> 브라우저에서만, 여기서만 로드.
      const [{ default: Menu }, { default: Item }] = await Promise.all([
        import("@/lib/quickMenu/Menu"),
        import("@/lib/quickMenu/Item"),
      ]);

      const menu = new Menu("#myMenu");
      const item1 = new Item("list", "fas fa-bars", "");
      const item2 = new Item("home", "fas fa-sign-out-alt", "", "");
      const item3 = new Item("up", "fas fa-id-card", "", "");
      const item4 = new Item("my-info", "fas fa-exchange-alt", "", ``);
      const item5 = new Item("info-contents", "fas fa-exchange-alt", "", "");

      menu.add(item1);
      menu.add(item2);
      menu.add(item3);
      menu.add(item4);
      menu.add(item5);

      const menuList = document.getElementById("list");
      const homeButton = document.getElementById("home");
      const upButton = document.getElementById("up");
      const myInfoButton = document.getElementById("my-info");
      const contents = document.getElementById("info-contents");

      contents.innerHTML = `
        <div id='contents-line'></div>
        <ul>
            <li><div id='dot'>●</div><div id='contents-date'>1997.12 ~ </div><div id='contents-text'>출생</div></li>
            <li><div id='dot'>●</div><div id='contents-date'>2013.03 ~ 2016.02</div><div id='contents-text'>풍생고등학교 입학</div></li>
            <li><div id='dot'>●</div><div id='contents-date'>2016.03 ~ 2022.02</div><div id='contents-text'>아주대학교 소프트웨어학과 입학</div></li>
            <li><div id='dot'>●</div><div id='contents-date'>2017.03 ~ 2018.12</div><div id='contents-text'>육군 5사단 근무</div></li>
            <li><div id='dot'>●</div><div id='contents-date'>2021.06 ~ 2021.08</div><div id='contents-text'>(주) 트루피플 인턴 실습</div></li>
            <li><div id='dot'>●</div><div id='contents-date'>2025.03 ~ 2025.05</div><div id='contents-text'>미묘 핸드메이드 프로젝트 팀장</div></li>
        </ul>
      `;

      const onHome = () => router.push("/");
      const onUp = () => window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      let clicked = false;
      const onMenuMouseDown = () => {
        if (clicked) {
          contents.style.opacity = 0;
          clicked = !clicked;
        }
      };
      const onMyInfoClick = () => {
        if (!clicked) {
          contents.style.left = getNumberFromPixel(myInfoButton.style.left) - 470 + "px";
          contents.style.top = getNumberFromPixel(myInfoButton.style.top) - 220 + "px";
          contents.style.opacity = 1;
        } else {
          contents.style.opacity = 0;
        }
        clicked = !clicked;
      };

      homeButton.addEventListener("click", onHome);
      upButton.addEventListener("click", onUp);
      menuList.addEventListener("mousedown", onMenuMouseDown);
      myInfoButton.addEventListener("click", onMyInfoClick);

      cleanupFns.push(() => {
        homeButton.removeEventListener("click", onHome);
        upButton.removeEventListener("click", onUp);
        menuList.removeEventListener("mousedown", onMenuMouseDown);
        myInfoButton.removeEventListener("click", onMyInfoClick);
      });
    })();

    return () => cleanupFns.forEach((fn) => fn());
  }, [router]);

  return (
    <div className="center menu">
      <div id="myMenu"></div>
    </div>
  );
}
