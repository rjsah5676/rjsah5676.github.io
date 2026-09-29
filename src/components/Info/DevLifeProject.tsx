import Link from "next/link";
import type { StaticImageData } from "next/image";
import {
  Arrow,
  Bullets,
  FlowBox,
  LinkPill,
  Section,
  Shot,
  StackTable,
  StatGrid,
  TroubleList,
  type Trouble,
} from "./ProjectDetailUI";

import homeImg from "@/img/Page/info/devlife/home.webp";
import projectImg from "@/img/Page/info/devlife/project.webp";
import infoPageImg from "@/img/Page/info/devlife/infopage.webp";
import archiveImg from "@/img/Page/info/devlife/archive.webp";
import melonImg from "@/img/Page/info/devlife/melon.webp";
import mineImg from "@/img/Page/info/devlife/mine.webp";
import mobileImg from "@/img/Page/info/devlife/mobile.webp";

// ───────────────────────── 데이터 ─────────────────────────

const STATS = [
  { value: "2021", label: "운영 시작" },
  { value: "140+", label: "커밋" },
  { value: "65", label: "TS 파일" },
  { value: "4", label: "미니게임" },
];

const STACK: { group: string; items: string[] }[] = [
  {
    group: "Frontend",
    items: ["Next.js 16 (App Router)", "React 19", "TypeScript 6", "Tailwind CSS 4"],
  },
  { group: "Data / Auth", items: ["Firebase Firestore", "Firebase Authentication"] },
  {
    group: "Infra / CI",
    items: ["GitHub Actions", "GitHub Pages", "Firebase Hosting", "Node.js 24"],
  },
  { group: "Library", items: ["React Quill", "Canvas API", "jQuery UI", "anime.js"] },
  { group: "Tooling", items: ["ESLint", "Prettier"] },
];

interface Feature {
  title: string;
  items: string[];
  images?: { img: StaticImageData; alt: string }[];
}

const FEATURES: Feature[] = [
  {
    title: "프로젝트 소개",
    items: [
      "팀·개인 프로젝트 탭 구성, 프로젝트별 상세 페이지 제공",
      "상세 페이지는 URL 파라미터(/infoPage/[idx]) 기반으로 빌드 시 정적 생성",
      "프로젝트별 이미지 슬라이드, 기간·기술 스택 표기",
    ],
    images: [
      { img: projectImg, alt: "프로젝트 목록" },
      { img: infoPageImg, alt: "프로젝트 상세" },
    ],
  },
  {
    title: "미니게임 4종",
    items: [
      "멜론 게임: Canvas 기반 드래그 퍼즐(합 10·20), 2분 타임어택, BGM·효과음, 랭킹",
      "지뢰찾기: 지뢰 99개 고급 난이도, 첫 클릭 주변 안전 보장, 모바일 길게 누르기 지원",
      "반응속도 테스트: 5회 평균 측정 및 랭킹",
      "스케치 퀴즈: 닉네임·방·채팅까지 구현 (그림판 미완성)",
    ],
    images: [
      { img: melonImg, alt: "멜론 게임" },
      { img: mineImg, alt: "지뢰찾기" },
    ],
  },
  {
    title: "개인공부 · 아카이브",
    items: [
      "관리자 로그인(Firebase Auth) 후 React Quill 에디터로 글 작성·수정·삭제",
      "개인공부 글은 빌드 시 글마다 정적 페이지로 생성해 검색엔진에 노출",
      "아카이브: 사이트 변경 이력·프로젝트·실무를 타임라인으로 기록, 분류 필터·정렬·더보기",
    ],
    images: [{ img: archiveImg, alt: "아카이브" }],
  },
  {
    title: "방명록 · 방문자 · 공통 UI",
    items: [
      "Firestore 방명록, 푸터 방문자 수(Today/Total)·달력·시계 위젯",
      "방문자 수는 브라우저당 하루 1회 집계, 보안 규칙으로 +1 증가만 허용",
      "플로팅 퀵메뉴, 드래그 가능한 Contact 모달, 공통 모달(ESC·뒤로가기로 닫기)",
      "모바일 반응형 대응",
    ],
  },
];

