import Link from "next/link";
import Faded from "@/components/Faded";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "소개",
  description:
    "레거시부터 새 서비스까지 끝까지 파고들어 완성하는 풀스택 개발자 이건모. 일하는 방식과 지금까지의 궤적을 소개합니다.",
  path: "/about/",
});

const facts = [
  { key: "Name", value: "Lee Gunmo" },
  { key: "BirthDay", value: "1997.12.10" },
  { key: "Education", value: "Ajou Univ. Software Dept." },
  { key: "MBTI", value: "ISTP" },
  { key: "Job", value: "Fullstack Developer @ commerce platform" },
  { key: "Stack", value: "Next.js · TypeScript · Spring Boot · Node.js · MySQL" },
  { key: "Motto", value: "Seize the day." },
];

// 이런 개발자입니다 — 각 항목마다 실제로 해온 일을 근거로
const traits: { title: string; body: string; proof: { label: string; href: string }[] }[] = [
  {
    title: "끝까지 파고듭니다",
    body: "돌아가는 것에서 멈추지 않습니다. 새로고침하면 끊기는 음성 통화, 모바일 뒤로가기에 닫히지 않는 모달, 페이지를 떠나도 울리는 배경음악처럼 사용자가 한 번쯤 부딪힐 작은 틈을 찾아 원인까지 내려가 고칩니다.",
    proof: [
      { label: "Oh! Sori 통화 복구", href: "/infoPage/11/" },
      { label: "이 사이트의 트러블슈팅", href: "/infoPage/4/" },
    ],
  },
  {
    title: "레거시를 피하지 않습니다",
    body: "오래된 코드를 새로 짜는 것보다 안전하게 옮기는 쪽이 더 어렵다는 걸 압니다. 5년 된 CRA 사이트를 Next.js와 TypeScript로 옮겼고, 실무에서는 곳곳에 하드코딩된 권한 체크를 권한키 체계로 바꾸는 식의 마이그레이션을 맡아왔습니다.",
    proof: [
      { label: "사이트 리뉴얼 기록", href: "/archive/" },
      { label: "실무 기록", href: "/archive/" },
    ],
  },
  {
    title: "화면에서 서버까지 잇습니다",
    body: "JSP·MyBatis 레거시 모놀리스, Spring Boot 기반 MSA, Next.js 프론트엔드를 오가며 기능 하나를 처음부터 끝까지 책임집니다. 결제·배송처럼 여러 계층이 맞물리는 도메인에서 경계에서 생기는 문제를 잡는 걸 좋아합니다.",
    proof: [{ label: "MIMYO 주문·결제 설계", href: "/infoPage/10/" }],
  },
  {
    title: "팀을 앞에서 끕니다",
    body: "두 번의 팀 프로젝트에서 팀장을 맡아 기획, 역할 분담, DB 설계, Git 브랜치 운영, 배포까지 이끌었습니다. 먼저 가장 무거운 부분을 가져가면 팀도 따라온다는 걸 배웠습니다.",
    proof: [
      { label: "MIMYO", href: "/infoPage/10/" },
      { label: "ArtPart", href: "/infoPage/8/" },
    ],
  },
  {
    title: "보안을 기능의 일부로 봅니다",
    body: "서버가 공격받아 DB가 날아가는 일을 겪은 뒤로, 기능보다 먼저 입력값과 권한과 노출된 설정을 봅니다. 저장형 XSS 대응, 계정 잠금, 본인인증 연동 같은 작업을 실무에서 직접 다뤄왔습니다.",
    proof: [{ label: "실무 기록", href: "/archive/" }],
  },
  {
    title: "오래 가꿉니다",
    body: "2016년에 시작한 알고리즘 풀이, 2021년에 만든 이 사이트를 지금도 계속 고치고 있습니다. 한 번 만들고 끝내기보다 쓰면서 불편한 걸 찾아 다듬는 쪽이 제 방식입니다.",
    proof: [
      { label: "백준 풀이 정리", href: "/infoPage/5/" },
      { label: "Gunmo's Dev Life", href: "/infoPage/4/" },
    ],
  },
];

const numbers = [
  { value: "2016", label: "알고리즘 시작" },
  { value: "2021", label: "이 사이트 오픈" },
  { value: "2회", label: "팀장" },
  { value: "9", label: "프로젝트" },
];

const qa = [
  { q: "혼자 일하는 거 좋아하세요?", a: "혼자 시작해서 함께 마무리하는 걸 좋아합니다." },
  {
    q: "가장 기억에 남는 버그는?",
    a: "새벽에 서버 공격받고 DB 날아가서 아침까지 콘솔 붙잡고 있었던 그날이요... 😅 그 뒤로 보안부터 봅니다.",
  },
  {
    q: "개발하면서 가장 뿌듯했던 순간?",
    a: "팀원들이 만든 UI 보고 '와 이거 진짜 서비스 같아졌다'고 했을 때요.",
  },
  {
    q: "일할 때 가장 중요하게 보는 건?",
    a: "왜 그렇게 해야 하는지요. 근거가 납득되면 빠르게 움직이고, 아니면 끝까지 물어봅니다.",
  },
  {
    q: "앞으로 어떤 개발자가 되고 싶으세요?",
    a: "실력도 중요하지만, 결국 믿고 함께할 수 있는 개발자가 되고 싶어요.",
  },
];

