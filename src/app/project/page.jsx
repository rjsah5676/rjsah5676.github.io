"use client";

import { useState } from "react";
import Faded from "@/components/Faded";
import InfoBox from "@/components/Info/InfoBox";

import airBoardImg from "@/img/Page/info/AirBoard.png";
import yoriJoriImg from "@/img/Page/info/YoriJori.png";
import logoImg from "@/img/Page/info/logo.png";
import taxImg from "@/img/Page/info/yctest/slide_1.jpg";
import acmicpcImg from "@/img/Page/info/acmicpc.png";
import unityImg from "@/img/Page/info/unity.png";
import dbImg from "@/img/Page/info/dbproj.png";
import artpartImg from "@/img/Page/info/artpart/artpart.jpg";
import kickeatImg from "@/img/Page/info/kickeat/img_kickeat_0.jpg";
import mimyoImg from "@/img/Page/info/mimyo/mimyo.jpg";
import wooriboardImg from "@/img/Page/info/wooriboard.jpg";

function TechPills({ items }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((t) => (
        <span
          key={t}
          className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-xs text-white/50"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

const teamProjects = [
  {
    idx: 10,
    imgLink: mimyoImg,
    gitLink: "https://github.com/rjsah5676/MIMYO",
    title: "커머스 핸드메이드 쇼핑몰 [MIMYO]",
    desc: "[실시간] [커뮤니케이션] [편의성]을 제공하는 핸드메이드 쇼핑몰",
    tech: ["React", "SpringBoot", "Redux", "WebSocket", "JPA"],
    secondLink: "https://drive.google.com/file/d/1ZVTpuval2WbT_x1n-3tOS7dhkpnCJQ8C/view",
  },
  {
    idx: 1,
    imgLink: airBoardImg,
    gitLink: "https://github.com/rjsah5676/Capstone-Design-2021-1-",
    title: "캠 필기 웹 화상 회의 서비스 [AirBoard]",
    desc: "웹 캠을 통한 필기 기능을 제공하는 화상 회의 플랫폼입니다.",
    tech: ["Javascript", "WebRTC", "OpenCV", "NodeJS", "MongoDB"],
    secondLink: "https://softcon.ajou.ac.kr/works/works_prev.asp?uid=421&wTerm=2021-1",
  },
  {
    idx: 9,
    imgLink: kickeatImg,
    gitLink: "https://github.com/rjsah5676/KickEat",
    title: "당신을 위한 맛집 도우미 [KickEat]",
    desc: "서울시 음식점 검색 및 추천 사이트입니다.",
    tech: ["React", "Springboot", "JPA", "MySQL"],
  },
  {
    idx: 8,
    imgLink: artpartImg,
    gitLink: "https://github.com/rjsah5676/ArtPart",
    title: "예술과 호텔의 만남 [ArtPart]",
    desc: "예술을 접할수 있는 호텔 사이트입니다.",
    tech: ["JSP", "Spring", "MyBatis", "MySQL"],
  },
  {
    idx: 2,
    imgLink: taxImg,
    gitLink: "https://github.com/rjsah5676/Tax-Investigation",
    title: "[영천시 세무조사 홈페이지]",
    desc: "세무 신고서 작성 및 조회기능을 제공하는 영천시 세무조사 웹 사이트 입니다.",
    tech: ["JSP", "Spring", "Javascript", "MySQL"],
  },
];

const personalProjects = [
  {
    idx: 11,
    imgLink: wooriboardImg,
    gitLink: "https://github.com/rjsah5676/WooriBoard",
    title: "음성채팅 커뮤니티 [Oh! Sori]",
    desc: "실시간 채팅 음성채팅 제공 커뮤니티 사이트",
    tech: ["NextJS", "Express", "WebRTC", "TailWind", "MongoDB"],
    secondLink: "https://ohsori.my/",
  },
  {
    idx: 3,
    imgLink: yoriJoriImg,
    gitLink: "https://github.com/rjsah5676/WebProject",
    title: "음식 레시피 공유 사이트 [요리조리]",
    desc: "음식 레시피를 공유하는 커뮤니티 웹 사이트입니다.",
    tech: ["React", "NodeJS", "Ajax", "JQuery", "MongoDB"],
  },
  {
    idx: 4,
    imgLink: logoImg,
    gitLink: "https://github.com/rjsah5676/rjsah5676.github.io",
    title: "[Gunmo's Dev Life]",
    desc: "React를 사용하여 만든 나를 소개하는 사이트입니다.",
    tech: ["Next.js", "TypeScript", "Tailwind", "Firebase"],
    secondLink: "https://rjsah5676.github.io/",
  },
  {
    idx: 5,
    imgLink: acmicpcImg,
    gitLink: "https://github.com/rjsah5676/ACMICPC",
    title: "알고리즘 [BAEKJOON Online Judge]",
    desc: "알고리즘을 배우기 위해 문제를 푼 사이트 입니다.",
    tech: ["C++", "Java", "Python"],
    secondLink: "https://solved.ac/profile/rjsah5676",
  },
  {
    idx: 7,
    imgLink: dbImg,
    gitLink: "https://github.com/rjsah5676/DBProject",
    title: "[GM Movie]",
    desc: "MySQL 학습을 위한 영화 정보 검색 사이트",
    tech: ["Python", "Flask", "MySQL"],
  },
  {
    idx: 6,
    imgLink: unityImg,
    gitLink: "https://github.com/rjsah5676/Unity-Programming",
    title: "[일단 뭔가 만든 Unity 게임]",
    desc: "Unity를 사용하여 만든 간단한 게임입니다.",
    tech: ["Unity", "C#"],
  },
];

export default function ProjectPage() {
  const [tab, setTab] = useState("team");
  const list = tab === "team" ? teamProjects : personalProjects;

  return (
    <Faded>
      <div className="mx-auto max-w-3xl px-6 pt-16 pb-24">
        <div className="mb-8 font-mono text-sm text-[#8B84FF]">project</div>

        <div className="mb-10 flex gap-2 font-mono text-sm">
          <button
            type="button"
            onClick={() => setTab("team")}
            className={`cursor-pointer rounded-full border px-4 py-1.5 transition-colors ${
              tab === "team"
                ? "border-[#6C63FF] bg-[#6C63FF]/10 text-white"
                : "border-white/10 text-white/50 hover:text-white"
            }`}
          >
            team
          </button>
          <button
            type="button"
            onClick={() => setTab("personal")}
            className={`cursor-pointer rounded-full border px-4 py-1.5 transition-colors ${
              tab === "personal"
                ? "border-[#6C63FF] bg-[#6C63FF]/10 text-white"
                : "border-white/10 text-white/50 hover:text-white"
            }`}
          >
            personal
          </button>
        </div>

        <div className="flex flex-col gap-5">
          {list.map((p) => (
            <InfoBox
              key={p.idx}
              idx={p.idx}
              imgLink={p.imgLink}
              gitLink={p.gitLink}
              title={p.title}
              desc={p.desc}
              tech={<TechPills items={p.tech} />}
              secondLink={p.secondLink}
            />
          ))}
        </div>
      </div>
    </Faded>
  );
}