const RENEWAL: { title: string; items: string[] }[] = [
  {
    title: "CRA → Next.js 마이그레이션",
    items: [
      "React 17 · Create React App 구조를 Next.js App Router 정적 export로 재구성",
      "Firebase SDK v8 → v9+ 모듈러 전환 (webpack 4 호환 문제로 react-scripts 5 선행 업그레이드)",
      "라우터 state로 넘기던 값을 URL 파라미터로 바꿔 새로고침 시 상태 유실 해결",
      "스타일을 Tailwind CSS 중심으로 이전",
    ],
  },
  {
    title: "TypeScript 전면 전환",
    items: [
      "전체 소스 65개 파일을 .ts/.tsx로 전환, allowJs 비활성화",
      "Firestore 데이터 계층(게시글·방명록·랭킹·방문자)에 타입 정의",
      "jQuery·anime.js 기반 레거시 퀵메뉴 모듈까지 클래스 타입 적용",
    ],
  },
  {
    title: "검색엔진 최적화(SEO)",
    items: [
      "페이지별 title·description·canonical, Open Graph·Twitter 카드",
      "sitemap.xml·robots.txt 생성, Google Search Console 등록",
      "JSON-LD 구조화 데이터 (Person, WebSite, BlogPosting)",
    ],
  },
  {
    title: "빌드·배포 자동화",
    items: [
      "GitHub Actions: npm ci, .nvmrc 기반 Node 버전 고정",
      "GitHub Pages + Firebase Hosting 동시 배포, Firebase 주소는 301로 대표 도메인 통일",
      "새 글 반영용 수동 실행 및 매일 04:00 KST 자동 재빌드",
    ],
  },
  {
    title: "품질 · 성능",
    items: [
      "대표 이미지 PNG → WebP (580KB → 90KB)",
      "ESLint·Prettier 도입 및 전체 포맷 통일",
      "저장형 XSS, 게임 BGM 누수, 모달 레이어 등 기존 버그 정리",
    ],
  },
];

const TROUBLES: Trouble[] = [
  {
    title: "정적 export에서 개인공부 목록이 HTML에 남지 않음",
    problem: "빌드된 /study 페이지 HTML에 글 링크가 하나도 없어 크롤러가 글을 찾지 못함",
    cause:
      "?category= 처리에 쓴 useSearchParams가 정적 export에서 컴포넌트 전체를 클라이언트 렌더링으로 전환(bailout)",
    solution:
      "쿼리는 마운트 후 location에서 읽도록 변경하고, 카테고리별 목록을 모두 렌더한 뒤 hidden으로 토글해 HTML에 전체 링크를 유지",
  },
  {
    title: "Firestore 연결 실패 시 글 0개로 배포될 위험",
    problem: "CI에서 Firestore에 접속하지 못해도 빌드가 성공하고 빈 개인공부 페이지가 생성됨",
    cause: "getDocs는 서버에 연결하지 못하면 에러 대신 로컬 캐시(빈 결과)로 resolve",
    solution:
      "빌드용 조회를 getDocsFromServer로 교체해 서버 응답이 없으면 빌드를 실패시키고 기존 배포를 유지",
  },
  {
    title: "페이지를 이동해도 멜론 게임 BGM이 계속 재생",
    problem: "게임 화면을 벗어난 뒤에도 음악과 게임 루프가 계속 동작",
    cause:
      "오디오·타이머가 모듈 스코프에 있고, 중복 초기화 가드 때문에 StrictMode 두 번째 마운트에서 cleanup이 등록되지 않음",
    solution: "가드 없는 별도 effect에서 언마운트 시 오디오 정지·타이머 해제를 수행",
  },
  {
    title: "모달을 닫은 직후 페이지 이동이 되돌려짐",
    problem:
      "모바일 뒤로가기로 닫히도록 쌓아둔 히스토리를 정리하는 과정에서 직후의 router.push가 취소됨",
    cause: "모달 cleanup의 history.back()이 호출부의 이동보다 늦게 처리됨",
    solution: "히스토리 정리(popstate)가 끝난 뒤에 모달 Promise를 resolve하도록 순서를 보장",
  },
  {
    title: "게임 랭킹의 저장형 XSS",
    problem: "랭킹 이름에 HTML을 넣으면 방문자 브라우저에서 그대로 실행될 수 있음",
    cause: "Firestore에서 읽은 사용자 입력을 innerHTML로 삽입",
    solution: "DOM 노드를 생성해 textContent로 삽입하도록 변경",
  },
];

const HISTORY = [
  { date: "2021.07", text: "Create React App으로 개발 시작, GitHub Pages 배포" },
  { date: "2021.08", text: "멜론 게임 제작" },
  { date: "2024.12", text: "프로젝트 상세·소개·방명록·아카이브 페이지 구성" },
  { date: "2025.01", text: "사이트 전면 리디자인, 퀵메뉴·Contact 모달 추가" },
  { date: "2025.05", text: "개인공부 게시판, 지뢰찾기 추가" },
  { date: "2026.09", text: "Next.js · TypeScript 전면 리뉴얼, SEO·배포 자동화" },
];

// ───────────────────────── 페이지 ─────────────────────────