export default function AboutPage() {
  return (
    <Faded>
      <div className="mx-auto max-w-2xl px-6 pt-16 pb-24">
        <div className="mb-6 font-mono text-sm text-[#8B84FF]">about</div>

        <h1 className="font-mono text-2xl leading-snug font-bold text-white sm:text-3xl">
          만들고, 끝까지 다듬는
          <br />
          풀스택 개발자 <span className="text-[#8B84FF]">이건모</span>입니다.
        </h1>
        <p className="mt-5 font-['Nanum_Gothic',sans-serif] leading-relaxed text-white/65">
          지금은 커머스 플랫폼에서 레거시 모놀리스와 MSA, 프론트엔드를 넘나들며 기능을 만들고
          고칩니다. 틈틈이 이 사이트를 뜯어고치고, 가끔은 알고리즘 문제를 풉니다.
        </p>

        {/* 가짜 터미널 창 */}
        <div className="mt-10 overflow-hidden rounded-xl border border-white/10 bg-[#1C1E24]">
          <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          </div>
          <div className="overflow-x-auto p-5 font-mono text-[13px] leading-7 text-white/70 sm:text-sm">
            <p className="mb-3 text-white/40">
              Gunmo&apos;s Dev Life [Version 2.0.0]
              <br />
              (c) Gunmo&apos;s Dev Life Corporation. All rights reserved
            </p>
            {facts.map((f) => (
              <div key={f.key} className="whitespace-nowrap">
                <span className="text-[#8B84FF]">C:\Gunmo\{f.key}&gt;</span>{" "}
                <span className="text-white">{f.value}</span>
              </div>
            ))}
            <div className="mt-3 text-white/40">
              C:\Gunmo&gt; git commit -m &quot;keep going&quot;
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {numbers.map((n) => (
            <div key={n.label} className="rounded-xl border border-white/10 px-4 py-3 text-center">
              <div className="font-mono text-xl font-bold text-white">{n.value}</div>
              <div className="mt-1 font-mono text-[11px] text-white/40">{n.label}</div>
            </div>
          ))}
        </div>

        <section className="mt-16">
          <h2 className="mb-6 font-mono text-sm text-[#8B84FF]">이런 개발자입니다</h2>
          <div className="flex flex-col gap-4">
            {traits.map((t, i) => (
              <div key={t.title} className="rounded-xl border border-white/10 bg-[#1C1E24] p-5">
                <h3 className="mb-2 flex items-center gap-3 font-mono text-base font-medium text-white">
                  <span className="text-xs text-[#8B84FF]">{String(i + 1).padStart(2, "0")}</span>
                  {t.title}
                </h3>
                <p className="font-['Nanum_Gothic',sans-serif] text-sm leading-relaxed break-keep text-white/65">
                  {t.body}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {t.proof.map((p) => (
                    <Link
                      key={p.label}
                      href={p.href}
                      className="rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-[11px] text-white/50 transition-colors hover:border-[#6C63FF]/50 hover:text-white"
                    >
                      {p.label} →
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="mb-6 font-mono text-sm text-[#8B84FF]">여기까지 온 길</h2>
          <div className="flex flex-col gap-5 font-['Nanum_Gothic',sans-serif] leading-relaxed break-keep text-white/70">
            <p>
              &lsquo;만드는 일&rsquo;이 좋아서 개발자가 되었습니다. 소프트웨어를 전공했고, 군 복무
              뒤 잠시 멀어졌던 개발을 다시 붙잡으면서 예전보다 더 깊게 몰입하는 저를 발견했습니다.
            </p>
            <p>
              팀 프로젝트에서는 팀장을 맡아 실시간 경매, 채팅, 주문·결제, 정산처럼 여러 흐름이 얽힌
              기능을 설계했고, 혼자서는 WebRTC 음성 통화 서비스를 만들며 &lsquo;되는 것&rsquo;과
              &lsquo;믿고 쓸 수 있는 것&rsquo; 사이의 거리를 배웠습니다.
            </p>
            <p>
              지금은 실무에서 오래된 코드와 새 코드 사이를 잇는 일을 합니다. 기술 자체보다 중요한 건
              문제를 끝까지 해결하는 태도라고 믿고, &lsquo;감사한 마음으로 즐겁게 일하자&rsquo;는
              원칙을 지키며 계속 업데이트하는 중입니다.
            </p>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="mb-6 font-mono text-sm text-[#8B84FF]">자주 듣는 질문들</h2>
          <div className="flex flex-col gap-6">
            {qa.map((item) => (
              <div key={item.q} className="border-b border-white/5 pb-6">
                <p className="mb-2 font-['Nanum_Gothic',sans-serif] font-medium text-white">
                  Q. {item.q}
                </p>
                <p className="font-['Nanum_Gothic',sans-serif] break-keep text-white/60">
                  A. {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-16 text-center font-['Nanum_Gothic',sans-serif] text-white/50 italic">
          &quot;혼자 잘하는 사람보다, 같이 잘할 수 있는 사람이 되겠습니다.&quot;
        </p>
      </div>
    </Faded>
  );
}