export default function DevLifeProject() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* 헤더 */}
      <div className="mb-3 font-mono text-sm text-[#8B84FF]">personal project</div>
      <h1 className="font-mono text-3xl font-bold text-white sm:text-4xl">Gunmo&apos;s Dev Life</h1>
      <p className="mt-3 font-['Nanum_Gothic',sans-serif] text-white/60">
        2021년부터 운영 중인 개인 포트폴리오 사이트이자, 새로 익힌 기술을 직접 적용해보는 개발
        실험장
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2 font-mono text-xs">
        <span className="rounded-full border border-white/10 px-3 py-1 text-white/50">
          2021.07 – 운영 중
        </span>
        <LinkPill href="https://github.com/rjsah5676/rjsah5676.github.io">GitHub ↗</LinkPill>
        <LinkPill href="https://rjsah5676.github.io/">사이트 ↗</LinkPill>
      </div>

      <div className="mt-8">
        <Shot img={homeImg} alt="메인 화면" />
      </div>

      <StatGrid stats={STATS} />

      <Section num="01" title="개요">
        <div className="flex flex-col gap-3 font-['Nanum_Gothic',sans-serif] text-sm leading-relaxed text-white/70">
          <p>
            Create React App으로 시작한 개인 사이트로, 프로젝트 소개 외에 개인공부 기록, 방명록,
            미니게임을 함께 운영하며 새로 배운 기술을 실제 서비스 형태로 적용해왔습니다.
          </p>
          <p>
            2026년 9월에는 오래된 React 17·CRA 구조를{" "}
            <b className="text-white">Next.js App Router와 TypeScript</b> 기반으로 전면 리뉴얼하고,
            검색엔진 노출(SEO)과 빌드·배포 자동화까지 정비했습니다. 별도 서버 없이 정적 호스팅만으로
            운영하되, 데이터는 빌드 시점 정적 생성과 클라이언트 Firestore 조회로 나누어 처리합니다.
          </p>
        </div>
      </Section>

      <Section num="02" title="기술 스택">
        <StackTable rows={STACK} />
      </Section>

      <Section num="03" title="아키텍처">
        <div className="rounded-xl border border-white/10 p-4 sm:p-5">
          <div className="mb-3 font-mono text-[11px] text-white/40">빌드 · 배포</div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto_1.3fr_auto_1fr]">
            <FlowBox title="GitHub" sub="push · 수동 실행 · 매일 04:00" />
            <Arrow />
            <FlowBox
              title="GitHub Actions"
              sub="npm ci → next build (Firestore 조회 → 정적 HTML 생성)"
              accent
            />
            <Arrow />
            <div className="flex flex-col gap-2">
              <FlowBox title="GitHub Pages" sub="대표 도메인" />
              <FlowBox title="Firebase Hosting" sub="301 → 대표 도메인" />
            </div>
          </div>

          <div className="mt-6 mb-3 font-mono text-[11px] text-white/40">런타임 (브라우저)</div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto_1.3fr]">
            <FlowBox title="정적 페이지" sub="HTML · JS · 이미지" />
            <Arrow />
            <div className="grid grid-cols-2 gap-2">
              <FlowBox title="Firestore" sub="방명록 · 랭킹 · 방문자 · 글 저장" />
              <FlowBox title="Auth" sub="관리자 로그인" />
            </div>
          </div>
        </div>
      </Section>

      <Section num="04" title="주요 기능">
        <div className="flex flex-col gap-10">
          {FEATURES.map((f) => (
            <div key={f.title}>
              <h3 className="mb-3 font-mono text-base font-medium text-white">{f.title}</h3>
              <Bullets items={f.items} />
              {f.images && (
                <div className={`mt-4 grid gap-3 ${f.images.length > 1 ? "sm:grid-cols-2" : ""}`}>
                  {f.images.map((im) => (
                    <Shot key={im.alt} img={im.img} alt={im.alt} />
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="mx-auto w-full max-w-[240px]">
            <Shot img={mobileImg} alt="모바일 화면 (퀵메뉴 펼침)" />
          </div>
        </div>
      </Section>

      <Section num="05" title="2026 리뉴얼 작업">
        <div className="grid gap-3 sm:grid-cols-2">
          {RENEWAL.map((r) => (
            <div key={r.title} className="rounded-xl border border-white/10 bg-[#1C1E24] p-5">
              <h3 className="mb-3 font-mono text-sm font-medium text-white">{r.title}</h3>
              <Bullets items={r.items} />
            </div>
          ))}
        </div>
      </Section>

      <Section num="06" title="트러블슈팅">
        <TroubleList items={TROUBLES} />
      </Section>

      <Section num="07" title="연혁">
        <ol className="relative ml-1 border-l border-white/10">
          {HISTORY.map((h) => (
            <li key={h.date} className="relative pb-4 pl-6 last:pb-0">
              <span className="absolute top-[7px] left-[-4.5px] h-2 w-2 rounded-full bg-[#6C63FF]" />
              <span className="mr-3 font-mono text-xs text-white/40">{h.date}</span>
              <span className="font-['Nanum_Gothic',sans-serif] text-sm text-white/75">
                {h.text}
              </span>
            </li>
          ))}
        </ol>
        <Link
          href="/archive/"
          className="mt-6 inline-block font-mono text-xs text-[#8B84FF] transition-colors hover:text-white"
        >
          전체 개발 기록 보기 →
        </Link>
      </Section>
    </div>
  );
}
